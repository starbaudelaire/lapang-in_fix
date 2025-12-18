// lib/action.ts

"use server";

import { auth } from "@/auth";
import { FieldSchema } from "@/lib/zod";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

// ==========================================
// HELPER: UPLOAD IMAGE
// ==========================================
async function saveImage(file: File | null): Promise<string> {
  // Validasi dasar
  if (!file || file.size === 0 || file.name === "undefined") return "";

  try {
    // 🔥 UPLOAD LANGSUNG KE VERCEL BLOB (CLOUD)
    // access: 'public' biar bisa dilihat semua orang
    const blob = await put(file.name, file, {
      access: "public",
    });

    // Balikin URL Cloud-nya (Contoh: https://fw84...public.blob.vercel-storage.com/...)
    return blob.url;
  } catch (error) {
    console.error("Gagal upload gambar ke Blob:", error);
    return ""; // Kalo gagal, balikin string kosong biar kena validasi Zod nanti
  }
}

// ==========================================
// SECTION 1: ADMIN CRUD FIELD
// ==========================================

export const createField = async (_prevState: unknown, formData: FormData) => {
  const amenitiesIds = formData.getAll("amenities") as string[];

  // 1. Upload Gambar Dulu
  const imageFile = formData.get("image") as File;
  const imageUrl = await saveImage(imageFile);

  // 2. Siapin Data (Fix Konversi Angka & Mapping Nama)
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    address: formData.get("address"),
    capacity: Number(formData.get("capacity")), // Convert ke Number
    pricePerHour: Number(formData.get("price")), // Ambil dari input 'price' -> masuk ke 'pricePerHour'
    type: formData.get("type"),
    image: imageUrl, // Masukin URL string hasil upload tadi
    amenities: amenitiesIds,
  };

  console.log("📦 [CREATE] Data Processed:", rawData);

  const validatedFields = FieldSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error(
      "❌ [CREATE] Zod Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Field.",
    };
  }

  const {
    name,
    description,
    address,
    capacity,
    pricePerHour,
    type,
    image,
    amenities,
  } = validatedFields.data;

  try {
    await prisma.field.create({
      data: {
        name,
        description,
        address,
        capacity,
        pricePerHour,
        type,
        image,
        FieldAmenities: {
          create: amenities?.map((amenityId) => ({ amenitiesId: amenityId })),
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Create Field." };
  }

  revalidatePath("/admin/field");
  redirect("/admin/field");
};

export const updateField = async (
  id: string,
  _prevState: unknown,
  formData: FormData
) => {
  const amenitiesIds = formData.getAll("amenities") as string[];

  // Logic Upload buat Edit:
  // Cek apakah user upload gambar baru?
  const imageFile = formData.get("image") as File | string;
  let finalImageUrl = "";

  // Kalau tipe-nya File dan ada isinya, berarti upload baru
  if (imageFile instanceof File && imageFile.size > 0) {
    finalImageUrl = await saveImage(imageFile);
  } else if (typeof imageFile === "string") {
    // Kalau string, berarti pake URL lama (dari hidden input)
    finalImageUrl = imageFile;
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    address: formData.get("address"),
    capacity: Number(formData.get("capacity")),
    pricePerHour: Number(formData.get("price") || formData.get("pricePerHour")), // Jaga-jaga support 2 nama
    type: formData.get("type"),
    image: finalImageUrl,
    amenities: amenitiesIds,
  };

  const validatedFields = FieldSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error(
      "❌ [UPDATE] Zod Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Field.",
    };
  }

  const {
    name,
    description,
    address,
    capacity,
    pricePerHour,
    type,
    image,
    amenities,
  } = validatedFields.data;

  try {
    await prisma.field.update({
      where: { id },
      data: {
        name,
        description,
        address,
        capacity,
        pricePerHour,
        type,
        image,
        FieldAmenities: {
          deleteMany: {},
          create: amenities?.map((amenityId) => ({ amenitiesId: amenityId })),
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Update Field." };
  }

  revalidatePath("/admin/field");
  redirect("/admin/field");
};

export const deleteField = async (id: string, _formData: FormData) => {
  try {
    await prisma.field.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete field:", error);
    return { message: "Database Error: Failed to Delete Field." };
  }
  revalidatePath("/admin/field");
};

// ==========================================
// SECTION 2: BOOKING ENGINE & PAYMENT
// ==========================================

async function checkAvailability(
  fieldId: string,
  startDate: Date,
  endDate: Date
) {
  const expiredTime = new Date(Date.now() - 15 * 60 * 1000);

  const existingReservation = await prisma.reservation.findFirst({
    where: {
      fieldId: fieldId,
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
        {
          OR: [
            { Payment: { status: "PAID" } },
            {
              AND: [
                { Payment: { status: "UNPAID" } },
                { createdAt: { gt: expiredTime } },
              ],
            },
          ],
        },
      ],
    },
    include: { Payment: true },
  });

  return !existingReservation;
}

const parseWIB = (str: string) => {
  if (!str) return null;
  const parts = str.split("T");
  if (parts.length < 2) return null;

  const datePart = parts[0];
  const timePart = parts[1];

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (isNaN(year) || isNaN(hour)) return null;

  // Convert WIB (UTC+7) ke UTC Native
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0));
};

export const createReservation = async (formData: FormData) => {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login dulu bos!" };
  const userId = session.user.id;

  const fieldId = formData.get("fieldId") as string;
  const startDateStr = formData.get("startDate") as string;

  // [PENTING] Baca durasi jam yang dikirim dari BookingCard
  const hours = Number(formData.get("hours")) || 1;

  const fieldPrice = Number(formData.get("price"));

  const startDate = parseWIB(startDateStr);

  if (!startDate || isNaN(startDate.getTime())) {
    return { error: "Format tanggal ngaco nih! Coba refresh." };
  }

  // Hitung EndDate di server (Start + Durasi)
  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

  const isAvailable = await checkAvailability(fieldId, startDate, endDate);

  if (!isAvailable) {
    return { error: "Yah, telat! Jam segitu udah dibooking orang lain bro." };
  }

  // --- LOGIC HARGA & KODE UNIK ---
  const appFee = Math.floor(fieldPrice * 0.1);
  const uniqueCode = Math.floor(Math.random() * 999) + 1;
  const totalAmount = fieldPrice + appFee + uniqueCode;

  let reservationId = "";

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buat Reservasi
      const reservation = await tx.reservation.create({
        data: {
          userId,
          fieldId,
          startDate,
          endDate,
          price: fieldPrice,
        },
      });

      reservationId = reservation.id;

      // 2. Buat Payment (FIXED: Pake connect)
      await tx.payment.create({
        data: {
          amount: totalAmount,
          status: "UNPAID",
          method: "QRIS",
          Reservation: {
            connect: { id: reservation.id },
          },
        },
      });
    });
  } catch (error) {
    console.error("Booking Failed:", error);
    return { error: "Sistem error nih, gagal booking." };
  }

  revalidatePath("/field");
  redirect(`/booking/payment/${reservationId}`);
};

