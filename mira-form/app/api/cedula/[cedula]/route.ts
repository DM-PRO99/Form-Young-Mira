import { sheets } from "@/lib/googleSheets"; // or use your helper
import { NextRequest, NextResponse } from "next/server";
import { withCors, corsPreflight } from "@/lib/cors";
import { checkApiRateLimit, getClientIp } from "@/lib/apiRateLimit";

export { corsPreflight as OPTIONS };

export const GET = withCors(async (
  request: NextRequest,
  { params }: { params: Promise<{ cedula: string }> }
) => {
  const ip = getClientIp(request);
  const allowed = await checkApiRateLimit(`cedula:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes, intenta de nuevo más tarde" }, { status: 429 });
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "GOOGLE_SHEET_ID not configured" },
        { status: 500 }
      );
    }

    const { cedula } = await params; 
    const range = "Sheet1!A1:AB500"; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      majorDimension: "ROWS"
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const header = rows[0];
    const ccIndex = header.findIndex(
      (h: string) =>
        h === "CC" || h === "Número de Documento" || h === "numeroDocumento"
    );

    if (ccIndex === -1) {
      return NextResponse.json(
        { error: "CC column not found" },
        { status: 400 }
      );
    }

    const foundRow = rows.find(
      (row: string[], i: number) => i > 0 && row[ccIndex] === cedula
    );

    if (!foundRow) {
      return NextResponse.json(
        { message: "No record found for this CC" },
        { status: 404 }
      );
    }

    const record = header.reduce<Record<string, string>>((obj: any, key: any, i: any) => {
      obj[key] = foundRow[i] ?? "";
      return obj;
    }, {});

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
});
