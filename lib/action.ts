"use server";

import { auth } from "@/auth";
import { FieldSchema } from "@/lib/zod";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";

/**
 * Uploads an image file to Vercel Blob storage.
 * @param file - The image file to upload.
 * @returns The public URL of the uploaded image, or an empty string if the upload fails.
 */
async function saveImage(file: File | null): Promise<string> {
  if (!file || file.size === 0 || file.name === "undefined") return "";

  try {
    // Upload the file to Vercel Blob storage with public access.
    const blob = await put(file.name, file, {
      access: "public",
    });

    // Return the public URL of the uploaded file.
    return blob.url;
  } catch (error) {
    console.error("Image upload to Vercel Blob failed:", error);
    // Return an empty string on failure to trigger Zod validation.
    return "";
  }
}

/**
 * Server action to create a new sports field.
 * Validates form data, uploads an image, and saves the new field to the database.
 * @param _prevState - The previous form state (unused).
 * @param formData - The form data containing the new field's details.
 */
export const createField = async (_prevState: unknown, formData: FormData) => {
  const amenitiesIds = formData.getAll("amenities") as string[];
  const imageFile = formData.get("image") as File;
  const imageUrl = await saveImage(imageFile);

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    address: formData.get("address"),
    capacity: Number(formData.get("capacity")),
    pricePerHour: Number(formData.get("price")),
    type: formData.get("type"),
    image: imageUrl,
    amenities: amenitiesIds,
  };

  const validatedFields = FieldSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create field.",
    };
  }

  const { name, description, address, capacity, pricePerHour, type, image, amenities } = validatedFields.data;

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
    return { message: "Database Error: Failed to create field." };
  }

  revalidatePath("/admin/field");
  redirect("/admin/field");
};

/**
 * Server action to update an existing sports field.
 * @param id - The ID of the field to update.
 * @param _prevState - The previous form state (unused).
 * @param formData - The form data containing the updated field details.
 */
export const updateField = async (
  id: string,
  _prevState: unknown,
  formData: FormData
) => {
  const amenitiesIds = formData.getAll("amenities") as string[];
  const imageFile = formData.get("image") as File | string;
  let finalImageUrl = "";

  // If a new file is uploaded, save it. Otherwise, use the existing image URL.
  if (imageFile instanceof File && imageFile.size > 0) {
    finalImageUrl = await saveImage(imageFile);
  } else if (typeof imageFile === "string") {
    finalImageUrl = imageFile;
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    address: formData.get("address"),
    capacity: Number(formData.get("capacity")),
    pricePerHour: Number(formData.get("price") || formData.get("pricePerHour")),
    type: formData.get("type"),
    image: finalImageUrl,
    amenities: amenitiesIds,
  };

  const validatedFields = FieldSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to update field.",
    };
  }

  const { name, description, address, capacity, pricePerHour, type, image, amenities } = validatedFields.data;

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
          deleteMany: {}, // Clear existing amenities before adding new ones
          create: amenities?.map((amenityId) => ({ amenitiesId: amenityId })),
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to update field." };
  }

  revalidatePath("/admin/field");
  redirect("/admin/field");
};

/**
 * Server action to delete a sports field by its ID.
 * @param id - The ID of the field to delete.
 */
export const deleteField = async (id: string, _formData: FormData) => {
  try {
    await prisma.field.delete({ where: { id } });
    revalidatePath("/admin/field");
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to delete field." };
  }
};

/**
 * Checks if a field is available for a given time range.
 * A slot is considered unavailable if it's PAID, or if it's UNPAID but created within the last 15 minutes.
 * @param fieldId - The ID of the field to check.
 * @param startDate - The start time of the desired booking.
 * @param endDate - The end time of the desired booking.
 * @returns {Promise<boolean>} - True if available, false otherwise.
 */
async function checkAvailability(
  fieldId: string,
  startDate: Date,
  endDate: Date
) {
  const expirationTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

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
                { createdAt: { gt: expirationTime } },
              ],
            },
          ],
        },
      ],
    },
  });

  return !existingReservation;
}

/**
 * Parses a string in "YYYY-MM-DDTHH:mm" format (assuming WIB, UTC+7) and converts it to a native UTC Date object.
 * @param str - The date-time string to parse.
 * @returns A Date object in UTC, or null if parsing fails.
 */
