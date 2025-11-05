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

// Orden fijo de columnas que coincide con el formulario
const COLUMN_ORDER = [
  "q_1",           // Aceptación de política de datos
  "q_2",           // Nombre completo
  "q_3",           // Género
  "q_4",           // Fecha de nacimiento
  "q_5",           // Número de celular
  "tipoDocumento", // Tipo de documento (grupo 6)
  "numeroDocumento", // Número de documento (grupo 6)
  "q_7",           // Grupo poblacional
  "q_8",           // Municipio
  "q_8b",          // Barrio
  "q_8c",          // Comuna
  "q_9",           // Dirección
  "q_10",          // Libreta militar
  "q_11",          // ¿Estás estudiando?
  "q_12",          // Qué te gustaría estudiar
  "q_13",          // Qué estás estudiando
  "q_14",          // Actividades deportivas
  "q_15",          // Actividades políticas
  "q_16",          // Actividades sociales
  "q_17",          // Idiomas
  "q_18",          // Redes sociales
  "q_19",          // Conocimientos tecnológicos
  "q_20",          // ¿Tienes emprendimiento?
  "q_21",          // Cuál emprendimiento
  "q_22",          // Tiempo conociendo la iglesia
  "q_23",          // Horario de culto
];

// Nombres legibles para los headers
const COLUMN_HEADERS: { [key: string]: string } = {
  "q_1": "Aceptación Política de Datos",
  "q_2": "Nombre Completo",
  "q_3": "Género",
  "q_4": "Fecha de Nacimiento",
  "q_5": "Número de Celular",
  "tipoDocumento": "Tipo de Documento",
  "numeroDocumento": "Número de Documento",
  "q_7": "Grupo Poblacional",
  "q_8": "Municipio",
  "q_8b": "Barrio",
  "q_8c": "Comuna",
  "q_9": "Dirección",
  "q_10": "Libreta Militar",
  "q_11": "¿Estás Estudiando?",
  "q_12": "Qué Te Gustaría Estudiar",
  "q_13": "Qué Estás Estudiando",
  "q_14": "Actividades Deportivas",
  "q_15": "Actividades Políticas",
  "q_16": "Actividades Sociales/Cívicas",
  "q_17": "Idiomas",
  "q_18": "Redes Sociales",
  "q_19": "Conocimientos Tecnológicos",
  "q_20": "¿Tienes Emprendimiento?",
  "q_21": "Cuál Emprendimiento",
  "q_22": "Tiempo Conociendo la Iglesia",
  "q_23": "Horario de Culto Preferido",
};

export async function appendRow(sheetName: string, data: any) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("❌ Falta GOOGLE_SHEET_ID en .env");

  if (!process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error("❌ Falta GOOGLE_CLIENT_EMAIL en .env");
  }
  if (!process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("❌ Falta GOOGLE_PRIVATE_KEY en .env");
  }

  const sheet = sheets.spreadsheets.values;

  // Función para serializar valores
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

  // Crear headers legibles usando el orden fijo
  const headers = COLUMN_ORDER.map(key => COLUMN_HEADERS[key] || key);
  
  // Crear valores en el mismo orden que los headers
  const values = COLUMN_ORDER.map((key) => serializeValue(data[key] || ""));

  console.log("📊 Orden de columnas:", COLUMN_ORDER);
  console.log("📊 Headers:", headers);
  console.log("📊 Datos recibidos:", data);
  console.log("📊 Values ordenados:", values);

  try {
    // Verificar si existen headers en la hoja
    const existing = await sheet.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    });

    const existingHeaders = existing.data.values?.[0] || [];

    // Si no hay headers, crearlos
    if (existingHeaders.length === 0) {
      console.log("✨ Creando encabezados en orden fijo...");
      await sheet.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    } else {
      // Verificar que los headers existentes coincidan con el orden esperado
      console.log("🔍 Headers existentes:", existingHeaders);
      
      // Si los headers no coinciden, actualizarlos
      const headersMatch = existingHeaders.length === headers.length && 
                          existingHeaders.every((h, i) => h === headers[i]);
      
      if (!headersMatch) {
        console.log("⚠️ Headers no coinciden. Actualizando...");
        await sheet.update({
          spreadsheetId: sheetId,
          range: `${sheetName}!1:1`,
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
      }
    }

    // Guardar los datos en el orden correcto
    console.log("💾 Guardando datos en Google Sheets...");
    await sheet.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });

    console.log("✅ Datos guardados exitosamente en el orden correcto");
    return true;
  } catch (error: any) {
    console.error("❌ Error al guardar en Google Sheets:", error);
    if (error.message?.includes("invalid_grant")) {
      throw new Error("Error de autenticación con Google Sheets. Verifica las credenciales.");
    }
    throw new Error(`Error al guardar en Google Sheets: ${error.message}`);
  }
}
