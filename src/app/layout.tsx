import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import I18nProvider from "@/i18n/i18n-provider";
import { Toaster } from "sonner";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Nexpo Console",
  description: "Super Admin console for Nexpo platform management",
  icons: {
    icon: "/nexpo-symbol.png",
    apple: "/nexpo-symbol.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnamPro.variable}>
      <body>
        <I18nProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
