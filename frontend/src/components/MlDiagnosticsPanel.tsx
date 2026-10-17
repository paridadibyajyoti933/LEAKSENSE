import React from 'react';
import { Cpu, AlertTriangle, ShieldCheck, Zap, Layers } from 'lucide-react';
import { TelemetryPacket, LeakLocation } from '../types';

interface MlDiagnosticsPanelProps {
  latestTelemetry?: TelemetryPacket | null;
}

const CLASSES: LeakLocation[] = ['No Leak', 'Left', 'Centre', 'Right'];

export const MlDiagnosticsPanel: React.FC<MlDiagnosticsPanelProps> = ({ latestTelemetry }) => {
  const ml = latestTelemetry?.ml_details;
  const probs = ml?.probabilities || {
    'No Leak': 0.1,
    'Left': 0.7,
    'Centre': 0.1,
    'Right': 0.1
  };

  const isSimulated = (ml?.inference_source || 'SIMULATED') === 'SIMULATED';
  const confidence = ml?.confidence ?? latestTelemetry?.confidence ?? 0.82;
  const bestClass = ml?.predicted_class ?? latestTelemetry?.predicted_class ?? 'Left';

  return (
    <div className="industrial-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-[#0f172a] text-slate-200 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800 text-teal-400 rounded border border-slate-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                ML Telemetry Inference Engine
              </h3>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                isSimulated
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {isSimulated ? 'SIMULATED_HEURISTIC_OUTPUT' : 'RANDOM_FOREST_CALIBRATED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {ml?.model_name || 'Acoustic Feature Inference'} ({ml?.model_version || 'v1.0'})
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-[10px] text-slate-400 block font-sans">Inference Latency</span>
          <span className="font-bold text-teal-400">
            {ml?.latency_ms ?? 1.4} ms
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5 bg-white">
        {/* Current State Classification */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded gap-4">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">
              Inferred Rig State
            </span>
            <div className="flex items-baseline gap-2.5 mt-1">
              <span className={`text-xl font-bold font-mono ${
                bestClass === 'No Leak' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {bestClass.toUpperCase()}
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">
                [{(confidence * 100).toFixed(1)}% probability margin]
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Input Quality: <b className="font-mono">{ml?.input_quality || 'NORMAL'}</b></span>
            </div>
            {ml?.uncertainty_warning && (
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>High Ambiguity in Acoustic Features</span>
              </div>
            )}
          </div>
        </div>

        {/* Probability Bars */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
            Class Likelihood Vector (Softmax / Probability Distribution)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CLASSES.map((cls) => {
              const p = probs[cls] ?? 0.05;
              const isSelected = cls === bestClass;
              return (
                <div
                  key={cls}
                  className={`p-2.5 rounded border ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1 font-mono">
                    <span className={isSelected ? 'font-bold text-slate-900' : 'text-slate-600'}>
                      {cls}
                    </span>
                    <span className={isSelected ? 'font-bold text-slate-900' : 'text-slate-500'}>
                      {(p * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-sm h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        isSelected ? 'bg-slate-800' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, p * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Vector Table */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200">
          <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-slate-500 uppercase font-semibold">
            <span>Inference Feature Vector [X]</span>
            <span>Sensor Readings</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">x[0]: RMS A</span>
              <span className="font-bold text-slate-800">{latestTelemetry?.vibration_a_rms.toFixed(4) ?? '0.0000'} V</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">x[1]: RMS B</span>
              <span className="font-bold text-slate-800">{latestTelemetry?.vibration_b_rms.toFixed(4) ?? '0.0000'} V</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">x[2]: Energy Ratio</span>
              <span className="font-bold text-blue-700">{latestTelemetry?.energy_ratio?.toFixed(3) ?? '1.000'}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">x[3]: Pressure Delta</span>
              <span className="font-bold text-slate-800">{( (latestTelemetry?.pressure_kpa ?? 150) - 150).toFixed(1)} kPa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
