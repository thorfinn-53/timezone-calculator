import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { handleApiError, readJson } from "@/lib/api";
import Moderator from "@/models/Moderator";

export async function POST(request) {
  try {
    const { visible_mods: visibleMods } = await readJson(request);
    if (!Array.isArray(visibleMods) || visibleMods.some((name) => typeof name !== "string")) {
      throw new TypeError("visible_mods must be an array of moderator names");
    }
    await dbConnect();
    await Moderator.updateMany({}, [
      { $set: { filtered: { $not: [{ $in: ["$name", visibleMods] }] } } },
    ]);
    return NextResponse.json({
      message: "Moderator filter updated",
      visible_mods: visibleMods,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
