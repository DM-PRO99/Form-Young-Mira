const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function testSubmit() {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('Iniciando prueba de guardado...\n');

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
    
    // Datos de prueba
    const testData = {
      q_1: 'Sí',
      q_2: 'Juan Pérez',
      q_3: 'Masculino',
      q_4: '2000-01-15',
      q_5: '3001234567',
      tipoDocumento: 'C.C.',
      numeroDocumento: '1234567890',
      q_7: 'No aplica',
      q_8: 'Medellín',
      // Agrega más campos según sea necesario
    };

    console.log('Datos de prueba:', testData);
    
    // Simular el guardado
    const SHEET_NAME = 'Base de datos';
    
    // Verificar que la hoja existe
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    let respuestasSheet = spreadsheet.data.sheets?.find(
      sheet => sheet.properties?.title === SHEET_NAME
    );

    if (!respuestasSheet) {
      console.log(`Creando hoja "${SHEET_NAME}"...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: SHEET_NAME,
                gridProperties: { rowCount: 1000, columnCount: 50 }
              }
            }
          }]
        }
      });
      console.log(`Hoja "${SHEET_NAME}" creada`);
    }

    // Leer datos existentes
    console.log('Leyendo datos existentes...');
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:Z10000`,
    });

    const existingValues = readRes.data.values || [];
    const header = existingValues[0] ? existingValues[0].map(String) : [];
    const dataKeys = Object.keys(testData);
    
    const unionHeaders = Array.from(new Set([...header, ...dataKeys]));
    console.log('Encabezados finales:', unionHeaders);

    // Actualizar encabezados si es necesario
    if (!header.length || unionHeaders.join('|') !== header.join('|')) {
      console.log('Actualizando encabezados...');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [unionHeaders] },
      });
    }

    // Preparar nueva fila
    const newRow = unionHeaders.map(h => testData[h] || '');
    console.log('Fila a insertar:', newRow);

    // Insertar nueva fila
    console.log('Insertando fila...');
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [newRow] },
    });

    console.log('\n✅ Datos guardados exitosamente!');
    
    // Verificar que se guardó
    console.log('\nVerificando datos guardados...');
    const verifyRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:Z100`,
    });
    
    console.log('Total de filas:', verifyRes.data.values?.length || 0);
    if (verifyRes.data.values && verifyRes.data.values.length > 0) {
      console.log('\nPrimeras 5 filas:');
      verifyRes.data.values.slice(0, 5).forEach((row, idx) => {
        console.log(`  ${idx + 1}:`, row.join(' | '));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testSubmit();

