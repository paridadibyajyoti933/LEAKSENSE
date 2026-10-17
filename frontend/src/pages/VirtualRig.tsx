import React, { useEffect, useState } from 'react';
import {
  Wrench, Save, RotateCcw, AlertTriangle, Droplets, Sparkles,
  CheckCircle2, Info
} from 'lucide-react';
import { PvcRigSimulator } from '../components/PvcRigSimulator';
import { SimulatorConfig, TelemetryPacket } from '../types';
import { fetchSimulatorConfig, updateSimulatorConfig } from '../services/api';

interface VirtualRigProps {
  latestTelemetry?: TelemetryPacket | null;
}

const PRESET_SCENARIOS = [
  {
    name: 'Normal Pipe Baseline',
    desc: 'Full integrity, baseline hydraulic pressure (152 kPa), uniform acoustic background.',
    leak: 'No Leak' as const,
    severity: 'None' as const,
    pump: 75,
    noise: 0.04
  },
  {
    name: 'Left Joint Seepage (Small)',
    desc: 'Minor hairline leak near Sensor A. Subtly asymmetric RMS (ratio ~1.5x).',
    leak: 'Left' as const,
    severity: 'Small' as const,
    pump: 80,
    noise: 0.03
  },
  {
    name: 'Central Coupling Rupture (Large)',
    desc: 'Severe rupture at midpoint (x=50cm). Sharp pressure drop to ~105 kPa and elevated balanced acoustic energy.',
    leak: 'Centre' as const,
    severity: 'Large' as const,
    pump: 85,
    noise: 0.05
  },
  {
    name: 'Right Elbow Failure (Medium)',
    desc: 'Acoustic energy concentrated at Sensor B (ratio ~0.4x). Significant pressure ripple.',
    leak: 'Right' as const,
    severity: 'Medium' as const,
    pump: 75,
    noise: 0.04
  }
];

export const VirtualRig: React.FC<VirtualRigProps> = ({ latestTelemetry }) => {
  const [config, setConfig] = useState<SimulatorConfig>({
    is_running: true,
    leak_location: 'Left',
    leak_severity: 'Medium',
    pump_flow_percent: 75,
    noise_level: 0.04,
    conceal_from_trainee: false
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulatorConfig().then(setConfig).catch(() => {});
  }, []);

  const handleUpdate = async (newConfig: SimulatorConfig) => {
    setConfig(newConfig);
    try {
      await updateSimulatorConfig(newConfig);
      setSaveMessage('Rig parameters synced to backend simulation engine');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    handleUpdate({
      ...config,
      leak_location: preset.leak,
      leak_severity: preset.severity,
      pump_flow_percent: preset.pump,
      noise_level: preset.noise
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Virtual PVC Training Rig Simulator
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              PHYSICAL APPROXIMATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate hydrodynamic flow, pump vibrations, acoustic attenuation, and controlled pipe leaks.
          </p>
        </div>

        {saveMessage && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveMessage}
          </div>
        )}
      </div>

      {/* Interactive Rig Simulator */}
      <PvcRigSimulator
        config={config}
        onUpdateConfig={handleUpdate}
        latestTelemetry={latestTelemetry}
        isTraineeMode={false}
      />

      {/* Preset Scenarios Gallery */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Preset Fault Scenarios</h3>
            <p className="text-xs text-slate-500">
              One-click standard plumbing fault configurations for trainee practice
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_SCENARIOS.map((p, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{p.name}</span>
                <p className="text-[11px] text-slate-500 mt-1">{p.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                  <span className="px-1.5 py-0.5 bg-white border rounded">Leak: {p.leak}</span>
                  <span className="px-1.5 py-0.5 bg-white border rounded">Sev: {p.severity}</span>
                </div>
              </div>
              <button
                onClick={() => applyPreset(p)}
                className="mt-4 w-full py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-teal-700 text-white transition-colors"
              >
                Inject Scenario
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
