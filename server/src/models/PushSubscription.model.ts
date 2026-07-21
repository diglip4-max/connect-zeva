import { Schema, model, Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  userId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceLabel: string;
  browserName?: string;
  osName?: string;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
    deviceLabel: { type: String, default: "Unknown device" },
    browserName: { type: String },
    osName: { type: String },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ userId: 1, createdAt: -1 });

export const PushSubscription = model<IPushSubscription>(
  "PushSubscription",
  pushSubscriptionSchema,
);
