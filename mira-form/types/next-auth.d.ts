import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      // municipios NO viaja en la sesión: se lee de la BD (lib/rbac.ts)
    } & DefaultSession['user']
  }

  interface User {
    role: string
    municipios: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
