import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'

// Misma tipografía que la landing y el login de coordinadores.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const fontVariables = `${jakarta.variable} ${jetbrains.variable}`