export const confirmPayment = async (formData: FormData) => {
  const reservationId = formData.get("reservationId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!reservationId || !paymentMethod) {
    return { error: "Pilih metode pembayaran dulu bro!" };
  }

  try {
    await prisma.payment.update({
      where: { reservationId },
      data: {
        method: paymentMethod,
      },
    });
  } catch (error) {
    console.error("Confirm Payment Failed:", error);
    return { error: "Gagal konfirmasi pembayaran." };
  }

  revalidatePath("/myreservation");
  redirect("/booking/success?id=" + reservationId);
};

export const cancelReservation = async (reservationId: string) => {
  if (!reservationId) return;

  try {
    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    revalidatePath("/field");
  } catch (error) {
    console.error("Gagal cancel booking:", error);
  }

  redirect("/");
};

export const updateReservationStatus = async (formData: FormData) => {
  const reservationId = formData.get("reservationId") as string;
  const newStatus = formData.get("status") as PaymentStatus;

  if (!reservationId || !newStatus) return;

  try {
    await prisma.payment.update({
      where: { reservationId: reservationId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/revenue");
    revalidatePath("/admin/dashboard");
  } catch (error) {
    console.error("Gagal update status:", error);
  }
};

// ==========================================
// SECTION 4: CLIENT DATA FETCHERS
// ==========================================

export const getBookedHours = async (fieldId: string, dateStr: string) => {
  const expiredTime = new Date(Date.now() - 15 * 60 * 1000);

  const reservations = await prisma.reservation.findMany({
    where: {
      fieldId: fieldId,
      OR: [
        { Payment: { status: "PAID" } },
        {
          AND: [
            { Payment: { status: "UNPAID" } },
            { createdAt: { gt: expiredTime } },
          ],
        },
      ],
    },
    select: { startDate: true, endDate: true },
  });

  const bookedSlots: string[] = [];
  const HOUR_MS = 60 * 60 * 1000;

  reservations.forEach((res) => {
    let currentMs = res.startDate.getTime();
    const endMs = res.endDate.getTime();

    // Loop per jam sampai kurang dari end time
    while (currentMs < endMs) {
      // Konversi UTC ke WIB (+7 Jam) buat dapetin string jam yg bener
      const wibDate = new Date(currentMs + 7 * HOUR_MS);

      const resDateStr = wibDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const resTimeStr = wibDate.toISOString().split("T")[1].substring(0, 5); // HH:mm

      if (resDateStr === dateStr) {
        bookedSlots.push(resTimeStr);
      }

      currentMs += HOUR_MS; // Tambah 1 jam
    }
  });

  return Array.from(new Set(bookedSlots));
};

// ==========================================
// SECTION 5: REVENUE & ANALYTICS
// ==========================================

export const getRevenueData = async () => {
  // Ambil semua lapangan beserta reservasi yang SUDAH BAYAR (PAID)
  const fields = await prisma.field.findMany({
    include: {
      Reservations: {
        where: { Payment: { status: "PAID" } }, // Cuma itung yang udah lunas
        include: { Payment: true },
      },
    },
  });

  let totalAppRevenue = 0; // Buat nampung Fee + Kode Unik

  const fieldRevenues = fields.map((field) => {
    let fieldIncome = 0;

    field.Reservations.forEach((res) => {
      // 1. Tambahin duit jatah lapangan
      fieldIncome += res.price;

      // 2. Tambahin duit jatah App (Total Transfer - Harga Lapangan)
      if (res.Payment) {
        const appShare = res.Payment.amount - res.price;
        totalAppRevenue += appShare;
      }
    });

    return {
      id: field.id,
      name: field.name,
      image: field.image,
      totalRevenue: fieldIncome,
      bookingCount: field.Reservations.length,
    };
  });

  return {
    fieldRevenues,
    totalAppRevenue,
  };
};

export const getFieldRevenueDetail = async (fieldId: string) => {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
  });

  if (!field) return null;

  const reservations = await prisma.reservation.findMany({
    where: {
      fieldId: fieldId,
      Payment: { status: "PAID" },
    },
    include: {
      User: true,
      Payment: true,
    },
    orderBy: { startDate: "desc" },
  });

  return { field, reservations };
};

export const getAppRevenueHistory = async () => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        Payment: { status: "PAID" }, // Kita cuma mau yang udah cair alias PAID
      },
      include: {
        User: true,
        Field: true,
        Payment: true,
      },
      orderBy: { createdAt: "desc" }, // Dari yang paling fresh
    });

    // Kita mapping datanya biar enak dikonsumsi di frontend
    const history = reservations.map((res) => {
      const totalPaid = res.Payment?.amount || 0;
      const fieldPrice = res.price;

      // Ini logic "cuan" aplikasi lo: Total Transfer - Jatah Lapangan
      const appRevenue = totalPaid - fieldPrice;

      return {
        id: res.id,
        bookingCode: res.id.slice(-5).toUpperCase(), // Biar ada kode booking pendek
        user: res.User.name || "User Tanpa Nama",
        userEmail: res.User.email,
        field: res.Field.name,
        date: res.startDate,
        appRevenue: appRevenue, // <--- Ini duit jatah elo
      };
    });

    return history;
  } catch (error) {
    console.error("Gagal ambil history revenue app:", error);
    return [];
  }
};

