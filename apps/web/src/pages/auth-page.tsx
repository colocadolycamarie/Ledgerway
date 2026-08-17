import { SignIn, SignUp } from '@clerk/react';
import { Logo } from '@/components/layout/logo';
import { BASE_PATH } from '@/lib/constants';

export default function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return <div className="auth-page ledger-grid"><div className="auth-side"><Logo dark /><div><p className="eyebrow accent-eyebrow">The finance control plane</p><h1>{mode === 'sign-in' ? 'Welcome back to the way spend moves.' : 'Make every dollar easy to stand behind.'}</h1><p>One continuous record from request to payment, built for teams who take control seriously.</p></div><span className="font-mono">LEDGERWAY / 01</span></div><div className="auth-card-wrap"><div className="auth-card"><div className="clerk-card-frame">{mode === 'sign-in' ? <SignIn routing="path" path={`${BASE_PATH}/sign-in`} signUpUrl={`${BASE_PATH}/sign-up`} /> : <SignUp routing="path" path={`${BASE_PATH}/sign-up`} signInUrl={`${BASE_PATH}/sign-in`} />}</div></div></div></div>;
}
