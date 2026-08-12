import { NextResponse } from "next/server";
import { HealthResponse } from "@/lib/types";

export async function GET() {
  const response: HealthResponse = {
    status: "ok",
    stores: ["continente", "pingodoce"],
    timestamp: new Date().toISOString()
  };
  return NextResponse.json(response);
}