// ==========================================
// SECTION 6: REVIEW SYSTEM
// ==========================================

export const createReview = async (formData: FormData) => {
  console.log("🚀 createReview dipanggil!");

  const session = await auth();
  if (!session?.user?.id) {
    console.log("❌ Error: User gak ada session");
    return { error: "Sesi habis, login lagi gih." };
  }

  const reservationId = formData.get("reservationId") as string;
  const fieldId = formData.get("fieldId") as string;
  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;

  console.log("📦 Data Review:", { reservationId, fieldId, rating, comment });

  if (!rating || !comment) return { error: "Bintang & Komen wajib diisi!" };
  if (!reservationId || !fieldId)
    return { error: "Data ID tidak valid (Corrupt)." };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) return { error: "Booking tidak ditemukan." };
    if (reservation.userId !== session.user.id)
      return { error: "Bukan bookingan lo!" };

    await prisma.review.create({
      data: {
        userId: session.user.id,
        fieldId: fieldId,
        reservationId: reservationId,
        rating: rating,
        comment: comment,
      },
    });

    console.log("✅ Review sukses masuk DB!");
  } catch (error) {
    console.error("🔥 Error Prisma:", error);
    return { error: "Gagal simpan ke database." };
  }

  revalidatePath("/myreservation");
  revalidatePath(`/field/${fieldId}`);

  return { success: true };
};

