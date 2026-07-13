const dotenv = require('dotenv');
const path = require('path');
const { execSync } = require('child_process');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Ejecutar el script tsx con las variables cargadas
try {
  execSync('npx tsx scripts/seed-admin.ts', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (error) {
  console.error('Error al ejecutar el script:', error.message);
  process.exit(1);
}
