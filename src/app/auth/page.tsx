"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketplaceConfig } from "@/config/marketplace.config";
import { Loader2, Mail, Lock, AlertCircle, ShoppingBag, Store } from "lucide-react";
import { z } from "zod";
import type { UserRole } from "@/types/database";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

function AuthContent() {
    const searchParams = useSearchParams();
    const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole>("buyer");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { signIn, signUp, user, loading: authLoading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user && role) {
            if (role === 'vendor') {
                router.replace("/vendor");
            } else if (role === 'super_admin') {
                router.replace("/admin");
            } else {
                router.replace("/dashboard");
            }
        }
    }, [user, authLoading, role, router]);

    if (user) {
        return null;
    }

    const validateInputs = (): boolean => {
        setError(null);

        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
            setError(emailResult.error.errors[0].message);
            return false;
        }

        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) {
            setError(passwordResult.error.errors[0].message);
            return false;
        }

        return true;
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setLoading(true);
        setError(null);

        const { error } = await signIn(email, password);

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                setError("Invalid email or password. Please try again.");
            } else if (error.message.includes("Email not confirmed")) {
                setError("Please verify your email address before signing in.");
            } else {
                setError(error.message);
            }
            setLoading(false);
            return;
        }

        // The useEffect will handle the redirection once user and role are populated
        // router.push("/dashboard");
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const { error } = await signUp(email, password, selectedRole);

        if (error) {
            if (error.message.includes("already registered")) {
                setError("An account with this email already exists. Try signing in instead.");
            } else {
                setError(error.message);
            }
            setLoading(false);
            return;
        }

        setSuccessMessage("Check your email for a confirmation link to complete your registration.");
        setLoading(false);
    };

    return (
        <MainLayout>
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-border/50">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">M</span>
                        </div>
                        <CardTitle className="text-2xl">Welcome to {marketplaceConfig.APP_NAME}</CardTitle>
                        <CardDescription>
                            Sign in to your account or create a new one
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue={defaultMode} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="signin">Sign In</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20">
                                    <p className="text-sm text-success">{successMessage}</p>
                                </div>
                            )}

                            <TabsContent value="signin">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signin-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signin-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-primary hover:opacity-90"
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign In
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    {/* Role Selector */}
                                    <div className="space-y-2">
                                        <Label>I want to</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole("buyer")}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                    selectedRole === "buyer"
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border hover:border-primary/50"
                                                }`}
                                            >
                                                <ShoppingBag className="h-6 w-6" />
                                                <span className="font-medium text-sm">Buy Products</span>
                                                <span className="text-xs text-muted-foreground">Browse & purchase</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRole("vendor")}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                    selectedRole === "vendor"
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border hover:border-primary/50"
                                                }`}
                                            >
                                                <Store className="h-6 w-6" />
                                                <span className="font-medium text-sm">Sell Products</span>
                                                <span className="text-xs text-muted-foreground">Open your store</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Must be at least 6 characters
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-primary hover:opacity-90"
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {selectedRole === "vendor" ? "Create Vendor Account" : "Create Account"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

function AuthFallback() {
    return (
        <MainLayout>
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        </MainLayout>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<AuthFallback />}>
            <AuthContent />
        </Suspense>
    );
}
