"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUser, getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) router.replace(u.role === "teacher" ? "/teacher" : "/student");
  }, [router]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Login failed"); return; }
      if (data.user.role !== role) {
        setError(`This account is a ${data.user.role}, not a ${role}.`);
        return;
      }
      setCurrentUser(data.user);
      router.push(data.user.role === "teacher" ? "/teacher" : "/student");
    } catch {
      setError("Could not connect. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!id || !name || !password) { setError("All fields are required"); return; }
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, email, password, role }),
      });
      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Signup failed"); return; }
      setCurrentUser(data.user);
      router.push(data.user.role === "teacher" ? "/teacher" : "/student");
    } catch {
      setError("Could not connect. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  function quickFill(qid: string, qpw: string, qrole: "student" | "teacher") {
    setMode("login");
    setRole(qrole);
    setId(qid);
    setPassword(qpw);
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-black text-white p-12">
        <div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-8">
            <span className="text-2xl text-black font-bold">LP</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">LabPilot</h1>
          <p className="text-neutral-400 mt-2">AI-Powered Laboratory Learning OS</p>
        </div>
        <div className="space-y-3 text-sm text-neutral-300">
          <p>Camera-guided experiments with real-time verification</p>
          <p>Voice assistant for hands-free lab guidance</p>
          <p>Automatic scoring, progress tracking, and analytics</p>
        </div>
        <p className="text-xs text-neutral-500">Guide. Protect. Educate.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1">{mode === "login" ? "Sign in" : "Create account"}</h2>
          <p className="text-sm text-neutral-500 mb-6">
            {mode === "login" ? "Access your lab dashboard" : "Register as a new student or teacher"}
          </p>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              onClick={() => setRole("student")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                role === "student" ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("teacher")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                role === "teacher" ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
            >
              Teacher
            </button>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="id">{role === "student" ? "Student ID" : "Teacher ID"}</Label>
              <Input
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={role === "student" ? "e.g., alice" : "e.g., teacher"}
                className="mt-1.5"
                autoComplete="username"
              />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., john@uni.edu"
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign in" : "Create account")}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {mode === "login" ? (
              <p className="text-sm text-neutral-500">
                Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-black hover:underline">Sign up</button>
              </p>
            ) : (
              <p className="text-sm text-neutral-500">
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-black hover:underline">Sign in</button>
              </p>
            )}
          </div>

          {/* Demo credentials */}
          {mode === "login" && (
            <div className="mt-8 border-t pt-5">
              <p className="text-xs font-semibold text-neutral-400 mb-2">DEMO ACCOUNTS (click to fill)</p>
              <div className="space-y-1.5">
                <button onClick={() => quickFill("teacher", "teach123", "teacher")} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-neutral-50 hover:bg-neutral-100">
                  <span className="font-mono font-semibold">teacher</span> / teach123
                </button>
                <button onClick={() => quickFill("alice", "pass123", "student")} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-neutral-50 hover:bg-neutral-100">
                  <span className="font-mono font-semibold">alice</span> / pass123 (has assignments)
                </button>
                <button onClick={() => quickFill("bob", "pass123", "student")} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-neutral-50 hover:bg-neutral-100">
                  <span className="font-mono font-semibold">bob</span> / pass123
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
