import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// SECTION 1: CUSTOMER DATA
// ==========================================

// 1. Ambil SATU lapangan (untuk Halaman Detail / Edit)
export const getFieldById = async (id: string) => {
  try {
    const field = await prisma.field.findUnique({
      where: { id },
      include: {
        FieldAmenities: {
          include: { Amenities: true },
        },
      },
    });
    return field;
  } catch (error) {
    console.error("Error fetching field:", error);
    return null;
  }
};

// 2. Ambil BANYAK lapangan (untuk Homepage + Filter)
export const getAllFields = async (
  query?: string,
  location?: string,
  type?: string
) => {
  try {
    const fields = await prisma.field.findMany({
      where: {
        AND: [
          // Filter Nama
          query ? { name: { contains: query, mode: "insensitive" } } : {},
          // Filter Lokasi
          location
            ? { address: { contains: location, mode: "insensitive" } }
            : {},
          // Filter Tipe
          type && type !== "all" ? { type: type as any } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      // Include Rating buat di Card
      include: {
        Reviews: {
          select: { rating: true },
        },
      },
    });
    return fields;
  } catch (error) {
    console.error("Error fetching fields:", error);
    return [];
  }
};

// 3. Ambil Booking User (untuk Dashboard User)
export const getUserReservations = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: session.user.id },
      include: {
        Field: true,
        Payment: true,
        Review: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return reservations;
  } catch (error) {
    console.error("Error user reservations:", error);
    return [];
  }
};

//

// ==========================================
// SECTION 2: ADMIN DASHBOARD DATA (REKAP BULANAN)
// ==========================================

// 4. Hitung Pendapatan BULANAN (Berdasarkan Parameter Bulan & Tahun)
export const getMonthlyRevenue = async (month: number, year: number) => {
  const startDate = new Date(Date.UTC(year, month - 1, 0, 17, 0, 0));

  const endDate = new Date(Date.UTC(year, month, 0, 16, 59, 59));

  try {
    const result = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        updatedAt: {
          // Pake updatedAt biar akurat kapan duit masuk
          gte: startDate,
          lte: endDate,
        },
      },
    });
    return result._sum.amount || 0;
  } catch (error) {
    return 0;
  }
};

// 4b. Hitung Total Booking BULANAN (Opsional, biar sinkron sama revenue)
export const getMonthlyBookingCount = async (month: number, year: number) => {
  const startDate = new Date(Date.UTC(year, month - 1, 0, 17, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 16, 59, 59));

  try {
    return await prisma.reservation.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  } catch (error) {
    return 0;
  }
};

// 5. Total Booking
export const getTotalBooking = async () => {
  try {
    const count = await prisma.reservation.count();
    return count;
  } catch (error) {
    return 0;
  }
};

// 6. Lapangan Aktif
export const getTotalActiveFields = async () => {
  try {
    const count = await prisma.field.count();
    return count;
  } catch (error) {
    return 0;
  }
};

// 7. Ambil SEMUA Reservasi (Buat Tabel Admin)
export const getAllReservations = async () => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        User: true,
        Field: true,
        Payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return reservations;
  } catch (error) {
    console.error("Error admin reservations:", error);
    return [];
  }
};

// ==========================================
// SECTION 3: BOOKING HELPERS (FIXED LOOP LOGIC)
// ==========================================

export const getBookedHours = async (fieldId: string, dateStr: string) => {
  if (!dateStr || !fieldId) return [];

  const [year, month, day] = dateStr.split("-").map(Number);
  // Start: Jam 00:00 WIB
  const startOfDay = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));
  // End: Jam 23:59 WIB
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 16, 59, 59));

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        fieldId: fieldId,
        // Cari yang overlap dengan hari ini
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
        OR: [
          { Payment: { status: "PAID" } },
          { Payment: { status: "UNPAID" } },
        ],
      },
      select: {
        startDate: true,
        endDate: true,
      },
    });

    const bookedHours: string[] = [];

    reservations.forEach((res) => {
      // Convert ke WIB
      let current = new Date(res.startDate.getTime() + 7 * 60 * 60 * 1000);
      const end = new Date(res.endDate.getTime() + 7 * 60 * 60 * 1000);

      // Loop per jam dari Start sampai End
      while (current < end) {
        const currentYear = current.getUTCFullYear();
        const currentMonth = current.getUTCMonth() + 1;
        const currentDay = current.getUTCDate();

        // Pastikan jamnya masih di tanggal yang dipilih (biar gak bocor ke besok/kemarin)
        if (
          currentYear === year &&
          currentMonth === month &&
          currentDay === day
        ) {
          const hour = current.getUTCHours();
          const hourStr = `${hour.toString().padStart(2, "0")}:00`;

          if (!bookedHours.includes(hourStr)) {
            bookedHours.push(hourStr);
          }
        }
        // Tambah 1 jam
        current.setUTCHours(current.getUTCHours() + 1);
      }
    });

    return bookedHours;
  } catch (error) {
    console.error("Gagal ambil jadwal booked:", error);
    return [];
  }
};

