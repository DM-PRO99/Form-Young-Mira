# 📋 Formulario Juventudes MIRA

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss)
![Google Sheets](https://img.shields.io/badge/Google_Sheets-API-34a853?style=for-the-badge&logo=googlesheets)

Formulario de encuesta moderno y elegante para Juventudes MIRA con integración directa a Google Sheets.

[Demo en Vivo](https://form-young-mira.vercel.app) • [Reportar Bug](https://github.com/DM-PRO99/Form-Young-Mira/issues) • [Solicitar Feature](https://github.com/DM-PRO99/Form-Young-Mira/issues)

</div>

---

## ✨ Características

### 🎨 Diseño Moderno y Minimalista
- Interfaz elegante con gradientes y sombras suaves
- Animaciones fluidas y transiciones suaves
- Diseño responsive para móvil, tablet y desktop
- Tema personalizado con color azul MIRA (#00289f)
- Scrollbar personalizado
- Efectos hover y focus en todos los elementos interactivos

### 🏘️ Sistema de Barrios Dinámicos
- **76 barrios y veredas de Itagüí** organizados por comunas (1-6)
- Selección dinámica de barrio según municipio
- **Llenado automático de comuna** al seleccionar barrio
- Fácilmente extensible para otros municipios
- Validación de datos consistente

### 📊 Integración con Google Sheets
- Guardado automático de respuestas en tiempo real
- Serialización inteligente de arrays y objetos
- Manejo de errores robusto
- Creación automática de headers si no existen
- Autenticación segura con Service Account

### 🔒 Seguridad
- Validación de origen de peticiones (CORS)
- Variables de entorno protegidas
- Validación de datos con Zod
- Sanitización de inputs

### 🎯 Experiencia de Usuario
- Notificaciones visuales de éxito/error
- Loading spinner elegante durante envío
- Validación en tiempo real
- Mensajes de error claros y descriptivos
- Botón para llenar otro formulario

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Google Cloud con Sheets API habilitada
- Service Account de Google con acceso al Sheet

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/DM-PRO99/Form-Young-Mira.git
   cd Form-Young-Mira/mira-form
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   GOOGLE_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----"
   GOOGLE_SHEET_ID=tu-id-de-google-sheets
   ```

   ⚠️ **Importante:** 
   - Los saltos de línea en `GOOGLE_PRIVATE_KEY` deben ser `\n` literales
   - Encierra la clave entre comillas dobles

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

---

## 📁 Estructura del Proyecto

```
mira-form/
├── app/
│   ├── api/
│   │   └── submit/
│   │       └── route.ts          # API endpoint para envío de formulario
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal
├── components/
│   ├── Form.tsx                  # Componente principal del formulario
│   └── QuestionField.tsx         # Componente para renderizar preguntas
├── data/
│   └── questions.ts              # Definición de preguntas y barrios
├── lib/
│   └── googleSheets.ts           # Integración con Google Sheets API
├── styles/
│   └── globals.css               # Estilos globales y Tailwind
└── .env.local                    # Variables de entorno (no incluido)
```

---

##  Tecnologías Utilizadas

- **[Next.js 14](https://nextjs.org/)** - Framework React con App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[React Hook Form](https://react-hook-form.com/)** - Manejo de formularios
- **[Zod](https://zod.dev/)** - Validación de esquemas
- **[TailwindCSS](https://tailwindcss.com/)** - Estilos utility-first
- **[Google Sheets API](https://developers.google.com/sheets/api)** - Almacenamiento de datos
- **[googleapis](https://www.npmjs.com/package/googleapis)** - Cliente oficial de Google APIs

---

##  Despliegue en Vercel

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New..."** → **"Project"**
3. Importa el repositorio **"Form-Young-Mira"**

### Paso 2: Configurar Variables de Entorno

En la configuración del proyecto en Vercel, agrega:

```
GOOGLE_CLIENT_EMAIL = tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\ntu-clave\n-----END PRIVATE KEY-----
GOOGLE_SHEET_ID = tu-id-de-sheets
```

### Paso 3: Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Tu formulario estará en línea!

### Paso 4: Actualizar Seguridad

Después del deploy, actualiza `app/api/submit/route.ts` con tu URL:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://tu-dominio.vercel.app', // Reemplaza con tu URL
]
```

Haz commit y push para actualizar.

---

##  Configuración de Google Sheets

### 1. Crear Service Account

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google Sheets API**
4. Ve a **IAM & Admin** → **Service Accounts**
5. Crea una nueva Service Account
6. Genera una clave JSON y descárgala

### 2. Configurar Google Sheet

1. Crea un nuevo Google Sheet
2. Comparte el Sheet con el email del Service Account (con permisos de Editor)
3. Copia el ID del Sheet desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE-ES-EL-ID]/edit
   ```

### 3. Formato del Sheet

El formulario creará automáticamente los headers en la primera fila. Asegúrate de que la hoja se llame **"Sheet1"** o actualiza el nombre en `app/api/submit/route.ts`.

---

## 🎨 Personalización

### Agregar Barrios de Otros Municipios

Edita `data/questions.ts` y agrega al objeto `neighborhoodsByMunicipality`:

```typescript
export const neighborhoodsByMunicipality = {
  "Itagüí": {
    // ... barrios existentes
  },
  "Medellín": {
    "El Poblado": "Comuna 14",
    "Laureles": "Comuna 11",
    // ... más barrios
  },
}
```

### Modificar Preguntas

Edita el array `questions` en `data/questions.ts`:

```typescript
{
  id: 99,
  question: "Tu nueva pregunta",
  type: "radio", // radio, checkbox, text, textarea, date, select
  options: ["Opción 1", "Opción 2"],
  required: true,
}
```

### Cambiar Colores

Edita `tailwind.config.ts`:

```typescript
colors: {
  miraBlue: '#00289f', // Cambia este color
}
```

---

## 🐛 Solución de Problemas

### Error: "Failed to append row"

- Verifica que el Service Account tenga permisos de Editor en el Sheet
- Confirma que el `GOOGLE_SHEET_ID` sea correcto
- Revisa que la clave privada esté correctamente formateada

### Error: "Acceso no autorizado"

- Verifica que tu dominio esté en `allowedOrigins` en `route.ts`
- Confirma que las variables de entorno estén configuradas en Vercel

### El formulario no se envía

- Abre la consola del navegador (F12) y revisa errores
- Verifica que todos los campos requeridos estén llenos
- Confirma que el servidor esté corriendo

---

##  Licencia

Este proyecto es privado y pertenece a Diego Mena.

---

##  Autor

**Diego Alejandro Mena Ciceri**
- GitHub: [@DM-PRO99](https://github.com/DM-PRO99)

---



<div align="center">

**[⬆ Volver arriba](#-formulario-juventudes-mira)**

Hecho con 💙 para Juventudes MIRA

</div>
