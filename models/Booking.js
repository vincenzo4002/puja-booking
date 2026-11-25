import mongoose from "mongoose";
import { STATUSES, MODES } from "../lib/constants.js";

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    devotee: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      gotra: { type: String, trim: true },
    },
    puja: { type: String, required: true, trim: true, index: true },
    pujaDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: "Pending", index: true },
    mode: { type: String, enum: MODES, default: "At Temple" },
    location: { type: String, trim: true },
    pandit: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    statusHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
