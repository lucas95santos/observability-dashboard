import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Providers } from "./providers";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Observability Dashboard",
  description: "System monitoring and observability platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="dashboard-theme"
            enableSystem={false}
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
