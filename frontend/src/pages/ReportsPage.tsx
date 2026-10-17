import React, { useEffect, useState } from 'react';
import {
  FileText, Download, Printer, CheckCircle2, AlertTriangle,
  Calendar, Award, User, Clock
} from 'lucide-react';
import { TrainingSession } from '../types';
import { fetchSessions } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  useEffect(() => {
    fetchSessions('trainer').then(setSessions).catch(() => {});
  }, []);

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Assessment Reports & Dossiers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Download verified PDF diagnostic assessment dossiers and full CSV tabular archives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export/csv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export All Sessions CSV
          </a>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">Individual Assessment Dossiers</h3>
          <p className="text-xs text-slate-500">
            Official PDF reports formatted with scoring rubrics, ground-truth comparison, and trainer remarks.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <th className="p-4">Session Code</th>
                <th className="p-4">Trainee Candidate</th>
                <th className="p-4">Type</th>
                <th className="p-4">Actual Ground Truth</th>
                <th className="p-4">Diagnosis</th>
                <th className="p-4">Score</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-900">{s.session_code}</td>
                  <td className="p-4 font-semibold text-slate-800">{s.trainee_name || 'Rahul Sharma'}</td>
                  <td className="p-4 capitalize text-slate-600">{s.session_type}</td>
                  <td className="p-4 font-bold text-slate-700">{s.ground_truth_leak}</td>
                  <td className="p-4 font-medium text-slate-900">{s.trainee_diagnosis}</td>
                  <td className="p-4 font-black text-teal-700">{s.total_score}%</td>
                  <td className="p-4">
                    <span className="text-[11px] font-semibold text-slate-600">
                      {s.performance_category?.split('(')[0] || 'Competent'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={`/api/reports/session/${s.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 border border-teal-300 text-teal-800 hover:bg-teal-100 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" /> Download PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
