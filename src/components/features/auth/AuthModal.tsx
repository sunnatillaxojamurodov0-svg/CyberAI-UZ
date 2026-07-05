import { useState, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Check,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  TextureCardStyled,
  TextureCardContent,
  TextureSeparator,
} from "@/components/ui/texture-card";
import { TextureButton } from "@/components/ui/texture-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "reset" | "reset-sent";

const formVariants = {
  enter: { opacity: 0, x: 30, scale: 0.97 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -30, scale: 0.97 },
};

const transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

/* ── OAuth buttons ──────────────────────────────────────── */

function GoogleButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <TextureButton variant="icon" onClick={signInWithGoogle}>
      <svg
        width="256"
        height="262"
        viewBox="0 0 256 262"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid"
        className="h-5 w-5"
      >
        <path
          d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
          fill="#4285F4"
        />
        <path
          d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
          fill="#34A853"
        />
        <path
          d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
          fill="#FBBC05"
        />
        <path
          d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
          fill="#EB4335"
        />
      </svg>
      <span className="pl-2">Google</span>
    </TextureButton>
  );
}

function GithubButton() {
  const { signInWithGithub } = useAuth();

  return (
    <TextureButton variant="icon" onClick={signInWithGithub}>
      <svg
        viewBox="0 0 256 250"
        width="256"
        height="250"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid"
        className="h-5 w-5"
      >
        <path
          d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46 6.397 1.185 8.746-2.777 8.746-6.158 0-3.052-.12-13.135-.174-23.83-35.61 7.742-43.124-15.103-43.124-15.103-5.823-14.795-14.213-18.73-14.213-18.73-11.613-7.944.876-7.78.876-7.78 12.853.902 19.621 13.19 19.621 13.19 11.417 19.568 29.945 13.911 37.249 10.64 1.149-8.272 4.466-13.92 8.127-17.116-28.431-3.236-58.318-14.212-58.318-63.258 0-13.975 5-25.394 13.188-34.358-1.329-3.224-5.71-16.242 1.24-33.874 0 0 10.749-3.44 35.21 13.121 10.21-2.836 21.16-4.258 32.038-4.307 10.878.049 21.837 1.47 32.066 4.307 24.431-16.56 35.165-13.12 35.165-13.12 6.967 17.63 2.584 30.65 1.255 33.873 8.207 8.964 13.173 20.383 13.173 34.358 0 49.163-29.944 59.988-58.447 63.157 4.591 3.972 8.682 11.762 8.682 23.704 0 17.126-.148 30.91-.148 35.126 0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002 256 57.307 198.691 0 128.001 0Zm-80.06 182.34c-.282.636-1.283.827-2.194.39-.929-.417-1.45-1.284-1.15-1.922.276-.655 1.279-.838 2.205-.399.93.418 1.46 1.293 1.139 1.931Zm6.296 5.618c-.61.566-1.804.303-2.614-.591-.837-.892-.994-2.086-.375-2.66.63-.566 1.787-.301 2.626.591.838.903 1 2.088.363 2.66Zm4.32 7.188c-.785.545-2.067.034-2.86-1.104-.784-1.138-.784-2.503.017-3.05.795-.547 2.058-.055 2.861 1.075.782 1.157.782 2.522-.019 3.08Zm7.304 8.325c-.701.774-2.196.566-3.29-.49-1.119-1.032-1.43-2.496-.726-3.27.71-.776 2.213-.558 3.315.49 1.11 1.03 1.45 2.505.701 3.27Zm9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033-1.448-.439-2.395-1.613-2.103-2.626.301-1.01 1.747-1.484 3.207-1.028 1.446.436 2.396 1.602 2.095 2.622Zm10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95-1.53.034-2.769-.82-2.786-1.86 0-1.065 1.202-1.932 2.733-1.958 1.522-.03 2.768.818 2.768 1.868Zm10.555-.405c.182 1.03-.875 2.088-2.387 2.37-1.485.271-2.861-.365-3.05-1.386-.184-1.056.893-2.114 2.376-2.387 1.514-.263 2.868.356 3.061 1.403Z"
          fill="#545454"
        />
      </svg>
      <span className="pl-2">Github</span>
    </TextureButton>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
        or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ── Password strength meter ──────────────────────────── */

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", test: (p: string) => p.length >= 8 },
    { label: "Uppercase", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lowercase", test: (p: string) => /[a-z]/.test(p) },
    { label: "Number", test: (p: string) => /[0-9]/.test(p) },
    { label: "Special char", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const passed = checks.filter((c) => c.test(password)).length;
  const strength = passed === 0 ? 0 : passed <= 2 ? 1 : passed <= 3 ? 2 : passed <= 4 ? 3 : 4;

  const colors = ["bg-muted", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const textColors = ["", "text-red-400", "text-orange-400", "text-yellow-400", "text-emerald-400"];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < strength ? colors[strength] : "bg-muted",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-[10px] font-bold uppercase tracking-[0.1em]",
            textColors[strength],
          )}
        >
          {labels[strength]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            {check.test(password) ? (
              <Check size={10} className="text-emerald-400" />
            ) : (
              <XCircle size={10} className="text-muted-foreground/30" />
            )}
            <span
              className={cn(
                "font-mono text-[9px] tracking-wide",
                check.test(password) ? "text-emerald-400" : "text-muted-foreground/40",
              )}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Login form ─────────────────────────────────────────── */

function LoginForm({ onModeChange }: { onModeChange: (mode: AuthMode) => void }) {
  const { signIn, authError, clearError, requires2FA } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      clearError();
      setSubmitting(true);
      await signIn(email, password, requires2FA ? totpToken : undefined);
      setSubmitting(false);
    },
    [email, password, totpToken, requires2FA, signIn, clearError],
  );

  return (
    <motion.form
      key="login"
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="flex justify-center gap-2">
        <GoogleButton />
        <GithubButton />
      </div>
      <OrDivider />
      <div className="space-y-2">
        <Label
          htmlFor="login-email"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@cyberai.dev"
          autoComplete="email"
          autoFocus
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="login-password"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>

      {requires2FA && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label
            htmlFor="login-2fa"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
          >
            2FA Code
          </Label>
          <Input
            id="login-2fa"
            type="text"
            value={totpToken}
            onChange={(e) => setTotpToken(e.target.value)}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
          />
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onModeChange("reset")}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-accent transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {authError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive"
        >
          {authError}
        </motion.p>
      )}

      <TextureButton
        variant="accent"
        className="w-full"
        type="submit"
        disabled={submitting || !email || !password || (requires2FA && !totpToken)}
      >
        <div className="flex gap-1 items-center justify-center">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {submitting ? "Verifying..." : requires2FA ? "Verify 2FA" : "Sign In"}
        </div>
      </TextureButton>

      <p className="text-center font-mono text-[10px] text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => onModeChange("signup")}
          className="text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-[0.12em]"
        >
          Sign up
        </button>
      </p>
    </motion.form>
  );
}

/* ── Signup form ────────────────────────────────────────── */

function SignupForm({ onModeChange }: { onModeChange: (mode: AuthMode) => void }) {
  const { signUp, authError, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      clearError();
      setSubmitting(true);
      await signUp(email, password, username || undefined);
      setSubmitting(false);
    },
    [email, password, username, signUp, clearError],
  );

  return (
    <motion.form
      key="signup"
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="flex justify-center gap-2">
        <GoogleButton />
        <GithubButton />
      </div>
      <OrDivider />
      <div className="space-y-2">
        <Label
          htmlFor="signup-username"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Username
        </Label>
        <Input
          id="signup-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="operator"
          autoComplete="username"
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="signup-email"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@cyberai.dev"
          autoComplete="email"
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="signup-password"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Password
        </Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>

      <AnimatePresence>{password && <PasswordStrengthMeter password={password} />}</AnimatePresence>

      {authError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive"
        >
          {authError}
        </motion.p>
      )}

      <TextureButton
        variant="accent"
        className="w-full"
        type="submit"
        disabled={submitting || !email || !password}
      >
        <div className="flex gap-1 items-center justify-center">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {submitting ? "Creating..." : "Create Account"}
        </div>
      </TextureButton>

      <p className="text-center font-mono text-[10px] text-muted-foreground">
        Already registered?{" "}
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className="text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-[0.12em]"
        >
          Sign in
        </button>
      </p>
    </motion.form>
  );
}

