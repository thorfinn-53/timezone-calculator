import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";
import Moderator from "@/models/Moderator";

export async function POST() {
  try {
    await dbConnect();
    const moderatorsCount = await Moderator.countDocuments();
    return NextResponse.json({
      message: "Data loaded successfully",
      moderators_count: moderatorsCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
