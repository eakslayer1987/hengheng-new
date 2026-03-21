import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#c0180c",
};

export const metadata: Metadata = {
  title: "ปังจัง | ชิงโชคกระเป๋าเงิน ปี 2",
  description: "ร่วมชิงโชคกับปังจัง กรอกรหัสใต้ฝา หรือสแกน QR เพื่อลุ้นรางวัลมูลค่ารวม 1,000,000 บาท",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ปังจัง | ชิงโชคกระเป๋าเงิน ปี 2",
    description: "กรอกรหัสลุ้นรางวัลรวม 1,000,000 บาท!",
    type: "website",
    locale: "th_TH",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={kanit.className}>{children}</body>
    </html>
  );
}
