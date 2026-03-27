import type { Metadata } from "next";
import { Providers } from "@/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostPro Planner",
  description: "post production, planned. — een tool van team5pm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased grain">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
