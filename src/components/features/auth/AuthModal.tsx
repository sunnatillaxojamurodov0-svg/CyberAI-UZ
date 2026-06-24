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
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "reset" | "reset-sent";

const formVariants = {
  enter: { opacity: 0, x: 30, scale: 0.97 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -30, scale: 0.97 },
};

const transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

/* ── Input field ────────────────────────────────────────── */

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  icon: typeof Mail;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={14}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 transition-all focus:border-accent/40 focus:shadow-[0_0_25px_-8px] focus:shadow-accent/20 font-mono"
        />
      </div>
    </div>
  );
}

/* ── OAuth buttons ──────────────────────────────────────── */

function GoogleButton() {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/30 hover:bg-surface-2 hover:shadow-[0_0_25px_-8px] hover:shadow-accent/20"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

function GithubButton() {
  const { signInWithGithub } = useAuth();

  return (
    <button
      type="button"
      onClick={signInWithGithub}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/30 hover:bg-surface-2 hover:shadow-[0_0_25px_-8px] hover:shadow-accent/20"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      Continue with GitHub
    </button>
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
      className="space-y-5"
    >
      <GoogleButton />
      <GithubButton />
      <OrDivider />
      <Field
        icon={Mail}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="operator@cyberai.dev"
        autoFocus
      />
      <Field
        icon={Lock}
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
      />

      {requires2FA && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Field
            icon={Lock}
            label="2FA Code"
            type="text"
            value={totpToken}
            onChange={setTotpToken}
            placeholder="000000"
            autoFocus
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

      <button
        type="submit"
        disabled={submitting || !email || !password || (requires2FA && !totpToken)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_0_30px_-8px] shadow-accent/40 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {submitting ? "Verifying..." : requires2FA ? "Verify 2FA" : "Sign In"}
      </button>

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
      className="space-y-5"
    >
      <GoogleButton />
      <GithubButton />
      <OrDivider />
      <Field
        icon={User}
        label="Username"
        value={username}
        onChange={setUsername}
        placeholder="operator"
      />
      <Field
        icon={Mail}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="operator@cyberai.dev"
      />
      <Field
        icon={Lock}
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
      />

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

      <button
        type="submit"
        disabled={submitting || !email || !password}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_0_30px_-8px] shadow-accent/40 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {submitting ? "Creating..." : "Create Account"}
      </button>

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
      className="space-y-5"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Enter your email address and we'll send you a reset link.
      </p>

      <Field
        icon={Mail}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="operator@cyberai.dev"
        autoFocus
      />

      {authError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 font-mono text-[11px] text-destructive"
        >
          {authError}
        </motion.p>
      )}

      <button
        type="submit"
        disabled={submitting || !email}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_0_30px_-8px] shadow-accent/40 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
        {submitting ? "Sending..." : "Send Reset Link"}
      </button>

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
      <DialogContent
        className={cn("max-w-sm border-border bg-background p-0 sm:rounded-2xl overflow-hidden")}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <div
            className="pointer-events-none absolute -inset-40 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 18%, transparent) 0%, transparent 70%)",
            }}
          />

          <button
            type="button"
            onClick={handleClose}
            className="absolute right-6 top-6 rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>

          <div className="relative flex items-center gap-3">
            <span className="relative grid size-8 place-items-center">
              <span className="absolute inset-0 rotate-45 rounded-[5px] bg-accent" />
              <span className="absolute inset-[5px] rotate-45 rounded-[3px] bg-background" />
              <span className="absolute size-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              CYBER<span className="text-accent">AI</span>
            </span>
          </div>

          <h2 className="relative mt-5 font-display text-xl font-bold tracking-tight text-foreground">
            {formTitles[mode]}
          </h2>
        </div>

        {/* Forms */}
        <div className="px-8 pb-8">
          <div className="relative min-h-[280px]">
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
      </DialogContent>
    </Dialog>
  );
}
