import React, { useEffect, useState } from 'react';
import {
  Users, Plus, Search, Filter, Download, UserCheck, Award,
  CheckCircle2, ChevronRight, Edit2, Archive, Phone, MapPin
} from 'lucide-react';
import { Trainee } from '../types';
import { fetchTrainees, createTrainee } from '../services/api';

export const TraineeRecords: React.FC = () => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New trainee form
  const [formData, setFormData] = useState({
    trainee_id: '',
    full_name: '',
    iti_centre: 'Govt ITI Pusa, New Delhi',
    trade: 'Plumber',
    batch: '2025-2026'
  });

  const loadTrainees = async () => {
    try {
      const data = await fetchTrainees(search || undefined);
      setTrainees(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTrainees();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrainee(formData);
      setIsModalOpen(false);
      setFormData({
        trainee_id: '',
        full_name: '',
        iti_centre: 'Govt ITI Pusa, New Delhi',
        trade: 'Plumber',
        batch: '2025-2026'
      });
      loadTrainees();
    } catch (err) {
      console.error('Failed to create trainee', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            ITI Trainee Directory & Records
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vocational candidate profiles, trade batches, and diagnostic skill assessment histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export/csv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Sessions CSV
          </a>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Enroll New Trainee
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by trainee name, ITI ID, or training centre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs border-none outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Trainees Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainees.map((t) => (
          <div key={t.id} className="industrial-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold text-sm">
                    {t.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.full_name}</h3>
                    <span className="font-mono text-[10px] text-teal-600 font-bold block">{t.trainee_id}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                  {t.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{t.iti_centre}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span>Trade: <b>{t.trade}</b></span>
                  <span>Batch: <b>{t.batch}</b></span>
                </div>
              </div>

              {/* Performance Summary Pill */}
              <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Avg Assessment:</span>
                <span className="font-bold text-teal-700 font-mono">
                  {t.average_score ? `${t.average_score}%` : 'Not Assessed'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{t.completed_sessions_count || 0} completed runs</span>
              <span className="font-semibold text-teal-600 hover:underline cursor-pointer">
                View History →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Trainee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Enroll ITI Candidate</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trainee ID (e.g. ITI-DEL-099)</label>
                <input
                  type="text"
                  required
                  placeholder="ITI-DEL-099"
                  value={formData.trainee_id}
                  onChange={(e) => setFormData({ ...formData, trainee_id: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ITI Centre</label>
                <input
                  type="text"
                  required
                  value={formData.iti_centre}
                  onChange={(e) => setFormData({ ...formData, iti_centre: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Trade</label>
                  <input
                    type="text"
                    required
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Batch</label>
                  <input
                    type="text"
                    required
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  Save Trainee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
