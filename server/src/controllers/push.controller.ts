import { Request, Response, NextFunction } from "express";
import { PushSubscription } from "../models/PushSubscription.model";
import { successResponse } from "../utils/apiResponse";

export const subscribe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { endpoint, keys, deviceLabel, browserName, osName } = req.body;
    const { id: userId } = req.user!;

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        endpoint,
        keys,
        deviceLabel,
        browserName,
        osName,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return successResponse(res, 200, "Subscribed to push notifications");
  } catch (err) {
    next(err);
  }
};

export const unsubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint });
    return successResponse(res, 200, "Unsubscribed");
  } catch (err) {
    next(err);
  }
};

export const listDevices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userId } = req.user!;
    const devices = await PushSubscription.find({ userId })
      .select("deviceLabel browserName osName lastUsedAt createdAt")
      .sort({ lastUsedAt: -1 });
    return successResponse(res, 200, "Devices fetched", devices);
  } catch (err) {
    next(err);
  }
};

export const revokeDevice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: userId } = req.user!;
    await PushSubscription.deleteOne({ _id: req.params.id, userId });
    return successResponse(res, 200, "Device revoked");
  } catch (err) {
    next(err);
  }
};
