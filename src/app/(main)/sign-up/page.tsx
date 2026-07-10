"use client";

import { SignUp, ClerkProvider } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Listen for Clerk's sign-up event
    const handleUserCreated = async () => {
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to synchronize user:", error);
      }
    };

    // Listen for Clerk's user session event
    const handleUserSession = () => {
      handleUserCreated();
    };

    // Use Clerk's event listener for sign-up completion
    const unlisten = ClerkProvider.hooks.useUserEventListener(
      'user.created',
      handleUserCreated
    );

    return () => unlisten();
  }, [router]);

  return <SignUp />;
}
