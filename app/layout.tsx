import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Manrope } from "next/font/google";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "RenterPass: one link for every rental application", template: "%s · RenterPass" },
  description: "Apply to every listing in seconds, and stay in control of your documents.",
  applicationName: "RenterPass",
  appleWebApp: { capable: true, title: "RenterPass", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IE"
      data-theme="light"
      suppressHydrationWarning
      className={`${manrope.variable} ${hanken.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans text-[15px] leading-6">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:shadow-overlay"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
