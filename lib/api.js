import { NextResponse } from "next/server";
import { RANKS } from "@/lib/timezone";

export function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error) {
  console.error("API request failed:", error);
  if (error instanceof TypeError || error instanceof RangeError) {
    return jsonError(error.message, 400);
  }
  if (error?.name === "ValidationError") {
    return jsonError(error.message, 400);
  }
  return jsonError("An unexpected server error occurred", 500);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new TypeError("Request body must be valid JSON");
  }
}

export function serializeModerator(moderator) {
  return {
    name: moderator.name,
    rank: RANKS[moderator.rank] || moderator.rank,
    offduty: moderator.offduty,
    timezone: moderator.timezone,
    availability: moderator.availability.map((range) => ({
      start_minute: range.start_minute,
      end_minute: range.end_minute,
    })),
    utc_offset: moderator.utc_offset,
    filtered: moderator.filtered,
  };
}
