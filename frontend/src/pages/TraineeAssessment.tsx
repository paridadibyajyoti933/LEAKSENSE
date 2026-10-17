import React, { useEffect, useState, useRef } from 'react';
import {
  Award, Clock, HelpCircle, CheckCircle2, XCircle, AlertCircle,
  Play, Download, ChevronRight, ShieldAlert, Cpu
} from 'lucide-react';
import { TrainingSession, LeakLocation, TelemetryPacket } from '../types';
import { fetchSessions, submitDiagnosis, startSession } from '../services/api';
import { LiveWaveformChart } from '../components/LiveWaveformChart';
import { PvcRigSimulator } from '../components/PvcRigSimulator';

interface TraineeAssessmentProps {
  latestTelemetry?: TelemetryPacket | null;
  history: TelemetryPacket[];
  isPaused: boolean;
  onTogglePause: () => void;
}

export const TraineeAssessment: React.FC<TraineeAssessmentProps> = ({
  latestTelemetry,
  history,
  isPaused,
  onTogglePause
}) => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<LeakLocation | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<TrainingSession | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const loadSessions = async () => {
    try {
      const list = await fetchSessions('trainee');
      setSessions(list);
      const running = list.find(s => s.status === 'RUNNING') || list.find(s => s.status === 'CREATED');
      if (running && !activeSession) {
        setActiveSession(running);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSession?.status === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession?.status]);

  const handleStartActiveSession = async () => {
    if (!activeSession) return;
    try {
      const started = await startSession(activeSession.id);
      setActiveSession(started);
      setTimerSeconds(0);
      setCompletedResult(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestHint = () => {
    if (activeSession?.session_type !== 'practice') return;
    const nextHints = hintsUsed + 1;
    setHintsUsed(nextHints);

    const rmsA = latestTelemetry?.vibration_a_rms ?? 0.05;
    const rmsB = latestTelemetry?.vibration_b_rms ?? 0.05;
    const pressure = latestTelemetry?.pressure_kpa ?? 150;
    const ratio = rmsA / (rmsB + 0.0001);

    if (nextHints === 1) {
      setHintText(`HINT 1: Observe Acoustic Ratio (AT-01A / AT-01B = ${ratio.toFixed(2)}x). Values > 1.4 indicate acoustic energy proximity to Left branch.`);
    } else if (nextHints === 2) {
      setHintText(`HINT 2: Pipeline pressure is currently ${pressure.toFixed(1)} kPa. Significant drop below 145 kPa confirms physical hydraulic loss.`);
    } else {
      setHintText(`HINT 3: Transducer positions: AT-01A is at 200mm, Left breach at 350mm, Centre at 500mm, Right at 650mm, AT-01B at 800mm.`);
    }
  };

  const handleSubmit = async () => {
    if (!activeSession || !selectedDiagnosis) return;
    setSubmitting(true);
    try {
      const result = await submitDiagnosis(activeSession.id, {
        trainee_diagnosis: selectedDiagnosis,
        hints_used: hintsUsed,
        attempts: 1,
        duration_seconds: timerSeconds,
        procedure_compliance: 'NOT_ASSESSED'
      });
      setCompletedResult(result);
      setActiveSession(result);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const isPractice = activeSession?.session_type === 'practice';

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Trainee Banner */}
      <div className="bg-white px-5 py-4 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.2 rounded border border-teal-200">
              TRAINEE_OPERATOR_TERMINAL
            </span>
            <span className="text-xs text-slate-400 font-mono">BENCH_01</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            PVC Pipeline Fault Localization & Diagnosis
          </h1>
          <p className="text-xs text-slate-500">
            Inspect physical vibration transducers (AT-01A / AT-01B) and hydraulic pressure gauges to identify pipe breach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-mono">Session Target:</label>
          <select
            value={activeSession?.id || ''}
            onChange={(e) => {
              const found = sessions.find(s => s.id === Number(e.target.value));
              if (found) {
                setActiveSession(found);
                setCompletedResult(found.status === 'COMPLETED' ? found : null);
                setSelectedDiagnosis(found.trainee_diagnosis || null);
                setTimerSeconds(found.duration_seconds || 0);
              }
            }}
            className="text-xs font-mono font-semibold p-2 rounded border border-slate-300 bg-white"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.session_code} [{s.session_type.toUpperCase()}] - {s.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Industrial Test Bench Timer & Mode Bar */}
      <div className="bg-[#0f172a] text-slate-200 rounded p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 text-teal-400 rounded border border-slate-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">
                {activeSession?.session_code || 'STANDBY_IDLE'}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded uppercase ${
                isPractice ? 'bg-blue-900/60 text-blue-200 border border-blue-700' : 'bg-amber-900/60 text-amber-200 border border-amber-700'
              }`}>
                {isPractice ? 'Practice: Guidance Enabled' : 'Assessment: Blind Test'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-sans">
              Candidate: <b>{activeSession?.trainee_name || 'Rahul Sharma'}</b>
            </span>
          </div>
        </div>

        {/* Digital Stopclock */}
        <div className="flex items-center gap-4">
          <div className="bg-black/50 px-3.5 py-1.5 rounded border border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="font-mono text-lg font-bold text-emerald-400 tracking-wider">
              {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {activeSession?.status === 'CREATED' && (
            <button
              onClick={handleStartActiveSession}
              className="px-3.5 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" /> Start Evaluation
            </button>
          )}
        </div>
      </div>

      {/* Concealed Virtual Rig Simulator View */}
      <PvcRigSimulator
        config={{
          is_running: true,
          leak_location: 'Left',
          leak_severity: 'Medium',
          pump_flow_percent: 75,
          noise_level: 0.04,
          conceal_from_trainee: true
        }}
        onUpdateConfig={() => {}}
        latestTelemetry={latestTelemetry}
        isTraineeMode={true}
      />

      {/* Streaming Acoustic Graph */}
      <LiveWaveformChart
        history={history}
        latestTelemetry={latestTelemetry}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      />

      {/* Physical-Style Decision Terminal Console */}
      <div className="industrial-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
              Diagnostic Decision Terminal
            </h3>
            <p className="text-[11px] text-slate-500">
              Select verified pipeline breach point based on telemetry measurements.
            </p>
          </div>

          {isPractice && activeSession?.status === 'RUNNING' && (
            <button
              onClick={handleRequestHint}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Request Acoustic Hint ({hintsUsed} used)</span>
            </button>
          )}
        </div>

        {hintText && (
          <div className="p-3 bg-amber-50 rounded border border-amber-300 text-xs font-mono text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>{hintText}</div>
          </div>
        )}

        {/* 4 Physical-Style Diagnosis Pushbuttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['No Leak', 'Left', 'Centre', 'Right'] as LeakLocation[]).map((loc) => {
            const isSelected = selectedDiagnosis === loc;
            const isCompleted = activeSession?.status === 'COMPLETED';
            return (
              <button
                key={loc}
                disabled={isCompleted || activeSession?.status !== 'RUNNING'}
                onClick={() => setSelectedDiagnosis(loc)}
                className={`p-4 rounded border text-left transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-300 bg-slate-50 hover:bg-white text-slate-800 disabled:opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-slate-800 text-teal-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {loc === 'No Leak' ? 'NORM' : `LOC-${loc[0]}`}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                </div>
                <div className="mt-2">
                  <span className="font-bold text-sm block font-sans">{loc}</span>
                  <span className={`text-[10px] block font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {loc === 'No Leak' ? 'Integrity Nominal' : loc === 'Left' ? 'AT-01A (x=350)' : loc === 'Centre' ? 'Midpoint (x=500)' : 'AT-01B (x=650)'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Action */}
        {activeSession?.status === 'RUNNING' && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={!selectedDiagnosis || submitting}
              className="px-6 py-2 rounded text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Verifying Telemetry...' : 'Commit Diagnostic Submission'}
              <ChevronRight className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        )}

        {/* Feedback Receipt */}
        {completedResult && (
          <div className="p-4 bg-slate-50 border border-slate-300 rounded space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {completedResult.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-700" />
                )}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase font-mono">
                    {completedResult.is_correct ? 'Correct Diagnostic Pass' : 'Incorrect Localization Commited'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Actual Fault: <b>{completedResult.ground_truth_leak}</b> | Candidate Submission: <b>{completedResult.trainee_diagnosis}</b>
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block font-sans">Scaled Score</span>
                <span className="text-xl font-bold text-slate-900">{completedResult.total_score}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px] font-sans">Correctness</span>
                <span className="font-bold text-slate-800">{completedResult.score_correctness} / 50 pts</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px] font-sans">Time Score</span>
                <span className="font-bold text-slate-800">{completedResult.score_time} / 20 pts ({completedResult.duration_seconds}s)</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px] font-sans">Independence</span>
                <span className="font-bold text-slate-800">{completedResult.score_independence} / 20 pts</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px] font-sans">Compliance</span>
                <span className="font-bold text-slate-800">{completedResult.procedure_compliance}</span>
              </div>
            </div>

            {completedResult.feedback_remarks && (
              <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                <b>EVALUATOR_REMARKS:</b> {completedResult.feedback_remarks}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <a
                href={`/api/reports/session/${completedResult.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" /> Download Verified PDF Dossier
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