/* ── Reset form ─────────────────────────────────────────── */

function ResetForm({ onModeChange }: { onModeChange: (mode: AuthMode) => void }) {
  const { resetPassword, authError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      clearError();
      setSubmitting(true);
      const err = await resetPassword(email);
      setSubmitting(false);
      if (!err) onModeChange("reset-sent");
    },
    [email, resetPassword, clearError],
  );

  return (
    <motion.form
      key="reset"
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Enter your email address and we'll send you a reset link.
      </p>

      <div className="space-y-2">
        <Label
          htmlFor="reset-email"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Email
        </Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@cyberai.dev"
          autoComplete="email"
          autoFocus
          className="rounded-xl border-border bg-surface py-3 pl-4 pr-4 text-sm font-mono"
        />
      </div>

      {authError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive"
        >
          {authError}
        </motion.p>
      )}

      <TextureButton
        variant="accent"
        className="w-full"
        type="submit"
        disabled={submitting || !email}
      >
        <div className="flex gap-1 items-center justify-center">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          {submitting ? "Sending..." : "Send Reset Link"}
        </div>
      </TextureButton>

      <p className="text-center font-mono text-[10px] text-muted-foreground">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className="text-accent hover:text-accent/80 transition-colors font-bold uppercase tracking-[0.12em]"
        >
          Sign in
        </button>
      </p>
    </motion.form>
  );
}

