'use server'
import { signIn, TooManyAttemptsError } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/admin/dashboard',
    })
  } catch (error) {
    if (error instanceof TooManyAttemptsError) return 'Demasiados intentos. Espera 15 minutos.'
    if (error instanceof AuthError) return 'Correo o contraseña incorrectos.'
    throw error // re-throw NEXT_REDIRECT
  }
  return null
}
