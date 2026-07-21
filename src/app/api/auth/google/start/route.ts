import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/server/services/google-drive";

export async function GET() {
  return NextResponse.redirect(getGoogleAuthUrl());
}
