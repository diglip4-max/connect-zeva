// src/services/userSync.service.ts
import axios from "axios";
import { ENV } from "../config/env";
import { User } from "../models/User.model";
import logger from "../utils/logger";
import { ZevaTicketPayload } from "../types/models.types";

export async function syncClinicStaff(clinicId: string) {
  try {
    const response = await axios.get(
      `${ENV.ZEVA_AUTH_INTERNAL_URL}/clinic-staff`,
      {
        params: { clinicId },
        headers: { "x-internal-api-key": ENV.ZEVA_INTERNAL_API_KEY },
        timeout: 5000,
      },
    );
    if (response.data?.length === 0) {
      logger.info({ clinicId }, "No clinic staff found");
      return 0;
    }

    if (!response.data?.success) {
      logger.error({ clinicId }, "Failed to sync clinic staff");
      throw new Error(response.data?.message || "Failed to sync clinic staff");
    }

    const staffList = (response.data.data || []) as ZevaTicketPayload[];

    // bulk upsert - existing users update ho, naye create ho
    const bulkOps = staffList.map((staff) => ({
      updateOne: {
        filter: { zevaUserId: staff.zevaUserId },
        update: {
          $set: {
            zevaUserId: staff.zevaUserId,
            clinicId: staff.clinicId,
            name: staff.name,
            avatarUrl: staff.avatarUrl,
            role: staff.role,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    logger.info({ clinicId, count: staffList.length }, "Clinic staff synced");
    return staffList.length;
  } catch (err) {
    logger.warn({ err, clinicId }, "Failed to sync clinic staff");
    throw err;
  }
}
