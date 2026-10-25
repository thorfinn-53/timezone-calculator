import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError, readJson } from "@/lib/api";
import AppSettings from "@/models/AppSettings";
import Moderator from "@/models/Moderator";

export async function GET() {
  try {
    await dbConnect();
    const settings = await AppSettings.findById("settings").lean();
    return NextResponse.json({ autosave: settings?.autosave ?? false });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const data = await readJson(request);
    if (typeof data.enabled !== "boolean") {
      throw new TypeError("enabled must be a boolean");
    }
    await dbConnect();
    const settings = await AppSettings.findByIdAndUpdate(
      "settings",
      { $set: { autosave: data.enabled } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return NextResponse.json({ autosave: settings.autosave });
  } catch (error) {
    return handleApiError(error);
  }
}
