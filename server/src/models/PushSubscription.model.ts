// src/models/PushSubscription.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  userId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string; // optional: browser/OS info for debugging
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    deviceInfo: { type: String },
  },
  { timestamps: true },
);

export const PushSubscription = model<IPushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema,
);
