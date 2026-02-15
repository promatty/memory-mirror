"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  // Hard-coded demo identity (frontend only)
  const DEMO_USER = { email: "demo@memorymirror.test", password: "password123" };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setError("");
    if (isLoading) return;

    const normalized = email.trim().toLowerCase();
    if (normalized === DEMO_USER.email && password === DEMO_USER.password) {
      setIsLoading(true);
      // small delay to show button state before redirect
      setTimeout(() => router.push("/mirror"), 500);
      return;
    }

    // error: show message + shake animation
    setError("Invalid email or password");
    setShake(true);
    setTimeout(() => setShake(false), 600);
    // clear error after a short time
    setTimeout(() => setError(""), 3000);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-lilac/20 blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <motion.div
            className="w-full bg-card border border-border/50 rounded-2xl p-8 shadow-xl backdrop-blur-sm"
            animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your Memory Mirror</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  Email
                </label>
                <input
                  className={`flex h-10 w-full rounded-md border ${error ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Password
                </label>
                <input
                  className={`flex h-10 w-full rounded-md border ${error ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-card h-10 px-4 py-2 mt-6 relative overflow-hidden group"
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                <span className="relative flex items-center justify-center font-semibold">
                  <span className="btn-default-text">{isLoading ? "Signing in..." : "Sign In"}</span>
                  <span className="btn-gradient-text absolute inset-0 bg-gradient-to-r from-lilac via-lime to-iris bg-clip-text text-transparent">
                    {isLoading ? "Signing in..." : "Sign In"}
                  </span>
                </span>
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
