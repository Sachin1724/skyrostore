import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Skyrostore — Professional UAVs & Components",
    template: "%s | Skyrostore",
  },
  description:
    "Engineering-grade drones, flight hardware, and components for mapping, inspection, agriculture, and custom aerial systems.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
