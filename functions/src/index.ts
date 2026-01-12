import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Global limits (cost protection)
setGlobalOptions({ maxInstances: 10 });

/* ---------------------------------
   VALIDATION SCHEMAS
----------------------------------*/

const ConsultantApplicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  locationState: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  specialties: z.array(z.string()).min(1).max(5),
  bio: z.string().min(20).max(1000),
});

const ConsultantRequestSchema = z.object({
  email: z.string().email(),
  topic: z.string().min(10).max(500),
  category: z.enum(["PAYE", "Reliefs", "Filing", "Employment", "Other"]),
  urgency: z.enum(["ASAP", "This week", "Later"]),
  budgetRange: z.string().optional(),
});

/* ---------------------------------
   CONSULTANT APPLICATION
----------------------------------*/
export const createConsultantApplication = onCall(async (request) => {
  const uid = request.auth?.uid ?? null;

  const parsed = ConsultantApplicationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid application data");
  }

  const data = parsed.data;

  await db.collection("consultantApplications").add({
    uid,
    ...data,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info("Consultant application submitted", { email: data.email });

  return { success: true };
});

/* ---------------------------------
   CONSULTANT REQUEST (WAITLIST)
----------------------------------*/
export const createConsultantRequest = onCall(async (request) => {
  const uid = request.auth?.uid ?? null;

  const parsed = ConsultantRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid request data");
  }

  const data = parsed.data;

  await db.collection("consultantRequests").add({
    uid,
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("Consultant request submitted", { email: data.email });

  return { success: true };
});
