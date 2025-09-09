import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward signin request to your Express server
    const resp = await axios.post("http://localhost:3000/signin", body, {
      withCredentials: true,
      // Important: we need raw headers
      validateStatus: () => true, 
    });

    // Grab Set-Cookie header from Express
    const setCookie = resp.headers["set-cookie"];

    // Create NextResponse with the same body
    const nextResp = NextResponse.json(resp.data, {
      status: resp.status,
    });

    // Forward cookies from Express → Browser
    if (setCookie) {
      setCookie.forEach((cookie: string) => {
        nextResp.headers.append("Set-Cookie", cookie);
      });
    }

    return nextResp;
  } catch (err: any) {
    console.error("Proxy signin error:", err.message);
    return NextResponse.json({ message: "Signin failed" }, { status: 500 });
  }
}
