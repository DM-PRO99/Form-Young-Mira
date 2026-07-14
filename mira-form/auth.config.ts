import type { NextAuthConfig } from 'next-auth'

export default {
  providers: [],
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/admin/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.role = user.role
        // No incluir municipios en el JWT para evitar error de serialización
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      // Municipios se obtendrán de la base de datos cuando sea necesario
      return session
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const isLoginPage = nextUrl.pathname === '/admin/login'
      const isUsuariosPage = nextUrl.pathname.startsWith('/admin/usuarios')

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/admin/dashboard', nextUrl))
        return true
      }

      if (!isLoggedIn) return false

      if (isUsuariosPage && session?.user.role !== 'admin') {
        return Response.redirect(new URL('/admin/dashboard', nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
