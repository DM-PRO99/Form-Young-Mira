import { NextResponse } from "next/server";
import { appendRow } from "@/lib/googleSheets";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log(" Data recibida:", data);

    await appendRow("Sheet1", data);

    return NextResponse.json({ success: true, message: " Registro exitoso" });
  } catch (error: any) {
    console.error(" Error API:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
