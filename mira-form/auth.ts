import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import authConfig from './auth.config'
import { connectToMongoDB } from '@/lib/mongodb'
import { checkApiRateLimit, getClientIp } from '@/lib/apiRateLimit'
import User, { MIRA_ROLES } from '@/models/User'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
})

const LOGIN_WINDOW_MS = 15 * 60 * 1000

export class TooManyAttemptsError extends CredentialsSignin {
  code = 'rate_limited'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase()
        const [ipOk, emailOk] = await Promise.all([
          checkApiRateLimit(`login-ip:${getClientIp(request)}`, 30, LOGIN_WINDOW_MS),
          checkApiRateLimit(`login-email:${email}`, 10, LOGIN_WINDOW_MS),
        ])
        if (!ipOk || !emailOk) throw new TooManyAttemptsError()

        await connectToMongoDB()

        const user = await User.findOne({ email, role: { $in: MIRA_ROLES } }).select('+passwordHash')

        if (!user || !user.activo) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.nombre,
          role: user.role,
          municipios: user.municipios,
        }
      },
    }),
  ],
})
