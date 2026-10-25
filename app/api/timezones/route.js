import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { getTimezones } from "@/lib/timezone";

export function GET() {
  try {
    return NextResponse.json(getTimezones());
  } catch (error) {
    return handleApiError(error);
  }
}
