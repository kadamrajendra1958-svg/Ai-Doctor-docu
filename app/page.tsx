'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, FileText, User, Settings, Home, Plus, Activity, Calendar, Stethoscope, ChevronRight, ShieldCheck, Sparkles, ClipboardCheck, Eye, EyeOff, Loader2, Mail, Lock, Search, X, ArrowLeft, Check, Pause, Play, Square, Bell, HelpCircle, Info, LogOut } from 'lucide-react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

type ScreenState = 'splash' | 'onboarding' | 'auth' | 'setup' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('splash');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsInitializing(false);
      if (user) {
        // Only jump to home if they aren't in setup
        setCurrentScreen((prev) => (prev === 'splash' || prev === 'onboarding' || prev === 'auth' ? 'home' : prev));
      } else {
        // If not authenticated, ensure they go to auth after splash/onboarding
        setCurrentScreen((prev) => (prev === 'home' || prev === 'setup' ? 'auth' : prev));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        if (!isInitializing) {
          // Firebase auth state has already loaded, transition based on auth state
          setCurrentScreen(auth.currentUser ? 'home' : 'onboarding');
        } else {
          // If still initializing, go to onboarding as fallback, auth listener will redirect if logged in
          setCurrentScreen('onboarding');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, isInitializing]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (currentScreen === 'home') {
    return <HomeScreen onLogout={handleLogout} />;
  }

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-slate-50 w-full p-0 md:p-6 lg:p-12">
      <div className="w-full h-[100dvh] md:h-auto md:min-h-[700px] max-w-5xl bg-white md:rounded-[2rem] md:shadow-2xl overflow-hidden flex flex-col relative md:border border-slate-200">
        {currentScreen === 'splash' && <SplashScreen />}
        {currentScreen === 'onboarding' && <OnboardingScreen onComplete={() => setCurrentScreen('auth')} />}
        {currentScreen === 'auth' && <AuthScreen onLogin={() => setCurrentScreen('home')} onRegister={() => setCurrentScreen('setup')} />}
        {currentScreen === 'setup' && <SetupScreen onComplete={() => setCurrentScreen('home')} />}
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="flex-1 bg-white flex flex-col items-center justify-center relative">
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-teal-100">
          <Stethoscope className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">DocuAI</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 tracking-wide uppercase">Clinical Intelligence</p>
      </div>
      
      {/* Subtle loading animation */}
      <div className="absolute bottom-20 flex gap-2">
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Record Consultations",
      description: "Capture patient encounters naturally with our secure clinical audio engine.",
      icon: <Mic className="w-14 h-14 md:w-20 md:h-20 text-teal-600" />
    },
    {
      title: "Generate Instantly",
      description: "Advanced medical AI automatically structures your conversation into clinical notes.",
      icon: <Sparkles className="w-14 h-14 md:w-20 md:h-20 text-teal-600" />
    },
    {
      title: "Review & Approve",
      description: "Verify the generated documentation, sign off securely, and sync to your EHR.",
      icon: <ClipboardCheck className="w-14 h-14 md:w-20 md:h-20 text-teal-600" />
    }
  ];

  const current = onboardingSteps[step];
  const isLast = step === onboardingSteps.length - 1;

  return (
    <div className="flex-1 bg-white flex flex-col h-full relative">
      {/* Skip Button */}
      <div className="absolute top-0 right-0 pt-10 sm:pt-12 px-4 z-20">
        {!isLast ? (
          <button onClick={onComplete} className="text-slate-400 hover:text-slate-600 font-medium text-sm p-2">
            Skip
          </button>
        ) : (
          <div className="h-9 p-2" />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-24 text-center" key={step}>
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-both flex flex-col items-center max-w-lg">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-slate-50 rounded-full flex items-center justify-center mb-8 md:mb-12 relative">
             <div className="absolute inset-0 bg-teal-50 rounded-full scale-110 -z-10"></div>
             {current.icon}
          </div>
          <h2 className="text-2xl md:text-4xl font-semibold text-slate-900 mb-4">{current.title}</h2>
          <p className="text-slate-500 md:text-lg leading-relaxed mb-8">
            {current.description}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-24 pb-[calc(2rem+env(safe-area-inset-bottom,1rem))] sm:pb-12 max-w-2xl mx-auto w-full">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-10">
           {onboardingSteps.map((_, i) => (
             <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-teal-500' : 'w-2 bg-slate-200'}`}></div>
           ))}
        </div>

        <button 
          onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl flex items-center justify-center font-medium transition-all group shadow-md"
        >
          {isLast ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; global?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    
    if (view === 'register' && !name.trim()) {
      newErrors.name = 'Doctor name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (view !== 'forgot') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (view === 'register' && password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (!navigator.onLine) {
        throw new Error('network/offline');
      }

      if (view === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        onRegister();
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setView('login');
        setErrors({ global: 'Password reset instructions sent to your email.' });
      }
    } catch (err: any) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (err.message === 'network/offline' || err.code === 'auth/network-request-failed') errorMessage = 'No internet connection. Please check your network and try again.';
      else if (err.code === 'auth/email-already-in-use') errorMessage = 'An account with this email already exists.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') errorMessage = 'Incorrect email or password.';
      else if (err.code === 'auth/weak-password') errorMessage = 'Password is too weak.';
      else if (err.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Please try again later.';
      
      setErrors({ global: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col md:flex-row h-full animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* Desktop Visual Side */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-8 border border-teal-500/30">
            <Stethoscope className="w-6 h-6 text-teal-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight">
            Clinical Intelligence,<br/>Simplified.
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Securely access your clinical workspace, automate documentation, and spend more time with your patients.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-500">
          <ShieldCheck className="w-5 h-5 text-teal-500" />
          HIPAA Compliant & End-to-End Encrypted
        </div>
        
        {/* Decor */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col h-full md:w-1/2 md:max-w-md mx-auto justify-center">
        <div className="px-8 pt-12 md:pt-0 sm:pt-16 pb-6">
          <div className="md:hidden w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-teal-100">
            <Stethoscope className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
            {view === 'login' ? 'Welcome back' : view === 'register' ? 'Create account' : 'Reset password'}
          </h2>
          <p className="text-slate-500 text-sm">
            {view === 'login' 
              ? 'Sign in to access your clinical workspace.' 
              : view === 'register' 
              ? 'Set up your secure clinical profile.' 
              : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        <div className="flex-1 md:flex-none px-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.global && (
            <div className={`p-3 text-sm rounded-xl border ${errors.global.includes('sent') ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {errors.global}
            </div>
          )}

          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                  placeholder="Dr. Jane Doe"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                placeholder="doctor@clinic.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                  placeholder="••••••••"
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
            </div>
          )}

          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-teal-500 focus:border-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
          )}

          {view === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setView('forgot'); setErrors({}); }}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="pt-2 md:pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl flex items-center justify-center font-medium transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Link'
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center pb-8">
          <p className="text-sm text-slate-500">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setErrors({});
                setPassword('');
              }}
              className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              disabled={loading}
            >
              {view === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

function SetupScreen({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinic, setClinic] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; specialization?: string; clinic?: string }>({});

  const handleComplete = async () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Doctor name is required';
    if (!specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (!clinic.trim()) newErrors.clinic = 'Clinic name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          name,
          specialization,
          clinic,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white flex flex-col md:flex-row h-full animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* Desktop Visual Side */}
      <div className="hidden md:flex md:w-1/2 bg-teal-50 p-12 flex-col justify-center items-center text-center relative overflow-hidden border-r border-teal-100">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-teal-100 relative z-10">
          <Stethoscope className="w-12 h-12 text-teal-600" />
        </div>
        <h2 className="text-4xl font-semibold text-teal-950 mb-4 relative z-10">Almost there.</h2>
        <p className="text-teal-800 text-lg max-w-sm relative z-10">
          Configure your clinical profile to unlock intelligent documentation tailored to your specialty.
        </p>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/40 via-transparent to-transparent"></div>
      </div>

      <div className="flex-1 flex flex-col h-full md:w-1/2 md:max-w-md mx-auto justify-center">
        <div className="px-8 pt-12 md:pt-0 sm:pt-16 pb-6">
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
            Doctor Setup
          </h2>
          <p className="text-slate-500 text-sm">
            Let&apos;s configure your clinical profile before you start.
          </p>
        </div>

        <div className="flex-1 md:flex-none px-8 overflow-y-auto">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`block w-full px-4 py-3 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
              placeholder="Dr. Jane Doe"
              disabled={loading}
            />
            {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={`block w-full px-4 py-3 border ${errors.specialization ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
              placeholder="e.g. Cardiology, General Practice"
              disabled={loading}
            />
            {errors.specialization && <p className="mt-1.5 text-sm text-red-500">{errors.specialization}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinic Name</label>
            <input
              type="text"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className={`block w-full px-4 py-3 border ${errors.clinic ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-teal-500'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
              placeholder="e.g. City Medical Center"
              disabled={loading}
            />
            {errors.clinic && <p className="mt-1.5 text-sm text-red-500">{errors.clinic}</p>}
          </div>
        </div>

        <div className="mt-10 pb-8">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl flex items-center justify-center font-medium transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

function HomeScreen({ onLogout }: { onLogout: () => void }) {
  const [profileName, setProfileName] = useState('Doctor');
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'settings'>('home');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isStartingConsultation, setIsStartingConsultation] = useState(false);
  const [patients, setPatients] = useState<{ id: string, name: string, dob: string, gender?: string, phone?: string, lastVisit: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [addPatientError, setAddPatientError] = useState<string | null>(null);
  
  const [recentConsultations, setRecentConsultations] = useState<any[]>([]);

  useEffect(() => {
    // Retrieve the doctor's name saved during setup or from Firebase
    if (auth.currentUser?.displayName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileName(auth.currentUser.displayName);
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'patients'), 
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pts = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        dob: doc.data().dob,
        gender: doc.data().gender,
        phone: doc.data().phone,
        lastVisit: doc.data().lastVisit,
        createdAt: doc.data().createdAt?.toMillis() || 0
      })).sort((a, b) => b.createdAt - a.createdAt);
      setPatients(pts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'consultations'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRecentConsultations(cons);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientDob.trim() || !newPatientGender.trim() || !newPatientPhone.trim() || !auth.currentUser) return;

    setAddPatientError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('network/offline');
      }
      
      await addDoc(collection(db, 'patients'), {
        userId: auth.currentUser.uid,
        name: newPatientName,
        dob: newPatientDob,
        gender: newPatientGender,
        phone: newPatientPhone,
        lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: serverTimestamp()
      });

      setNewPatientName('');
      setNewPatientDob('');
      setNewPatientGender('');
      setNewPatientPhone('');
      setIsAddingPatient(false);
    } catch (err: any) {
      console.error("Error adding patient:", err);
      if (err.message === 'network/offline') {
        setAddPatientError("No internet connection. Please try again.");
      } else {
        setAddPatientError("Failed to add patient. Please check database permissions or try again.");
      }
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#FAFAFA] animate-in fade-in duration-500">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col py-6">
        <div className="px-8 mb-10 flex items-center gap-3">
           <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100">
             <Stethoscope className="w-6 h-6 text-teal-600" />
           </div>
           <h1 className="text-xl font-semibold text-slate-900 tracking-tight">DocuAI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <DesktopNavItem icon={<Home className="w-5 h-5" />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <DesktopNavItem icon={<User className="w-5 h-5" />} label="Patients" active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} />
          <DesktopNavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-[100dvh] relative overflow-hidden">
        {/* Header */}
        <header className="px-6 md:px-10 pt-12 sm:pt-14 md:pt-10 pb-4 bg-white md:bg-transparent flex justify-between items-center z-10 sticky top-0 border-b border-slate-100 md:border-none">
          {selectedPatientId ? (
             <div className="flex items-center gap-4 w-full">
               <button onClick={() => isStartingConsultation ? setIsStartingConsultation(false) : setSelectedPatientId(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <h1 className="text-xl font-semibold text-slate-900 truncate">
                 {isStartingConsultation ? 'New Consultation' : patients.find(p => p.id === selectedPatientId)?.name}
               </h1>
             </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-slate-500">{getGreeting()},</p>
                <h1 className="text-2xl font-semibold text-slate-900">{profileName}</h1>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center border-2 border-teal-500 shadow-sm overflow-hidden">
                 {/* Fallback avatar matching the clean aesthetic */}
                 <User className="text-teal-600 w-6 h-6" />
              </div>
            </>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-[calc(5rem+env(safe-area-inset-bottom,1rem))] md:pb-10">
          <div className="max-w-5xl mx-auto w-full">
            {selectedPatientId && patients.find(p => p.id === selectedPatientId) && isStartingConsultation ? (
              <NewConsultationScreen 
                patient={patients.find(p => p.id === selectedPatientId)!}
                onCancel={() => setIsStartingConsultation(false)}
              />
            ) : selectedPatientId && patients.find(p => p.id === selectedPatientId) ? (
               <PatientDetails 
                 patient={patients.find(p => p.id === selectedPatientId)!} 
                 onStartConsultation={() => setIsStartingConsultation(true)}
                 onGoBack={() => setSelectedPatientId(null)}
               />
            ) : (
              <>
                {activeTab === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Primary Action Area */}
                <section className="mt-6 mb-8 md:mt-2">
                  <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg shadow-slate-900/10">
                    <div className="relative z-10">
                      <h2 className="text-xl md:text-2xl font-medium mb-1">New Consultation</h2>
                      <p className="text-slate-300 text-sm md:text-base mb-6 md:mb-8">Start recording audio or type a new note.</p>
                      <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                        <button onClick={() => setActiveTab('patients')} className="flex-1 bg-teal-500 hover:bg-teal-400 text-white py-3 md:py-4 px-4 rounded-2xl flex items-center justify-center font-medium transition-colors shadow-sm">
                          <Mic className="w-5 h-5 mr-2" />
                          Record
                        </button>
                        <button onClick={() => setActiveTab('patients')} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 md:py-4 px-4 rounded-2xl flex items-center justify-center font-medium backdrop-blur-sm transition-colors border border-white/10">
                          <Plus className="w-5 h-5 mr-2" />
                          Manual
                        </button>
                      </div>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 md:w-64 md:h-64 bg-teal-500/20 rounded-full blur-2xl md:blur-3xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 md:w-48 md:h-48 bg-blue-500/20 rounded-full blur-xl md:blur-2xl"></div>
                  </div>
                </section>

            {/* Consultations */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Today&apos;s Consultations</h3>
                <button onClick={() => setActiveTab('patients')} className="text-sm font-medium text-teal-600 hover:text-teal-700">View All</button>
              </div>
              
              {recentConsultations.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-slate-900 font-medium mb-1">No Consultations Yet</h4>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    Tap &apos;Record&apos; above to start your first patient encounter today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConsultations.slice(0, 3).map((item) => {
                    const patient = patients.find(p => p.id === item.patientId);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedPatientId(item.patientId)}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition-colors cursor-pointer shadow-sm group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{patient?.name || 'Unknown Patient'}</h4>
                              <p className="text-sm text-slate-500">{item.type} • {item.date}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors mt-2" />
                        </div>
                        <p className="text-slate-600 text-sm mt-3 ml-13 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Patients</h3>
                <button onClick={() => setActiveTab('patients')} className="text-sm font-medium text-teal-600 hover:text-teal-700">View Directory</button>
              </div>
              
              {patients.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-slate-900 font-medium mb-1">No Patients Found</h4>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    Your patient list will appear here once you add a patient.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patients.slice(0, 3).map(patient => (
                    <div key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-teal-200 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-lg">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-900 font-semibold truncate">{patient.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">DOB: {patient.dob}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Last Visit</p>
                        <p className="text-xs font-medium text-slate-700">{patient.lastVisit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Patient Directory</h2>
              <button 
                onClick={() => setIsAddingPatient(true)}
                className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-sm hover:bg-teal-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors shadow-sm"
                placeholder="Search patients..."
              />
            </div>

            {patients.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm mt-8">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-900 font-medium mb-1">Empty Directory</h4>
                <p className="text-sm text-slate-500 max-w-[200px] mb-6">
                  You have not added any patients to your secure directory yet.
                </p>
                <button 
                  onClick={() => setIsAddingPatient(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-6 rounded-xl text-sm font-medium transition-colors"
                >
                  Add First Patient
                </button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No patients matching &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map(patient => (
                  <div key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-teal-200 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-lg">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-900 font-semibold truncate">{patient.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">DOB: {patient.dob}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Last Visit</p>
                      <p className="text-xs font-medium text-slate-700">{patient.lastVisit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6 max-w-2xl mx-auto pb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h2>
            
            <div className="space-y-6">
              {/* Account Group */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-2">
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-slate-400" />
                      <span>Account</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-slate-400" />
                      <span>Privacy & Security</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-slate-400" />
                      <span>Notifications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Support Group */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-2">
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-slate-400" />
                      <span>Help</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-slate-400" />
                      <span>About</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Danger Group */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-2">
                  <button onClick={onLogout} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-colors text-left font-medium text-red-600">
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-red-500" />
                      <span>Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
              </>
            )}
        </div>
      </main>

      {/* Add Patient Modal */}
      {isAddingPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-900">Add New Patient</h3>
              <button 
                onClick={() => setIsAddingPatient(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPatient} className="p-6">
              {addPatientError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex justify-between items-center">
                  <span>{addPatientError}</span>
                  <button type="button" onClick={() => setAddPatientError(null)} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                    placeholder="e.g. John Doe"
                    autoFocus
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={newPatientDob}
                      onChange={(e) => setNewPatientDob(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                      required
                    >
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                    placeholder="e.g. (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-400 text-white py-3 rounded-xl font-medium transition-colors shadow-sm"
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 pb-[calc(1rem+env(safe-area-inset-bottom,1rem))] pt-4 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'patients' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Patients</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
      </div>
    </div>
  );
}

function DesktopNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
        active ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function NewConsultationScreen({ patient, onCancel }: { patient: { id: string, name: string }, onCancel: () => void }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'prep' | 'recording' | 'paused' | 'processing' | 'review' | 'saving' | 'success'>('prep');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setUploadError(null);
    setMicError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('network/offline');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          if (!navigator.onLine) {
            throw new Error('network/offline');
          }
          
          setProcessingStep(0);
          setUploadError(null);
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          setProcessingStep(1); 
          
          // Timeout implementation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          setProcessingStep(2);
          const data = await response.json();
          
          if (data.notes) {
            setNotes(data.notes);
            setDraftNotes(data.notes);
          } else {
            throw new Error('Transcription failed to produce notes.');
          }
          
          setProcessingStep(3);
        } catch (error: any) {
          console.error("Transcription failed:", error);
          if (error.name === 'AbortError') {
            setUploadError("Transcription timed out. Please try again or use a shorter recording.");
          } else {
            setUploadError(error.message || "Transcription failed. Please try again.");
          }
          setProcessingStep(-1);
        }
      };

      mediaRecorder.start();
      setRecordingStatus('recording');
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.message === 'network/offline') {
        setMicError("No internet connection. Please check your network and try again.");
      } else {
        setMicError("Microphone permission denied or failed to initialize.");
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
    setRecordingStatus('processing');
  };
  
  const defaultNotes = {
    chiefComplaint: "Patient reports a persistent dry cough and mild shortness of breath lasting for the past 5 days.",
    history: "The patient noted the cough started gradually and has worsened at night. Denies fever, chills, or chest pain. No recent travel. Has a history of mild seasonal allergies, currently managed with OTC antihistamines.",
    observations: "Patient appears comfortable and in no acute distress. Vitals: BP 120/80, HR 78, Temp 98.6°F, SpO2 98% on room air. Lungs are clear to auscultation bilaterally. No wheezing or rhonchi.",
    assessment: "1. Acute bronchitis, likely viral in origin.\n2. Seasonal allergic rhinitis (stable).",
    plan: "- Supportive care for bronchitis (hydration, rest).\n- Prescribed Tessalon Perles 100mg TID PRN for severe cough.\n- Continue current OTC antihistamines for allergies.\n- Return to clinic if symptoms worsen or fail to improve after 7-10 days.",
    followUp: "Schedule a follow-up appointment in 2 weeks if symptoms persist, or sooner if breathing difficulties develop."
  };
  
  const [notes, setNotes] = useState(defaultNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [draftNotes, setDraftNotes] = useState(defaultNotes);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<'cancel_edit' | 'close_screen' | null>(null);

  const handleApproveAndSave = async () => {
    if (!auth.currentUser) return;
    setSaveError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('network/offline');
      }

      setRecordingStatus('saving');
      
      await addDoc(collection(db, 'consultations'), {
        userId: auth.currentUser.uid,
        patientId: patient.id,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: 'Consultation',
        summary: notes.chiefComplaint,
        fullNotes: notes,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'patients', patient.id), {
        lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      setRecordingStatus('success');
      
      setTimeout(() => {
        setRecordingStatus('prep');
        setProcessingStep(0);
        onCancel();
      }, 2500);
    } catch (err: any) {
      console.error("Error saving consultation:", err);
      if (err.message === 'network/offline') {
        setSaveError("No internet connection. Please try again.");
      } else {
        setSaveError("Failed to save consultation. Please check database permissions or try again.");
      }
      setRecordingStatus('review');
    }
  };

  const handleClose = () => {
    if (isEditing && JSON.stringify(notes) !== JSON.stringify(draftNotes)) {
      setPendingAction('close_screen');
      setShowUnsavedWarning(true);
    } else {
      setRecordingStatus('prep');
      setProcessingStep(0);
      onCancel();
    }
  };

  const handleCancelEdit = () => {
    if (JSON.stringify(notes) !== JSON.stringify(draftNotes)) {
      setPendingAction('cancel_edit');
      setShowUnsavedWarning(true);
    } else {
      setIsEditing(false);
    }
  };

  const confirmDiscard = () => {
    setShowUnsavedWarning(false);
    if (pendingAction === 'cancel_edit') {
      setIsEditing(false);
      setDraftNotes(notes);
    } else if (pendingAction === 'close_screen') {
      setRecordingStatus('prep');
      setProcessingStep(0);
      onCancel();
    }
  };

  const saveEdits = () => {
    setNotes(draftNotes);
    setIsEditing(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingStatus === 'recording') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordingStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (recordingStatus === 'processing') {
    const steps = [
      { title: 'Finalizing Audio', icon: Mic },
      { title: 'Transcribing Audio', icon: FileText },
      { title: 'Structuring AI Notes', icon: Sparkles },
      { title: 'Ready for Review', icon: ClipboardCheck }
    ];

    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 mt-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900 mb-10">Processing Consultation</h2>
        
        <div className="w-full max-w-sm space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = processingStep > idx;
            const isCurrent = processingStep === idx;
            const isPending = processingStep >= 0 && processingStep < idx;
            const isError = processingStep === -1;
            const Icon = step.icon;

            return (
              <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isPending || isError ? 'opacity-40' : 'opacity-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                  isCompleted ? 'bg-teal-50 text-teal-600' : 
                  isCurrent ? 'bg-slate-900 text-white shadow-md' : 
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : 
                   isCurrent && !isError ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                   <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium transition-colors duration-500 ${
                    isCompleted || (isCurrent && !isError) ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {uploadError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm w-full max-w-sm text-center">
            {uploadError}
            <div className="mt-3 flex gap-2 justify-center">
              <button 
                onClick={() => setRecordingStatus('prep')} 
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Discard & Retry
              </button>
              {/* To retry upload we would need to extract the onstop logic, but resetting is cleaner for now */}
            </div>
          </div>
        )}

        {/* Finish Button */}
        <div className={`mt-12 transition-all duration-500 ${
          processingStep === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <button 
            onClick={() => { setRecordingStatus('review'); }} 
            className="bg-teal-500 hover:bg-teal-400 text-white py-3 px-8 rounded-2xl font-medium transition-colors shadow-sm flex items-center"
          >
            Review Notes
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  if (recordingStatus === 'review') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6 max-w-3xl mx-auto pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Consultation Notes</h2>
          <button onClick={handleClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Warning Banner */}
        {!isEditing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm tracking-wide uppercase mb-1">AI Draft — Doctor Review Required</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                These notes were generated automatically from the audio recording. Please review carefully and make any necessary corrections before saving to the patient&apos;s official record.
              </p>
            </div>
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 shadow-sm text-red-800">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Unsaved Warning Dialog */}
        {showUnsavedWarning && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Discard changes?</h3>
              <p className="text-slate-500 mb-6">You have unsaved edits. Are you sure you want to discard them?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowUnsavedWarning(false)} className="px-4 py-2 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Keep Editing</button>
                <button onClick={confirmDiscard} className="px-4 py-2 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">Discard</button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Content */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-6 space-y-8">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Chief Complaint
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.chiefComplaint}
                onChange={e => setDraftNotes({...draftNotes, chiefComplaint: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.chiefComplaint}</p>
            )}
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              History
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.history}
                onChange={e => setDraftNotes({...draftNotes, history: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[120px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.history}</p>
            )}
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Observations
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.observations}
                onChange={e => setDraftNotes({...draftNotes, observations: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[120px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.observations}</p>
            )}
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Assessment
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.assessment}
                onChange={e => setDraftNotes({...draftNotes, assessment: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.assessment}</p>
            )}
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Plan
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.plan}
                onChange={e => setDraftNotes({...draftNotes, plan: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[140px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.plan}</p>
            )}
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              Follow-up
            </h4>
            {isEditing ? (
              <textarea 
                value={draftNotes.followUp}
                onChange={e => setDraftNotes({...draftNotes, followUp: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y transition-shadow"
              />
            ) : (
              <p className="text-slate-900 leading-relaxed whitespace-pre-line">{notes.followUp}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditing ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button onClick={handleCancelEdit} className="px-6 py-4 rounded-2xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
              Cancel
            </button>
            <button onClick={saveEdits} className="px-8 py-4 rounded-2xl font-medium bg-teal-500 text-white hover:bg-teal-400 transition-colors shadow-sm shadow-teal-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" />
              Save Changes
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button onClick={() => { setIsEditing(true); setDraftNotes(notes); }} className="px-6 py-4 rounded-2xl font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 mr-2 text-slate-400" />
              Edit Notes
            </button>
            <button onClick={handleApproveAndSave} className="px-8 py-4 rounded-2xl font-medium bg-teal-500 text-white hover:bg-teal-400 transition-colors shadow-sm shadow-teal-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" />
              Approve & Save
            </button>
          </div>
        )}
      </div>
    );
  }

  if (recordingStatus === 'saving') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 mt-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
        <Loader2 className="w-16 h-16 text-teal-500 animate-spin mb-6" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Saving Consultation</h3>
        <p className="text-slate-500 text-center max-w-sm">
          Securely saving the consultation notes and updating the patient's record in your database...
        </p>
      </div>
    );
  }

  if (recordingStatus === 'success') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 mt-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">Saved Successfully</h3>
        <p className="text-slate-500 text-center max-w-sm">
          The consultation has been added to {patient.name}'s official record.
        </p>
      </div>
    );
  }

  if (recordingStatus === 'recording' || recordingStatus === 'paused') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 mt-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
        
        {/* Visualizer / Pulser */}
        <div className="relative flex items-center justify-center mb-12 mt-8">
          {recordingStatus === 'recording' && (
            <>
              <div className="absolute w-48 h-48 md:w-64 md:h-64 bg-red-500/20 rounded-full animate-ping" style={{ animationDuration: '2.5s' }}></div>
              <div className="absolute w-36 h-36 md:w-48 md:h-48 bg-red-500/30 rounded-full animate-pulse"></div>
            </>
          )}
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${
            recordingStatus === 'recording' ? 'bg-red-500 shadow-xl shadow-red-500/40 scale-110' : 'bg-slate-100 scale-100'
          }`}>
            <Mic className={`w-10 h-10 md:w-14 md:h-14 transition-colors duration-500 ${recordingStatus === 'recording' ? 'text-white' : 'text-slate-400'}`} />
          </div>
        </div>

        {/* Timer & Status */}
        <div className="text-center mb-16">
          <h2 className="text-6xl font-light text-slate-900 tracking-tight tabular-nums mb-4">{formatTime(timeElapsed)}</h2>
          <div className="flex items-center justify-center gap-2">
            {recordingStatus === 'recording' ? (
              <>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-500 font-medium tracking-wide uppercase text-sm">Recording in progress</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-amber-600 font-medium tracking-wide uppercase text-sm">Paused</span>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 md:gap-8">
          <button 
            onClick={() => { setRecordingStatus('prep'); setTimeElapsed(0); onCancel(); }} 
            className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="Cancel"
          >
            <X className="w-6 h-6 md:w-7 md:h-7" />
          </button>
          
          {recordingStatus === 'recording' ? (
            <button 
              onClick={pauseRecording} 
              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-all shadow-sm"
              title="Pause"
            >
              <Pause className="w-7 h-7 md:w-9 md:h-9" />
            </button>
          ) : (
            <button 
              onClick={resumeRecording} 
              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 transition-all shadow-sm"
              title="Resume"
            >
              <Play className="w-7 h-7 md:w-9 md:h-9 ml-1" />
            </button>
          )}

          <button 
            onClick={stopRecording} 
            className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20"
            title="Stop & Save"
          >
            <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6 max-w-2xl mx-auto">
      
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8 text-center">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mic className="w-10 h-10 text-teal-600" />
        </div>
        
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Ready to Record</h2>
        <p className="text-slate-500 mb-8">
          You are about to start a new consultation session for <span className="font-semibold text-slate-700">{patient.name}</span>. 
          The audio will be securely processed to generate your clinical notes.
        </p>

        {/* Consent Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-8 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Patient Consent Required</h3>
            <p className="text-sm text-amber-800 leading-relaxed mb-4">
              Before recording, you must obtain explicit verbal or written consent from the patient to capture and process this audio for clinical documentation purposes.
            </p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${consentGiven ? 'bg-amber-600 border-amber-600' : 'border-amber-300 bg-white group-hover:border-amber-400'}`}>
                {consentGiven && <Check className="w-4 h-4 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={consentGiven}
                onChange={() => setConsentGiven(!consentGiven)}
              />
              <span className="text-sm font-medium text-amber-900">I have obtained consent from this patient</span>
            </label>
          </div>
        </div>

        {micError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex justify-between items-center text-left">
            <span>{micError}</span>
            <button onClick={() => setMicError(null)} className="text-red-500 hover:text-red-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onCancel}
            className="px-6 py-4 rounded-2xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!consentGiven}
            onClick={startRecording}
            className={`px-8 py-4 rounded-2xl font-medium flex items-center justify-center transition-all ${
              consentGiven 
                ? 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </button>
        </div>
      </div>

    </div>
  );
}

function PatientDetails({ patient, onStartConsultation, onGoBack }: { patient: { id: string, name: string, dob: string, gender?: string, phone?: string, lastVisit: string }, onStartConsultation: () => void, onGoBack: () => void }) {
  const [viewingNotes, setViewingNotes] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(patient.name);
  const [editDob, setEditDob] = useState(patient.dob);
  const [editGender, setEditGender] = useState(patient.gender || '');
  const [editPhone, setEditPhone] = useState(patient.phone || '');

  useEffect(() => {
    // Reset state if patient changes
    setEditName(patient.name);
    setEditDob(patient.dob);
    setEditGender(patient.gender || '');
    setEditPhone(patient.phone || '');
  }, [patient]);

  useEffect(() => {
    if (!auth.currentUser || !patient.id) return;
    
    const q = query(
      collection(db, 'consultations'),
      where('userId', '==', auth.currentUser.uid),
      where('patientId', '==', patient.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const h = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHistory(h);
    });

    return () => unsubscribe();
  }, [patient.id]);

  const handleUpdate = async () => {
     try {
       if (!navigator.onLine) throw new Error('network/offline');
       await updateDoc(doc(db, 'patients', patient.id), {
          name: editName,
          dob: editDob,
          gender: editGender,
          phone: editPhone
       });
       setIsEditing(false);
     } catch (e: any) { 
       console.error(e); 
       if (e.message === 'network/offline') alert("No internet connection. Please check your network and try again.");
       else alert("Failed to update patient details. Please try again.");
     }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this patient? Consultations will remain attached to this deleted record ID.")) {
      try {
        if (!navigator.onLine) throw new Error('network/offline');
        await deleteDoc(doc(db, 'patients', patient.id));
        onGoBack();
      } catch(e: any) { 
        console.error(e); 
        if (e.message === 'network/offline') alert("No internet connection. Please try again.");
        else alert("Failed to delete patient. Please try again.");
      }
    }
  }

  if (viewingNotes) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6 max-w-3xl mx-auto pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewingNotes(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{viewingNotes.date} — {viewingNotes.type}</h2>
              <p className="text-sm text-slate-500">{patient.name}</p>
            </div>
          </div>
        </div>

        {/* Notes Content */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-6 space-y-8">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chief Complaint</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.chiefComplaint}</p>
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">History</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.history}</p>
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observations</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.observations}</p>
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assessment</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.assessment}</p>
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Plan</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.plan}</p>
          </div>
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Follow-up</h4>
            <p className="text-slate-900 leading-relaxed whitespace-pre-line">{viewingNotes.fullNotes?.followUp}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
      
      {/* Patient Info Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
        <div className="flex justify-end gap-2 mb-4">
           {isEditing ? (
             <>
               <button onClick={handleUpdate} className="text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg">Save</button>
               <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg">Cancel</button>
             </>
           ) : (
             <>
               <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Edit</button>
               <button onClick={handleDelete} className="text-sm font-medium text-red-500 hover:text-red-700 ml-2">Delete</button>
             </>
           )}
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-3xl shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
            {isEditing ? (
              <>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs text-slate-400 mb-1">Name</p>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Date of Birth</p>
                  <input type="text" value={editDob} onChange={e => setEditDob(e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Gender</p>
                  <input type="text" value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Phone</p>
                  <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2 md:col-span-1 hidden md:block">
                  <p className="text-xs text-slate-400 mb-1">Name</p>
                  <p className="font-medium text-slate-900">{patient.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Date of Birth</p>
                  <p className="font-medium text-slate-900">{patient.dob}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Gender</p>
                  <p className="font-medium text-slate-900">{patient.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Phone</p>
                  <p className="font-medium text-slate-900">{patient.phone || 'Not specified'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-slate-900/10 mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-medium mb-1">New Consultation</h2>
            <p className="text-slate-300 text-sm">Start recording a new encounter for {patient.name.split(' ')[0]}.</p>
          </div>
          <button 
            onClick={onStartConsultation}
            className="bg-teal-500 hover:bg-teal-400 text-white py-3 px-6 rounded-2xl flex items-center justify-center font-medium transition-colors shadow-sm shrink-0"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
      </div>

      {/* Consultation History */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Consultation History</h3>
        
        {history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
            <p className="text-slate-500">No consultations recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => setViewingNotes(item)}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition-colors cursor-pointer shadow-sm group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.type}</h4>
                      <p className="text-sm text-slate-500">{item.date}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors mt-2" />
                </div>
                <p className="text-slate-600 text-sm mt-3 ml-13 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
