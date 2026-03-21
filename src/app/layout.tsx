import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ปังจัง Super App',
  description: 'เฮงเฮงปังจัง — สะสมฉลาก ลุ้นโชคใหญ่',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ปังจัง' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3D0008',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-[#3D0008] text-[#FDF5E6] font-kanit antialiased">
        {children}
      </body>
    </html>
  )
}
