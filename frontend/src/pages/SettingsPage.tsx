import React, { useState } from 'react';
import {
  Settings, Sliders, Cloud, CheckCircle2, AlertTriangle, ShieldCheck,
  Volume2, Bell, Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({
    correctness: 50,
    time: 20,
    independence: 20,
    compliance: 10
  });

  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalWeights = weights.correctness + weights.time + weights.independence + weights.compliance;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Platform Settings & Rubric Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure scoring weights, offline sync boundaries, and platform audio cues.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configuration saved locally
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Scoring Rubric Weights */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">Automatic Scoring Rubric Weights</h3>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              totalWeights === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              Total: {totalWeights} / 100 pts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Diagnostic Correctness Weight (pts)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.correctness}
                onChange={(e) => setWeights({ ...weights, correctness: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Awarded for exact match with concealed leak ground truth.</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Diagnosis Speed / Time Weight (pts)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.time}
                onChange={(e) => setWeights({ ...weights, time: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Calculated based on difficulty baseline time thresholds.</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Independent Completion Weight (pts)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.independence}
                onChange={(e) => setWeights({ ...weights, independence: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Deductions applied for hint requests and repeat attempts.</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Procedure Compliance Weight (pts)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={weights.compliance}
                onChange={(e) => setWeights({ ...weights, compliance: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Displayed as 'NOT ASSESSED' if unobserved by instructor.</span>
            </div>
          </div>
        </div>

        {/* Offline-first & Cloud Sync Feature Flag */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Cloud Synchronization & Offline-First Mode</h3>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Firebase Cloud Sync</span>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                When disabled, all records remain strictly inside the local SQLite database. When enabled with valid credentials, queued records automatically synchronize.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cloudEnabled}
                onChange={(e) => setCloudEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            Current Status: <b>Local-First Mode Active (Offline SQLite).</b> No external network dependencies required.
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
