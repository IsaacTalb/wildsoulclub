import { SignUp } from "@clerk/nextjs";
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
    
    // Clerk does not expose a direct event for sign-up completion,
    // so we rely on the webhook for synchronization.
    // This is a placeholder for manual synchronization if needed.
  }, [router]);

  return <SignUp />;
}
