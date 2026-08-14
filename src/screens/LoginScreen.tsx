import { useState } from 'react';
import { Lock } from 'lucide-react';
import { AppLogo } from '../components/AppLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBanner } from '../components/StatusBanner';
import {
  AUTH_CONFIRMATION_SENT,
  AUTH_EMAIL_LABEL,
  AUTH_NOT_CONFIGURED,
  AUTH_PASSWORD_HINT,
  AUTH_PASSWORD_LABEL,
  AUTH_SIGN_IN_BUTTON,
  AUTH_SIGN_IN_SUBTITLE,
  AUTH_SIGN_IN_TITLE,
  AUTH_SIGN_UP_BUTTON,
  AUTH_SIGN_UP_SUBTITLE,
  AUTH_SIGN_UP_TITLE,
  AUTH_SWITCH_TO_SIGN_IN,
  AUTH_SWITCH_TO_SIGN_UP,
} from '../constants/authMicrocopy';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'sign-in' | 'sign-up';

function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div className="mb-m">
      <label htmlFor={id} className="mb-s block text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-input border border-border bg-surface px-m py-3 text-base text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {hint && <p className="mt-s text-sm text-text-secondary">{hint}</p>}
    </div>
  );
}

export function LoginScreen() {
  const { authEnabled, signIn, signUp, syncError, clearSyncError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';
  const title = isSignUp ? AUTH_SIGN_UP_TITLE : AUTH_SIGN_IN_TITLE;
  const subtitle = isSignUp ? AUTH_SIGN_UP_SUBTITLE : AUTH_SIGN_IN_SUBTITLE;

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    clearSyncError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    if (isSignUp) {
      const result = await signUp(trimmedEmail, password);
      setIsSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsConfirmation) {
        setInfo(AUTH_CONFIRMATION_SENT);
        setMode('sign-in');
        setPassword('');
        return;
      }
    } else {
      const message = await signIn(trimmedEmail, password);
      setIsSubmitting(false);

      if (message) {
        setError(message);
      }
    }
  };

  const switchMode = () => {
    setMode(isSignUp ? 'sign-in' : 'sign-up');
    setError(null);
    setInfo(null);
    clearSyncError();
  };

  if (!authEnabled) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-m py-xl">
        <header className="mb-xxl text-center">
          <AppLogo />
        </header>
        <StatusBanner type="warning" message={AUTH_NOT_CONFIGURED} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-m py-xl">
      <header className="mb-xxl text-center">
        <AppLogo />
        <p className="mt-m text-base text-text-secondary">{subtitle}</p>
      </header>

      <div className="flex flex-1 flex-col">
        <h1 className="mb-l text-2xl font-semibold text-text-primary">{title}</h1>

        <AuthField
          id="auth-email"
          label={AUTH_EMAIL_LABEL}
          type="email"
          value={email}
          autoComplete="email"
          onChange={setEmail}
        />

        <AuthField
          id="auth-password"
          label={AUTH_PASSWORD_LABEL}
          type="password"
          value={password}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          onChange={setPassword}
          hint={isSignUp ? AUTH_PASSWORD_HINT : undefined}
        />

        {info && (
          <div className="mb-m">
            <StatusBanner type="warning" message={info} />
          </div>
        )}

        {(error || syncError) && (
          <div className="mb-m">
            <StatusBanner type="warning" message={error ?? syncError ?? ''} />
          </div>
        )}

        <PrimaryButton onClick={() => void handleSubmit()} loading={isSubmitting}>
          {isSignUp ? AUTH_SIGN_UP_BUTTON : AUTH_SIGN_IN_BUTTON}
        </PrimaryButton>

        <button
          type="button"
          onClick={switchMode}
          className="mt-l text-sm font-medium text-primary hover:text-primary-hover"
        >
          {isSignUp ? AUTH_SWITCH_TO_SIGN_IN : AUTH_SWITCH_TO_SIGN_UP}
        </button>
      </div>

      <footer className="pb-xl pt-xxl text-center">
        <p className="inline-flex items-center gap-s text-sm text-text-secondary">
          <Lock className="h-4 w-4" aria-hidden />
          Your toolbox and history stay tied to your account.
        </p>
      </footer>
    </div>
  );
}
