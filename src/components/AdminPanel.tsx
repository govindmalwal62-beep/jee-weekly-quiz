import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Trash2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  Save, 
  Database, 
  Clock, 
  Layers, 
  Code, 
  Sparkles, 
  Check, 
  X, 
  Eye, 
  ShieldAlert, 
  ArrowLeft,
  ChevronRight,
  Bookmark,
  FileJson,
  CheckCircle,
  FolderSync
} from 'lucide-react';
import { Question, SubjectType } from '../types';
import { auth } from '../firebase';

interface AdminPanelProps {
  questions: Question[];
  onUpdateQuestions: (updated: Question[]) => void;
  onResetQuestions: () => void;
  examDurationMinutes: number;
  onUpdateDuration: (mins: number) => void;
  onClose: () => void;
}

export default function AdminPanel({
  questions,
  onUpdateQuestions,
  onResetQuestions,
  examDurationMinutes,
  onUpdateDuration,
  onClose
}: AdminPanelProps) {
  
  // PASSWORD VERIFICATION (Auto authenticate if current user is the verified admin)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return auth.currentUser?.email === 'govindmalwal62@gmail.com';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // QUESTION EDIT MODAL STATE
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // BULK UPLOAD STATE
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkUploadError, setBulkUploadError] = useState('');
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false);

  // FORM CONTROLS (for Add/Edit)
  const [formSubject, setFormSubject] = useState<SubjectType>('physics');
  const [formYear, setFormYear] = useState('JEE Main 2024');
  const [formText, setFormText] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');

  // SUBMIT LOGIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin' || auth.currentUser?.email === 'govindmalwal62@gmail.com') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('INVALID CLEARANCE CODE. ACCESS DENIED.');
    }
  };

  // OPEN EDIT FORM
  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsAddingNew(false);
    
    setFormSubject(q.subject);
    setFormYear(q.year);
    setFormText(q.text);
    setFormOptionA(q.options[0]);
    setFormOptionB(q.options[1]);
    setFormOptionC(q.options[2]);
    setFormOptionD(q.options[3]);
    setFormCorrectIndex(q.correctAnswer);
    setFormExplanation(q.explanation || '');
  };

  // OPEN NEW FORM
  const openAddNew = () => {
    setEditingQuestion(null);
    setIsAddingNew(true);

    const generatedId = `NEW_Q_${Date.now()}`;
    setFormSubject('physics');
    setFormYear('JEE Main 2026');
    setFormText('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormCorrectIndex(0);
    setFormExplanation('');
  };

  // SAVE CHANGES (ADD or EDIT)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText || !formOptionA || !formOptionB || !formOptionC || !formOptionD) {
      alert('Please fill out all options and question statement details.');
      return;
    }

    const compiledQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : `Q_${Date.now()}`,
      subject: formSubject,
      year: formYear,
      text: formText,
      options: [formOptionA, formOptionB, formOptionC, formOptionD],
      correctAnswer: formCorrectIndex,
      explanation: formExplanation
    };

    if (editingQuestion) {
      // update
      const updated = questions.map(q => q.id === editingQuestion.id ? compiledQuestion : q);
      onUpdateQuestions(updated);
      setEditingQuestion(null);
    } else {
      // add
      const updated = [...questions, compiledQuestion];
      onUpdateQuestions(updated);
      setIsAddingNew(false);
    }
  };

  // DELETE QUESTION
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this JEE question from the active database?')) {
      const updated = questions.filter(q => q.id !== id);
      onUpdateQuestions(updated);
    }
  };

  // GENERATE SAMPLE TEMPLATE FOR BULK UPLOADER
  const loadBulkJsonTemplate = () => {
    const defaultTemplate = [
      {
        "id": "BULK_1",
        "subject": "physics",
        "year": "JEE Main 2025",
        "text": "The length of a simple pendulum is increased by 44%. Find the percentage increase in its time period.",
        "options": [
          "12%",
          "20%",
          "44%",
          "22%"
        ],
        "correctAnswer": 1,
        "explanation": "Time period T = 2π * sqrt(L/g). If L increases to 1.44L, then T increases to sqrt(1.44)*T = 1.2T. Ratio of increase is 1.2 - 1 = 0.20 or 20%."
      }
    ];
    setBulkJsonText(JSON.stringify(defaultTemplate, null, 2));
    setBulkUploadSuccess(false);
    setBulkUploadError('');
  };

  // PROCESS BULK JSON
  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed)) {
        setBulkUploadError('JSON structure must be an ARRAY of question objects.');
        return;
      }

      // Quick validate properties
      const isValid = parsed.every(item => {
        return (
          typeof item.id === 'string' &&
          ['physics', 'chemistry', 'maths'].includes(item.subject) &&
          typeof item.year === 'string' &&
          typeof item.text === 'string' &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.correctAnswer === 'number' &&
          item.correctAnswer >= 0 &&
          item.correctAnswer <= 3
        );
      });

      if (!isValid) {
        setBulkUploadError('Validation failed. Some questions do not contain required fields: id (string), subject ("physics"/"chemistry"/"maths"), year (string), text (string), options (array of exactly 4 strings), correctAnswer (index 0-3)');
        return;
      }

      // Concat to existing or overwrite
      if (confirm(`Valid JSON array detected with ${parsed.length} questions. Do you want to merge these into the current database?`)) {
        onUpdateQuestions([...questions, ...parsed]);
      } else if (confirm('Would you prefer to COMPLETELY OVERWRITE and replace the active database with these questions?')) {
        onUpdateQuestions(parsed);
      } else {
        return;
      }

      setBulkUploadSuccess(true);
      setBulkJsonText('');
      setBulkUploadError('');
    } catch (e: any) {
      setBulkUploadError(`Invalid JSON formatting: ${e.message}`);
    }
  };

  // STATUS STATS CALCULATOR
  const countPhysics = questions.filter(q => q.subject === 'physics').length;
  const countChemistry = questions.filter(q => q.subject === 'chemistry').length;
  const countMaths = questions.filter(q => q.subject === 'maths').length;

  // ================= RENDER VISUAL PASSWORD ACCESS BOX =================
  if (!isAuthenticated) return (
    <div className="w-full min-h-[90vh] flex items-center justify-center p-4 relative" id="admin-lockbox">
      
      <div className="absolute top-10 left-10 text-xs text-slate-500 font-mono flex items-center gap-1">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
        SYSTEM_PORTAL: SECURE_VAULT_DECRYPTION
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-md glass-panel-heavy rounded-3xl p-6 md:p-8 text-slate-100 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-550 via-cyan-550 to-purple-555"></div>
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-slate-950 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-slate-200">ADMIN CLEARANCE REQUIRED</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase">Enter password credentials below</p>
        </div>
         <form onSubmit={handleLogin} className="space-y-4" id="login-form">
          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1.5 font-bold">Access Token Code</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter Access Code"
              autoFocus
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-550/15 focus:shadow-[0_0_24px_rgba(6,182,212,0.3)] text-slate-100 placeholder-slate-750 px-4 py-3 rounded-xl font-mono text-center tracking-widest outline-none text-sm transition-all duration-300"
              id="password-input-field"
            />
          </div>

          {authError && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-xs font-mono font-bold text-red-400 text-center animate-shake" id="error-alert">
              {authError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-950 transition-colors border border-slate-800 hover:bg-slate-900 duration-150 text-slate-350 px-4 py-3 rounded-xl text-xs font-bold font-mono"
              id="btn-return-login"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-cyan-550 border border-cyan-400 hover:bg-cyan-600 text-slate-950 py-3 rounded-xl text-xs font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              id="btn-login-submit"
            >
              DECRYPT ENTRY
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // ================= RENDER DYNAMIC BACKEND MANAGEMENT SUITE =================
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8" id="admin-panel-system">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-5" id="adm-heading-block">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-2">System Level: root_admin_panel</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            Maker Control Interface
          </h1>
          <p className="text-sm text-slate-400">Manage real-time questions, timing attributes, and bulk integrations</p>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
          id="btn-close-admin"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Maker Panel
        </button>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" id="admin-stats-card-row">
        
        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 rounded-lg text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-2xl font-bold font-mono text-slate-100">{questions.length}</span>
            <span className="text-[11px] text-slate-450 uppercase font-mono">TOTAL PYQs</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 rounded-lg text-cyan-450">
            <CheckCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="block text-2xl font-bold font-mono text-slate-100">
              P:{countPhysics} | C:{countChemistry} | M:{countMaths}
            </span>
            <span className="text-[11px] text-slate-450 uppercase font-mono">SUBJECT DIVISION</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 rounded-lg text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="block text-2xl font-bold font-mono text-slate-100">{examDurationMinutes} Mins</span>
            <span className="text-[11px] text-slate-450 uppercase font-mono">EXAM TIMER RANGE</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 rounded-lg text-emerald-400">
            <Sparkles className="w-5 h-5 text-emerald-450 animate-spin" />
          </div>
          <div>
            <span className="block text-2xl font-bold font-mono text-slate-100">Local DB</span>
            <span className="text-[11px] text-slate-450 uppercase font-mono">PERSIST STATUS</span>
          </div>
        </div>

      </div>

      {/* SYSTEM CONTROLS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" id="sys-ctrl-row">
        
        {/* TIMER AND RESET MANAGER COMPONENT */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col justify-between" id="timing-control-panel">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-350 mb-4 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Exam timing setting
            </h3>

            <div className="space-y-4" id="range-control-stack">
              <div>
                <label className="block text-xs uppercase text-slate-400 font-bold mb-1 font-mono">
                  Timer setting: {examDurationMinutes} Minutes
                </label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={examDurationMinutes}
                  onChange={(e) => onUpdateDuration(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>5 mins</span>
                  <span>90 mins</span>
                  <span>180 mins</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-normal font-medium">
                Adjusting this controls the active countdown timer immediately. Recommended standards for 15 Questions practice represents <strong className="text-cyan-400">30 to 60 Mins</strong>.
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to revert ALL customizations? This deletes all custom changes/added questions and restores the 15 verified, premium default mock questions.')) {
                  onResetQuestions();
                }
              }}
              className="flex-1 bg-slate-950 transition-colors border border-red-900/30 text-red-400 hover:bg-red-950/20 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
              id="btn-revert-seed"
            >
              <RotateCcw className="w-4 h-4 animate-spin" />
              Reset Database
            </button>
          </div>
        </div>

        {/* BULK DATA JSON UPLOADER */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5" id="bulk-uploader-card">
          <h3 className="text-sm font-bold font-mono text-slate-350 mb-1.5 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <FileJson className="w-4 h-4 text-cyan-400" />
              Bulk JSON Quiz Loader
            </span>
            <button
              onClick={loadBulkJsonTemplate}
              className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-cyan-400 px-2 py-0.5 rounded font-mono transition-colors font-semibold cursor-pointer"
              id="btn-json-template"
            >
              Load Array Template
            </button>
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">Integrate full multiple-choice worksheets easily by entering structured array objects:</p>

          <div className="space-y-3" id="bulk-uploader-stack">
            <textarea
              value={bulkJsonText}
              onChange={(e) => {
                setBulkJsonText(e.target.value);
                setBulkUploadError('');
                setBulkUploadSuccess(false);
              }}
              placeholder={`[
  {
    "id": "CUSTOM_Q1",
    "subject": "chemistry",
    "year": "JEE Main 2024",
    "text": "Identify the element having highest electron gain enthalpy...",
    "options": ["Fluorine", "Chlorine", "Bromine", "Iodine"],
    "correctAnswer": 1 (starts from 0, representing chlorine),
    "explanation": "..."
  }
]`}
              className="w-full h-28 bg-slate-950 border border-slate-800/80 focus:border-cyan-550 rounded-xl p-3 font-mono text-xs placeholder-slate-700 text-slate-300 outline-none resize-none"
              id="bulk-textarea"
            ></textarea>

            {bulkUploadError && (
              <div className="p-2 bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-mono rounded" id="bulk-error">
                {bulkUploadError}
              </div>
            )}

            {bulkUploadSuccess && (
              <div className="p-2 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-xs font-mono rounded flex items-center gap-1" id="bulk-success">
                <Check className="w-4 h-4" /> Bulk Quiz Uploaded Successfully! Database Modified.
              </div>
            )}

            <button
              onClick={handleBulkUpload}
              disabled={!bulkJsonText.trim()}
              className="w-full bg-cyan-550 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-cyan-550 text-slate-950 font-bold py-2.5 rounded-xl text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-all"
              id="btn-json-upload-submit"
            >
              <FolderSync className="w-4 h-4" />
              PARSE & SYNCHRONIZE DATABASE
            </button>
          </div>
        </div>

      </div>

      {/* QUESTION LIST & ADD ENTRY MODULE */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5" id="questions-management-catalog">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6" id="catalog-header">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Active Question Bank List
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Edit, add parameters, or clear individual rows</p>
          </div>

          <button
            onClick={openAddNew}
            className="bg-cyan-550 border border-cyan-400 hover:bg-cyan-600 active:translate-y-0.5 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            id="btn-add-new-trigger"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Make Custom Question
          </button>
        </div>

        {/* QUESTIONS TABLE GRID */}
        <div className="overflow-x-auto w-full border border-slate-850 rounded-xl bg-slate-950/20" id="table-scroll-container">
          <table className="w-full text-left border-collapse" id="questions-dashboard-table">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-mono tracking-wider font-bold text-slate-450 uppercase bg-slate-950/80">
                <th className="py-3 px-4 w-12 text-center">ID</th>
                <th className="py-3 px-4 w-28">Subject/Year</th>
                <th className="py-3 px-4">Question Text Summary</th>
                <th className="py-3 px-4 w-20 text-center">Answer</th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60" id="table-body">
              {questions.length > 0 ? (
                questions.map((q, qIndex) => (
                  <tr key={q.id} className="text-xs hover:bg-slate-900/40 text-slate-300 group" id={`tr-question-${q.id}`}>
                    <td className="py-3.5 px-4 font-mono text-center text-slate-500 text-[11px] font-medium">{qIndex + 1}</td>
                    <td className="py-3.5 px-4">
                      <span className="block capitalize font-bold text-slate-200">{q.subject}</span>
                      <span className="block text-[10px] text-slate-450 font-mono">{q.year}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="line-clamp-2 leading-relaxed text-slate-200 font-medium max-w-lg md:max-w-xl" title={q.text}>
                        {q.text}
                      </p>
                      <div className="flex gap-2 text-[10px] text-slate-400/80 font-mono mt-1 group-hover:text-slate-400">
                        <span className="px-1 bg-slate-950/60 rounded">A: {q.options[0]?.substring(0, 16)}...</span>
                        <span className="px-1 bg-slate-950/60 rounded">B: {q.options[1]?.substring(0, 16)}...</span>
                        <span className="px-1 bg-slate-950/60 rounded">C: {q.options[2]?.substring(0, 16)}...</span>
                        <span className="px-1 bg-slate-950/60 rounded">D: {q.options[3]?.substring(0, 16)}...</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {['A', 'B', 'C', 'D'][q.correctAnswer]}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1.5 bg-slate-900 duration-150 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-400 rounded-lg cursor-pointer"
                          title="Edit Question Attributes"
                          id={`btn-edit-${q.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 bg-slate-900 duration-150 hover:bg-red-950 border border-slate-800 hover:border-red-900/30 text-red-400 rounded-lg cursor-pointer"
                          title="Delete Row"
                          id={`btn-delete-${q.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr id="empty-row-fallback">
                  <td colSpan={5} className="py-8 text-center text-slate-400 bg-slate-950/10">
                    No active questions found in your customized quiz database. Revert or add questions to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT FORM MODAL (Full functional React view) */}
      <AnimatePresence>
        {(editingQuestion !== null || isAddingNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto" id="edit-form-modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0e1322] border border-white/10 rounded-3xl p-6 md:p-8 text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto my-8"
              id="form-card"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6" id="form-header">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 font-mono uppercase tracking-wide">
                    {editingQuestion ? '✏️ Edit JEE Question Metadata' : '➕ Make New Exam Question'}
                  </h3>
                  <p className="text-xs text-slate-400">ID: {editingQuestion ? editingQuestion.id : 'AUTO_GENERATED'}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsAddingNew(false);
                  }}
                  className="p-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 cursor-pointer text-slate-400 hover:text-white"
                  id="form-close-badge"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4" id="metadata-form">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject Stream</label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value as SubjectType)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-xl px-3 py-2.5 text-xs text-slate-200 uppercase font-mono outline-none"
                    >
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="maths">Mathematics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exam Year Year</label>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      placeholder="e.g. 'JEE Main 2024'"
                      required
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Statement / Text Body</label>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Enter the complete question problem statement here..."
                    required
                    className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-xl p-3 text-xs text-slate-200 leading-relaxed outline-none"
                  ></textarea>
                </div>

                <div className="space-y-2 border-t border-slate-800/40 pt-4">
                  <span className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Multiple-Choice Options (A-D)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="options-inputs-grid">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] items-center justify-center font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-400">A</span>
                        <input
                          type="text"
                          value={formOptionA}
                          onChange={(e) => setFormOptionA(e.target.value)}
                          placeholder="Option A Text"
                          required
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-lg px-3 py-2 text-xs text-slate-250 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] items-center justify-center font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-400">B</span>
                        <input
                          type="text"
                          value={formOptionB}
                          onChange={(e) => setFormOptionB(e.target.value)}
                          placeholder="Option B Text"
                          required
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-lg px-3 py-2 text-xs text-slate-250 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] items-center justify-center font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-400">C</span>
                        <input
                          type="text"
                          value={formOptionC}
                          onChange={(e) => setFormOptionC(e.target.value)}
                          placeholder="Option C Text"
                          required
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-lg px-3 py-2 text-xs text-slate-250 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] items-center justify-center font-bold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-400">D</span>
                        <input
                          type="text"
                          value={formOptionD}
                          onChange={(e) => setFormOptionD(e.target.value)}
                          placeholder="Option D Text"
                          required
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-lg px-3 py-2 text-xs text-slate-250 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/40 pt-4" id="evaluations-inputs">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mark Correct Choice</label>
                    <select
                      value={formCorrectIndex}
                      onChange={(e) => setFormCorrectIndex(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-xl px-3 py-2.5 text-xs font-mono text-emerald-400 font-bold outline-none"
                    >
                      <option value={0}>Option A</option>
                      <option value={1}>Option B</option>
                      <option value={2}>Option C</option>
                      <option value={3}>Option D</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Solution Logic / Explanation</label>
                    <input
                      type="text"
                      value={formExplanation}
                      onChange={(e) => setFormExplanation(e.target.value)}
                      placeholder="Step-by-step mathematical logic to display on results page"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-550 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsAddingNew(false);
                    }}
                    className="flex-1 bg-slate-950 transition-colors border border-slate-850 hover:bg-slate-900 duration-150 text-slate-350 py-3 rounded-xl text-xs font-bold font-mono"
                    id="form-cancel"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-550 border border-cyan-400 hover:bg-cyan-600 text-slate-950 py-3 rounded-xl text-xs font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                    id="form-save"
                  >
                    Save & Store Question
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
