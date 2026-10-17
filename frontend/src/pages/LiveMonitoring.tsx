import React, { useEffect, useState } from 'react';
import {
  Activity, Gauge, Waves, Download, ShieldAlert, Cpu, AlertTriangle,
  CheckCircle2, Radio, Zap
} from 'lucide-react';
import { TelemetryPacket } from '../types';
import { LiveWaveformChart } from '../components/LiveWaveformChart';
import { MlDiagnosticsPanel } from '../components/MlDiagnosticsPanel';
import { fetchSensorDiagnostics } from '../services/api';

interface LiveMonitoringProps {
  latestTelemetry?: TelemetryPacket | null;
  history: TelemetryPacket[];
  isPaused: boolean;
  onTogglePause: () => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({
  latestTelemetry,
  history,
  isPaused,
  onTogglePause
}) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);

  useEffect(() => {
    fetchSensorDiagnostics().then(setDiagnostics).catch(() => {});
    const interval = setInterval(() => {
      fetchSensorDiagnostics().then(setDiagnostics).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isSimulated = latestTelemetry?.source === 'simulation';

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Sensor & Telemetry Monitoring
            </h1>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
              isSimulated
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              {isSimulated ? 'SIMULATED DATA STREAM' : 'LIVE UNO Q HARDWARE STREAM'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time spectral analysis, RMS amplitudes, and pipeline hydraulic pressure signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/telemetry/export-csv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Telemetry CSV
          </a>
        </div>
      </div>

      {/* Sensor Diagnostics Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Acoustic Sensor A
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              {diagnostics?.acoustic_sensor_a === 'CONNECTED' ? 'Hardware Active' : 'Simulated Stream'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              diagnostics?.acoustic_sensor_a === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {diagnostics?.acoustic_sensor_a || 'SIMULATED'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Left Pipeline Clamp (x=20cm)</span>
        </div>

        <div className="industrial-card p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Acoustic Sensor B
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              {diagnostics?.acoustic_sensor_b === 'CONNECTED' ? 'Hardware Active' : 'Simulated Stream'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              diagnostics?.acoustic_sensor_b === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {diagnostics?.acoustic_sensor_b || 'SIMULATED'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Right Pipeline Clamp (x=80cm)</span>
        </div>

        <div className="industrial-card p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pressure Sensor
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              {diagnostics?.pressure_sensor === 'CONNECTED' ? 'Hardware Active' : 'Simulated Stream'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              diagnostics?.pressure_sensor === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {diagnostics?.pressure_sensor || 'SIMULATED'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">In-line Transducer (x=50cm)</span>
        </div>

        <div className="industrial-card p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Telemetry Rate & Age
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              10 Hz (100 ms)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              STREAM OK
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Source: {latestTelemetry?.source?.toUpperCase() || 'SIMULATION'}
          </span>
        </div>
      </div>

      {/* Real-time Streaming Charts */}
      <LiveWaveformChart
        history={history}
        latestTelemetry={latestTelemetry}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      />

      {/* Machine Learning Diagnostics Panel */}
      <MlDiagnosticsPanel latestTelemetry={latestTelemetry} />
    </div>
  );
};
