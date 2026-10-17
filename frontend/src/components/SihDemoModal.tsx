import React, { useState } from 'react';
import {
  CheckCircle2, ChevronRight, RotateCcw, X, Download, FileText,
  Play, Terminal, ShieldCheck, Layers
} from 'lucide-react';
import { triggerDemoStep, resetDemo } from '../services/api';

interface SihDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (path: string) => void;
}

const STEPS = [
  { id: 1, title: 'Initialize Simulation', desc: 'Engage centrifugal pump (P-01) at 75% flow, verify baseline acoustic floor.' },
  { id: 2, title: 'Inject Concealed Fault', desc: 'Open Left branch leak with Medium severity aperture (isolated from candidate view).' },
  { id: 3, title: 'Sample Synthetic Telemetry', desc: 'Synthesize acoustic attenuation: AT-01A receives higher amplitude than AT-01B.' },
  { id: 4, title: 'Execute Offline Inference', desc: 'Classifier scores acoustic/pressure features and predicts "Left" (88% margin).' },
  { id: 5, title: 'Arm Candidate Assessment', desc: 'Launch timed assessment session; enforce ground-truth isolation protocol.' },
  { id: 6, title: 'Submit Trainee Finding', desc: 'Candidate independently evaluates telemetry and commits diagnostic choice: "Left".' },
  { id: 7, title: 'Compute Objective Rubric', desc: 'Score calculated: Correctness (50/50), Speed (19/20), Independence (20/20).' },
  { id: 8, title: 'Persist Record to SQLite', desc: 'Commit session record locally and queue for optional cloud sync.' },
  { id: 9, title: 'Aggregate Training Analytics', desc: 'Refresh candidate confusion matrix and cumulative accuracy trends.' },
  { id: 10, title: 'Export Official Dossier', desc: 'Generate printable PDF assessment report with rubric breakdown.' }
];

export const SihDemoModal: React.FC<SihDemoModalProps> = ({ isOpen, onClose, onNavigateTo }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNextStep = async () => {
    if (currentStep > 10) return;
    setLoading(true);
    try {
      const res = await triggerDemoStep(currentStep);
      setStepLogs(prev => [...prev, `[STEP ${currentStep}] ${res.description}`]);
      if (res.session_id) setActiveSessionId(res.session_id);

      if (currentStep === 9) {
        onNavigateTo('/analytics');
      }

      if (currentStep < 10) {
        setCurrentStep(prev => prev + 1);
      }
    } catch (err: any) {
      setStepLogs(prev => [...prev, `[ERROR STEP ${currentStep}] ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetDemo();
      setCurrentStep(1);
      setStepLogs(['[RESET] Rig baseline restored: No Leak, 75% pump flow.']);
      setActiveSessionId(null);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded border border-slate-300 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Engineering Header */}
        <div className="px-5 py-3.5 bg-[#0a192f] text-slate-200 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 text-teal-400 rounded border border-slate-700">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                  Smart India Hackathon 2026 — Evaluation Sequence
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700">
                  AUTOMATED_WORKFLOW
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                10-Stage Deterministic Vocational Training & Assessment Verification
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {/* Progress Indicator */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-bold text-slate-700">STAGE {currentStep}/10: {STEPS[currentStep - 1]?.title}</span>
              <span className="text-slate-500">{Math.round(((currentStep - 1) / 10) * 100)}% Verified</span>
            </div>
            <div className="w-full bg-slate-200 rounded-sm h-1.5 overflow-hidden">
              <div
                className="bg-slate-800 h-full transition-all duration-200"
                style={{ width: `${((currentStep - 1) / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {STEPS.map((step) => {
              const isPast = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded border flex items-start gap-2.5 transition-all ${
                    isCurrent
                      ? 'border-slate-800 bg-white shadow-xs'
                      : isPast
                      ? 'border-slate-200 bg-slate-100/70 text-slate-500'
                      : 'border-slate-200 bg-white opacity-40'
                  }`}
                >
                  <div className={`mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isPast
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isCurrent
                      ? 'bg-slate-900 text-teal-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPast ? 'OK' : `0${step.id}`}
                  </div>
                  <div className="flex-1 text-xs">
                    <p className={`font-semibold ${isCurrent ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {step.title}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Console Output */}
          {stepLogs.length > 0 && (
            <div className="bg-[#0f172a] rounded p-3 text-[11px] font-mono text-emerald-400 space-y-1 max-h-28 overflow-y-auto border border-slate-800">
              {stepLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo</span>
          </button>

          <div className="flex items-center gap-2">
            {activeSessionId && (
              <a
                href={`/api/reports/session/${activeSessionId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
                <span>PDF Dossier</span>
              </a>
            )}

            <button
              onClick={handleNextStep}
              disabled={loading || currentStep > 10}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : currentStep > 10 ? (
                'All 10 Stages Complete'
              ) : (
                <>
                  <span>Execute Stage {currentStep}</span>
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
