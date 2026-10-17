import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, Filter, Award, Clock, Target, AlertCircle } from 'lucide-react';
import { PerformanceAnalytics as IAnalytics, Trainee } from '../types';
import { fetchPerformanceAnalytics, fetchTrainees } from '../services/api';

const CLASSES = ['No Leak', 'Left', 'Centre', 'Right'];

export const PerformanceAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<string>('all');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadData = async () => {
    try {
      const [tList, data] = await Promise.all([
        fetchTrainees(),
        fetchPerformanceAnalytics({
          trainee_id: selectedTrainee !== 'all' ? Number(selectedTrainee) : undefined,
          difficulty: selectedDiff !== 'all' ? selectedDiff : undefined,
          session_type: selectedType !== 'all' ? selectedType : undefined
        })
      ]);
      setTrainees(tList);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTrainee, selectedDiff, selectedType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Performance & Skill Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical accuracy trends, confusion matrices, and speed benchmarks derived from SQLite records.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTrainee}
            onChange={(e) => setSelectedTrainee(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Trainees</option>
            {trainees.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>

          <select
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Session Types</option>
            <option value="assessment">Assessment</option>
            <option value="practice">Practice</option>
          </select>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="industrial-card p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Overall Accuracy
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {analytics?.accuracy_percent ?? 0}%
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Across {analytics?.total_sessions ?? 0} completed runs
          </span>
        </div>

        <div className="industrial-card p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Average Diagnosis Time
          </span>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {analytics?.average_time_seconds ?? 0}s
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Benchmark Target: &lt;35.0s
          </span>
        </div>

        <div className="industrial-card p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Recorded Assessments
          </span>
          <p className="text-3xl font-black text-teal-700 mt-2">
            {analytics?.total_sessions ?? 0}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            SQLite Verified History
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Accuracy Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Cumulative Accuracy Over Time</h3>
          <p className="text-xs text-slate-500 mb-4">Chronological skill progression across sessions</p>

          <div className="h-64 w-full">
            {analytics?.accuracy_over_time && analytics.accuracy_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.accuracy_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="cumulative_accuracy" name="Cumulative Accuracy %" stroke="#008080" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No session data matching current filters
              </div>
            )}
          </div>
        </div>

        {/* 2. Performance by Leak Location */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Performance by Leak Location</h3>
          <p className="text-xs text-slate-500 mb-4">Diagnostic accuracy across pipe branches</p>

          <div className="h-64 w-full">
            {analytics?.location_performance && analytics.location_performance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.location_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="location" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  <Bar dataKey="accuracy_percent" name="Accuracy %" fill="#008080" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No session records
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainee Diagnosis Confusion Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Class-Wise Confusion Matrix</h3>
          <p className="text-xs text-slate-500">
            Actual rig leak ground truth (rows) vs. Trainee submitted diagnosis (columns). Diagonal cells represent correct diagnoses.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                <th className="p-3 text-left">Actual Ground Truth ↓ / Trainee →</th>
                {CLASSES.map(cls => (
                  <th key={cls} className="p-3">{cls}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {analytics?.confusion_matrix?.map((row) => (
                <tr key={row.actual} className="hover:bg-slate-50">
                  <td className="p-3 text-left font-bold text-slate-800 font-sans bg-slate-50">
                    {row.actual}
                  </td>
                  {CLASSES.map(cls => {
                    const count = row[cls] || 0;
                    const isDiagonal = row.actual === cls;
                    return (
                      <td
                        key={cls}
                        className={`p-3 font-bold text-sm ${
                          isDiagonal
                            ? count > 0 ? 'bg-emerald-50 text-emerald-800' : 'text-slate-400'
                            : count > 0 ? 'bg-rose-50 text-rose-800' : 'text-slate-300'
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
