import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';
import { useAuth } from '@/lib/auth';
import { firebaseAuth } from '@/lib/firebase';

type Profile = { displayName: string | null; email: string | null; phone: string | null };

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  if (error.message.includes('auth/email-already-in-use')) return 'An account already exists for this email.';
  if (error.message.includes('auth/invalid-credential')) return 'The email or password is incorrect.';
  if (error.message.includes('auth/weak-password')) return 'Use a password with at least six characters.';
  if (error.message.includes('auth/invalid-email')) return 'Enter a valid email address.';
  return error.message;
}

async function profileRequest(method: 'GET' | 'PUT', body?: Partial<Profile>) {
  const token = await firebaseAuth?.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in again.');
  const response = await fetch('/api/customer/profile', {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to load your profile.');
  return data as Profile;
}

export default function AccountPage() {
  const { loading, user, isCustomer, signUp, signInCustomer, signOutCustomer } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCustomer) return;
    void profileRequest('GET').then(setProfile).catch((nextError) => setError(friendlyError(nextError)));
  }, [isCustomer]);

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
    if (user?.email) setEmail(user.email);
  }, [user]);

  if (loading) return <PageFrame eyebrow="Your account" title="Loading your account." description="Checking your secure session."><div /></PageFrame>;
  if (user?.email?.toLowerCase() === 'adminayushmedical@gmail.com') return <Navigate to="/admin/dashboard" replace />;

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'signup') await signUp(name, email, password);
      else await signInCustomer(email, password);
      setMessage(mode === 'signup' ? 'Your account is ready.' : 'Welcome back.');
    } catch (nextError) {
      setError(friendlyError(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const saved = await profileRequest('PUT', { displayName: name, email, phone });
      setProfile(saved);
      setMessage('Profile saved.');
    } catch (nextError) {
      setError(friendlyError(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isCustomer) {
    return (
      <PageFrame eyebrow="Customer account" title={mode === 'signin' ? 'Welcome back.' : 'Create your account.'} description="Keep your details ready for future pharmacy services. Your customer account is separate from the private admin workspace.">
        <section className="site-container py-10 md:py-16">
          <div className="mx-auto max-w-lg rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="mb-7 flex gap-2 rounded-full bg-muted p-1">
              {(['signin', 'signup'] as const).map((nextMode) => (
                <button key={nextMode} type="button" onClick={() => setMode(nextMode)} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold ${mode === nextMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {nextMode === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'signup' && <label className="block text-sm font-bold">Your name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" autoComplete="name" required /></label>}
              <label className="block text-sm font-bold">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" autoComplete="email" required /></label>
              <label className="block text-sm font-bold">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required /></label>
              {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">{error}</p>}
              {message && <p className="rounded-xl border border-primary/20 bg-secondary p-3 text-sm font-semibold text-primary">{message}</p>}
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
            </form>
          </div>
        </section>
      </PageFrame>
    );
  }

  return (
    <PageFrame eyebrow="Customer account" title={`Good to see you${name ? `, ${name.split(' ')[0]}` : ''}.`} description="Keep your customer details current for a smoother experience with the pharmacy.">
      <section className="site-container py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
          <form onSubmit={saveProfile} className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <p className="eyebrow">Your details</p>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.04em]">Customer profile</h2>
            <div className="mt-8 space-y-5">
              <label className="block text-sm font-bold">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" required /></label>
              <label className="block text-sm font-bold">Email<input value={email} className="mt-2 w-full rounded-xl border border-border bg-muted px-4 py-3.5 text-sm text-muted-foreground outline-none" readOnly /></label>
              <label className="block text-sm font-bold">Mobile number <span className="font-normal text-muted-foreground">(optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-primary" autoComplete="tel" /></label>
            </div>
            {error && <p className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">{error}</p>}
            {message && <p className="mt-5 rounded-xl border border-primary/20 bg-secondary p-3 text-sm font-semibold text-primary">{message}</p>}
            <button type="submit" disabled={submitting} className="mt-7 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{submitting ? 'Saving…' : 'Save profile'}</button>
          </form>
          <div className="rounded-[1.75rem] bg-primary p-7 text-primary-foreground">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_84%)]">Account access</p>
            <p className="mt-4 text-sm leading-6 text-[hsl(189_35%_84%)]">You are signed in as {profile?.email || user?.email}. Your customer session persists on this device.</p>
            <button type="button" onClick={() => void signOutCustomer()} className="mt-7 rounded-full bg-primary-foreground px-5 py-3 text-sm font-bold text-primary">Sign out</button>
            <Link to="/medicines" className="mt-4 block text-sm font-bold underline underline-offset-4">Browse the catalogue</Link>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}