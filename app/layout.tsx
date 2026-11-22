import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Flinders MBA Future",
  description:
    "Match your ambitions to a Flinders MBA, discover industry experiences and explore Australian career directions.",
};
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#232D4B",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
