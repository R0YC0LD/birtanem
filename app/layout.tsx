import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://r0yc0ld.github.io/birtanem/"),
  title: "Buse ♡ Onur",
  description: "Buse ve Onur için hazırlanmış romantik bir dijital dünya.",
  openGraph: {
    title: "Buse ♡ Onur",
    description: "Burası sadece bizim.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buse ♡ Onur",
    description: "Burası sadece bizim.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
