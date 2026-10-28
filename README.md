# MIRA · Gestión de Juventudes

Plataforma web para gestionar los registros de jóvenes, los eventos y la formación del equipo de coordinadores. El código está en la carpeta [`mira-form/`](mira-form/).

## Tecnologías

- **Next.js 16** (App Router) con React y TypeScript.
- **MongoDB** con Mongoose.
- **Auth.js (next-auth v5)**. Hay dos roles: `admin` y `coordinador`.
- **Vercel Blob** para videos, PDF, presentaciones, imágenes y entregas. Las subidas usan URLs prefirmadas con OIDC.
- **TipTap** como editor de texto enriquecido para la teoría de los cursos.
- Tailwind, framer-motion, lucide-react y sonner para la interfaz y las notificaciones.
- Google Sheets (googleapis) y correo SMTP (nodemailer).

## Módulos

### Panel y registros
- Dashboard con indicadores. La sección «Pendientes de revisión» lista los registros con datos incompletos.
- Formulario de inscripción con selección de municipio, a partir de los municipios registrados en la app.
- Gestión de usuarios y permisos por municipio (RBAC en `lib/rbac.ts`).
- La misma identidad visual en todo el panel (azul marino `#0A2472`, azul `#1E56E8`, violeta `#5B3FE4`, fuente Plus Jakarta Sans), adaptada al celular.

### Eventos
- Un evento puede tener varias fechas, con cupo e inscripción por fecha.
- **Repetición estilo Google Calendar:**
  - Opciones: cada día, días hábiles, semanal en los días elegidos, mensual o personalizado.
  - La serie termina después de N veces o en una fecha.
  - Hay vista previa de la serie y se puede quitar una fecha suelta.
- Las fechas pasadas se ocultan en la inscripción pública.
- Se pueden eliminar eventos.

### Estudio (cursos)
Cada curso tiene un menú interno al estilo Canvas o Moodle:

| Sección | Qué contiene |
|---|---|
| **Inicio** | La carátula del curso: foto de portada y contenido de bienvenida que escribe el admin. |
| **Programa del curso** | Objetivos, metodología, cronograma y forma de evaluación. |
| **Módulos** | Temas con introducción y lecciones. Cada lección tiene teoría escrita (con imágenes) y, si se quiere, un video, PDF o presentación. Cada tema puede tener un cuestionario. |
| **Tareas** | El admin crea tareas con fecha límite, puntaje y tipo de entrega (archivo, texto o ambos). El coordinador entrega y el admin califica y comenta. |
| **Evaluaciones** | Todos los cuestionarios del curso con su estado y nota. |
| **Calificaciones** | Para el coordinador, sus notas de cuestionarios y tareas. Para el admin, el resumen de entregas por calificar y el enlace al reporte. |

Además:
- **Desbloqueo en orden** (opcional por curso): un tema se abre al completar el anterior, es decir, al ver sus lecciones y aprobar su cuestionario.
- **Reporte de avance** del equipo, solo para el admin y exportable a CSV.
- La portada del curso también se muestra en su tarjeta del listado.

### Seguridad
- Todo el HTML de la teoría se limpia en el servidor con `sanitize-html`. Las imágenes solo se aceptan si vienen del Blob propio.
- La API nunca envía las respuestas correctas de los cuestionarios a los coordinadores, ni el contenido de los temas bloqueados.
- Cada persona solo puede subir entregas dentro de su propia carpeta del curso.
- Los archivos que dejan de usarse se borran del Blob al guardar.

## Desarrollo local

```bash
cd mira-form
npm install
npm run dev
```

Crea `mira-form/.env.local`. Este archivo no se sube al repositorio. Necesita estas variables:

| Variable | Uso |
|---|---|
| `MONGODB_URI` | Conexión a MongoDB |
| `AUTH_SECRET` | Secreto de Auth.js |
| `BLOB_STORE_ID` | Store de Vercel Blob (OIDC) |
| `BLOB_WEBHOOK_PUBLIC_KEY` | Clave pública del webhook de Blob |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` | Sincronización con Google Sheets |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Envío de correos |

## Despliegue

Vercel despliega automáticamente desde la rama `main`, y cada rama genera su propia preview. El directorio raíz del proyecto en Vercel es `mira-form/`.
