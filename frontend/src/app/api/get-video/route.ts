import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://127.0.0.1:8000";

// Proxy get-video request to backend
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendRes = await fetch(
      `${backendBaseUrl}/api/twelvelabs/get-video`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