/* ── Reset sent confirmation ────────────────────────────── */

function ResetSent({ onModeChange }: { onModeChange: (mode: AuthMode) => void }) {
  return (
    <motion.div
      key="reset-sent"
      variants={formVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transition}
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      <div className="grid size-14 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
        <CheckCircle2 size={26} className="text-emerald-400" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
          Check your inbox
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          If an account exists with that email, we've sent a reset link.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onModeChange("login")}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-accent/80 transition-colors"
      >
        <ArrowLeft size={12} /> Back to sign in
      </button>
    </motion.div>
  );
}

/* ── Auth Modal ─────────────────────────────────────────── */

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
  };

  const handleClose = () => {
    closeAuthModal();
    setTimeout(() => setMode("login"), 300);
  };

  const formTitles: Record<AuthMode, string> = {
    login: "Sign In",
    signup: "Create Account",
    reset: "Reset Password",
    "reset-sent": "Email Sent",
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm border-0 bg-transparent p-0 sm:rounded-2xl overflow-hidden shadow-none">
        <TextureCardStyled>
          <TextureCardContent className="p-0">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-foreground z-10"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-surface-2 rounded-full">
                  <Sparkles className="h-6 w-6 stroke-neutral-200" />
                </div>
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                  {formTitles[mode]}
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "login" && "Welcome back! Sign in to continue."}
                  {mode === "signup" && "Create your account to get started."}
                  {mode === "reset" && "Enter your email to reset password."}
                  {mode === "reset-sent" && "Check your inbox for the reset link."}
                </p>
              </div>
            </div>

            <TextureSeparator />

            {/* Forms */}
            <div className="px-6 py-4">
              <div className="relative min-h-[260px]">
                <AnimatePresence mode="wait">
                  {mode === "login" && <LoginForm key="login" onModeChange={handleModeChange} />}
                  {mode === "signup" && <SignupForm key="signup" onModeChange={handleModeChange} />}
                  {mode === "reset" && <ResetForm key="reset" onModeChange={handleModeChange} />}
                  {mode === "reset-sent" && (
                    <ResetSent key="reset-sent" onModeChange={handleModeChange} />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <TextureSeparator />

            {/* Footer */}
            <div className="px-6 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                {mode === "login" || mode === "reset" || mode === "reset-sent"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => onModeChange(mode === "signup" ? "login" : "signup")}
                  className="text-primary font-semibold hover:underline"
                >
                  {mode === "signup" ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          </TextureCardContent>
        </TextureCardStyled>
      </DialogContent>
    </Dialog>
  );
}
