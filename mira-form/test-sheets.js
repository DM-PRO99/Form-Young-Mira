const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testSheets() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('Variables de entorno:');
    console.log('- Email:', clientEmail);
    console.log('- Sheet ID:', spreadsheetId);
    console.log('- Private Key presente:', !!privateKey);

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

    console.log('\n=== HOJAS DISPONIBLES ===');
    console.log('Título del archivo:', spreadsheet.data.properties?.title);
    console.log('URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    console.log('\nHojas:');
    spreadsheet.data.sheets?.forEach(sheet => {
      console.log(`- "${sheet.properties?.title}" (ID: ${sheet.properties?.sheetId})`);
    });

    // Intentar leer datos de la primera hoja
    const firstSheet = spreadsheet.data.sheets?.[0];
    if (firstSheet) {
      console.log(`\n=== DATOS DE LA HOJA "${firstSheet.properties?.title}" ===`);
      const values = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${firstSheet.properties?.title}!A1:Z10`,
      });
      console.log('Filas encontradas:', values.data.values?.length || 0);
      if (values.data.values && values.data.values.length > 0) {
        console.log('Primeros 5 registros:');
        values.data.values.slice(0, 5).forEach((row, idx) => {
          console.log(`  ${idx + 1}:`, row.join(' | '));
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

testSheets();

