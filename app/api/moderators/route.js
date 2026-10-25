import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError, readJson, serializeModerator } from "@/lib/api";
import Moderator from "@/models/Moderator";
import {
  getUtcOffsetHours,
  parseAvailability,
  RANKS,
} from "@/lib/timezone";

export async function GET() {
  try {
    await dbConnect();
    const moderators = await Moderator.find().sort({ name: 1 }).lean();
    return NextResponse.json(moderators.map(serializeModerator));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request) {
  try {
    const data = await readJson(request);
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw new TypeError("Name is required");
    }
    if (
      typeof data.rank !== "string" ||
      !Object.hasOwn(RANKS, data.rank)
    ) {
      throw new TypeError("Rank is invalid");
    }
    if (
      typeof data.timezone !== "string" ||
      !data.timezone.trim()
    ) {
      throw new TypeError("Timezone is required");
    }

    const availability = parseAvailability(data.availability);
    const utcOffset = getUtcOffsetHours(data.timezone);
    await dbConnect();

    const existing = await Moderator.findOne({ name: data.name.trim() }).lean();
    const moderator = await Moderator.findOneAndUpdate(
      { name: data.name.trim() },
      {
        $set: {
          rank: RANKS[data.rank],
          timezone: data.timezone,
          availability,
          utc_offset: utcOffset,
          offduty: existing?.offduty ?? Boolean(data.offduty),
          filtered: existing?.filtered ?? false,
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    return NextResponse.json(
      {
        message: existing
          ? "Applied changes to already existing moderator"
          : "Moderator added",
        moderator: serializeModerator(moderator),
      },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
