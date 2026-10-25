import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";
import Moderator from "@/models/Moderator";

export async function POST() {
  try {
    await dbConnect();
    await Moderator.deleteMany({});
    return NextResponse.json({ message: "All data reset" });
  } catch (error) {
    return handleApiError(error);
  }
}
