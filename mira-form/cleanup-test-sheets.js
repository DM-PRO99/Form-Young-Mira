const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    let processedKey = privateKey;
    if (privateKey.includes('\\n')) {
      processedKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: processedKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    console.log('Hojas encontradas:');
    const testSheets = [];
    spreadsheet.data.sheets?.forEach(sheet => {
      console.log(`- "${sheet.properties?.title}" (ID: ${sheet.properties?.sheetId})`);
      if (sheet.properties?.title && sheet.properties.title.startsWith('Test_Permisos_')) {
        testSheets.push(sheet.properties.sheetId);
      }
    });

    if (testSheets.length > 0) {
      console.log(`\nEliminando ${testSheets.length} hojas de prueba...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: testSheets.map(sheetId => ({
            deleteSheet: { sheetId }
          }))
        }
      });
      console.log('Hojas eliminadas exitosamente');
    } else {
      console.log('No hay hojas de prueba para eliminar');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanup();

