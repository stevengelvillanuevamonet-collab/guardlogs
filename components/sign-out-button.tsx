"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Signs the user out via Supabase and returns to the login page.
export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // End the session, then redirect and refresh server data.
  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
