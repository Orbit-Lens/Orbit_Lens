import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'researcher' | 'admin';
  googleId?: string;
  refreshTokenHash?: string;
  failedLoginAttempts: number;
  lockUntil?: Date;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  institution?: string;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginLock(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['user', 'researcher', 'admin'], default: 'user' },
    googleId: { type: String, sparse: true },
    refreshTokenHash: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    storageUsedBytes: { type: Number, default: 0 },
    storageQuotaBytes: { type: Number, default: 10 * 1024 * 1024 * 1024 }, // 10 GB
    institution: { type: String, trim: true },
    isVerified: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // If previously locked and lock expired, reset
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: any = { $inc: { failedLoginAttempts: 1 } };
  // Lock account for 15 minutes after 5 failed attempts
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }

  await this.updateOne(updates);
};

UserSchema.methods.resetLoginLock = async function (): Promise<void> {
  await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

export const User = mongoose.model<IUser>('User', UserSchema);
