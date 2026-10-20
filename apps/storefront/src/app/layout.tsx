import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
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
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
      </body>
    </html>
  );
}
