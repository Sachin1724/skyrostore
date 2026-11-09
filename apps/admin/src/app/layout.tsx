import type { Metadata } from "next";
import "./globals.css";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";

export const metadata: Metadata = {
  title: {
    default: "Skyrostore Admin",
    template: "%s | Skyrostore Admin",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </body>
    </html>
  );
}