// ==========================================
// SECTION 4: REVENUE BY DATE (NEW FEATURE)
// ==========================================

//
// Timpa fungsi getRevenueByDate yang lama dengan yang ini:

export const getRevenueByDate = async (dateStr: string) => {
  // dateStr format: "YYYY-MM-DD" (Contoh: "2025-12-16")

  // KITA RAKIT MANUAL RANGE WAKTU WIB (UTC+7)
  // 00:00 WIB = 17:00 UTC (Hari Sebelumnya)
  // 23:59 WIB = 16:59 UTC (Hari Ini)

  const date = new Date(dateStr);

  // 1. Start Time: H-1 jam 17:00:00 UTC
  const startWIB = new Date(date);
  startWIB.setUTCDate(date.getUTCDate() - 1);
  startWIB.setUTCHours(17, 0, 0, 0);

  // 2. End Time: H+0 jam 16:59:59 UTC
  const endWIB = new Date(date);
  endWIB.setUTCHours(16, 59, 59, 999);

  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: "PAID",
        updatedAt: {
          // PAKE UPDATED_AT (Waktu Bayar/Approve)
          gte: startWIB,
          lte: endWIB,
        },
      },
      include: {
        Reservation: {
          select: {
            price: true,
            fieldId: true,
            Field: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    // 3. Pisahin Duit Kita vs Duit Owner
    let platformRevenue = 0;
    let ownerRevenue = 0;
    const fieldStats: Record<string, any> = {};

    payments.forEach((p) => {
      const totalBayar = p.amount; // Total yang user transfer (+ kode unik)
      const hargaLapangan = p.Reservation.price; // Harga asli lapangan

      // Duit Kita = Total Transfer - Harga Asli
      const cuanKita = totalBayar - hargaLapangan;

      platformRevenue += cuanKita;
      ownerRevenue += hargaLapangan;

      // Grouping per Lapangan (Buat list di bawah)
      const fId = p.Reservation.fieldId;
      if (!fieldStats[fId]) {
        fieldStats[fId] = {
          id: fId,
          name: p.Reservation.Field.name,
          image: p.Reservation.Field.image || "/card-lapangan.jpg",
          totalOwnerRevenue: 0, // Pendapatan bersih lapangan
          bookingCount: 0,
        };
      }
      fieldStats[fId].totalOwnerRevenue += hargaLapangan;
      fieldStats[fId].bookingCount += 1;
    });

    // Convert Object ke Array & Sort
    const fieldRevenues = Object.values(fieldStats).sort(
      (a: any, b: any) => b.totalOwnerRevenue - a.totalOwnerRevenue
    );

    return {
      platformRevenue, // Duit Kita
      ownerRevenue, // Duit Lapangan
      totalCombined: platformRevenue + ownerRevenue,
      fieldRevenues,
    };
  } catch (error) {
    console.error("Error revenue breakdown:", error);
    return {
      platformRevenue: 0,
      ownerRevenue: 0,
      totalCombined: 0,
      fieldRevenues: [],
    };
  }
};
// Tambahin ini di lib/data.ts

// ... (code yang udah ada)

// ==========================================
// ==========================================
// SECTION 8: AMENITIES DATA
// ==========================================

export const getAllAmenities = async () => {
  try {
    const amenities = await prisma.amenities.findMany();
    return amenities;
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return [];
  }
};
