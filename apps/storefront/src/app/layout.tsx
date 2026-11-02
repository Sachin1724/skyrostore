import { Suspense } from "react";
import type { Metadata } from "next";
import { Zilla_Slab } from "next/font/google";
import "./globals.css";

const zilla = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-zilla",
  display: "swap",
});
import { AnalyticsTracker } from "@/components/analytics/tracker";

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
    <html lang="en-IN" className={zilla.variable}>
      <body>
        {children}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
