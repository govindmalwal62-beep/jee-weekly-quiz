import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Bookmark, 
  AlertTriangle, 
  Send, 
  BookOpen, 
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Eye
} from 'lucide-react';
import { Question, SubjectType } from '../types';

interface StudentQuizProps {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  onSelectAnswer: (questionId: string, optionIndex: number | null) => void;
  timeRemaining: number;
  section: SubjectType;
  onChangeSection: (section: SubjectType) => void;
  currentQuestionIndex: Record<SubjectType, number>;
  onChangeQuestionIndex: (subject: SubjectType, index: number) => void;
  onSubmit: () => void;
  candidateName: string;
  onLogout: () => void;
}

export default function StudentQuiz({
  questions,
  selectedAnswers,
  onSelectAnswer,
  timeRemaining,
  section,
  onChangeSection,
  currentQuestionIndex,
  onChangeQuestionIndex,
  onSubmit,
  candidateName,
  onLogout
}: StudentQuizProps) {

  // Visual helper of "Marked for review"
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Filter questions of active subject
  const subjectQuestions = questions.filter(q => q.subject === section);
  const activeIndex = currentQuestionIndex[section];
  const activeQuestion = subjectQuestions[activeIndex];

  // Global question flat index tracker to map total 15 questions
  const getGlobalIndex = (qId: string) => {
    return questions.findIndex(q => q.id === qId) + 1;
  };

  // Format time remaining
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemaining <= 300; // less than 5 minutes

  // Handle previous navigation
  const handlePrev = () => {
    if (activeIndex > 0) {
      onChangeQuestionIndex(section, activeIndex - 1);
    } else {
      // Go to previous section's last question if applicable
      if (section === 'chemistry') {
        onChangeSection('physics');
        onChangeQuestionIndex('physics', questions.filter(q => q.subject === 'physics').length - 1);
      } else if (section === 'maths') {
        onChangeSection('chemistry');
        onChangeQuestionIndex('chemistry', questions.filter(q => q.subject === 'chemistry').length - 1);
      }
    }
  };

  // Handle next navigation
  const handleNext = () => {
    if (activeIndex < subjectQuestions.length - 1) {
      onChangeQuestionIndex(section, activeIndex + 1);
    } else {
      // Go to next section's first question if applicable
      if (section === 'physics') {
        onChangeSection('chemistry');
        onChangeQuestionIndex('chemistry', 0);
      } else if (section === 'chemistry') {
        onChangeSection('maths');
        onChangeQuestionIndex('maths', 0);
      }
    }
  };

  const toggleReviewMark = (qId: string) => {
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Total answers progress calculation
  const totalAttempted = questions.filter(q => selectedAnswers[q.id] !== undefined).length;
  const totalReview = questions.filter(q => markedForReview[q.id]).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6" id="student-quiz-container">
      
      {/* ================= STICKY TIMER & HEADS-UP DISPLAY ================= */}
      <div className={`sticky top-0 z-40 transition-all duration-300 rounded-2xl mb-6 p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 glass-panel ${
        isLowTime 
          ? 'animate-pulse-glow-red border-red-500/50 text-white' 
          : 'border-white/10 text-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
      }`} id="top-timer-panel">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLowTime ? 'bg-red-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isLowTime ? 'bg-red-500' : 'bg-cyan-500'}`}></span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight glow-text-cyan flex items-center gap-2">
              <span>JEE Main Year-wise practice paper</span>
              <span className="text-xs bg-slate-800 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-normal">CBT SIMULATOR</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">National Testing Agency (NTA) Simulation Suite</p>
          </div>
        </div>

        {/* TIMER DISPLAY */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2.5 px-4 md:px-6 py-2 rounded-xl font-mono text-xl md:text-2xl font-bold tracking-widest border transition-all ${
            isLowTime 
              ? 'bg-red-950/80 border-red-500 text-red-400' 
              : 'bg-slate-950/80 border-cyan-500/30 text-cyan-400 glow-text-cyan'
          }`} id="countdown-clock">
            <Clock className={`w-5 h-5 md:w-6 md:h-6 ${isLowTime ? 'animate-bounce text-red-500' : 'text-cyan-400'}`} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
          
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-cyan-550 border border-cyan-400 hover:bg-cyan-600 active:translate-y-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer"
            id="header-submit-btn"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>

      {/* ================= SUBJECT TAB NAVIGATION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="exam-main-layout">
        <div className="lg:col-span-3 flex flex-col gap-6" id="quiz-left-panel">
          
          {/* Section Selector */}
          <div className="flex rounded-xl p-1 bg-slate-950/60 border border-white/5" id="subject-tabs">
            {(['physics', 'chemistry', 'maths'] as SubjectType[]).map((subj) => {
              const isActive = section === subj;
              const count = questions.filter(q => q.subject === subj).length;
              const answered = questions.filter(q => q.subject === subj && selectedAnswers[q.id] !== undefined).length;
              
              return (
                <button
                  key={subj}
                  onClick={() => onChangeSection(subj)}
                  className={`flex-1 py-3 px-2 rounded-lg font-semibold text-center text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 capitalize cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-500/30 text-cyan-400 shadow-[0_2px_10px_rgba(6,182,212,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                  id={`tab-${subj}`}
                >
                  <span className="hidden sm:inline">
                    {subj === 'physics' && 'Physics'}
                    {subj === 'chemistry' && 'Chemistry'}
                    {subj === 'maths' && 'Mathematics'}
                  </span>
                  <span className="sm:hidden uppercase">{subj.substring(0, 3)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300' 
                      : 'bg-slate-800 text-slate-400'
                  }`} id={`badge-${subj}`}>
                    {answered}/{count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ================= ACTIVE QUESTION CONTAINER ================= */}
          <div className="glass-panel rounded-2xl p-5 md:p-8 relative min-h-[460px] flex flex-col justify-between" id="question-card-container">
            <AnimatePresence mode="wait">
              {activeQuestion ? (
                <motion.div
                  key={activeQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col"
                  id={`question-wrapper-${activeQuestion.id}`}
                >
                  {/* Question Metadata header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5" id="question-header">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300">
                        Q. {getGlobalIndex(activeQuestion.id)} of {questions.length}
                      </span>
                      <span className="text-xs uppercase px-2.5 py-1 bg-cyan-950/50 text-cyan-400 border border-cyan-800/30 rounded-full font-bold tracking-wide animate-pulse-glow-cyan">
                        {section}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-yellow-500/20 text-yellow-500 font-semibold shadow-[0_0_8px_rgba(234,179,8,0.1)]">
                        {activeQuestion.year}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-green-500/20 text-emerald-400 font-semibold">
                        +4 / -1 Mark
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-slate-100 text-base md:text-lg leading-relaxed mb-6 font-medium whitespace-pre-wrap" id="question-statement">
                    {activeQuestion.text}
                  </div>

                  {/* MCQ Options grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4" id="options-grid">
                    {activeQuestion.options.map((optionText, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx];
                      const isSelected = selectedAnswers[activeQuestion.id] === oIdx;
                      
                      return (
                        <button
                          key={oIdx}
                          onClick={() => onSelectAnswer(activeQuestion.id, oIdx)}
                          className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/50 to-slate-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-255'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                          id={`opt-${activeQuestion.id}-${letter}`}
                        >
                          <div className={`p-1.5 w-8 h-8 flex items-center justify-center shrink-0 rounded-lg border font-mono text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                              : 'bg-slate-950 border-slate-800 text-slate-400 group-hover:border-slate-600 group-hover:text-slate-250'
                          }`}>
                            {letter}
                          </div>
                          <span className="text-sm md:text-base leading-snug">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400" id="no-question-fallback">
                  <HelpCircle className="w-10 h-10 mb-2 animate-bounce text-cyan-400" />
                  <p>Question not available. Select another question from the sidebar.</p>
                </div>
              )}
            </AnimatePresence>

            {/* ================= CONTROL UTILITY FOOTER RAIL ================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-5 mt-6" id="question-footer">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrev}
                  className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-850 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] cursor-pointer"
                  id="button-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-850 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] cursor-pointer"
                  id="button-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeQuestion && selectedAnswers[activeQuestion.id] !== undefined && (
                  <button
                    onClick={() => onSelectAnswer(activeQuestion.id, null)}
                    className="flex-1 sm:flex-initial bg-slate-950 hover:bg-red-950/60 border border-red-900/30 hover:border-red-500 text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] cursor-pointer hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                    id="button-clear"
                  >
                    Clear Response
                  </button>
                )}
                
                {activeQuestion && (
                  <button
                    onClick={() => toggleReviewMark(activeQuestion.id)}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all duration-150 hover:scale-[1.04] active:scale-[0.96] cursor-pointer ${
                      markedForReview[activeQuestion.id]
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-900/70'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    }`}
                    id="button-review"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    {markedForReview[activeQuestion.id] ? 'Marked' : 'Mark Review'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL: CBT QUESTION GRID PANEL ================= */}
        <div className="flex flex-col gap-6" id="quiz-right-panel">
          
          {/* Profile Overview Card */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 border shadow-sm border-white/5" id="profile-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                JEE
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Candidate Session</p>
                <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight truncate uppercase" title={candidateName}>
                  {candidateName}
                </h3>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500 hover:text-red-300 text-red-400 text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shrink-0 font-mono"
              id="btn-logout"
            >
              LOGOUT
            </button>
          </div>

          {/* Progress Status Counter Dashboard */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5" id="progress-stats-block">
            <h3 className="text-sm font-bold text-slate-350 mb-3 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              Exam Progress Panel
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4" id="stats-summary-grid">
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="block font-mono text-base font-bold text-emerald-400 glow-text">{totalAttempted}</span>
                <span className="text-[10px] text-slate-400">Attempted</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="block font-mono text-base font-bold text-amber-400 glow-text">{totalReview}</span>
                <span className="text-[10px] text-slate-400">Review Marks</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="block font-mono text-base font-bold text-slate-350">{questions.length - totalAttempted}</span>
                <span className="text-[10px] text-slate-450">Remaining</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="block font-mono text-base font-bold text-cyan-400">{questions.length}</span>
                <span className="text-[10px] text-slate-400">Total PYQs</span>
              </div>
            </div>

            {/* LIVE ATTEMPT RATIO PROGRESS BAR */}
            <div className="space-y-1 mb-2" id="live-progress-bar-stack">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Attempt Tracker</span>
                <span>{Math.round((totalAttempted / questions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div 
                  className="bg-gradient-to-r from-cyan-500 through-brand-purple to-cyan-400 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${(totalAttempted / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* PALETTE NAVIGATION BY INDEX */}
          <div className="glass-panel rounded-2xl p-5 flex-1 border border-white/5 flex flex-col justify-between" id="palette-grid-block">
            <div>
              <h3 className="text-xs font-bold text-slate-350 mb-3 flex items-center justify-between font-mono tracking-wider uppercase border-b border-slate-800/60 pb-2">
                <span>QUESTION PALETTE</span>
                <span className="text-[10px] text-cyan-400 flex items-center gap-0.5 glow-text">
                  <Eye className="w-3 h-3" />
                  PCM Grid
                </span>
              </h3>

              {/* Subject Grouped Mini-grids */}
              {(['physics', 'chemistry', 'maths'] as SubjectType[]).map((subj) => {
                const subjQuestions = questions.filter(q => q.subject === subj);
                
                return (
                  <div key={subj} className="mb-4" id={`palette-${subj}`}>
                    <p className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 mb-2 capitalize pl-1">
                      {subj}
                    </p>
                    <div className="grid grid-cols-5 gap-2" id={`grid-${subj}`}>
                      {subjQuestions.map((q, sIdx) => {
                        const globalIndex = getGlobalIndex(q.id);
                        const isChosen = selectedAnswers[q.id] !== undefined;
                        const isReview = markedForReview[q.id];
                        const isActive = section === subj && activeIndex === sIdx;
                        
                        let btnStyle = 'bg-slate-950 text-slate-400 border-slate-800/80 hover:border-slate-600 hover:text-white';
                        if (isChosen && isReview) {
                          btnStyle = 'bg-gradient-to-br from-amber-600 to-amber-800 text-white border-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                        } else if (isChosen) {
                          btnStyle = 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-slate-100 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
                        } else if (isReview) {
                          btnStyle = 'bg-slate-950 text-amber-400 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
                        }

                        if (isActive) {
                          btnStyle += ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10';
                        }

                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              onChangeSection(subj);
                              onChangeQuestionIndex(subj, sIdx);
                            }}
                            className={`h-9 w-9 text-xs flex items-center justify-center font-bold font-mono rounded-lg border transition-all cursor-pointer ${btnStyle}`}
                            title={`${subj.toUpperCase()} Q${sIdx + 1} (${q.year})`}
                            id={`palette-item-${q.id}`}
                          >
                            {globalIndex}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Palette Legend Color Indicators */}
            <div className="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-400 space-y-2" id="palette-legend">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded border border-emerald-400"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-950 rounded border border-amber-500/60"></div>
                  <span>Review Tag</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-950 rounded border border-slate-800"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SUBMIT EXAM WARNING CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="submit-confirm-modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 md:p-8 text-center text-slate-100 border border-white/20"
            >
              <div className="w-16 h-16 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-cyan-400" />
              </div>
              
              <h3 className="text-xl font-bold tracking-tight mb-2">Are you sure you want to end?</h3>
              <p className="text-sm text-slate-400 mb-6">
                You have answered <strong className="text-cyan-400">{totalAttempted}</strong> out of <strong className="text-slate-200">{questions.length}</strong> questions. Once submitted, your scores will be evaluated instantly.
              </p>

              {/* Subject Breakdown in Modal */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-6 text-left text-xs space-y-2" id="modal-status-breakdown">
                {(['physics', 'chemistry', 'maths'] as SubjectType[]).map((subj) => {
                  const count = questions.filter(q => q.subject === subj).length;
                  const answered = questions.filter(q => q.subject === subj && selectedAnswers[q.id] !== undefined).length;
                  return (
                    <div key={subj} className="flex justify-between items-center capitalize">
                      <span className="text-slate-400 font-medium">{subj}:</span>
                      <span className="font-mono text-slate-200">
                        {answered} / {count} Answered
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-slate-900 duration-150 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  id="modal-cancel-btn"
                >
                  Return to Test
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    onSubmit();
                  }}
                  className="flex-1 bg-cyan-550 border border-cyan-400 hover:bg-cyan-600 text-slate-950 py-2.5 rounded-xl text-sm font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                  id="modal-confirm-btn"
                >
                  Submit Exam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
