import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://127.0.0.1:8000";

// Proxy the upload to backend /upload-video endpoint
export async function POST(request: Request) {
  // Get the form data from the request
  const formData = await request.formData();
  // Prepare a new FormData to send to backend
  const backendForm = new FormData();
  for (const [key, value] of formData.entries()) {
    backendForm.append(key, value);
  }

  // Send to backend using env variable
  const backendRes = await fetch(`${backendBaseUrl}/api/twelvelabs/upload-video`, {
    method: "POST",
    body: backendForm,
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
