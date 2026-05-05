import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  Leaf,
  KeyRound,
  Sprout,
  Shield,
  AlertCircle,
  Github,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────── Types ─────────────── */
interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  joinedAt: number;
  avatar?: string;
}

interface SessionUser {
  id: string;
  username: string;
  email: string;
  token: string;
  isAdmin?: boolean;
}

/* ─────────────── Constants ─────────────── */
const USERS_KEY = 'prompt-forge-users';
const SESSION_KEY = 'prompt-forge-session';
const ADMIN_USER = 'xsytrance';
const ADMIN_PASS = 'Cipriano0503!!';

const easeBreathe = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeAppear = [0, 0, 0.2, 1] as [number, number, number, number];

/* ─────────────── localStorage helpers ─────────────── */
function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: SessionUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

/* ─────────────── Mock hash ─────────────── */
function mockHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return `hash_${Math.abs(h).toString(36)}_${str.length}`;
}

/* ─────────────── Validation helpers ─────────────── */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

function passwordStrength(password: string): { label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak', color: '#f59e0b' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#6b9b6b' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#15803d' },
  ];
  return levels[Math.min(score, 5)];
}

/* ─────────────── Sub-components ─────────────── */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  icon,
  showToggle,
  onToggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  icon: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-inter text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-cream rounded-[8px] border px-4 py-3 pl-11 font-inter text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all duration-300 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
              : 'border-stone-200 focus:border-moss-400 focus:shadow-[0_0_40px_rgba(106,155,106,0.15)]'
          }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            {type === 'password' ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="font-inter text-xs text-red-500 flex items-center gap-1"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SocialButton({
  provider,
  onClick,
}: {
  provider: 'google' | 'github';
  onClick: () => void;
}) {
  const isGoogle = provider === 'google';
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-[8px] font-inter text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isGoogle
          ? 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          : 'bg-[#24292e] text-white hover:bg-[#1b1f23]'
      }`}
    >
      {isGoogle ? (
        <span className="font-bold text-lg">G</span>
      ) : (
        <Github size={18} />
      )}
      {isGoogle ? 'Google' : 'GitHub'}
    </button>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const isAdminRedirect = redirect === '/admin';

  const [tab, setTab] = useState<'register' | 'login'>(isAdminRedirect ? 'login' : 'register');
  const [showAdmin, setShowAdmin] = useState(isAdminRedirect);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regTerms, setRegTerms] = useState(false);

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Admin fields
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Shared state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const session = loadSession();
    if (session && !isAdminRedirect) {
      toast.success(`Welcome back, ${session.username}!`);
      navigate(redirect);
    }
  }, [navigate, redirect, isAdminRedirect]);

  const clearErrors = useCallback(() => setErrors({}), []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const validateRegister = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isValidUsername(regUsername)) {
      errs.regUsername = 'Username must be at least 3 characters (letters, numbers, underscore)';
    }
    if (!isValidEmail(regEmail)) {
      errs.regEmail = 'Please enter a valid email address';
    }
    if (regPassword.length < 8 || !/[A-Z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
      errs.regPassword = 'Password must be at least 8 characters with 1 uppercase letter and 1 number';
    }
    if (regPassword !== regConfirm) {
      errs.regConfirm = 'Passwords do not match';
    }
    if (!regTerms) {
      errs.regTerms = 'Please agree to the terms';
    }

    const users = loadUsers();
    if (users.some((u) => u.username.toLowerCase() === regUsername.toLowerCase())) {
      errs.regUsername = 'Username already taken';
    }
    if (users.some((u) => u.email.toLowerCase() === regEmail.toLowerCase())) {
      errs.regEmail = 'Email already registered';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLogin = (): boolean => {
    const errs: Record<string, string> = {};
    if (!loginUser.trim()) {
      errs.loginUser = 'Please enter your username or email';
    }
    if (!loginPassword) {
      errs.loginPassword = 'Please enter your password';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAdmin = (): boolean => {
    const errs: Record<string, string> = {};
    if (!adminUser.trim()) errs.adminUser = 'Enter admin username';
    if (!adminPassword) errs.adminPassword = 'Enter admin password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    clearErrors();
    if (!validateRegister()) {
      triggerShake();
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const users = loadUsers();
    const newUser: StoredUser = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      username: regUsername,
      email: regEmail,
      passwordHash: mockHash(regPassword),
      joinedAt: Date.now(),
    };

    saveUsers([...users, newUser]);

    const session: SessionUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      token: `token_${mockHash(newUser.id + Date.now())}`,
    };
    saveSession(session);

    setLoading(false);
    setSuccess(true);
    toast.success('Account created! Welcome to the garden 🌱');

    setTimeout(() => {
      navigate(redirect);
    }, 1200);
  };

  const handleLogin = async () => {
    clearErrors();
    if (!validateLogin()) {
      triggerShake();
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const users = loadUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === loginUser.toLowerCase() ||
        u.email.toLowerCase() === loginUser.toLowerCase()
    );

    if (!user || user.passwordHash !== mockHash(loginPassword)) {
      setErrors({ loginPassword: 'Invalid username/email or password' });
      setLoading(false);
      triggerShake();
      return;
    }

    const session: SessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      token: `token_${mockHash(user.id + Date.now())}`,
    };
    saveSession(session);

    setLoading(false);
    setSuccess(true);
    toast.success(`Welcome back, ${user.username}! 🔑`);

    setTimeout(() => {
      navigate(redirect);
    }, 1200);
  };

  const handleAdminLogin = async () => {
    clearErrors();
    if (!validateAdmin()) {
      triggerShake();
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (adminUser !== ADMIN_USER || adminPassword !== ADMIN_PASS) {
      setErrors({ adminPassword: 'Invalid admin credentials' });
      setLoading(false);
      triggerShake();
      return;
    }

    const session: SessionUser = {
      id: `admin_${Date.now()}`,
      username: ADMIN_USER,
      email: 'admin@promptforge.local',
      token: `admin_token_${mockHash(ADMIN_USER + Date.now())}`,
      isAdmin: true,
    };
    saveSession(session);

    setLoading(false);
    setSuccess(true);
    toast.success('Admin access granted 🔒');

    setTimeout(() => {
      navigate('/admin');
    }, 800);
  };

  const handleSocial = (provider: string) => {
    toast(`Coming soon! ${provider} authentication is not yet available.`, {
      icon: '🚧',
    });
  };

  const regStrength = passwordStrength(regPassword);

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center py-12 px-4"
      style={{
        backgroundColor: 'var(--stone-50)',
        backgroundImage: 'url(/admin-pattern.svg)',
        backgroundSize: '200px',
        backgroundRepeat: 'repeat',
        backgroundBlendMode: 'soft-light',
        opacity: 1,
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: easeAppear }}
        className={`w-full max-w-[480px] bg-stone-100 rounded-[16px] shadow-lg border border-stone-200 p-8 ${
          shake ? 'animate-[shake_0.3s_ease-in-out]' : ''
        }`}
      >
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: easeBreathe }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-moss-100 flex items-center justify-center">
              <Leaf size={24} className="text-moss-600" />
            </div>
          </div>
          <h1 className="font-playfair text-xl font-bold text-moss-800">Prompt Forge</h1>
          <p className="font-inter text-sm text-stone-500 mt-1">Join the garden of AI ideas</p>
        </motion.div>

        {/* Admin overlay toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              setShowAdmin(!showAdmin);
              clearErrors();
            }}
            className="font-inter text-xs text-stone-400 hover:text-moss-600 transition-colors duration-200 flex items-center gap-1"
          >
            <Shield size={12} />
            {showAdmin ? 'Back to user login' : 'Admin Login'}
          </button>
        </div>

        {/* Admin Form */}
        <AnimatePresence mode="wait">
          {showAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: easeBreathe }}
              className="space-y-5"
            >
              <div className="text-center mb-4">
                <h2 className="font-inter text-lg font-semibold text-moss-900 flex items-center justify-center gap-2">
                  <Shield size={18} /> Admin Access
                </h2>
                <p className="font-inter text-xs text-stone-500 mt-1">
                  Enter your admin credentials
                </p>
              </div>

              <InputField
                label="Admin Username"
                placeholder="xsytrance"
                value={adminUser}
                onChange={setAdminUser}
                error={errors.adminUser}
                icon={<Shield size={16} />}
              />

              <InputField
                label="Admin Password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={setAdminPassword}
                type="password"
                error={errors.adminPassword}
                icon={<KeyRound size={16} />}
              />

              <button
                onClick={handleAdminLogin}
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-moss-700 text-cream rounded-[14px] font-inter text-sm font-medium hover:bg-moss-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : success ? (
                  <>
                    <Check size={16} /> Access granted! Redirecting...
                  </>
                ) : (
                  <>
                    <Shield size={16} /> Enter Admin Panel
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: easeBreathe }}
            >
              {/* Tab Switcher */}
              <div className="flex mb-6 border-b border-stone-200">
                <button
                  onClick={() => {
                    setTab('register');
                    clearErrors();
                  }}
                  className={`flex-1 pb-3 font-inter text-sm font-medium text-center transition-all duration-300 ${
                    tab === 'register'
                      ? 'text-moss-700 border-b-2 border-moss-500'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Sprout size={14} /> Register
                  </span>
                </button>
                <button
                  onClick={() => {
                    setTab('login');
                    clearErrors();
                  }}
                  className={`flex-1 pb-3 font-inter text-sm font-medium text-center transition-all duration-300 ${
                    tab === 'login'
                      ? 'text-moss-700 border-b-2 border-moss-500'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <KeyRound size={14} /> Log In
                  </span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {tab === 'register' ? (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <InputField
                      label="Username *"
                      placeholder="Choose a username..."
                      value={regUsername}
                      onChange={setRegUsername}
                      error={errors.regUsername}
                      icon={<Sprout size={16} />}
                    />

                    <InputField
                      label="Email"
                      placeholder="your@email.com"
                      value={regEmail}
                      onChange={setRegEmail}
                      error={errors.regEmail}
                      icon={<span className="text-sm">✉️</span>}
                    />

                    <div>
                      <InputField
                        label="Password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={setRegPassword}
                        type={showRegPassword ? 'text' : 'password'}
                        error={errors.regPassword}
                        icon={<KeyRound size={16} />}
                        showToggle
                        onToggle={() => setShowRegPassword(!showRegPassword)}
                      />
                      {/* Strength bar */}
                      {regPassword && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: regStrength.color }}
                            />
                          </div>
                          <span
                            className="font-inter text-[10px] font-medium"
                            style={{ color: regStrength.color }}
                          >
                            {regStrength.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <InputField
                      label="Confirm Password"
                      placeholder="••••••••"
                      value={regConfirm}
                      onChange={setRegConfirm}
                      type={showRegPassword ? 'text' : 'password'}
                      error={errors.regConfirm}
                      icon={<KeyRound size={16} />}
                    />

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={regTerms}
                        onChange={(e) => setRegTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-stone-300 text-moss-600 focus:ring-moss-500"
                      />
                      <label htmlFor="terms" className="font-inter text-xs text-stone-500">
                        I agree to the{' '}
                        <span className="text-moss-600 hover:underline cursor-pointer">Terms</span>{' '}
                        and{' '}
                        <span className="text-moss-600 hover:underline cursor-pointer">Privacy Policy</span>
                      </label>
                    </div>
                    {errors.regTerms && (
                      <p className="font-inter text-xs text-red-500">{errors.regTerms}</p>
                    )}

                    <motion.button
                      onClick={handleRegister}
                      disabled={loading || success}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-moss-700 text-cream rounded-[14px] font-inter text-sm font-medium hover:bg-moss-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4, ease: easeBreathe }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Planting...
                        </>
                      ) : success ? (
                        <>
                          <Check size={16} /> Account created! Redirecting...
                        </>
                      ) : (
                        <>
                          <Sprout size={16} /> Plant Your Account
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <InputField
                      label="Username or Email"
                      placeholder="xsytrance or your@email.com"
                      value={loginUser}
                      onChange={setLoginUser}
                      error={errors.loginUser}
                      icon={<Sprout size={16} />}
                    />

                    <div>
                      <InputField
                        label="Password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={setLoginPassword}
                        type={showLoginPassword ? 'text' : 'password'}
                        error={errors.loginPassword}
                        icon={<KeyRound size={16} />}
                        showToggle
                        onToggle={() => setShowLoginPassword(!showLoginPassword)}
                      />
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => toast('Password reset coming soon!', { icon: '🔧' })}
                          className="font-inter text-xs text-moss-600 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-moss-600 focus:ring-moss-500"
                      />
                      <label htmlFor="remember" className="font-inter text-xs text-stone-500">
                        Remember me
                      </label>
                    </div>

                    <motion.button
                      onClick={handleLogin}
                      disabled={loading || success}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-moss-700 text-cream rounded-[14px] font-inter text-sm font-medium hover:bg-moss-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4, ease: easeBreathe }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Unlocking...
                        </>
                      ) : success ? (
                        <>
                          <Check size={16} /> Welcome back! Redirecting...
                        </>
                      ) : (
                        <>
                          <KeyRound size={16} /> Enter the Garden
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social Auth */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="font-inter text-xs text-stone-500">or continue with</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <div className="flex gap-3">
                  <SocialButton provider="google" onClick={() => handleSocial('Google')} />
                  <SocialButton provider="github" onClick={() => handleSocial('GitHub')} />
                </div>
              </div>

              {/* Toggle prompt */}
              <div className="mt-6 text-center">
                <AnimatePresence mode="wait">
                  {tab === 'register' ? (
                    <motion.p
                      key="to-login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-inter text-sm text-stone-500"
                    >
                      Already have an account?{' '}
                      <button
                        onClick={() => {
                          setTab('login');
                          clearErrors();
                        }}
                        className="text-moss-600 hover:underline font-medium"
                      >
                        🔑 Log In
                      </button>
                    </motion.p>
                  ) : (
                    <motion.p
                      key="to-register"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-inter text-sm text-stone-500"
                    >
                      New to the garden?{' '}
                      <button
                        onClick={() => {
                          setTab('register');
                          clearErrors();
                        }}
                        className="text-moss-600 hover:underline font-medium"
                      >
                        🌱 Create an account
                      </button>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Minimal footer */}
      <div className="mt-8 text-center">
        <p className="font-inter text-xs text-stone-400">
          © 2024 Prompt Forge ·{' '}
          <button onClick={() => navigate('/')} className="text-moss-600 hover:underline">
            Back to home →
          </button>
        </p>
      </div>

      {/* Shake keyframe injected via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
