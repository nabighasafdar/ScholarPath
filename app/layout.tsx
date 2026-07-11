import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken-grotesk" });

export const metadata: Metadata = {
  title: "ScholarPath",
  description:
    "AI research co-pilot for students — uniqueness scoring, conference matching, and paper coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${hankenGrotesk.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
