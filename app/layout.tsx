import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ios/Toast";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

// Self-hosted at build time: no requests to Google from the browser.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Find a gym buddy nearby.",
  applicationName: APP_NAME,
  // Adds apple-mobile-web-app-capable, title and status bar style for the iOS home screen.
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // Next emits the newer mobile-web-app-capable; older iOS needs the Apple name too.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The chat input stays above the on-screen keyboard.
  interactiveWidget: "resizes-content",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body>
        <ToastProvider>
          <div className="app-column">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