const parseWIB = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split("T");
  if (parts.length < 2) return null;

  const [year, month, day] = parts[0].split("-").map(Number);
  const [hour, minute] = parts[1].split(":").map(Number);

  if (isNaN(year) || isNaN(hour)) return null;

  // Convert WIB (UTC+7) to native UTC for database storage
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0));
};

/**
 * Server action to create a new reservation for a sports field.
 * It checks availability, calculates pricing, and creates the reservation and payment records in a transaction.
 * @param formData - The form data containing reservation details.
 */
export const createReservation = async (formData: FormData) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required. Please sign in." };
  }
  const userId = session.user.id;

  const fieldId = formData.get("fieldId") as string;
  const startDateStr = formData.get("startDate") as string;
  const hours = Number(formData.get("hours")) || 1;
  const fieldPrice = Number(formData.get("price"));

  const startDate = parseWIB(startDateStr);
  if (!startDate || isNaN(startDate.getTime())) {
    return { error: "Invalid date format. Please refresh and try again." };
  }

  // Calculate end time on the server for security
  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

  const isAvailable = await checkAvailability(fieldId, startDate, endDate);
  if (!isAvailable) {
    return { error: "Sorry, the selected time slot is no longer available." };
  }

  const appFee = Math.floor(fieldPrice * 0.1);
  const uniqueCode = Math.floor(Math.random() * 999) + 1;
  const totalAmount = fieldPrice + appFee + uniqueCode;

  let reservationId = "";

  try {
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
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
    console.error("Reservation failed:", error);
    return { error: "An unexpected error occurred. Failed to create reservation." };
  }

  revalidatePath("/field");
  redirect(`/booking/payment/${reservationId}`);
};

/**
 * Server action to confirm a payment method for a reservation.
 * @param formData - The form data containing the reservation ID and payment method.
 */
export const confirmPayment = async (formData: FormData) => {
  const reservationId = formData.get("reservationId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!reservationId || !paymentMethod) {
    return { error: "Please select a payment method." };
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
    return { error: "Failed to confirm payment method." };
  }

  revalidatePath("/myreservation");
  redirect("/booking/success?id=" + reservationId);
};

/**
 * Server action to cancel an unpaid reservation.
 * @param reservationId - The ID of the reservation to cancel.
 */
export const cancelReservation = async (reservationId: string) => {
  if (!reservationId) return;

  try {
    // Note: Relies on cascading delete in schema to also delete the associated payment
    await prisma.reservation.delete({
      where: { id: reservationId },
    });
    revalidatePath("/field");
  } catch (error) {
    console.error("Failed to cancel reservation:", error);
  }

  redirect("/");
};

/**
 * Server action for admins to update the payment status of a reservation.
 * @param formData - The form data containing the reservation ID and new status.
 */
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
    console.error("Failed to update status:", error);
  }
};

/**
 * Fetches the booked time slots for a specific field on a given date.
 * @param fieldId - The ID of the field.
 * @param dateStr - The date in "YYYY-MM-DD" format.
 * @returns An array of booked time slots in "HH:mm" format.
 */
export const getBookedHours = async (fieldId: string, dateStr: string) => {
  const expirationTime = new Date(Date.now() - 15 * 60 * 1000);

  const reservations = await prisma.reservation.findMany({
    where: {
      fieldId: fieldId,
      OR: [
        { Payment: { status: "PAID" } },
        {
          AND: [
            { Payment: { status: "UNPAID" } },
            { createdAt: { gt: expirationTime } },
          ],
        },
      ],
    },
    select: { startDate: true, endDate: true },
  });

  const bookedSlots: string[] = [];
  const HOUR_IN_MS = 60 * 60 * 1000;

  reservations.forEach((res) => {
    let currentMs = res.startDate.getTime();
    const endMs = res.endDate.getTime();

    // Iterate through each hour of the reservation duration
    while (currentMs < endMs) {
      // Convert from UTC to WIB (UTC+7) to get the correct local time string
      const wibDate = new Date(currentMs + 7 * HOUR_IN_MS);
      const resDateStr = wibDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const resTimeStr = wibDate.toISOString().split("T")[1].substring(0, 5); // HH:mm

      if (resDateStr === dateStr) {
        bookedSlots.push(resTimeStr);
      }
      currentMs += HOUR_IN_MS;
    }
  });

  return Array.from(new Set(bookedSlots)); // Return unique slots
};

