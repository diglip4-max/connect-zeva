// src/models/User.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IUser extends Document {
  zevaUserId: string; // reference to original Zeva Clinic user
  clinicId: string; // for clinic-scoping
  name: string;
  avatarUrl?: string;
  role: "doctor" | "receptionist" | "staff" | "admin";
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    zevaUserId: { type: String, required: true, unique: true, index: true },
    clinicId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["doctor", "receptionist", "staff", "admin"],
      default: "staff",
    },
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Compound index - fast lookup of all users within a clinic
userSchema.index({ clinicId: 1, isActive: 1 });

export const User = model<IUser>("User", userSchema);
