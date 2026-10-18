import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export function LoginForm() {
    const { signInWithOtp, verifyOtp } = useAuth();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    // Count down the "Resend code" timer.
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function sendCode(): Promise<boolean> {
        setBusy(true);
        setError(null);
        const { error } = await signInWithOtp(email.trim());
        setBusy(false);
        if (error) {
            setError(error.message);
            return false;
        }
        setCooldown(RESEND_SECONDS);
        return true;
    }

    async function handleEmailSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (await sendCode()) {
            setCode("");
            setStep("code");
        }
    }

    async function handleResend() {
        if (await sendCode()) setCode("");
    }

    async function submitCode(value: string) {
        setBusy(true);
        setError(null);
        const { error } = await verifyOtp(email.trim(), value);
        if (error) {
            setBusy(false);
            setCode("");
            setError("That code didn't work. Check it and try again, or request a new one.");
        }
        // On success, onAuthStateChange swaps this screen for the app.
    }

    // Digits only; verifies automatically on the last digit.
    function handleCodeChange(raw: string) {
        const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
        setCode(digits);
        if (digits.length === CODE_LENGTH && !busy) void submitCode(digits);
    }

    function goBack() {
        setStep("email");
        setCode("");
        setError(null);
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Sleep Tracker</CardTitle>
                    <CardDescription>
                        {step === "email"
                            ? "Enter your email and we'll send you a login code."
                            : `We sent a ${CODE_LENGTH}-digit code to ${email.trim()}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "email" ? (
                        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                            <Input
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            <Button type="submit" disabled={busy || !email}>
                                {busy ? "Sending…" : "Send code"}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <Input
                                autoFocus
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                placeholder="••••••"
                                aria-label="Login code"
                                className="h-12 text-center text-xl tracking-[0.4em]"
                                value={code}
                                readOnly={busy}
                                onChange={(e) => handleCodeChange(e.target.value)}
                            />
                            {busy && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Checking…
                                </p>
                            )}
                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            <p className="text-center text-sm text-muted-foreground">
                                Or tap the link in the email.
                            </p>
                            <div className="flex items-center justify-between">
                                <Button type="button" variant="link" size="sm" onClick={goBack}>
                                    Wrong address? Go back
                                </Button>
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    disabled={busy || cooldown > 0}
                                    onClick={handleResend}
                                >
                                    {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default LoginForm;
