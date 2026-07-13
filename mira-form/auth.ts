import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import authConfig from './auth.config'
import { connectToMongoDB } from '@/lib/mongodb'
import User from '@/models/User'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        await connectToMongoDB()

        const user = await User.findOne({
          email: parsed.data.email.toLowerCase(),
        }).select('+passwordHash')

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
