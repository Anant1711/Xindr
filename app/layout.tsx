import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ios/Toast";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Find a gym buddy nearby.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F2F7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="app-column">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