/**
 * Fetches revenue data for all fields, including total app revenue.
 * Only considers reservations with a "PAID" status.
 */
export const getRevenueData = async () => {
  const fields = await prisma.field.findMany({
    include: {
      Reservations: {
        where: { Payment: { status: "PAID" } },
        include: { Payment: true },
      },
    },
  });

  let totalAppRevenue = 0;

  const fieldRevenues = fields.map((field) => {
    let fieldIncome = 0;

    field.Reservations.forEach((res) => {
      fieldIncome += res.price;
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

/**
 * Fetches detailed revenue information for a single field.
 * @param fieldId - The ID of the field to retrieve details for.
 */
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

/**
 * Fetches the application's revenue history from all paid reservations.
 * @returns An array of objects, each representing a transaction and the app's revenue from it.
 */
export const getAppRevenueHistory = async () => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        Payment: { status: "PAID" },
      },
      include: {
        User: true,
        Field: true,
        Payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const history = reservations.map((res) => {
      const totalPaid = res.Payment?.amount || 0;
      const fieldPrice = res.price;
      const appRevenue = totalPaid - fieldPrice;

      return {
        id: res.id,
        bookingCode: res.id.slice(-5).toUpperCase(),
        user: res.User.name || "Unnamed User",
        userEmail: res.User.email,
        field: res.Field.name,
        date: res.startDate,
        appRevenue: appRevenue,
      };
    });

    return history;
  } catch (error) {
    console.error("Failed to fetch app revenue history:", error);
    return [];
  }
};

/**
 * Server action to create a new review for a field.
 * @param formData - The form data containing the review details.
 */
export const createReview = async (formData: FormData) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required. Please sign in." };
  }

  const reservationId = formData.get("reservationId") as string;
  const fieldId = formData.get("fieldId") as string;
  const rating = parseInt(formData.get("rating") as string);
  const comment = formData.get("comment") as string;

  if (!rating || !comment) return { error: "Rating and comment are required." };
  if (!reservationId || !fieldId) return { error: "Invalid form data." };

  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return { error: "Booking not found." };
    if (reservation.userId !== session.user.id) return { error: "This reservation does not belong to you." };

    await prisma.review.create({
      data: {
        userId: session.user.id,
        fieldId: fieldId,
        reservationId: reservationId,
        rating: rating,
        comment: comment,
      },
    });

  } catch (error) {
    console.error("Prisma Error creating review:", error);
    return { error: "Database error: Failed to save review." };
  }

  revalidatePath("/myreservation");
  revalidatePath(`/field/${fieldId}`);

  return { success: true };
};

/**
 * Server action to save a contact message from a user.
 * @param _prevState - The previous form state (unused).
 * @param formData - The form data containing the contact message.
 */
export const saveMessage = async (_prevState: unknown, formData: FormData) => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "Name, Email, and Message fields are required." };
  }

  try {
    await prisma.message.create({
      data: { name, email, subject: subject || "No Subject", message },
    });

    return {
      success: true,
      message: "Message sent successfully! Thank you for contacting us.",
    };
  } catch (error) {
    console.error("Failed to save message:", error);
    return { error: "Failed to send message. Please try again later." };
  }
};

/**
 * Server action to verify a booking ticket via its QR code.
 * The QR code is expected to contain "BOOKING-<reservationId>".
 * @param qrCode - The full string scanned from the QR code.
 * @returns An object indicating success or failure, with reservation details on success.
 */
export const verifyTicket = async (qrCode: string) => {
  const bookingId = qrCode.replace("BOOKING-", "");

  if (!bookingId) return { error: "Invalid or empty QR Code." };

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
      return { error: "Booking not found in the database." };
    }

    if (reservation.Payment?.status !== "PAID") {
      return {
        error: "This booking is UNPAID or has been canceled.",
        details: reservation,
      };
    }

    return {
      success: true,
      message: "TICKET VALID! Please proceed.",
      data: reservation,
    };
  } catch (error) {
    console.error("Ticket verification scan error:", error);
    return { error: "A server error occurred during validation." };
  }
};