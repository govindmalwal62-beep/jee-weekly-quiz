import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Mail, Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all standard requirements.');
      setLoading(false);
      return;
    }

    if (!isLogin && !name) {
      setError('Please enter your full name for student identification.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // LOGIN Student
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Authentication successful! Handled login for:", userCredential.user.email);
        onAuthSuccess(userCredential.user);
      } else {
        // SIGNUP Student
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update auth profile display name
        await updateProfile(user, { displayName: name });

        // Create user document in firestore
        const userPath = `users/${user.uid}`;
        try {
          await setDoc(doc(db, userPath), {
            uid: user.uid,
            name: name,
            email: email,
            photoURL: '',
            createdAt: serverTimestamp()
          });
          console.log("User document successfully registered in Firestore 'users' collection.");
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, userPath);
        }

        console.log("Authentication successful! Handled student signup for:", user.email);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error("Authentication process failed:", err);
      let customError = 'Invalid email or password.';
      const errorCode = err.code || '';
      const errorMessage = (err.message || '').toLowerCase();

      if (errorCode === 'auth/email-already-in-use') {
        customError = 'This email is already registered. Please login instead.';
      } else if (errorCode === 'auth/user-not-found' || errorMessage.includes('user-not-found') || errorMessage.includes('user not found')) {
        customError = 'User not found.';
      } else if (errorCode === 'auth/wrong-password' || errorMessage.includes('wrong-password') || errorMessage.includes('wrong password')) {
        customError = 'Wrong password.';
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email') || errorMessage.includes('invalid email')) {
        customError = 'Invalid email.';
      } else if (errorCode === 'auth/invalid-credential' || errorMessage.includes('invalid-credential') || errorMessage.includes('invalid credential')) {
        customError = 'Invalid email or password.';
      }
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      console.log("Google Authentication successful! Display name:", user.displayName, "Email:", user.email);

      // Check if user already exists in collection 'users' to avoid overwriting their createdAt timestamp
      const userDocRef = doc(db, `users/${user.uid}`);
      let userExists = false;
      try {
        const docSnap = await getDocFromServer(userDocRef);
        userExists = docSnap.exists();
      } catch (checkErr) {
        console.warn("Failed verifying existing user document, writing update directly:", checkErr);
      }

      if (!userExists) {
        const userPath = `users/${user.uid}`;
        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || 'Google Student',
            email: user.email || '',
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp()
          });
          console.log("New user document successfully registered in Firestore 'users' collection via Google.");
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, userPath);
        }
      } else {
        console.log("Existing user logged in via Google. Firestore document preserved.");
      }

      onAuthSuccess(user);
    } catch (err: any) {
      console.error("Google Authentication process failed:", err);
      let customError = 'Google Sign-In failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        customError = 'Sign-In cancelled. Google popup was closed.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        customError = 'Login cancelled due to another popup open request.';
      } else if (err.message) {
        customError = err.message;
      }
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" id="auth-portal-card">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 md:p-8 border border-cyan-800/20 relative overflow-hidden shadow-lg"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
        
        {/* Toggle tabs */}
        <div className="flex border-b border-slate-800 pb-4 mb-6 gap-2" id="auth-tabs">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all uppercase ${
              isLogin 
                ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-auth-login"
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold transition-all uppercase ${
              !isLogin 
                ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-auth-signup"
          >
            Create Account
          </button>
        </div>

        <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase font-mono mb-4 text-center">
          {isLogin ? 'Enter Credentials' : 'Register New Student Profile'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form-block">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Candidate Full Name</label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 text-slate-550">
                  <User className="w-4 h-4 text-cyan-455" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 text-slate-200 placeholder-slate-700 px-10 py-2.5 rounded-xl text-xs outline-none transition-all"
                  id="auth-input-name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-550">
                <Mail className="w-4 h-4 text-cyan-455" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@domain.com"
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 text-slate-200 placeholder-slate-700 px-10 py-2.5 rounded-xl text-xs outline-none transition-all"
                id="auth-input-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Secure Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-550">
                <Lock className="w-4 h-4 text-cyan-455" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 text-slate-200 placeholder-slate-700 px-10 py-2.5 rounded-xl text-xs outline-none transition-all"
                id="auth-input-password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/45 border border-red-900/35 rounded-xl text-xs font-mono font-bold text-red-400 leading-normal" id="auth-error-output">
              <div className="flex gap-1.5 items-start">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 border border-cyan-400/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] text-slate-950 font-extrabold uppercase py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-mono tracking-wider active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-auth-submit"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>{isLogin ? 'LOG IN & LAUNCH' : 'SIGN UP & LAUNCH'}</span>
              </>
            )}
          </button>

          {/* Centered neon-aligned divider with OR */}
          <div className="relative flex py-2 items-center" id="social-auth-divider">
            <div className="flex-grow border-t border-slate-800/80"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 font-bold tracking-widest">OR</span>
            <div className="flex-grow border-t border-slate-800/80"></div>
          </div>

          {/* Professional Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/45 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer font-mono tracking-wide active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-google-auth-submit"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {/* Official Google Icon SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
