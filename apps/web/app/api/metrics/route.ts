import { type NextRequest, NextResponse } from "next/server";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";
  const upstream = `${apiUrl}/api/metrics?${searchParams.toString()}`;

  try {
    const res = await fetch(upstream, { next: { revalidate: 30 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach upstream API" },
      { status: 502 },
    );
  }
}
