"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Key,
  Shield,
  Eye,
  EyeOff,
  Radio,
  Server,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [smartcardPin, setSmartcardPin] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (result.success) {
          setSuccessMessage("Authentication verified. Loading workspace...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
        } else {
          setErrorMessage(result.error || "Authentication failed. Please verify credentials.");
        }
      } else {
        const result = await register({
          name: name.trim() || email.split("@")[0],
          email,
          password,
          institution: institution.trim() || "ISRO SAC",
        });
        if (result.success) {
          setSuccessMessage("Researcher account provisioned. Initializing default workspace...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
        } else {
          setErrorMessage(result.error || "Registration failed. Please check your details.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Government Restricted Access Level 3 Card */}
      <div className="bg-surface border-2 border-border p-6 sm:p-8 shadow-sm">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            {/* Space Agency Seal */}
            <div className="w-12 h-12 rounded-full border border-border bg-surface-secondary flex items-center justify-center shrink-0">
              <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white">
                <Radio className="w-5 h-5 text-saffron" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                Lunar Image Analysis Portal
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Government of India | Department of Space | ISRO SAC
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-error/40 text-error-foreground rounded-sm text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESTRICTED GOVERNMENT ACCESS • LEVEL-3</span>
            <span className="sm:hidden">LEVEL-3</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-border mt-4 mb-5 text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              mode === "login"
                ? "border-navy text-navy bg-surface-muted"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Institutional Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
              mode === "register"
                ? "border-navy text-navy bg-surface-muted"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Register Researcher Account
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-error/60 text-error-foreground rounded-sm text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Access Denied: </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 bg-green-50 border border-success/60 text-success-foreground rounded-sm text-xs flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Verified: </strong>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5"
                >
                  Full Name (required)
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Vikram Sarabhai"
                    className="w-full bg-surface border border-border-input px-3 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="institution"
                  className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5"
                >
                  Scientific Institution / Centre
                </label>
                <div className="relative">
                  <input
                    id="institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Space Applications Centre (SAC), Ahmedabad"
                    className="w-full bg-surface border border-border-input px-3 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent placeholder:text-text-muted"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Institutional Identifier / Official Email (required)
              </label>
              <span className="text-[11px] text-text-muted font-mono">
                @isro.gov.in / @iisc.ac.in
              </span>
            </div>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scientist.isro.gov.in"
                className="w-full bg-surface border border-border-input pl-9 pr-3 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent placeholder:text-text-muted font-mono"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Digital Access Key / Cryptographic Password (required)
              </label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "For test credentials, use the pre-configured Demo accounts below or enter your registered account."
                  )
                }
                className="text-[11px] text-accent hover:underline cursor-pointer"
              >
                Revoke / Reset
              </button>
            </div>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-surface border border-border-input pl-9 pr-10 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent placeholder:text-text-muted font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-text-muted hover:text-text-primary cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Smartcard PIN (Hardware Security Token) */}
          {mode === "login" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="smartcardPin"
                  className="text-xs font-bold uppercase tracking-wider text-text-secondary"
                >
                  Hardware Security Token / Smartcard PIN
                </label>
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <span>Virtual Scrambler</span>
                </span>
              </div>
              <div className="relative flex items-center">
                <Shield className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
                <input
                  id="smartcardPin"
                  type="password"
                  maxLength={8}
                  value={smartcardPin}
                  onChange={(e) => setSmartcardPin(e.target.value)}
                  placeholder="6-8 Digit PIN / RSA SecurID (Optional for demo)"
                  className="w-full bg-surface border border-border-input pl-9 pr-3 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent placeholder:text-text-muted font-mono"
                />
              </div>
            </div>
          )}

          {/* Remember workstation checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="remember"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 accent-navy rounded-sm border-border-input cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-text-secondary cursor-pointer select-none">
              Remember this scientific workstation (30-day hardware binding)
            </label>
          </div>

          {/* Primary Action Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-base flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 animate-spin" />
                <span>Verifying Cryptographic Credentials...</span>
              </span>
            ) : mode === "login" ? (
              <span>Sign In to Analysis Workstation &rarr;</span>
            ) : (
              <span>Provision Scientific Account &rarr;</span>
            )}
          </Button>
        </form>

        {/* Quick Demo Fill Accounts for Evaluators */}
        <div className="mt-4 p-2.5 bg-surface-secondary border border-border text-xs space-y-1.5">
          <div className="font-bold text-text-primary flex items-center justify-between">
            <span>Prototype Evaluation Credentials:</span>
            <span className="text-[10px] text-text-muted">Click to auto-fill</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoCredentials("sakthivel@orbitlens.app", "Password123")}
              className="px-2 py-1 bg-surface border border-border-input text-accent hover:bg-accent-muted rounded-sm font-mono text-[11px] cursor-pointer"
            >
              Admin: sakthivel@orbitlens.app
            </button>
            <button
              type="button"
              onClick={() => handleDemoCredentials("sarah.chen@lunar-institute.org", "Password123")}
              className="px-2 py-1 bg-surface border border-border-input text-accent hover:bg-accent-muted rounded-sm font-mono text-[11px] cursor-pointer"
            >
              Researcher: sarah.chen@lunar-institute.org
            </button>
          </div>
        </div>

        {/* Secondary Authentication SSO Buttons (Visibly Disabled with Banner) */}
        <div className="mt-5 pt-4 border-t border-border space-y-2">
          {/* Gov e-Pramaan SSO */}
          <div className="relative">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full py-2 px-3 border border-border-light bg-surface-secondary/70 text-text-muted rounded-sm text-xs flex items-center justify-between cursor-not-allowed opacity-80"
            >
              <span className="flex items-center gap-2 font-medium">
                <Shield className="w-3.5 h-3.5 text-text-muted" />
                Sign in with Gov e-Pramaan / Institutional SSO
              </span>
              <span className="text-[10px] uppercase font-bold bg-border-light px-1.5 py-0.5 rounded-sm text-text-muted">
                Not available in this prototype
              </span>
            </button>
          </div>

          {/* Google OAuth SSO */}
          <div className="relative">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full py-2 px-3 border border-border-light bg-surface-secondary/70 text-text-muted rounded-sm text-xs flex items-center justify-between cursor-not-allowed opacity-80"
            >
              <span className="flex items-center gap-2 font-medium">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h5.51c-.33 1.9-2 3.32-4.17 3.32-2.52 0-4.57-2.05-4.57-4.57s2.05-4.57 4.57-4.57c1.13 0 2.15.42 2.94 1.18l2.06-2.06C16.92 5.86 14.65 5 12 5 8.13 5 5 8.13 5 12s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.12-1.06z"
                  />
                </svg>
                Sign in with Google Account
              </span>
              <span className="text-[10px] uppercase font-bold bg-border-light px-1.5 py-0.5 rounded-sm text-text-muted">
                Not available in this prototype
              </span>
            </button>
          </div>
        </div>

        {/* Security and Active Gateway Bar */}
        <div className="mt-5 p-3 bg-surface-muted border border-border text-xs space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-navy font-bold">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              AUTHENTICATION GATEWAY: ACTIVE (TLS 1.3 | SHA-384)
            </span>
            <span className="text-success font-bold">99.98% UPTIME</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Notice: Unauthorized access to lunar spatial infrastructure is strictly prohibited under
            the Indian Space Policy &amp; Cyber Security Directives.
          </p>
          <div className="flex items-center justify-between font-mono text-[10px] text-text-muted pt-1 border-t border-border-light">
            <span>Node: SAC-AHM-LUNAR-AUTH-01</span>
            <span>EPHEMERIS: V2.4.12</span>
          </div>
        </div>
      </div>

      {/* External Sub-Card Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono text-text-muted">
        <span>FOR AUTHORIZED SCIENTIFIC &amp; INSTITUTIONAL USERS ONLY</span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-success" />
          ISRO SCIENTIFIC DATA PROCESSING NODE &bull; ONLINE
        </span>
      </div>
    </div>
  );
}
