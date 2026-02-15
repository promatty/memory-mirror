"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setError("");
    if (isSubmitting) return;

    if (!email.trim()) {
      setError("Please enter an email");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsSubmitting(true);
    // Dummy create account flow: show success and redirect to login
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 900);
    }, 700);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-lilac/20 blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="w-full bg-card border border-border/50 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif mb-2">Create an account</h1>
              <p className="text-muted-foreground">Start preserving your memories</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`flex h-10 w-full rounded-md border ${error ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`flex h-10 w-full rounded-md border ${error ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirm">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={`flex h-10 w-full rounded-md border ${error ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none`}
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive mt-2" role="alert">
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm text-foreground/90 bg-emerald-50 border border-emerald-200 p-3 rounded-md">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <div className="leading-tight">Account created — redirecting to sign in</div>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary hover:bg-card h-10 px-4 py-2 mt-6 disabled:opacity-50"
                disabled={isSubmitting || success}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
