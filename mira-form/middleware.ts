import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
