import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.png";
import { supabase } from "@/lib/supabase";
import { migrateTempUserToUsers } from "@/lib/tempUserService";
import { useAuth } from "@/context/AuthContext";

const VerifyEmail = () => {
  const [message, setMessage] = useState(
    "Verifying your email address..."
  );
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if this is a callback from email link
        const hash = window.location.hash;

        if (hash) {
          // Handle email confirmation callback
          // Supabase will automatically handle this
          setMessage("Email verified successfully!");
          setIsVerified(true);

          // Wait for auth state to update
          setTimeout(async () => {
            try {
              const { data } = await supabase.auth.getSession();
              if (data.session?.user) {
                // Migrate temp user data to users table
                await migrateTempUserToUsers(
                  data.session.user.id,
                  data.session.user.email || ""
                );
                console.log("Temp user data migrated to users table");
              }
            } catch (err) {
              console.error("Error migrating temp user:", err);
            }

            navigate("/login");
          }, 2000);
        } else {
          // Check current session
          const { data } = await supabase.auth.getSession();

          if (data.session?.user?.email_confirmed_at) {
            setMessage("Your email has already been verified!");
            setIsVerified(true);

            // Migrate if not already done
            try {
              await migrateTempUserToUsers(
                data.session.user.id,
                data.session.user.email || ""
              );
            } catch (err) {
              console.error("Error migrating temp user:", err);
            }

            setTimeout(() => {
              navigate("/login");
            }, 3000);
          } else {
            setMessage(
              "Check your email for a verification link. If you don't see it, check your spam folder."
            );
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to verify email"
        );
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <img
              src={logo}
              alt="Placement Pilot"
              className="h-12 w-12 object-contain"
            />
          </a>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isVerified
              ? "Email Verified!"
              : "Verify Your Email"}
          </h1>
        </div>

        <div className="glass-card p-6 space-y-4 text-center">
          {isVerified && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-600">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isVerified && !error && (
            <>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-600">
                {message}
              </div>
              <p className="text-muted-foreground text-sm">
                You'll be redirected to login once verified.
              </p>
            </>
          )}

          {!isVerified && error && (
            <a
              href="/login"
              className="inline-block mt-4 text-primary hover:underline font-medium text-sm"
            >
              Back to Login
            </a>
          )}

          {isVerified && (
            <p className="text-muted-foreground text-sm">
              Redirecting to dashboard...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
