import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lifestyle Transformer",
  description: "Transform your lifestyle for the planet!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
