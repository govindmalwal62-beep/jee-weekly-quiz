import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Percent, 
  BarChart3, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Award,
  BookMarked,
  Home,
  Clock,
  Zap,
  Flame,
  Gauge,
  Info,
  Compass,
  HeartCrack,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Question, SubjectType, AnalyticsSummary } from '../types';
import { PRACTICAL_SUGGESTIONS } from '../data';

interface QuizResultsProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  timeRemaining?: number;
  examDurationMinutes?: number;
  onRestart: () => void;
  onGoToAdmin: () => void;
  onGoToHome: () => void;
}

const CHAPTERS_MAPPING: Record<string, { chapter: string; category: string }> = {
  P1: { chapter: 'Projectile Motion', category: 'Kinematics' },
  P2: { chapter: 'Electromagnetic Waves', category: 'Electromagnetism' },
  P3: { chapter: 'Drift Velocity & Current', category: 'Current Electricity' },
  P4: { chapter: 'Young\'s Double Slit (YDSE)', category: 'Wave Optics' },
  P5: { chapter: 'Nuclear Alpha/Beta Decay', category: 'Modern Physics' },
  C1: { chapter: 'Molecular Orbital Theory', category: 'Chemical Bonding' },
  C2: { chapter: 'IUPAC Coordination Complexes', category: 'Inorganic Chemistry' },
  C3: { chapter: 'Carbylamine & Amines', category: 'Organic Chemistry' },
  C4: { chapter: 'Group 15 Hydride Strength', category: 'P-Block Elements' },
  C5: { chapter: 'First-Order Chemicals Half-Life', category: 'Physical Chemistry' },
  M1: { chapter: 'Taylor Series & Limits', category: 'Calculus' },
  M2: { chapter: 'Consistent Matrices Equations', category: 'Algebra' },
  M3: { chapter: 'Bounded Area of Parabola', category: 'Integral Calculus' },
  M4: { chapter: 'Complex Locus & Bisector', category: 'Complex Numbers' },
  M5: { chapter: 'Double Dice Throw Sums', category: 'Probability' }
};

