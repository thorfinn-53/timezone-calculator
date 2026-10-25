import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";
import Moderator from "@/models/Moderator";

export async function POST() {
  try {
    await dbConnect();
    await Moderator.updateMany({}, { $set: { filtered: false } });
    return NextResponse.json({ message: "Filters cleared" });
  } catch (error) {
    return handleApiError(error);
  }
}
