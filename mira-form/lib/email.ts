import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Faltan variables de entorno SMTP_HOST, SMTP_PORT, SMTP_USER o SMTP_PASSWORD'
    )
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  })

  return cachedTransporter
}

function formatFechaEvento(fecha: Date): string {
  return new Date(fecha).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface SendRegistrationThankYouParams {
  to: string
  nombreCompleto: string
  eventoNombre: string
  eventoFecha: Date
  eventoLugar: string
}

export async function sendRegistrationThankYou({
  to,
  nombreCompleto,
  eventoNombre,
  eventoFecha,
  eventoLugar,
}: SendRegistrationThankYouParams): Promise<void> {
  const transporter = getTransporter()
  const logoPath = path.join(process.cwd(), 'public', 'mira-badge.png')
  const logoBuffer = fs.readFileSync(logoPath)

  const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || nombreCompleto

  const html = `
    <div style="background:#F4F6FA;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E6EAF2;">
        <div style="background:linear-gradient(175deg,#00318C 0%,#001348 100%);padding:28px 28px 24px;text-align:center;">
          <img src="cid:mira-logo" alt="Mira" width="44" height="44" style="border-radius:10px;display:inline-block;" />
          <p style="color:#FFFFFF;font-size:13px;font-weight:600;letter-spacing:.08em;margin:12px 0 0;">MIRA · PANEL DE EVENTOS</p>
        </div>
        <div style="padding:28px;">
          <h1 style="font-size:19px;color:#16213E;margin:0 0 12px;">¡Gracias por inscribirte, ${primerNombre}!</h1>
          <p style="font-size:14px;color:#41537A;line-height:1.6;margin:0 0 20px;">
            Confirmamos tu inscripción a <strong style="color:#16213E;">${eventoNombre}</strong>. Nos alegra que vayas a acompañarnos.
          </p>
          <div style="background:#EAF0FC;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
            <p style="font-size:13px;color:#0B3AA8;margin:0 0 6px;"><strong>Fecha:</strong> ${formatFechaEvento(eventoFecha)}</p>
            <p style="font-size:13px;color:#0B3AA8;margin:0;"><strong>Lugar:</strong> ${eventoLugar}</p>
          </div>
          <p style="font-size:12.5px;color:#6B7A99;line-height:1.6;margin:0;">
            Si tienes alguna duda sobre el evento, comunícate con el equipo organizador. ¡Te esperamos!
          </p>
        </div>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Inscripción confirmada · ${eventoNombre}`,
    html,
    attachments: [
      {
        filename: 'mira-badge.png',
        content: logoBuffer,
        cid: 'mira-logo',
      },
    ],
  })
}
