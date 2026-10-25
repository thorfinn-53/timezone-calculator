import { connection, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError } from "@/lib/api";
import Moderator from "@/models/Moderator";
import { compressGraphData, createGraphData } from "@/lib/timezone";

export async function GET(request) {
  await connection();
  try {
    const rawSlotSize = new URL(request.url).searchParams.get("slot_size");
    const slotSize = rawSlotSize === null ? 60 : Number(rawSlotSize);
    const includeModerators =
      new URL(request.url).searchParams.get("include_moderators") === "true";
    await dbConnect();
    const moderators = await Moderator.find().lean();
    const graph = createGraphData(moderators, slotSize);
    if (includeModerators) {
      return NextResponse.json({
        graph: compressGraphData(graph),
        moderators: moderators.map(({ name, rank }) => ({ name, rank })),
      });
    }
    return NextResponse.json(graph);
  } catch (error) {
    return handleApiError(error);
  }
}
