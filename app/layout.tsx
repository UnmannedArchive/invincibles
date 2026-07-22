import type { Metadata } from "next";
import { Anton, Archivo, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const anton = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-ui",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-data",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const DESCRIPTION =
  "Spin the eras, draft a full XI from football history, and play a 38-game season. Can your team go Invincible — all the way to a perfect 38-0-0?";

export const metadata: Metadata = {
  // Share cards are absolute URLs; without this they resolve to localhost.
  metadataBase: new URL(siteUrl()),
  title: "Invincibles — draft an XI, go the season unbeaten",
  description: DESCRIPTION,
  applicationName: "Invincibles",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Invincibles",
    description: DESCRIPTION,
    url: "/",
    siteName: "Invincibles",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Invincibles", description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Only served on Vercel; off-platform it just 404s into the console.
            Needs Web Analytics enabled for the project to collect anything. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
