import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError, readJson } from "@/lib/api";
import Moderator from "@/models/Moderator";

export async function POST(request) {
  try {
    const { name } = await readJson(request);
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError("Name is required");
    }
    await dbConnect();
    const removed = await Moderator.findOneAndDelete({ name: name.trim() });
    return NextResponse.json({
      message: removed ? "Moderator removed" : "Moderator not found",
      removed_moderator: removed?.name ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
