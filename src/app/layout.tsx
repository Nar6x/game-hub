import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/shared/UserContext";
import { Navbar } from "@/components/shared/Navbar";
import { UsernameModal } from "@/components/shared/UsernameModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameHub - Play Online",
  description:
    "Play Tic Tac Toe and Snakes & Ladders online with friends or AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <UserProvider>
          <UsernameModal />
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </UserProvider>
      </body>
    </html>
  );
}
