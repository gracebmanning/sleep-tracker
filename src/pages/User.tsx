import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";

export default function User() {
    const { user, signOut } = useAuth();

    return (
        <div className="page-container">
            <h1 className="page-header">User</h1>
            {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            <div className="flex flex-col items-start gap-y-4">
                <ThemeToggle />
                <Button variant="outline" onClick={() => signOut()}>
                    Sign out
                </Button>
            </div>
        </div>
    );
}
