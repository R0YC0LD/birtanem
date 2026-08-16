import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buse — Kalbimin Koordinatları",
  description: "Buse için nokta nokta çizilmiş küçük bir sürpriz.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
