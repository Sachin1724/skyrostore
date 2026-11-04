import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the closest web match to Apple's SF Pro; optical sizing keeps headings crisp.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});
import { QuickViewModal } from "@/components/catalog/quick-view-modal";
import { CompareDrawer } from "@/components/catalog/compare-drawer";
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
    <html lang="en-IN" className={inter.variable}>
      <body>
        {children}
        <QuickViewModal />
        <CompareDrawer />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
