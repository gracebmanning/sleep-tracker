import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthProvider";

export function LoginForm() {
    const { signInWithOtp } = useAuth();
    const [email, setEmail] = React.useState("");
    const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        setStatus("sending");
        setErrorMessage(null);

        const { error } = await signInWithOtp(email);

        if (error) {
            setStatus("error");
            setErrorMessage(error);
        } else {
            setStatus("sent");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Sleep Tracker</CardTitle>
                    <CardDescription>
                        {status === "sent"
                            ? "Check your email for a login link."
                            : "Enter your email to get a magic link."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status !== "sent" && (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === "sending"}
                                />
                            </div>
                            {status === "error" && (
                                <p className="text-sm text-destructive">{errorMessage}</p>
                            )}
                            <Button type="submit" disabled={status === "sending"}>
                                {status === "sending" ? "Sending..." : "Send magic link"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
