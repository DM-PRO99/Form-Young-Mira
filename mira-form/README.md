# MIRA - Encuesta (Next.js + TypeScript)

Proyecto generado para la encuesta de Juventudes MIRA.

**Características**
- Next.js (App Router)
- TypeScript (strict)
- React Hook Form + Zod validation
- TailwindCSS with custom blue (#00289f)
- Server API route using googleapis to append rows to Google Sheets (service account)

## Setup rápido
1. Instala dependencias:
   ```
   npm install
   ```
2. Copia el archivo de ejemplo `.env.local.example` a `.env.local` y completa las variables:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (reemplaza los saltos de línea con \n)
   - `GOOGLE_SHEET_ID`
3. Ejecuta en desarrollo:
   ```
   npm run dev
   ```
4. Abre http://localhost:3000

## Notas
- Si prefieres usar Google Apps Script (endpoint público) en lugar de la API with service account, modifica `app/api/submit/route.ts` para hacer `fetch` al endpoint del script.
- Revisa `data/questions.ts` para editar preguntas y opciones sin tocar la lógica.