export default function QuizResults({
  questions,
  selectedAnswers,
  timeRemaining = 3600,
  examDurationMinutes = 60,
  onRestart,
  onGoToAdmin,
  onGoToHome
}: QuizResultsProps) {
  
  const [activeReviewTab, setActiveReviewTab] = useState<SubjectType | 'all'>('all');
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // ================= EXAM EVALUATION ENGINE =================
  const evaluateQuiz = (): AnalyticsSummary => {
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    
    const sectionPerformance: Record<SubjectType, {
      total: number;
      attempted: number;
      correct: number;
      score: number;
    }> = {
      physics: { total: 0, attempted: 0, correct: 0, score: 0 },
      chemistry: { total: 0, attempted: 0, correct: 0, score: 0 },
      maths: { total: 0, attempted: 0, correct: 0, score: 0 }
    };

    questions.forEach(q => {
      sectionPerformance[q.subject].total += 1;
      
      const userChoice = selectedAnswers[q.id];
      if (userChoice === undefined) {
        unattemptedCount += 1;
      } else {
        sectionPerformance[q.subject].attempted += 1;
        if (userChoice === q.correctAnswer) {
          correctCount += 1;
          sectionPerformance[q.subject].correct += 1;
          sectionPerformance[q.subject].score += 4;
        } else {
          wrongCount += 1;
          sectionPerformance[q.subject].score -= 1;
        }
      }
    });

    const totalScore = (correctCount * 4) - wrongCount;
    const maxPossibleScore = questions.length * 4;
    const percentage = Math.max(0, Math.round((totalScore / maxPossibleScore) * 100));
    
    const attemptedCount = correctCount + wrongCount;
    const accuracyRate = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    let rankLabel: 'Excellent' | 'Very Good' | 'Average' | 'Needs Improvement' = 'Needs Improvement';
    if (percentage >= 85) rankLabel = 'Excellent';
    else if (percentage >= 65) rankLabel = 'Very Good';
    else if (percentage >= 40) rankLabel = 'Average';

    return {
      totalScore,
      correctCount,
      wrongCount,
      unattemptedCount,
      percentage,
      accuracyRate,
      rankLabel,
      sectionPerformance
    };
  };

  const stats = evaluateQuiz();

  // TIME CALCULATIONS
  const totalAllocatedSeconds = examDurationMinutes * 60;
  const utilizedSeconds = Math.max(0, totalAllocatedSeconds - timeRemaining);
  const minutesUtilized = Math.floor(utilizedSeconds / 60);
  const secondsUtilized = utilizedSeconds % 60;

  const attemptedCount = stats.correctCount + stats.wrongCount;
  const averageSecondsPerQuestion = attemptedCount > 0 ? Math.round(utilizedSeconds / attemptedCount) : 0;

  // CHAPTER ANALYTICS COMPILER
  const correctChapters: string[] = [];
  const weakChapters: string[] = [];
  const skippedChapters: string[] = [];

  questions.forEach(q => {
    const map = CHAPTERS_MAPPING[q.id] || { chapter: q.id, category: q.subject };
    const label = `${map.chapter} (${map.category})`;
    
    const userChoice = selectedAnswers[q.id];
    if (userChoice === undefined) {
      skippedChapters.push(label);
    } else if (userChoice === q.correctAnswer) {
      correctChapters.push(label);
    } else {
      weakChapters.push(label);
    }
  });

  // BEST AND WEAKEST SUBJECT IDENTIFICATION
  const getSubjectScores = () => {
    return (['physics', 'chemistry', 'maths'] as SubjectType[]).map(subj => {
      const p = stats.sectionPerformance[subj];
      const accuracy = p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0;
      return {
        subject: subj,
        score: p.score,
        accuracy,
        total: p.total
      };
    });
  };

  const subjectScores = getSubjectScores();
  const sortedByScore = [...subjectScores].sort((a, b) => b.score - a.score);
  const bestSubjectData = sortedByScore[0];
  const weakestSubjectData = sortedByScore[sortedByScore.length - 1];

  // RANK CONFIGURATION
  const getRankConfig = (rank: string) => {
    switch (rank) {
      case 'Excellent':
        return {
          textColor: 'text-emerald-400',
          gradient: 'from-emerald-500/20 via-cyan-500/10 to-transparent border-emerald-500/40',
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
          badge: 'bg-emerald-950 text-emerald-400 border-emerald-500/50',
          tag: '🚀 TOP 1% COHORT LEVEL'
        };
      case 'Very Good':
        return {
          textColor: 'text-cyan-400',
          gradient: 'from-cyan-500/20 via-indigo-500/10 to-transparent border-cyan-500/40',
          glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-500/50',
          tag: '⚡ VERY GOOD • 98+ PERCENTILE BASELINE'
        };
      case 'Average':
        return {
          textColor: 'text-amber-400',
          gradient: 'from-amber-500/20 via-yellow-500/15 to-transparent border-amber-500/40',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-950 text-amber-300 border-amber-500/50',
          tag: '📈 STABLE STANDING • NEEDS REVISION HOUR'
        };
      default:
        return {
          textColor: 'text-red-400',
          gradient: 'from-red-500/20 via-rose-500/10 to-transparent border-red-500/40',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
          badge: 'bg-red-950 text-red-300 border-red-500/50',
          tag: '⚠️ FOCUS MANDATED • REBUILD BASIC TEXTS'
        };
    }
  };

  const rankUi = getRankConfig(stats.rankLabel);

  const getRankMotivation = (rank: string) => {
    switch (rank) {
      case 'Excellent':
        return 'Sensational outcome. Your core logical mastery and spatial formulation across PCM is ready for IIT level entrance. Keep tuning peak speed.';
      case 'Very Good':
        return 'Sustained academic excellence. Excellent baseline accuracies. Shifting focus to NCERT chemical inorganic details will push you to 99.9 percentile.';
      case 'Average':
        return 'Acceptable score line. You are on the right path, but negative scoring in calculations pulled your totals down. Focus heavily on practice speed.';
      default:
        return 'Rebuild fundamental textbook concepts. Dedicate focused hours to practice derivations, standard limit bounds, and group coordination structures.';
    }
  };

  const toggleExplanation = (qId: string) => {
    setExpandedExplanation(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const filteredQuestions = activeReviewTab === 'all' 
    ? questions 
    : questions.filter(q => q.subject === activeReviewTab);

  // RECHARTS DATA PREPARATION
  const subjectChartData = [
    { name: 'Physics', 'Your Score': stats.sectionPerformance.physics.score, 'Max Target': 20, 'National Topper': 20, accuracy: stats.sectionPerformance.physics.attempted > 0 ? Math.round((stats.sectionPerformance.physics.correct / stats.sectionPerformance.physics.attempted) * 100) : 0 },
    { name: 'Chemistry', 'Your Score': stats.sectionPerformance.chemistry.score, 'Max Target': 20, 'National Topper': 20, accuracy: stats.sectionPerformance.chemistry.attempted > 0 ? Math.round((stats.sectionPerformance.chemistry.correct / stats.sectionPerformance.chemistry.attempted) * 100) : 0 },
    { name: 'Mathematics', 'Your Score': stats.sectionPerformance.maths.score, 'Max Target': 20, 'National Topper': 20, accuracy: stats.sectionPerformance.maths.attempted > 0 ? Math.round((stats.sectionPerformance.maths.correct / stats.sectionPerformance.maths.attempted) * 100) : 0 }
  ];

  const radarChartData = [
    { subject: 'Mechanics & Kin', A: stats.correctCount >= 3 ? 100 : 60, B: 90, fullMark: 100 },
    { subject: 'Electronics', A: stats.correctCount >= 2 ? 80 : 40, B: 85, fullMark: 100 },
    { subject: 'Organic Chem', A: selectedAnswers['C3'] === questions.find(q => q.id === 'C3')?.correctAnswer ? 100 : 30, B: 95, fullMark: 100 },
    { subject: 'Physical Chem', A: selectedAnswers['C5'] === questions.find(q => q.id === 'C5')?.correctAnswer ? 100 : 20, B: 90, fullMark: 100 },
    { subject: 'Calculus', A: selectedAnswers['M1'] === questions.find(q => q.id === 'M1')?.correctAnswer ? 100 : 20, B: 88, fullMark: 100 },
    { subject: 'Algebra & Prob', A: selectedAnswers['M5'] === questions.find(q => q.id === 'M5')?.correctAnswer ? 100 : 40, B: 92, fullMark: 100 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6"
      id="results-dashboard"
    >
      
      {/* HEADER ACTIONS BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-900/60 pb-6" id="results-header">
        <div>
          <span className="text-xs font-mono text-cyan-450 font-bold uppercase tracking-widest block mb-1">
            PREMIUM LEARNING ANALYTICS PLATFORM
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.35)] shrink-0" />
            Performance Diagnostic
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time NTA syllabus scoring assessment engine with localized Chapter diagnostics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5" id="navigation-actions">
          <button
            onClick={onGoToHome}
            className="border border-slate-800 bg-slate-950/80 hover:bg-slate-900 hover:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
            id="btn-goto-home"
          >
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            Lobby Desk
          </button>

          <button
            onClick={onRestart}
            className="border border-cyan-850 bg-cyan-950/20 text-cyan-400 hover:text-white hover:bg-cyan-500 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            id="btn-retake"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake Simulator
          </button>
          
          <button
            onClick={onGoToAdmin}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:text-cyan-400 text-slate-400 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer"
            id="btn-goto-admin"
          >
            Admin Entrance
          </button>
        </div>
      </div>

      {/* HUGE HEADER RESULTS SUMMARY BAR */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 bg-gradient-to-br from-slate-900/90 to-slate-950/90 shadow-xl mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all" id="hero-results-header">
        
        {/* Animated HUD Circular Meter */}
        <div className="relative w-44 h-44 flex items-center justify-center shrink-0" id="recharts-custom-circular-gauge">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="88" 
              cy="88" 
              r="72" 
              className="stroke-slate-900 fill-none" 
              strokeWidth="10"
            />
            <circle 
              cx="88" 
              cy="88" 
              r="72" 
              className="stroke-indigo-600/30 fill-none" 
              strokeWidth="2"
              strokeDasharray={452}
              strokeDashoffset={226}
            />
            <circle 
              cx="88" 
              cy="88" 
              r="72" 
              className="stroke-cyan-500 fill-none transition-all duration-1000 shadow-[0_0_12px_#06b6d4]" 
              strokeWidth="10"
              strokeDasharray={452}
              strokeDashoffset={452 - (452 * Math.max(0, stats.percentage)) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Core score text inside */}
          <div className="text-center z-10" id="radar-score-digits">
            <span className="block text-4xl font-extrabold font-mono text-white tracking-tighter">{stats.totalScore}</span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold font-mono border-t border-slate-800/80 pt-1 mt-1">/ 60 Marks</span>
          </div>
        </div>

        {/* Diagnostic assessment block */}
        <div className="flex-grow text-center lg:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center lg:justify-start mb-3">
            <span className="bg-slate-950 text-[10px] font-mono border border-slate-800/80 px-3 py-1 rounded-full text-slate-400">
              JEE PREP COMPLIANCE SUMMARY
            </span>
            <span className={`px-3 py-1 bg-slate-950 text-cyan-400 border border-cyan-850 rounded-full text-[11px] font-mono font-bold border ${rankUi.badge}`}>
              {rankUi.tag}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mb-2">
            Standing Tier: <span className={rankUi.textColor}>{stats.rankLabel}</span>
          </h2>
          
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {getRankMotivation(stats.rankLabel)}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-4 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time Utilized: <strong className="text-white">{minutesUtilized}m {secondsUtilized}s</strong> of {examDurationMinutes}m</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Speed Index: <strong className="text-white">{averageSecondsPerQuestion}s</strong> / Question</span>
            </div>
          </div>
        </div>

        {/* Big percentage indicator card */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl text-center self-stretch lg:self-auto flex flex-col justify-center min-w-[150px] shadow-sm hover:border-slate-700 transition" id="percentage-box-hud">
          <span className="text-slate-400 uppercase text-[9px] font-mono tracking-wider font-bold">Accuracy percentile</span>
          <span className="text-4xl font-extrabold font-mono text-cyan-400 mt-1">{stats.accuracyRate}%</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">Correct-to-Attempt ratio</span>
        </div>
      </div>

      {/* PREMIUM STRIPE-INSPIRED CORE PERFORMANCE METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8" id="stripe-cards-bento">
        
        {/* TOTAL SCORE */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Score</span>
          <div className="mt-3">
            <span className="block text-2xl font-black font-mono text-white">{stats.totalScore}</span>
            <span className="text-[10px] text-slate-450 font-mono">Max achievable: 60</span>
          </div>
        </div>

        {/* ACCURACY % */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Accuracy %</span>
          <div className="mt-3">
            <span className="block text-2xl font-black font-mono text-indigo-400">{stats.accuracyRate}%</span>
            <span className="text-[10px] text-slate-450 font-mono">National Mean: 48%</span>
          </div>
        </div>

        {/* QUESTIONS ATTEMPTED */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-purple-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Attempted</span>
          <div className="mt-3">
            <span className="block text-2xl font-black font-mono text-purple-400">{attemptedCount} / 15</span>
            <span className="text-[10px] text-slate-450 font-mono">Skipped: {stats.unattemptedCount}</span>
          </div>
        </div>

        {/* TIME UTILIZATION */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-amber-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Time Used</span>
          <div className="mt-3">
            <span className="block text-2xl font-black font-mono text-amber-400">{minutesUtilized}m {secondsUtilized}s</span>
            <span className="text-[10px] text-slate-450 font-mono">Allotted: {examDurationMinutes}m</span>
          </div>
        </div>

        {/* BEST SUBJECT */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-emerald-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Best subject</span>
          <div className="mt-3">
            <span className="block text-base font-black font-mono text-emerald-400 capitalize truncate" title={bestSubjectData.subject}>
              {bestSubjectData.subject}
            </span>
            <span className="text-[10px] text-slate-450 font-mono">Score: {bestSubjectData.score} ({bestSubjectData.accuracy}% Acc)</span>
          </div>
        </div>

        {/* WEAKEST SUBJECT */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-red-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Weakest subject</span>
          <div className="mt-3">
            <span className="block text-base font-black font-mono text-rose-400 capitalize truncate" title={weakestSubjectData.subject}>
              {weakestSubjectData.subject}
            </span>
            <span className="text-[10px] text-slate-450 font-mono">Score: {weakestSubjectData.score} ({weakestSubjectData.accuracy}% Acc)</span>
          </div>
        </div>

        {/* RANK CATEGORY */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-yellow-505/20 transition-all duration-300 hover:shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Rank tier</span>
          <div className="mt-3">
            <span className="block text-sm font-black font-mono text-yellow-400 truncate">
              {stats.rankLabel}
            </span>
            <span className="text-[10px] text-slate-450 font-mono">NTA Scaled Status</span>
          </div>
        </div>

      </div>

      {/* CHARTS INTEGRATION: RECHARTS TWO-COLUMN SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" id="recharts-visuals-panel">
        
        {/* Section Score Comparison */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5" id="chart-section-performance">
          <div className="flex items-center justify-between border-b border-slate-805/60 pb-3 mb-4">
            <h3 className="text-base font-extrabold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Subject Performance Standards
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Your Score vs National Mean</span>
          </div>

          <div className="w-full h-[240px]" id="recharts-bar-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[-5, 20]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend index={0} fontSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Your Score" fill="url(#colorUserScore)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="National Topper" fill="#1e293b" radius={[4, 4, 0, 0]} opacity={0.6} />
                
                <defs>
                  <linearGradient id="colorUserScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Space Balance Diagnostic */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5" id="chart-radar-accuracy">
          <div className="flex items-center justify-between border-b border-slate-805/60 pb-3 mb-4">
            <h3 className="text-base font-extrabold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Syllabus Coverage & Balance
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Subject Stream Mapping %</span>
          </div>

          <div className="w-full h-[240px] flex items-center justify-center" id="recharts-radar-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                <PolarGrid stroke="#334155" opacity={0.5} />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                <Radar name="Candidate Spectrum" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                <Radar name="Topper Distribution" dataKey="B" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.05} />
                <Legend index={1} wrapperStyle={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '4px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CHAPTER DIAGNOSTICS: STRENGTH VS WEAKNESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="chapter-diagnostics-layout">
        
        {/* WEAK AREAS (Requires Urgent Action) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-rose-500/15" id="chapter-weaknesses">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3.5 mb-4">
            <div className="p-1.5 bg-red-950/50 border border-red-500/20 rounded-lg text-red-400 shrink-0">
              <HeartCrack className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[13px] font-mono tracking-wider text-slate-400 font-extrabold uppercase">
                WEAK AREAS & NEGATIVE MARKS WARNING
              </h3>
              <p className="text-[10px] text-slate-550">Specific chapters requiring active study revision hours</p>
            </div>
          </div>

          {weakChapters.length > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="weak-chapters-scroller">
              {weakChapters.map((cap, cIdx) => (
                <div key={cIdx} className="p-3 bg-red-950/20 border border-red-900/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-200 font-medium">{cap}</span>
                  <span className="text-[9px] font-mono uppercase bg-red-950 text-red-400 px-2 py-0.5 border border-red-800/20 rounded-md shrink-0">
                    -1 Penalized
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500" id="fallback-no-weak">
              No weak areas detected! You maintained a pristine correct record on all attempted answers.
            </div>
          )}
        </div>

        {/* STRENGTH AREAS (Core Mastered Chapters) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-emerald-500/15" id="chapter-strengths">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3.5 mb-4">
            <div className="p-1.5 bg-emerald-950/50 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[13px] font-mono tracking-wider text-slate-400 font-extrabold uppercase">
                STRENGTH CORES & UNTOUCHED CONCEPTS
              </h3>
              <p className="text-[10px] text-slate-555">Syllabus streams which were solved with 100% correct precision</p>
            </div>
          </div>

          {correctChapters.length > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="correct-chapters-scroller">
              {correctChapters.map((cap, cIdx) => (
                <div key={cIdx} className="p-3 bg-emerald-950/10 border border-emerald-900/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-200 font-medium">{cap}</span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-800/20 rounded-md shrink-0">
                    +4 Mastered
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500" id="fallback-no-strong">
              Solve some questions correctly to map out your conceptual core strengths.
            </div>
          )}
        </div>

      </div>

      {/* IMPROVEMENT HIGHLIGHT STRANDS */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 mb-8" id="improvement-remedial-deck">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 uppercase font-mono">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          NTA SPECIAL COACHING INSTRUCTIONS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="improvement-grid">
          {PRACTICAL_SUGGESTIONS.map((tip) => {
            let isRelevant = false;
            if (tip.id === 'guess' && stats.wrongCount > 2) isRelevant = true;
            if (tip.id === 'accuracy' && stats.accuracyRate < 70) isRelevant = true;
            if (tip.id === 'time' && minutesUtilized > 30) isRelevant = true;
            if (tip.id === 'weak' && weakChapters.length > 1) isRelevant = true;

            const iconMap = {
              guess: <Zap className="w-5 h-5 text-purple-400" />,
              weak: <HeartCrack className="w-5 h-5 text-rose-400" />,
              formulas: <TrendingUp className="w-5 h-5 text-cyan-400" />,
              mock: <BookMarked className="w-5 h-5 text-emerald-400" />,
              time: <Clock className="w-5 h-5 text-amber-400" />,
              accuracy: <Percent className="w-5 h-5 text-indigo-400" />,
              ncert: <Compass className="w-5 h-5 text-red-400" />,
              schedule: <Award className="w-5 h-5 text-yellow-400" />
            };

            return (
              <div 
                key={tip.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  isRelevant 
                    ? 'bg-gradient-to-b from-indigo-950/20 to-slate-950/60 border-indigo-505/30 shadow-[0_4px_15px_rgba(99,102,241,0.05)]' 
                    : 'bg-slate-950/40 border-slate-900'
                }`}
                id={`remediation-card-${tip.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-850">
                    {iconMap[tip.id] || <Sparkles className="w-5 h-5 text-cyan-400" />}
                  </div>
                  {isRelevant && (
                    <span className="text-[9px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 border border-indigo-500/30 rounded-full font-black tracking-wider animate-pulse">
                      High Impact Option
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-extrabold text-white leading-tight mb-2">{tip.text}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">{tip.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLY DETAILED SOLUTIONS ACCORDION AND REVIEW GRID */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5" id="solution-explorer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6" id="sol-header">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-5.5 h-5.5 text-cyan-400" />
              Detailed Solution Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">Study specific mathematical derivations, rules, and logic for all questions</p>
          </div>

          <div className="flex flex-wrap gap-1.5" id="review-filters">
            {(['all', 'physics', 'chemistry', 'maths'] as const).map((block) => (
              <button
                key={block}
                onClick={() => setActiveReviewTab(block)}
                className={`text-xs font-mono font-bold py-2 px-3.5 rounded-xl border transition-all cursor-pointer capitalize ${
                  activeReviewTab === block
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                    : 'bg-slate-955 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white'
                }`}
                id={`filter-${block}`}
              >
                {block}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4" id="filtered-solutions-accordion">
          {filteredQuestions.map((q) => {
            const userChoice = selectedAnswers[q.id];
            const isCorrect = userChoice === q.correctAnswer;
            const open = expandedExplanation[q.id];
            const qCode = CHAPTERS_MAPPING[q.id] || { chapter: 'General Space', category: q.subject };

            return (
              <div 
                key={q.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  userChoice === undefined 
                    ? 'bg-slate-950/20 border-slate-900' 
                    : isCorrect 
                      ? 'bg-emerald-950/5 border-emerald-500/20 shadow-[0_2px_12px_rgba(16,185,129,0.02)]' 
                      : 'bg-red-955/5 border-red-500/15'
                }`}
                id={`solution-card-${q.id}`}
              >
                
                {/* Header Title clickable bar */}
                <div 
                  onClick={() => toggleExplanation(q.id)}
                  className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                  id={`solution-bar-${q.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 font-mono text-xs font-bold rounded-xl flex items-center justify-center border bg-slate-950 shrink-0 border-slate-800 text-slate-300">
                      Q{questions.indexOf(q) + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 font-bold uppercase">
                        <span>{q.subject}</span>
                        <span className="text-slate-800 font-normal select-none">•</span>
                        <span>{qCode.chapter}</span>
                      </p>
                      <h4 className="text-sm md:text-base font-bold text-slate-200 mt-1 truncate max-w-lg md:max-w-2xl">
                        {q.text}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    {userChoice === undefined ? (
                      <span className="text-[10px] font-bold text-slate-450 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                        SKIPPED
                      </span>
                    ) : isCorrect ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                        CORRECT (+4)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 bg-red-950/25 px-2 py-1 rounded border border-red-500/20">
                        INCORRECT (-1)
                      </span>
                    )}
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Explanatory solutions list when opened */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-900 bg-slate-955/40"
                    >
                      <div className="p-5" id={`solution-details-${q.id}`}>
                        {/* Options Display inside dropdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5" id={`solution-options-${q.id}`}>
                          {q.options.map((opt, oIdx) => {
                            const isSelected = userChoice === oIdx;
                            const isCorrectAns = q.correctAnswer === oIdx;
                            const letter = ['A', 'B', 'C', 'D'][oIdx];

                            let optionStyle = 'border-slate-850 text-slate-400 bg-slate-950/30';
                            let badgeStyle = 'bg-slate-950 text-slate-500 border-slate-900';

                            if (isCorrectAns) {
                              optionStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-300';
                              badgeStyle = 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-[0_0_8px_#10b981]';
                            } else if (isSelected) {
                              optionStyle = 'border-red-500 bg-red-950/20 text-red-300';
                              badgeStyle = 'bg-red-500 text-slate-950 font-black border-red-400';
                            }

                            return (
                              <div key={oIdx} className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-xs md:text-sm ${optionStyle}`} id={`sol-opt-${q.id}-${letter}`}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center font-mono border text-[10px] shrink-0 font-bold ${badgeStyle}`}>
                                  {letter}
                                </div>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Text explanation */}
                        {q.explanation && (
                          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-900/60 font-mono text-xs text-slate-300 leading-relaxed" id={`step-derivation-${q.id}`}>
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-900 pb-2">
                              <Info className="w-4 h-4 text-cyan-400" />
                              <span className="text-cyan-400 font-bold font-sans">NTA STEP-BY-STEP SOLUTION PATHWAY:</span>
                            </div>
                            <span className="whitespace-pre-wrap">{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}
