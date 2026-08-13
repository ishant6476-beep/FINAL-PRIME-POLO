import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { Apple, ArrowLeft, Building2, Check, Eye, EyeOff, Fingerprint, Globe2, LockKeyhole, LogOut, Mail, PackageOpen, RefreshCw, ShieldCheck, Sparkles, Trash2, UserRound, UsersRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageIntro, PrimaryButton } from "../components/ui";
import { takeAuthIntent } from "../lib/router";
import { isSupabaseConfigured, type ProfileRecord, supabase, supabaseConfigStatus } from "../lib/supabase";

type AuthMode = "login" | "signup" | "forgot" | "pending" | "reset";
type UserRole = ProfileRecord["role"];

const roles: Array<{ value: UserRole; label: string; icon: typeof Building2 }> = [
  { value: "company", label: "Company", icon: Building2 },
  { value: "influencer", label: "Influencer", icon: UsersRound },
  { value: "freelancer", label: "Freelancer", icon: Sparkles },
  { value: "other", label: "Other", icon: Globe2 },
];

function AuthPanel({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<AuthMode>(() => {
    try {
      return new URLSearchParams(window.location.search).has("reset") ? "reset" : takeAuthIntent();
    } catch {
      return takeAuthIntent();
    }
  });
  const [role, setRole] = useState<UserRole>("company");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
      if (session && event !== "PASSWORD_RECOVERY" && mode !== "reset") onAuthenticated(session);
    });
    return () => data.subscription.unsubscribe();
  }, [mode, onAuthenticated]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
      } else if (mode === "signup") {
        const name = String(form.get("name") || "").trim();
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { name, role } } });
        if (error) throw error;
        if (data.session) onAuthenticated(data.session);
        else {
          setPendingEmail(email);
          setMode("pending");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/dashboard?reset=1` });
        if (error) throw error;
        setNotice({ type: "success", text: "Recovery link sent. Check your inbox and spam folder." });
      } else if (mode === "reset") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your new password.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setNotice({ type: "success", text: "Password updated. Your account is ready." });
        window.history.replaceState({}, "", "/dashboard");
        const { data } = await supabase.auth.getSession();
        if (data.session) window.setTimeout(() => onAuthenticated(data.session!), 700);
      }
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : error instanceof Error ? error.message : "Authentication failed. Please try again.";
      setNotice({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  const oauth = async () => {
    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    setNotice(error ? { type: "error", text: error.message } : { type: "success", text: "A fresh confirmation link is on its way." });
    setLoading(false);
  };

  if (!isSupabaseConfigured) return <div className="auth-shell glass-elite auth-config"><ShieldCheck /><h2>Connect your secure account system</h2><p>Accounts activate as soon as the Supabase credentials are added to your environment. Status: {supabaseConfigStatus}</p></div>;

  if (mode === "pending") return <div className="auth-shell glass-elite pending-panel"><span><Mail /></span><small>One more step</small><h2>Confirm your email</h2><p>We sent a secure confirmation link to <strong>{pendingEmail}</strong>. Click it to activate your account.</p><button onClick={() => void resend()} disabled={loading}>{loading ? "Sending..." : "Resend link"}</button><button type="button" onClick={() => setMode("login")} className="forgot-link">Back to login</button></div>;

  return (
    <div className="auth-shell glass-elite">
      <div className="auth-heading"><span><Fingerprint /></span><small>Private Client Portal</small><h2>{mode === "signup" ? "Create your account" : mode === "forgot" ? "Recover access" : mode === "reset" ? "Update password" : "Secure login"}</h2></div>
      {(mode === "login" || mode === "signup") && <div className="oauth-grid"><button onClick={() => void oauth()} disabled={loading}><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.8-.1-1.4-.2-2.1H12v4h5.5c-.2 1.1-.9 2-1.9 2.6v2.5h3.1c1.8-1.6 2.8-4 2.8-6.9z" /><path fill="#34A853" d="M12 22c2.4 0 4.5-.8 6-2.2l-3.1-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.2v2.6C4.7 20.8 8 22 12 22z" /><path fill="#FBBC05" d="M6.4 13c-.3-.9-.5-1.8-.5-2.8s.2-1.9.4-2.8V4.6H3.2C2.3 6.1 2 7.9 2 10s.3 3.9 1.2 5.4l3.2-2.4z" /><path fill="#EA4335" d="M12 3.9c1.5 0 2.9.5 3.9 1.5l2.9-2.9C16.5.9 14.4 0 12 0 8 0 4.7 1.2 2.2 3.3l3.2 2.6c.8-2.3 3-3.9 5.6-3.9z" /></svg> Google</button></div>}
      {(mode === "login" || mode === "signup") && <div className="auth-divider"><span />or use email<span /></div>}
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <label><span>Your name</span><div><UserRound /><input name="name" placeholder="Full name" required maxLength={120} /></div></label>}
        {mode !== "reset" && <label><span>Email address</span><div><Mail /><input name="email" type="email" placeholder="you@company.com" required autoComplete="email" /></div></label>}
        {mode !== "forgot" && <label><span>{mode === "reset" ? "New password" : "Password"}</span><div><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} placeholder={mode === "reset" ? "At least 8 characters" : "••••••••"} required autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((show) => !show)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
        {mode === "signup" && <fieldset><legend>I am joining as</legend><div className="role-grid">{roles.map(({ value, label, icon: Icon }) => <button type="button" key={value} className={role === value ? "active" : ""} onClick={() => setRole(value)}><Icon />{label}</button>)}</div></fieldset>}
        {mode === "login" && <button type="button" className="forgot-link" onClick={() => setMode("forgot")}>Forgot password?</button>}
        {notice && <div className={`auth-notice ${notice.type}`}>{notice.text}</div>}
        <PrimaryButton type="submit" disabled={loading}>{loading ? "Securing..." : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Recovery Link" : mode === "reset" ? "Update Password" : "Sign In"}</PrimaryButton>
      </form>
      <div className="auth-switch">{mode === "login" ? <>New to Prime Polo? <button type="button" onClick={() => setMode("signup")}>Create an account</button></> : mode === "signup" ? <>Already have an account? <button type="button" onClick={() => setMode("login")}>Sign in</button></> : mode === "forgot" ? <>Back to <button type="button" onClick={() => setMode("login")}>login</button></> : null}</div>
    </div>
  );
}

function AccountPanel({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (data) setProfile(data as ProfileRecord);
      else {
        const fallback: ProfileRecord = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split("@")[0] || "Client",
          email: session.user.email || null,
          phone: null,
          company: null,
          avatar_url: null,
          role: "company",
          created_at: new Date().toISOString(),
        };
        await supabase.from("profiles").upsert(fallback).catch(() => {
          // Fail silently
        });
        setProfile(fallback);
      }
      setLoading(false);
    };
    void load();
  }, [session]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const updates = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      company: String(form.get("company") || "").trim() || null,
    };
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", session.user.id).select().single();
    if (error) setNotice(error.message);
    else {
      setProfile(data as ProfileRecord);
      setNotice("Profile updated securely.");
      setEditing(false);
    }
    setLoading(false);
  };

  const deleteAccount = async () => {
    if (!window.confirm("Permanently delete your Prime Polo account and profile? This cannot be undone.")) return;
    const { error } = await supabase.rpc("delete_own_account");
    if (error) setNotice(`Deletion could not be completed: ${error.message}`);
    else {
      await supabase.auth.signOut();
      onLogout();
    }
  };

  if (loading && !profile) return <div className="account-loading"><RefreshCw />Loading your workspace...</div>;
  if (!profile) return null;
  const provider = session.user.app_metadata.provider === "google" ? "Google OAuth" : "Email & Password";
  const initials = profile.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PP";
  return (
    <div className="account-panel">
      <section className="account-hero glass-gold"><div className="account-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Account avatar" /> : initials}<i /></div><div><span>Prime Polo Account</span><h2>{profile.name}</h2></div></section>
      <div className="account-grid">
        <section className="account-section glass-elite"><div className="account-section-heading"><div><small>Profile / 01</small><h3>Account details</h3></div><button onClick={() => setEditing((editing) => !editing)}>{editing ? <ArrowLeft /> : "Edit"}</button></div>{editing ? <form onSubmit={save}><label><span>Name</span><input name="name" defaultValue={profile.name || ""} placeholder="Full name" maxLength={120} required /></label><label><span>Email (from login)</span><input type="email" value={session.user.email || ""} disabled /></label><label><span>Phone</span><input name="phone" type="tel" defaultValue={profile.phone || ""} placeholder="+91 98765 43210" maxLength={20} /></label><label><span>Company</span><input name="company" defaultValue={profile.company || ""} placeholder="Your company" maxLength={120} /></label><div><small>Authentication: {provider}</small></div>{notice && <div className="form-notice success">{notice}</div>}<button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button></form> : <div><p><strong>Name</strong><br />{profile.name}</p><p><strong>Email</strong><br />{session.user.email}</p><p><strong>Phone</strong><br />{profile.phone || "Not provided"}</p><p><strong>Company</strong><br />{profile.company || "Not provided"}</p><p><small>Authentication: {provider}</small></p></div>}</section>
        <section className="account-section glass-elite purchases"><div className="account-section-heading"><div><small>Purchases / 02</small><h3>Services & plans</h3></div></div><div><PackageOpen /><p>No active services yet. Begin your journey from the contact form.</p></div></section>
      </div>
      <section className="danger-zone"><div><Trash2 /><span><strong>Delete account</strong><small>Permanently remove your profile and authentication data.</small></span></div><button onClick={() => void deleteAccount()}>Delete</button></section>
      <button className="logout-button" onClick={() => void onLogout()}><LogOut /> Log Out</button>
    </div>
  );
}

export function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).has("reset");
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };
  const authenticated = useCallback((next: Session) => {
    setSession(next);
    setRecoveryMode(false);
  }, []);
  return (
    <main className="dashboard-page">
      <PageIntro tag="Client Portal" title={session ? "Your Growth Workspace" : "Account Access"} copy={session ? "Profile, services and the direct line to your Prime Polo team." : "Secure, private account access."} />
      <section className="section dashboard-content"><div className="container-elite">{loading ? <div className="account-loading"><RefreshCw />Checking secure session...</div> : recoveryMode ? <AuthPanel onAuthenticated={authenticated} /> : session ? <AccountPanel session={session} onLogout={logout} /> : <AuthPanel onAuthenticated={authenticated} />}</div></section>
    </main>
  );
}
