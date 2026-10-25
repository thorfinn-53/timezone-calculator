import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError, readJson } from "@/lib/api";
import Moderator from "@/models/Moderator";
import { RANKS } from "@/lib/timezone";

const RANK_FAMILIES = {
  Recruit: "RECRUIT",
  Knight: "KNIGHT",
  "Vanguard Knight": "KNIGHT",
  Commander: "COMMANDER",
  "Prime Commander": "COMMANDER",
  General: "GENERAL",
  "Supreme General": "GENERAL",
  "Saiyan Royalty": "GENERAL",
};

export async function POST(request) {
  try {
    const { visible_ranks: visibleRanks } = await readJson(request);
    const allowedRanks = ["RECRUIT", "KNIGHT", "COMMANDER", "GENERAL"];
    if (
      !Array.isArray(visibleRanks) ||
      visibleRanks.some((rank) => !allowedRanks.includes(rank))
    ) {
      throw new TypeError("visible_ranks contains an invalid rank family");
    }
    await dbConnect();
    const moderators = await Moderator.find().select("name rank").lean();
    await Promise.all(
      moderators.map((moderator) =>
        Moderator.updateOne(
          { _id: moderator._id },
          {
            $set: {
              filtered: !visibleRanks.includes(
                RANK_FAMILIES[moderator.rank] ??
                  RANK_FAMILIES[RANKS[moderator.rank]],
              ),
            },
          },
        ),
      ),
    );
    return NextResponse.json({
      message: "Rank filter updated",
      visible_ranks: visibleRanks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
