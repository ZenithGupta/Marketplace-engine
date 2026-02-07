"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <AuthProvider>
                            <TooltipProvider>
                                <Toaster />
                                <Sonner />
                                {children}
                            </TooltipProvider>
                        </AuthProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </body>
        </html>
    );
}
