'use server'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { headers } from 'next/headers'

export async function loginAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0] ??
    headersList.get('x-real-ip') ??
    '127.0.0.1'
  if (!checkRateLimit(ip)) return 'Demasiados intentos. Espera 1 minuto.'
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/admin/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) return 'Correo o contraseña incorrectos.'
    throw error // re-throw NEXT_REDIRECT
  }
  return null
}
