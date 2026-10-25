import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await dbConnect();
    return NextResponse.json({ message: "Data is saved automatically in MongoDB" });
  } catch (error) {
    return handleApiError(error);
  }
}
