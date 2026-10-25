import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema(
  {
    start_minute: { type: Number, required: true, min: 0, max: 1439 },
    end_minute: { type: Number, required: true, min: 0, max: 1440 },
  },
  { _id: false },
);

const ModeratorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    rank: { type: String, required: true },
    offduty: { type: Boolean, default: false },
    timezone: { type: String, required: true },
    availability: { type: [AvailabilitySchema], required: true },
    utc_offset: { type: Number, required: true },
    filtered: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Moderator ||
  mongoose.model("Moderator", ModeratorSchema);
