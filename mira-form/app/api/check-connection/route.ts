import { NextResponse } from 'next/server';
import { verifyGoogleSheetsConnection } from '@/lib/googleSheets';

export async function GET() {
  try {
    const result = await verifyGoogleSheetsConnection();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (err) {
    console.error('Error al verificar la conexión:', err);
    return NextResponse.json({
      success: false,
      message: 'Error al verificar la conexión',
      details: { error: String(err) }
    }, { 
      status: 500 
    });
  }
}