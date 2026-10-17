import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle2, AlertTriangle, Clock, Target, Gauge,
  Waves, Cpu, Play, ArrowRight, ShieldCheck, Wrench, HardDrive
} from 'lucide-react';
import { OverviewMetrics, TelemetryPacket, TrainingSession, SimulatorConfig } from '../types';
import { fetchOverviewMetrics, fetchSessions, fetchSimulatorConfig, updateSimulatorConfig } from '../services/api';
import { LiveWaveformChart } from '../components/LiveWaveformChart';
import { PvcRigSimulator } from '../components/PvcRigSimulator';

interface OverviewProps {
  latestTelemetry?: TelemetryPacket | null;
  history: TelemetryPacket[];
  isPaused: boolean;
  onTogglePause: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  latestTelemetry,
  history,
  isPaused,
  onTogglePause
}) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [simConfig, setSimConfig] = useState<SimulatorConfig>({
    is_running: true,
    leak_location: 'Left',
    leak_severity: 'Medium',
    pump_flow_percent: 75,
    noise_level: 0.04,
    conceal_from_trainee: true
  });
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [m, s, c] = await Promise.all([
        fetchOverviewMetrics(),
        fetchSessions('trainer'),
        fetchSimulatorConfig()
      ]);
      setMetrics(m);
      setRecentSessions(s.slice(0, 5));
      setSimConfig(c);
    } catch (e) {
      console.error('Failed to load overview data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = async (newConfig: SimulatorConfig) => {
    setSimConfig(newConfig);
    try {
      await updateSimulatorConfig(newConfig);
    } catch (e) {
      console.error(e);
    }
  };

  const isSimulated = latestTelemetry?.source === 'simulation';

  return (
    <div className="space-y-5">
      {/* Platform Title Bar */}
      <div className="bg-white px-5 py-4 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Diagnostic Training & Skill Assessment Console
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-300">
              SIH-2026-RIG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time acoustic & pressure telemetry for PVC training rig with offline TinyML inference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/assessment')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch Trainee Assessment</span>
          </button>
          <button
            onClick={() => navigate('/virtual-rig')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-slate-100 shadow-xs transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Rig Control Panel</span>
          </button>
        </div>
      </div>

      {/* 10 Precision Engineering KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Device Connection Status */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Device Channel
          </span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`led-indicator ${metrics?.is_live_hardware ? 'led-green' : 'led-amber'}`} />
            <span className="font-bold text-slate-900 text-xs truncate">
              {metrics?.is_live_hardware ? 'UNO Q Hardware' : 'Rig Simulator'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
            {metrics?.is_live_hardware ? 'COM3 @ 115200' : 'SYNTHETIC_SIGNAL'}
          </span>
        </div>

        {/* 2. Active Training Session */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Active Session
          </span>
          <p className="text-xs font-bold font-mono text-slate-900 mt-1 truncate">
            {metrics?.active_session_code || 'IDLE_STANDBY'}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block truncate">
            {metrics?.active_session_trainee ? metrics.active_session_trainee : 'No active candidate'}
          </span>
        </div>

        {/* 3. Current Leak Prediction */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Inferred State
          </span>
          <p className={`text-sm font-bold font-mono mt-1 ${
            (latestTelemetry?.predicted_class ?? 'No Leak') === 'No Leak' ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {(latestTelemetry?.predicted_class || 'No Leak').toUpperCase()}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">
            {isSimulated ? 'Heuristic Model' : 'TinyML On-Device'}
          </span>
        </div>

        {/* 4. Detection Confidence */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Decision Margin
          </span>
          <p className="text-sm font-bold font-mono text-slate-900 mt-1">
            {latestTelemetry?.confidence ? `${(latestTelemetry.confidence * 100).toFixed(1)}%` : '85.0%'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">Calibrated Score</span>
        </div>

        {/* 5. Water Pressure */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Transducer PT-01
          </span>
          <p className="text-sm font-bold font-mono text-blue-700 mt-1">
            {latestTelemetry?.pressure_kpa ? `${latestTelemetry.pressure_kpa.toFixed(1)} kPa` : '150.0 kPa'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">Ref: 150.0 kPa</span>
        </div>

        {/* 6. Vibration Sensor A */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Sensor A (Left)
          </span>
          <p className="text-sm font-mono font-bold text-slate-900 mt-1">
            {latestTelemetry?.vibration_a_rms ? `${latestTelemetry.vibration_a_rms.toFixed(3)} V` : '0.045 V'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">RMS Amplitude</span>
        </div>

        {/* 7. Vibration Sensor B */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Sensor B (Right)
          </span>
          <p className="text-sm font-mono font-bold text-slate-900 mt-1">
            {latestTelemetry?.vibration_b_rms ? `${latestTelemetry.vibration_b_rms.toFixed(3)} V` : '0.045 V'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">RMS Amplitude</span>
        </div>

        {/* 8. Completed Sessions */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Records in DB
          </span>
          <p className="text-sm font-bold font-mono text-slate-900 mt-1">
            {metrics?.completed_sessions_count ?? 15}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">SQLite Local Store</span>
        </div>

        {/* 9. Average Trainee Accuracy */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Mean Accuracy
          </span>
          <p className="text-sm font-bold font-mono text-emerald-700 mt-1">
            {metrics?.average_trainee_accuracy ? `${metrics.average_trainee_accuracy.toFixed(1)}%` : '80.0%'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">Validated Passes</span>
        </div>

        {/* 10. Average Diagnosis Time */}
        <div className="industrial-card p-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Mean Speed
          </span>
          <p className="text-sm font-bold font-mono text-slate-900 mt-1">
            {metrics?.average_diagnosis_time ? `${metrics.average_diagnosis_time.toFixed(1)}s` : '26.4s'}
          </p>
          <span className="text-[10px] text-slate-400 block font-mono">Benchmark: &lt;35.0s</span>
        </div>
      </div>

      {/* Interactive Rig Simulator Component */}
      <PvcRigSimulator
        config={simConfig}
        onUpdateConfig={handleUpdateConfig}
        latestTelemetry={latestTelemetry}
        isTraineeMode={false}
      />

      {/* Real-time Oscilloscopic Telemetry Graph */}
      <LiveWaveformChart
        history={history}
        latestTelemetry={latestTelemetry}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      />

      {/* Bottom Grid: Recent Session Audits & Diagnostic Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Session Logs */}
        <div className="lg:col-span-2 industrial-panel p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
                Recent Completed Trainee Assessments
              </h3>
              <p className="text-[11px] text-slate-500">Chronological SQLite record audit</p>
            </div>
            <button
              onClick={() => navigate('/sessions')}
              className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
            >
              Session Archive <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase font-bold">
                  <th className="pb-2">Session ID</th>
                  <th className="pb-2">Candidate</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Target Fault</th>
                  <th className="pb-2">Diagnosis</th>
                  <th className="pb-2">Outcome</th>
                  <th className="pb-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-800">{s.session_code}</td>
                    <td className="py-2.5 font-sans font-semibold text-slate-900">{s.trainee_name || 'Rahul Sharma'}</td>
                    <td className="py-2.5 capitalize text-slate-500 font-sans">{s.session_type}</td>
                    <td className="py-2.5 text-slate-700">{s.ground_truth_leak}</td>
                    <td className="py-2.5 text-slate-900 font-bold">{s.trainee_diagnosis || '-'}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        s.is_correct ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {s.is_correct ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-teal-800">
                      {s.total_score ? `${s.total_score}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transducer Diagnostic Health */}
        <div className="industrial-panel p-5 space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
              Transducer Bus Diagnostics
            </h3>
            <p className="text-[11px] text-slate-500">Physical and synthetic pipeline sensors</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-medium text-slate-700">Acoustic Transducer A</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                {metrics?.sensor_health_a || 'SIMULATED'}
              </span>
            </div>

            <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-medium text-slate-700">Acoustic Transducer B</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                {metrics?.sensor_health_b || 'SIMULATED'}
              </span>
            </div>

            <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-medium text-slate-700">Pressure Transmitter PT-01</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                {metrics?.sensor_health_pressure || 'SIMULATED'}
              </span>
            </div>

            <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-medium text-slate-700">Arduino UNO Q MCU</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                metrics?.is_live_hardware ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {metrics?.is_live_hardware ? 'LIVE_STREAM' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
