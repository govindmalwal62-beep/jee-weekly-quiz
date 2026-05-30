/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  Clock, 
  Database, 
  HelpCircle, 
  Lock, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles, 
  Trophy, 
  User,
  ExternalLink,
  Info
} from 'lucide-react';
import { Question, SubjectType } from './types';
import { INITIAL_QUESTIONS } from './data';
import StudentQuiz from './components/StudentQuiz';
import QuizResults from './components/QuizResults';
import AdminPanel from './components/AdminPanel';

// Firebase imports
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  getDocFromServer,
  setDoc, 
  collection, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import Auth from './components/Auth';

export default function App() {
  // ================= GENERAL CONFIGS & PERSIST_STATES =================
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('jee_quiz_questions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved questions, fallback to defaults.', e);
      }
    }
    return INITIAL_QUESTIONS;
  });

  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('jee_quiz_duration');
    return saved ? parseInt(saved) : 60; // 60 minutes default
  });

  // STUDENT CHOICE STATE
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('jee_quiz_answers');
    return saved ? JSON.parse(saved) : {};
  });

  // SCREEN CONTROLLER STATE
  const [currentScreen, setCurrentScreen] = useState<'home' | 'quiz' | 'result' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.hash === '#admin') {
      return 'admin';
    }
    const savedSubmitted = localStorage.getItem('jee_quiz_submitted');
    if (savedSubmitted === 'true') {
      return 'result';
    }
    const savedStarted = localStorage.getItem('jee_quiz_started');
    if (savedStarted === 'true') {
      return 'quiz';
    }
    return 'home';
  });

  // ACTIVE SCREEN NAVIGATION (PCM TABS & IN-TAB INDICES)
  const [activeSection, setActiveSection] = useState<SubjectType>('physics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<Record<SubjectType, number>>({
    physics: 0,
    chemistry: 0,
    maths: 0
  });

  // TIME REMAINING STATE
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    const savedTime = localStorage.getItem('jee_quiz_time_remaining');
    if (savedTime) {
      return parseInt(savedTime);
    }
    return examDurationMinutes * 60;
  });

  // CANDIDATE PROFILE REGISTER (DYNAMICALLY DRIVEN BY FIREBASE AUTH)
  const [candidateName, setCandidateName] = useState('');

  // FIREBASE USER HOOKS & ATTEMPTS HOOKS
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);

  // AUTH GUARANTEE CONTROL LAYER
  const activeScreenToShow = user ? currentScreen : 'home';

  // CONFIRMATION DIALOG STATES
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ================= CACHE KEEP-ALIVE LISTENERS =================
  useEffect(() => {
    localStorage.setItem('jee_quiz_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('jee_quiz_duration', examDurationMinutes.toString());
  }, [examDurationMinutes]);

  useEffect(() => {
    localStorage.setItem('jee_quiz_answers', JSON.stringify(selectedAnswers));
  }, [selectedAnswers]);

  // FIREBASE AUTH EVENT LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setCandidateName(currentUser.displayName || currentUser.email || 'STUDENT_CANDIDATE');
      } else {
        setCandidateName('');
      }
    });
    return () => unsubscribe();
  }, []);

  // FIRESTORE SYNC ACTIVE QUIZ QUESTIONS
  useEffect(() => {
    if (!user) return;

    const quizDocRef = doc(db, 'quizzes', 'week_1');
    const unsubscribe = onSnapshot(quizDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quizzes/week_1');
    });

    return () => unsubscribe();
  }, [user]);

  // FIRESTORE RETRIEVE Student Attempts with local sorting to bypass index requirement
  useEffect(() => {
    if (!user) {
      setPreviousAttempts([]);
      return;
    }

    const q = query(
      collection(db, 'results'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attempts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAtDate: data.submittedAt ? data.submittedAt.toDate() : new Date()
        };
      });
      // Sort locally by date desc
      attempts.sort((a, b) => b.submittedAtDate.getTime() - a.submittedAtDate.getTime());
      setPreviousAttempts(attempts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
    });

    return () => unsubscribe();
  }, [user]);

  // Auto seed default data if logged in as the Admin and the quiz record is vacant
  useEffect(() => {
    const seedDefaultData = async () => {
      if (user && user.email === 'govindmalwal62@gmail.com') {
        try {
          const quizDocRef = doc(db, 'quizzes', 'week_1');
          const snap = await getDocFromServer(quizDocRef);
          if (!snap.exists()) {
            await setDoc(quizDocRef, {
              quizId: 'week_1',
              title: 'JEE Main Practice Paper',
              week: 'Week 1',
              questions: INITIAL_QUESTIONS
            });
            console.log("Firestore successfully seeded with default questions bundle.");
          }
        } catch (err) {
          console.warn("Dynamic default questions seeding deferred:", err);
        }
      }
    };
    seedDefaultData();
  }, [user]);

  // ACTIVE COUNTDOWN CLOCK EFFECT
  useEffect(() => {
    if (activeScreenToShow === 'quiz') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          const nextVal = prev - 1;
          localStorage.setItem('jee_quiz_time_remaining', nextVal.toString());
          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeScreenToShow]);

  // SCORING EVALUATION UTILITY
  const getSectionScore = (subject: SubjectType) => {
    let score = 0;
    questions.forEach(q => {
      if (q.subject === subject) {
        const userChoice = selectedAnswers[q.id];
        if (userChoice !== undefined) {
          if (userChoice === q.correctAnswer) score += 4;
          else score -= 1;
        }
      }
    });
    return score;
  };

  // AUTO SUBMIT TRIGGER
  const handleAutoSubmitOnTimeout = async () => {
    if (user) {
      const pScore = getSectionScore('physics');
      const cScore = getSectionScore('chemistry');
      const mScore = getSectionScore('maths');
      const totalScore = pScore + cScore + mScore;

      const resultDocRef = doc(collection(db, 'results'));
      try {
        await setDoc(resultDocRef, {
          uid: user.uid,
          quizId: 'week_1',
          score: totalScore,
          physicsScore: pScore,
          chemistryScore: cScore,
          mathsScore: mScore,
          submittedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `results/${resultDocRef.id}`);
      }
    }

    localStorage.setItem('jee_quiz_submitted', 'true');
    localStorage.removeItem('jee_quiz_started');
    setCurrentScreen('result');
    alert('TIME END WARNING: Your allotted exam period has completed. Your current choices have been automatically locked and submitted for evaluations.');
  };

  // STANDARD FORM SUBMISSION BY USER
  const handleUserSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (user) {
      const pScore = getSectionScore('physics');
      const cScore = getSectionScore('chemistry');
      const mScore = getSectionScore('maths');
      const totalScore = pScore + cScore + mScore;

      const resultDocRef = doc(collection(db, 'results'));
      try {
        await setDoc(resultDocRef, {
          uid: user.uid,
          quizId: 'week_1',
          score: totalScore,
          physicsScore: pScore,
          chemistryScore: cScore,
          mathsScore: mScore,
          submittedAt: serverTimestamp()
        });
        console.log('Results saved successfully to Firestore.');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `results/${resultDocRef.id}`);
      }
    }

    localStorage.setItem('jee_quiz_submitted', 'true');
    localStorage.removeItem('jee_quiz_started');
    setCurrentScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SYSTEM ATTEMPT SHIFT AND CLEAR - RETAKE EXAM
  const handleRestartQuiz = () => {
    setShowRestartConfirm(true);
  };

  const executeRestartQuiz = async () => {
    // Reload questions from Firestore for the retake
    try {
      const quizDocRef = doc(db, 'quizzes', 'week_1');
      const snap = await getDocFromServer(quizDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      }
    } catch (err) {
      console.warn("Failed force-reloading questions on retake:", err);
    }

    setSelectedAnswers({});
    const baseTime = examDurationMinutes * 60;
    setTimeRemaining(baseTime);
    setActiveSection('physics');
    setCurrentQuestionIndex({ physics: 0, chemistry: 0, maths: 0 });
    
    localStorage.setItem('jee_quiz_answers', '{}');
    localStorage.setItem('jee_quiz_time_remaining', baseTime.toString());
    localStorage.setItem('jee_quiz_started', 'true');
    localStorage.removeItem('jee_quiz_submitted');
    setCurrentScreen('quiz');
    setShowRestartConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // STUDENT SESSION LOGOUT
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    try {
      await signOut(auth);
      
      setSelectedAnswers({});
      setTimeRemaining(3600);
      setExamDurationMinutes(60);
      setActiveSection('physics');
      setCurrentQuestionIndex({ physics: 0, chemistry: 0, maths: 0 });
      setCandidateName('');
      
      localStorage.setItem('jee_quiz_answers', '{}');
      localStorage.setItem('jee_quiz_time_remaining', '3600');
      localStorage.setItem('jee_quiz_duration', '60');
      localStorage.removeItem('jee_quiz_started');
      localStorage.removeItem('jee_quiz_submitted');
      setCurrentScreen('home');
      setShowLogoutConfirm(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // DYNAMIC TIMER UPDATE BY MAKER
  const handleUpdateDuration = (mins: number) => {
    setFormDurationMinutes(mins);
  };

  const setFormDurationMinutes = (mins: number) => {
    setExamDurationMinutes(mins);
    if (activeScreenToShow === 'home') {
      setTimeRemaining(mins * 60);
    }
  };

  // FULL DATABASE RESET TO PRISTINE QUESTIONS
  const handleFullQuestionsReset = () => {
    setShowResetConfirm(true);
  };

  const executeFullQuestionsReset = async () => {
    setQuestions(INITIAL_QUESTIONS);
    setExamDurationMinutes(60);
    setTimeRemaining(3600);
    setSelectedAnswers({});

    // Save default mock questions to firestore quizzes
    const quizDocRef = doc(db, 'quizzes', 'week_1');
    try {
      await setDoc(quizDocRef, {
        quizId: 'week_1',
        title: 'JEE Main Practice Paper',
        week: 'Week 1',
        questions: INITIAL_QUESTIONS
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quizzes/week_1');
    }

    localStorage.removeItem('jee_quiz_submitted');
    localStorage.removeItem('jee_quiz_answers');
    localStorage.removeItem('jee_quiz_started');
    localStorage.setItem('jee_quiz_questions', JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem('jee_quiz_duration', '60');
    localStorage.setItem('jee_quiz_time_remaining', '3600');
    setShowResetConfirm(false);
    setShowResetSuccess(true);
  };

  // SELECT AND UPDATE CHOICE
  const handleSelectAnswer = (qId: string, optionIndex: number | null) => {
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      if (optionIndex === null) {
        delete copy[qId];
      } else {
        copy[qId] = optionIndex;
      }
      return copy;
    });
  };

  const handleStartExam = () => {
    localStorage.setItem('jee_quiz_candidate', candidateName);
    localStorage.setItem('jee_quiz_started', 'true');
    localStorage.setItem('jee_quiz_time_remaining', timeRemaining.toString());
    setCurrentScreen('quiz');
  };

  // ADMIN PERSISTENT MODIFIER SYNC HANDLER
  const handleUpdateQuestions = async (updatedQuestions: Question[]) => {
    setQuestions(updatedQuestions);
    
    const quizDocRef = doc(db, 'quizzes', 'week_1');
    try {
      await setDoc(quizDocRef, {
        quizId: 'week_1',
        title: 'JEE Main Practice Paper',
        week: 'Week 1',
        questions: updatedQuestions
      });
      console.log('Quiz synchronized to Firestore.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quizzes/week_1');
    }
  };

  // STATISTICS LABELS FOR HEADS-UP DISPLAY
  const totalQuestionsCount = questions.length;
  const physicsCount = questions.filter(q => q.subject === 'physics').length;
  const chemistryCount = questions.filter(q => q.subject === 'chemistry').length;
  const mathsCount = questions.filter(q => q.subject === 'maths').length;

  // Render a tiny elegant loading bar if the session auth registration states are pending
  if (authLoading) return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center font-mono">
      <div className="w-8 h-8 border-t-2 border-cyan-400 rounded-full animate-spin mb-3"></div>
      <div className="text-xs text-slate-500 uppercase tracking-widest animate-pulse">Initializing Security Layers...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between" id="app-root-deck">
      
      {/* ================= PAGE CONTAINER AND HEADERS ================= */}
      <main className="flex-grow">
        
        {/* ================= HOME SCREEN: LOBBY & RULES ================= */}
        {activeScreenToShow === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-4xl mx-auto px-4 md:px-6 py-12"
            id="home-landing-page"
          >
            {/* HERO BADGE & HEADER DESIGN */}
            <div className="text-center mb-10" id="brand-splash">
              <span className="text-xs font-mono text-cyan-450 font-bold uppercase tracking-widest bg-cyan-950/40 px-3 py-1.5 border border-cyan-800/40 rounded-full inline-block mb-4 hover:border-cyan-500/30 transition-all">
                National Exam Practice Lab
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                JEE Main Practice Simulator
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Computer Based Test (CBT) environment fully compliant with actual syllabus patterns & question structures.
              </p>
            </div>

            {/* QUICK METRICS DOCK CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8" id="quick-metrics-dock">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_4px_20px_rgba(6,182,212,0.1)] hover:-translate-y-0.5">
                <BoxIcon iconName="Sparkles" />
                <h3 className="text-2xl font-extrabold font-mono text-cyan-400 mt-3">{totalQuestionsCount} Premium PYQs</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Equally distributed subjects ({physicsCount}P, {chemistryCount}C, {mathsCount}M)</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_4px_20px_rgba(6,182,212,0.1)] hover:-translate-y-0.5">
                <BoxIcon iconName="Clock" />
                <h3 className="text-2xl font-extrabold font-mono text-cyan-400 mt-3">{examDurationMinutes} Min Timer</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Automatic system submission countdown</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center transition-all duration-300 hover:border-cyan-500/20 hover:shadow-[0_4px_20px_rgba(6,182,212,0.1)] hover:-translate-y-0.5">
                <BoxIcon iconName="Award" />
                <h3 className="text-2xl font-extrabold font-mono text-cyan-400 mt-3">+4 / -1 Marking</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Accurate JEE scoring standard active</p>
              </div>
            </div>

            {/* SYLLABUS AND EXAMINATION RULES BOX */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 mb-8" id="syllabus-rules-board">
              <h2 className="text-sm font-bold tracking-wider text-slate-205 flex items-center gap-2 mb-4 uppercase font-mono border-b border-slate-800 pb-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                OFFICIAL CBT PRACTICE INSTRUCTIONS
              </h2>
              
              <ul className="text-xs md:text-sm text-slate-300 space-y-4 leading-relaxed font-normal" id="rules-numbered">
                <li className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 mt-0.5 shadow-sm">1</div>
                  <span>This comprehensive simulated exam package includes the core PCM hierarchy: <strong>Physics (P1-P5)</strong>, <strong>Chemistry (C1-C5)</strong>, and <strong>Mathematics (M1-M5)</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 mt-0.5 shadow-sm">2</div>
                  <span>You are permitted to switch between subjects freely at any given point during the exam duration using the subject section buttons at the top of the interface.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 mt-0.5 shadow-sm">3</div>
                  <span>Each question contains <strong>Exactly 1 Correct Option</strong>. Checking any option registers the option instantly. Clear Response restarts the selection.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 mt-0.5 shadow-sm">4</div>
                  <span>A warning system will alert you when there are only <strong>5 Minutes Left</strong> in the active countdown clock at the top, highlighted inside dark red pulsing.</span>
                </li>
              </ul>
            </div>

            {/* CANDIDATE INITIATION MODULE */}
            {user ? (
              <div className="space-y-6 max-w-md mx-auto" id="logged-in-student-dashboard">
                <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 relative overflow-hidden flex flex-col items-center text-center shadow-lg hover:border-cyan-500/30 transition-all">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                  
                  <div className="w-12 h-12 rounded-full bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center mb-3 text-cyan-400">
                    <User className="w-6 h-6" />
                  </div>
                  
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                    {user.displayName || 'Candidate Standard'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mb-6">{user.email}</p>

                  <div className="w-full flex gap-3">
                    <button
                      onClick={handleLogout}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 py-3 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer active:translate-y-0.5"
                      id="btn-lobby-logout"
                    >
                      Sign Out
                    </button>
                    <button
                      onClick={handleStartExam}
                      className="flex-[2] bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 border border-cyan-400/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] text-slate-950 font-extrabold uppercase py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-mono tracking-wider active:translate-y-0.5"
                      id="btn-initialize-cbt"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                      START EXAMINATION
                    </button>
                  </div>
                </div>

                {/* PREVIOUS ATTEMPTS SCORECARD */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5" id="previous-attempts-panel">
                  <h3 className="text-xs font-bold font-mono text-cyan-450 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-900 pb-3">
                    <Award className="w-4 h-4" />
                    Historic Attempt Log
                  </h3>

                  {previousAttempts.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-medium" id="empty-attempts-state">
                      No previous attempts logged. Take your first practice exam to build historical analytics!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1" id="attempts-list">
                      {previousAttempts.map((attempt, index) => {
                        const dateText = attempt.submittedAtDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <div 
                            key={attempt.id} 
                            className="bg-slate-950/60 border border-slate-900/60 hover:border-cyan-900/30 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
                          >
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">
                                Attempt #{previousAttempts.length - index} • {dateText}
                              </span>
                              <div className="flex gap-3 text-[10px] font-mono text-slate-400">
                                <span>P: <span className={attempt.physicsScore >= 0 ? 'text-emerald-400' : 'text-red-400'}>{attempt.physicsScore}</span></span>
                                <span>C: <span className={attempt.chemistryScore >= 0 ? 'text-emerald-400' : 'text-red-400'}>{attempt.chemistryScore}</span></span>
                                <span>M: <span className={attempt.mathsScore >= 0 ? 'text-emerald-400' : 'text-red-400'}>{attempt.mathsScore}</span></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold font-mono text-cyan-400 block">
                                {attempt.score} <span className="text-[10px] text-slate-500 font-normal">/ 60</span>
                              </span>
                              <span className="text-[9px] font-mono uppercase bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/40">
                                COMPLETED
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Auth onAuthSuccess={(u) => setUser(u)} />
            )}
          </motion.div>
        )}

        {/* ================= QUIZ ROOM SCREEN: STUDENT PORTAL ================= */}
        {activeScreenToShow === 'quiz' && (
          <StudentQuiz
            questions={questions}
            selectedAnswers={selectedAnswers}
            onSelectAnswer={handleSelectAnswer}
            timeRemaining={timeRemaining}
            section={activeSection}
            onChangeSection={setActiveSection}
            currentQuestionIndex={currentQuestionIndex}
            onChangeQuestionIndex={(subj, index) => {
              setCurrentQuestionIndex(prev => ({
                ...prev,
                [subj]: index
              }));
            }}
            onSubmit={handleUserSubmit}
            candidateName={candidateName}
            onLogout={handleLogout}
          />
        )}

        {/* ================= ANALYTICS SCREEN: RESULTS PORTAL ================= */}
        {activeScreenToShow === 'result' && (
          <QuizResults
            questions={questions}
            selectedAnswers={selectedAnswers}
            timeRemaining={timeRemaining}
            examDurationMinutes={examDurationMinutes}
            onRestart={handleRestartQuiz}
            onGoToAdmin={() => setCurrentScreen('admin')}
            onGoToHome={() => {
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* ================= THE HIDDEN ADMIN PORTAL SCREEN ================= */}
        {activeScreenToShow === 'admin' && (
          <AdminPanel
            questions={questions}
            onUpdateQuestions={setQuestions}
            onResetQuestions={handleFullQuestionsReset}
            examDurationMinutes={examDurationMinutes}
            onUpdateDuration={handleUpdateDuration}
            onClose={() => {
              // Standard route exit behavior
              const isSubmitted = localStorage.getItem('jee_quiz_submitted') === 'true';
              if (isSubmitted) {
                setCurrentScreen('result');
              } else {
                setCurrentScreen('home');
              }
            }}
          />
        )}

        {/* ================= MODAL ANIMA-PRESENCE DIALOGS ================= */}
        <AnimatePresence>
          {/* RETAKE EXAM CONFIRMATION DIALOG */}
          {showRestartConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="restart-confirm-modal">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 md:p-8 text-center text-slate-100 border border-cyan-500/30"
              >
                <div className="w-16 h-16 bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <RotateCcw className="w-8 h-8 text-cyan-400" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight mb-2 uppercase font-mono">Retake Practice Exam?</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Are you sure you want to retake this practice exam? This action will:
                </p>

                <div className="bg-slate-950/65 border border-slate-900 rounded-xl p-4.5 mb-6 text-left text-xs space-y-2.5 font-mono text-slate-300" id="restart-features-list">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />
                    <span>Clear all previously recorded answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />
                    <span>Reset exam countdown clock to 1 Hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />
                    <span>Reset item selection index to Question 1</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRestartConfirm(false)}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="restart-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeRestartQuiz}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 border border-cyan-400/50 text-slate-950 py-2.5 rounded-xl text-sm font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="restart-confirm-btn"
                  >
                    Confirm Retake
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* CANDIDATE LOGOUT CONFIRMATION DIALOG */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="logout-confirm-modal">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 md:p-8 text-center text-slate-100 border border-red-500/30"
              >
                <div className="w-16 h-16 bg-red-950/40 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-red-400" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight mb-2 uppercase font-mono">Terminate Candidate Session?</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed font-sans">
                  Are you sure you want to terminate your candidate session? This will reset all current options and log you back to the lobby registration board.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="logout-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeLogout}
                    className="flex-1 bg-red-950 hover:bg-red-905 border border-red-500/50 text-red-50 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="logout-confirm-btn"
                  >
                    Confirm Logout
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ADMIN BANK RESET CONFIRMATION */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="reset-confirm-modal">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 md:p-8 text-center text-slate-100 border border-amber-500/30"
              >
                <div className="w-16 h-16 bg-amber-950/40 text-amber-500 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-amber-500" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight mb-2 uppercase font-mono">Reset Active Question Database?</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed font-sans">
                  Clear custom updates and restore the pristine 15-question verified bank? This will clear active student candidate logs.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="reset-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeFullQuestionsReset}
                    className="flex-1 bg-amber-950 hover:bg-amber-900 border border-amber-500/50 text-amber-300 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                    id="reset-confirm-btn"
                  >
                    Restore Defaults
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ADMIN BANK RESET SUCCESS */}
          {showResetSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="reset-success-modal">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 md:p-8 text-center text-slate-100 border border-emerald-500/30"
              >
                <div className="w-16 h-16 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                
                <h3 className="text-xl font-bold tracking-tight mb-2 uppercase font-mono">Restoration Completed</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed font-sans">
                  The active quiz bank, exam timings, and response parameters have been successfully reverted to the default 15 verifiably accurate questions.
                </p>

                <button
                  onClick={() => setShowResetSuccess(false)}
                  className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                  id="reset-success-btn"
                >
                  Acknowledge
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* ================= GLOBAL SUB-FOOTER WITH HIDDEN PORTALS ================= */}
      <footer className="border-t border-slate-900/50 py-5 bg-[#05080f]/80" id="global-portal-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500" id="footer-inner">
          <div className="font-mono text-[11px]" id="candidate-meta">
            CBT CLIENT VERSION: <span className="text-cyan-600 font-bold">1.2.4-PROD_DECRYPT</span> | UTC: <span className="text-slate-400">2026-05-28</span>
          </div>

          <div className="flex items-center gap-4" id="footer-actions">
            {user && activeScreenToShow !== 'admin' && (
              <button
                onClick={() => setCurrentScreen('admin')}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-900 rounded-lg hover:border-slate-800 text-[10px] text-slate-500 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
                title="Enter Hidden Admin Configuration Suite"
                id="btn-footer-admin-trigger"
              >
                <Lock className="w-3 h-3 text-slate-650 shrink-0" />
                Maker Panel
              </button>
            )}

            <div className="text-slate-500 font-medium">
              Simulation authorized under NTA guidelines
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Visual indicator icon component
function BoxIcon({ iconName }: { iconName: 'Sparkles' | 'Clock' | 'Award' }) {
  const containerStyle = "w-10 h-10 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-center mx-auto mb-2 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
  
  if (iconName === 'Sparkles') return (
    <div className={containerStyle}><Sparkles className="w-5 h-5 text-cyan-400" /></div>
  );
  if (iconName === 'Clock') return (
    <div className={containerStyle}><Clock className="w-5 h-5 text-cyan-400 animate-pulse" /></div>
  );
  return (
    <div className={containerStyle}><Award className="w-5 h-5 text-cyan-400" /></div>
  );
}
