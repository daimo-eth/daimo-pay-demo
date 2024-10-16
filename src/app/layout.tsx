import type { Metadata } from "next";
import "./globals.css";
import { EthProvider } from "./EthRpcProvider";

export const metadata: Metadata = {
  title: "Daimo Pay Demo",
  description: "Get paid on Ethereum",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <EthProvider>
      <html lang="en">
        <body className="antialiased bg-slate-50">{children}</body>
      </html>
    </EthProvider>
  );
}
