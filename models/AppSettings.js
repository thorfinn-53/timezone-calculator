import mongoose from "mongoose";

const AppSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: "settings" },
  autosave: { type: Boolean, default: false },
});

export default mongoose.models.AppSettings ||
  mongoose.model("AppSettings", AppSettingsSchema);
