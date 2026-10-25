import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) setError(authError.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ld-login">
      <div className="ld-orb ld-orb-a" aria-hidden="true" />
      <div className="ld-orb ld-orb-b" aria-hidden="true" />

      <section className="ld-card" aria-labelledby="login-title">
        <div className="ld-brand-row">
          <img className="ld-brand-logo" src="/mind2pixel-logo.svg" alt="Mind2Pixel" />
        </div>

        <header className="ld-form-head">
          <h1 id="login-title">Sign in to your workspace</h1>
          <p>Enter your work credentials to continue.</p>
        </header>

        {!isSupabaseConfigured && (
          <div className="ld-alert ld-alert-warning" role="status">
            Sign-in is not configured. Add the Supabase settings to <code>client/.env</code>.
          </div>
        )}
        {error && <div className="ld-alert ld-alert-error" role="alert">{error}</div>}

        <form className="ld-form" onSubmit={submit}>
          <div className="ld-field">
            <label htmlFor="login-email">Work email</label>
            <div className="ld-input">
              <Mail size={17} className="ld-input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
          </div>

          <div className="ld-field">
            <label htmlFor="login-password">Password</label>
            <div className="ld-input">
              <Lock size={17} className="ld-input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                className="ld-toggle"
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button className="ld-submit" type="submit" disabled={loading || !isSupabaseConfigured}>
            {loading ? (
              <>
                <Loader2 size={17} className="ld-spin" /> <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span> <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <div className="ld-assurance"><ShieldCheck size={15} /><span>Protected with secure authentication</span></div>
        <p className="ld-help">Need help accessing your account? Contact your workspace administrator.</p>
      </section>
    </main>
  );
}