// ==========================================
// SECTION 7: CONTACT US (MESSAGE)
// ==========================================

export const saveMessage = async (_prevState: unknown, formData: FormData) => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "Nama, Email, dan Pesan wajib diisi!" };
  }

  try {
    await prisma.message.create({
      data: {
        name,
        email,
        subject: subject || "No Subject",
        message,
      },
    });

    return {
      success: true,
      message: "Pesan berhasil dikirim! Terima Kasih telah menghubungi kami!",
    };
  } catch (error) {
    console.error("Gagal simpan pesan:", error);
    return { error: "Gagal mengirim pesan. Silakan coba lagi nanti." };
  }
};

//

// ... codingan yang lain biarin ...

// ==========================================
// SECTION 8: ADMIN SCANNER (VALIDASI TIKET)
// ==========================================

export const verifyTicket = async (qrCode: string) => {
  // Format QR kita kan: "BOOKING-clqxxxxx..."
  // Jadi kita harus buang prefix "BOOKING-" dulu
  const bookingId = qrCode.replace("BOOKING-", "");

  if (!bookingId) return { error: "QR Code tidak valid/kosong." };

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: bookingId },
      include: {
        User: true,
        Field: true,
        Payment: true,
      },
    });

    if (!reservation) {
      return { error: "Booking TIDAK DITEMUKAN dalam database!" };
    }

    // Cek Status Pembayaran
    if (reservation.Payment?.status !== "PAID") {
      return {
        error: "Booking BELUM LUNAS / Dibatalkan!",
        details: reservation, // Balikin data biar admin tau ini punya siapa
      };
    }

    // Cek Tanggal (Optional: Kalo mau strict cuma bisa scan hari H)
    // const today = new Date().toISOString().split("T")[0];
    // const bookingDate = reservation.startDate.toISOString().split("T")[0];
    // if (today !== bookingDate) return { error: "Tiket bukan untuk hari ini!" };

    return {
      success: true,
      message: "TIKET VALID! Silakan Masuk.",
      data: reservation,
    };
  } catch (error) {
    console.error("Scan Error:", error);
    return { error: "Terjadi kesalahan server saat validasi." };
  }
};
