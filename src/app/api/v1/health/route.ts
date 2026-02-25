import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "eaf-platform",
      checkedAt: new Date().toISOString(),
    },
    { status: 200 },
  );
}
