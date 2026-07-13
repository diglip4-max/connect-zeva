// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.model";
import { syncClinicStaff } from "../services/userSync.service";
import { successResponse } from "../utils/apiResponse";

export const getClinicStaff = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { clinicId, id: currentUserId } = req.user!;

    // background me fresh sync trigger karo (non-blocking - stale-while-revalidate pattern)
    await syncClinicStaff(clinicId); // fire and forget, error already logged inside

    const staff = await User.find({
      clinicId,
      isActive: true,
      _id: { $ne: currentUserId }, // apne aap ko list se exclude karo
    })
      .select("_id name avatarUrl role isOnline lastSeenAt")
      .sort({ name: 1 });

    return successResponse(res, 200, "Clinic staff fetched", staff);
  } catch (err) {
    next(err);
  }
};
