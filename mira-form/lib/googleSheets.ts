import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

export async function appendRow(sheetName: string, data: any) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error(" Falta GOOGLE_SHEET_ID en .env");

  
  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error(" Falta GOOGLE_CLIENT_EMAIL en .env");
  }
  if (!process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error(" Falta GOOGLE_PRIVATE_KEY en .env");
  }

  const sheet = sheets.spreadsheets.values;

  
  const serializeValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      
      return value.join(", ");
    }
    if (typeof value === "object") {
      
      return JSON.stringify(value);
    }
    return String(value);
  };

  
  const headers = Object.keys(data);
  const values = headers.map((key) => serializeValue(data[key]));

  console.log("📊 Headers:", headers);
  console.log("📊 Values:", values);

  try {
    
    const existing = await sheet.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    });

    const existingHeaders = existing.data.values?.[0] || [];

    
    if (existingHeaders.length === 0) {
      console.log(" Creando encabezados...");
      await sheet.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    
    console.log(" Guardando datos en Google Sheets...");
    await sheet.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });

    console.log(" Datos guardados exitosamente");
    return true;
  } catch (error: any) {
    console.error(" Error al guardar en Google Sheets:", error);
    if (error.message?.includes("invalid_grant")) {
      throw new Error("Error de autenticación con Google Sheets. Verifica las credenciales.");
    }
    throw new Error(`Error al guardar en Google Sheets: ${error.message}`);
  }
}
