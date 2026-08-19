import { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://mira-form.vercel.app',
  'http://localhost:3000',
]

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

type RouteHandler<C = any> = (req: NextRequest, ctx: C) => Promise<Response> | Response

export function withCors<C = any>(handler: RouteHandler<C>): RouteHandler<C> {
  return async (req, ctx) => {
    const response = await handler(req, ctx)
    const headers = buildCorsHeaders(req.headers.get('origin'))
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }
    return response
  }
}

export function corsPreflight(req: NextRequest): Response {
  return new Response(null, { status: 204, headers: buildCorsHeaders(req.headers.get('origin')) })
}
