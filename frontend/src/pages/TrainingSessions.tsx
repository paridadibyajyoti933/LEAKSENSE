import React, { useEffect, useState } from 'react';
import {
  Calendar, Plus, Play, XCircle, CheckCircle2, Clock, Award,
  Filter, FileText, ChevronRight, User, AlertCircle
} from 'lucide-react';
import { TrainingSession, Trainee, LeakLocation, LeakSeverity, Difficulty } from '../types';
import { fetchSessions, fetchTrainees, createSession, startSession, cancelSession } from '../services/api';

export const TrainingSessions: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [selectedTraineeId, setSelectedTraineeId] = useState<number>(1);
  const [sessionType, setSessionType] = useState<'practice' | 'assessment'>('assessment');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [groundTruth, setGroundTruth] = useState<LeakLocation>('Left');
  const [severity, setSeverity] = useState<LeakSeverity>('Medium');
  const [trainerNotes, setTrainerNotes] = useState<string>('');

  const loadData = async () => {
    try {
      const [sList, tList] = await Promise.all([
        fetchSessions('trainer'),
        fetchTrainees()
      ]);
      setSessions(sList);
      setTrainees(tList);
      if (tList.length > 0) setSelectedTraineeId(tList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSession({
        trainee_id: selectedTraineeId,
        session_type: sessionType,
        difficulty: difficulty,
        ground_truth_leak: groundTruth,
        leak_severity: severity,
        trainer_notes: trainerNotes
      });
      setIsModalOpen(false);
      setTrainerNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleStart = async (id: number) => {
    try {
      await startSession(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelSession(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Training Session Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage practice and assessment sessions, configure concealed leak scenarios, and track progress.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Session
        </button>
      </div>

      {/* Sessions Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'RUNNING', 'CREATED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              statusFilter === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {st === 'all' ? 'All Sessions' : st}
          </button>
        ))}
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((s) => (
          <div
            key={s.id}
            className="industrial-card p-5 flex flex-col justify-between border-l-4"
            style={{
              borderLeftColor:
                s.status === 'RUNNING' ? '#008080' :
                s.status === 'COMPLETED' ? '#10b981' :
                s.status === 'CANCELLED' ? '#ef4444' : '#64748b'
            }}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900">{s.session_code}</span>
                  <h3 className="font-bold text-sm text-slate-800 mt-0.5">{s.trainee_name || 'Trainee'}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  s.status === 'RUNNING' ? 'bg-teal-100 text-teal-800 animate-pulse' :
                  s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                  s.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {s.status}
                </span>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Type</span>
                  <span className="font-semibold text-slate-700 capitalize">{s.session_type}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Difficulty</span>
                  <span className="font-semibold text-slate-700 capitalize">{s.difficulty}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Target Leak</span>
                  <span className="font-bold text-slate-900">{s.ground_truth_leak} ({s.leak_severity})</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Submitted Diagnosis</span>
                  <span className="font-bold text-slate-900">{s.trainee_diagnosis || 'Pending'}</span>
                </div>
              </div>

              {s.total_score !== null && (
                <div className="mt-3 p-3 bg-teal-50/60 rounded-xl border border-teal-200/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-900">Assessment Score:</span>
                  <span className="text-base font-black text-teal-700">{s.total_score}%</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
              </span>

              <div className="flex items-center gap-2">
                {s.status === 'CREATED' && (
                  <button
                    onClick={() => handleStart(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" /> Start
                  </button>
                )}
                {s.status === 'RUNNING' && (
                  <button
                    onClick={() => handleCancel(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                {s.status === 'COMPLETED' && (
                  <a
                    href={`/api/reports/session/${s.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> PDF Dossier
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-slate-900">Configure New Training Session</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Trainee</label>
                <select
                  value={selectedTraineeId}
                  onChange={(e) => setSelectedTraineeId(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {trainees.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.trainee_id}) - {t.iti_centre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Session Mode</label>
                  <select
                    value={sessionType}
                    onChange={(e: any) => setSessionType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="assessment">Assessment (Blind Test)</option>
                    <option value="practice">Practice (With Hints)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="easy">Easy (&lt; 60s target)</option>
                    <option value="medium">Medium (&lt; 35s target)</option>
                    <option value="hard">Hard (&lt; 20s target)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Rig Leak</label>
                  <select
                    value={groundTruth}
                    onChange={(e: any) => setGroundTruth(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="No Leak">No Leak (Baseline)</option>
                    <option value="Left">Left Branch (x=35cm)</option>
                    <option value="Centre">Centre Branch (x=50cm)</option>
                    <option value="Right">Right Branch (x=65cm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Leak Severity</label>
                  <select
                    value={severity}
                    onChange={(e: any) => setSeverity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Small">Small (Pin-hole)</option>
                    <option value="Medium">Medium (Joint leak)</option>
                    <option value="Large">Large (Pipe crack)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trainer Instructions / Notes</label>
                <textarea
                  value={trainerNotes}
                  onChange={(e) => setTrainerNotes(e.target.value)}
                  placeholder="e.g. Trainee instructed to observe pressure drop before acoustic scan."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
