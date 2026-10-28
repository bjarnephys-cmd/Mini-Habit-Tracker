import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Cloud,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  loginWithGoogle,
  signupWithEmail,
  loginWithEmail,
  sendPasswordReset,
  resendVerificationEmail,
  refreshCurrentUser,
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onAuthSuccess(user);
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      if (e.message.includes('popup-closed-by-user')) {
        setError('Login-vinduet blev lukket.');
      } else {
        setError(e.message || 'Google login fejlede.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Adgangskoden skal være på mindst 6 tegn.');
          setLoading(false);
          return;
        }
        const user = await signupWithEmail(email.trim(), password);
        setVerificationSentTo(user.email || email.trim());
        setSuccessMsg(
          'Konto oprettet! Vi har sendt en bekræftelses-e-mail. Tjek din indbakke for at bekræfte din adresse.'
        );
        onAuthSuccess(user);
      } else if (mode === 'login') {
        const user = await loginWithEmail(email.trim(), password);
        onAuthSuccess(user);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email.trim());
        setSuccessMsg(
          'Vi har sendt et link til nulstilling af adgangskode til din e-mailadresse.'
        );
      }
    } catch (err: unknown) {
      const e = err as Error;
      if (e.message.includes('operation-not-allowed')) {
        setError('E-mail/adgangskode login er endnu ikke slået til i Firebase-konsollen. Benyt venligst "Fortsæt hurtigt med Google" ovenfor, eller aktiver "Email/Password" i Firebase-konsollen.');
      } else if (e.message.includes('email-already-in-use')) {
        setError('Denne e-mailadresse er allerede i brug. Prøv at logge ind i stedet.');
      } else if (e.message.includes('wrong-password') || e.message.includes('invalid-credential')) {
        setError('Forkert e-mail eller adgangskode.');
      } else if (e.message.includes('user-not-found')) {
        setError('Ingen bruger fundet med denne e-mailadresse.');
      } else if (e.message.includes('invalid-email')) {
        setError('Ugyldigt e-mailformat.');
      } else {
        setError(e.message || 'Der opstod en fejl. Prøv igen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setSuccessMsg('En ny bekræftelses-e-mail er sendt afsted til din indbakke!');
    } catch (err: unknown) {
      setError((err as Error).message || 'Kunne ikke gensende mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIfVerified = async () => {
    setCheckingVerification(true);
    setError(null);
    try {
      const refreshed = await refreshCurrentUser();
      if (refreshed?.emailVerified) {
        setSuccessMsg('E-mailen er bekræftet! Din konto er nu fuldt synkroniseret.');
        setTimeout(() => onClose(), 1500);
      } else {
        setError('E-mailen er endnu ikke bekræftet. Klik venligst på linket i din indbakke først.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'login'
                  ? 'Log ind'
                  : mode === 'signup'
                  ? 'Opret fælles konto'
                  : 'Nulstil adgangskode'}
              </h2>
              <p className="text-xs text-slate-500">
                Synkronisér vaner og træning mellem PC og mobil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification banner if user created account with email and needs to verify */}
        {(verificationSentTo || (currentUser && !currentUser.emailVerified && !currentUser.providerData.some(p => p.providerId === 'google.com'))) && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Mail className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Bekræftelses-e-mail afsendt</span>
            </div>
            <p className="leading-relaxed">
              Vi har sendt et link til <strong>{verificationSentTo || currentUser?.email}</strong>. 
              Klik på linket i e-mailen for at bekræfte din konto.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCheckIfVerified}
                disabled={checkingVerification}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingVerification ? 'animate-spin' : ''}`} />
                <span>Jeg har bekræftet</span>
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="px-2.5 py-1.5 text-amber-900 hover:underline font-medium"
              >
                Gensend mail
              </button>
            </div>
          </div>
        )}

        {/* Fast Google Login Button */}
        {mode !== 'forgot' && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-2.5 shadow-2xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Fortsæt hurtigt med Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                eller med e-mail
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="mt-2 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mailadresse
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="f.eks. bjarne@mail.dk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Adgangskode
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                  >
                    Glemt adgangskode?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Mindst 6 tegn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Arbejder...</span>
              </>
            ) : mode === 'login' ? (
              <span>Log ind</span>
            ) : mode === 'signup' ? (
              <>
                <span>Opret konto &amp; Send bekræftelse</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>Send link til nulstilling</span>
            )}
          </button>
        </form>

        {/* Bottom Mode Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          {mode === 'login' ? (
            <p>
              Har du ikke en konto endnu?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-slate-900 hover:underline"
              >
                Opret konto her
              </button>
            </p>
          ) : (
            <p>
              Har du allerede en konto?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-slate-900 hover:underline"
              >
                Log ind her
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
