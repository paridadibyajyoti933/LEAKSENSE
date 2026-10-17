import React, { useState } from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle, Droplets, Gauge,
  Activity, Sliders, Eye, EyeOff, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { SimulatorConfig, LeakLocation, LeakSeverity, TelemetryPacket } from '../types';

interface PvcRigSimulatorProps {
  config: SimulatorConfig;
  onUpdateConfig: (config: SimulatorConfig) => void;
  latestTelemetry?: TelemetryPacket | null;
  isTraineeMode?: boolean;
}

export const PvcRigSimulator: React.FC<PvcRigSimulatorProps> = ({
  config,
  onUpdateConfig,
  latestTelemetry,
  isTraineeMode = false
}) => {
  const [concealActive, setConcealActive] = useState<boolean>(isTraineeMode || config.conceal_from_trainee);

  const handleLeakSelect = (loc: LeakLocation) => {
    onUpdateConfig({
      ...config,
      leak_location: loc,
      leak_severity: loc === 'No Leak' ? 'None' : (config.leak_severity === 'None' ? 'Medium' : config.leak_severity)
    });
  };

  const handleSeveritySelect = (sev: LeakSeverity) => {
    onUpdateConfig({
      ...config,
      leak_severity: sev
    });
  };

  const handlePumpFlowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({
      ...config,
      pump_flow_percent: parseFloat(e.target.value)
    });
  };

  const handleNoiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({
      ...config,
      noise_level: parseFloat(e.target.value)
    });
  };

  const handleToggleRunning = () => {
    onUpdateConfig({
      ...config,
      is_running: !config.is_running
    });
  };

  const handleReset = () => {
    onUpdateConfig({
      is_running: true,
      leak_location: 'No Leak',
      leak_severity: 'None',
      pump_flow_percent: 75,
      noise_level: 0.04,
      conceal_from_trainee: true
    });
  };

  const isHidden = isTraineeMode || concealActive;
  const rmsA = latestTelemetry?.vibration_a_rms ?? 0.045;
  const rmsB = latestTelemetry?.vibration_b_rms ?? 0.045;
  const pressure = latestTelemetry?.pressure_kpa ?? 150.0;

  return (
    <div className="industrial-panel overflow-hidden">
      {/* Schematic Header Bar */}
      <div className="px-5 py-3 bg-[#0f172a] text-slate-200 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800 text-teal-400 rounded border border-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xs tracking-wider text-white uppercase font-mono">
                PVC Loop Test Rig Schematic [RIG-01]
              </h2>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                SIMULATED_PHYSICS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Schedule 40 PVC loop, 2x Piezo-acoustic transducers, 1x piezoresistive pressure transmitter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTraineeMode && (
            <button
              onClick={() => setConcealActive(!concealActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                concealActive
                  ? 'bg-amber-950/70 border-amber-600/60 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {concealActive ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
              <span>{concealActive ? 'Concealed (Blind Test)' : 'Ground Truth Visible'}</span>
            </button>
          )}

          <button
            onClick={handleToggleRunning}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold shadow-sm transition-colors ${
              config.is_running
                ? 'bg-rose-700 hover:bg-rose-800 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {config.is_running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{config.is_running ? 'Stop Rig' : 'Run Rig'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Engineering CAD Schematic Diagram */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="relative w-full max-w-5xl mx-auto bg-white rounded border border-slate-300 p-3 shadow-inner overflow-x-auto schematic-grid">
          <svg viewBox="0 0 900 340" className="w-full h-auto select-none min-w-[700px]">
            <defs>
              {/* Industrial PVC Pipe Gradient */}
              <linearGradient id="pvcPipeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="25%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              {/* Water Stream Gradient */}
              <linearGradient id="fluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Technical Water Spray */}
              <linearGradient id="leakSprayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* RESERVOIR TANK (x=30 to 110) */}
            <g transform="translate(30, 85)">
              <rect x="0" y="0" width="80" height="160" rx="3" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
              <rect x="4" y="40" width="72" height="114" rx="2" fill="url(#fluidGrad)" opacity="0.85" />
              <line x1="12" y1="55" x2="68" y2="55" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="40" y="24" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                TK-101
              </text>
              <text x="40" y="145" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600" fontFamily="monospace">
                WATER TANK
              </text>
            </g>

            {/* SUCTION LINE */}
            <path d="M 110 200 L 165 200" stroke="url(#pvcPipeGrad)" strokeWidth="20" strokeLinecap="square" />
            {config.is_running && (
              <path d="M 110 200 L 165 200" stroke="#0284c7" strokeWidth="7" className="hydraulic-flow" fill="none" />
            )}

            {/* CENTRIFUGAL CIRCULATION PUMP (x=165) */}
            <g transform="translate(165, 175)">
              <rect x="-5" y="-5" width="60" height="60" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
              <circle cx="25" cy="25" r="22" fill="#1e293b" />
              <circle cx="25" cy="25" r="14" fill="#0f766e" />
              {/* Impeller */}
              <g className={config.is_running ? 'animate-spin origin-center' : ''} style={{ transformOrigin: '25px 25px' }}>
                <line x1="25" y1="14" x2="25" y2="36" stroke="#ffffff" strokeWidth="2.5" />
                <line x1="14" y1="25" x2="36" y2="25" stroke="#ffffff" strokeWidth="2.5" />
              </g>
              <text x="25" y="70" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                P-01 ({config.pump_flow_percent}%)
              </text>
            </g>

            {/* MAIN PVC LOOP PIPELINE */}
            <path d="M 220 200 L 260 200 L 260 135 L 790 135 L 790 260 L 90 260 L 90 245"
                  fill="none" stroke="url(#pvcPipeGrad)" strokeWidth="24" strokeLinejoin="miter" strokeMiterlimit="4" />

            {/* Inner fluid stream */}
            {config.is_running && (
              <path d="M 220 200 L 260 200 L 260 135 L 790 135 L 790 260 L 90 260 L 90 245"
                    fill="none" stroke="#0ea5e9" strokeWidth="9" className="hydraulic-flow" strokeLinejoin="miter" />
            )}

            {/* Technical Flow Arrowheads */}
            <g fill="#0369a1" opacity="0.9">
              <polygon points="320,131 332,135 320,139" />
              <polygon points="480,131 492,135 480,139" />
              <polygon points="630,131 642,135 630,139" />
              <polygon points="786,180 790,194 794,180" />
              <polygon points="460,264 446,260 460,256" />
            </g>

            {/* SENSOR A (x = 320) */}
            <g transform="translate(320, 110)">
              {/* Clamp bracket */}
              <rect x="-12" y="0" width="24" height="48" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="0" cy="10" r="5" fill={rmsA > 0.12 ? '#d97706' : '#059669'} />
              <text x="0" y="-12" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                AT-01A
              </text>
              <text x="0" y="-2" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="sans-serif">
                Acoustic Contact
              </text>
              {/* Telemetry RMS pill */}
              <rect x="-32" y="52" width="64" height="18" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="0" y="65" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                {rmsA.toFixed(3)} V
              </text>
            </g>

            {/* LEAK POINT LEFT (x = 400) */}
            <g transform="translate(400, 135)">
              <circle cx="0" cy="0" r="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
              <circle cx="0" cy="0" r="7" fill={config.leak_location === 'Left' ? '#dc2626' : '#94a3b8'} />
              <text x="0" y="30" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="monospace">
                VALVE-L
              </text>

              {config.leak_location === 'Left' && !isHidden && (
                <g>
                  <path d="M 0 -8 L -16 -50 L 16 -50 Z" fill="url(#leakSprayGrad)" />
                  <circle cx="-6" cy="-42" r="2.5" fill="#0284c7" />
                  <circle cx="8" cy="-38" r="2" fill="#38bdf8" />
                  <text x="0" y="-55" textAnchor="middle" fill="#b91c1c" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    BREACH: LEFT [{config.leak_severity}]
                  </text>
                </g>
              )}
            </g>

            {/* PRESSURE TRANSMITTER PT-01 (x = 500) */}
            <g transform="translate(500, 110)">
              <rect x="-6" y="10" width="12" height="26" fill="#475569" />
              {/* Dial gauge with tick marks */}
              <circle cx="0" cy="-6" r="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
              <circle cx="0" cy="-6" r="17" fill="#f8fafc" />
              <line x1="-10" y1="-6" x2="-14" y2="-6" stroke="#94a3b8" strokeWidth="1" />
              <line x1="10" y1="-6" x2="14" y2="-6" stroke="#94a3b8" strokeWidth="1" />
              <line x1="0" y1="-16" x2="0" y2="-20" stroke="#94a3b8" strokeWidth="1" />
              {/* Pointer */}
              <line x1="0" y1="-6" x2={Math.min(12, Math.max(-12, (pressure - 150) * 0.35))} y2="-16"
                    stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
              <circle cx="0" cy="-6" r="2.5" fill="#0f172a" />
              <text x="0" y="-30" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                PT-01
              </text>
              <rect x="-32" y="52" width="64" height="18" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="0" y="65" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
                {pressure.toFixed(1)} kPa
              </text>
            </g>

            {/* LEAK POINT CENTRE (x = 570) */}
            <g transform="translate(570, 135)">
              <circle cx="0" cy="0" r="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
              <circle cx="0" cy="0" r="7" fill={config.leak_location === 'Centre' ? '#dc2626' : '#94a3b8'} />
              <text x="0" y="30" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="monospace">
                VALVE-C
              </text>

              {config.leak_location === 'Centre' && !isHidden && (
                <g>
                  <path d="M 0 -8 L -16 -50 L 16 -50 Z" fill="url(#leakSprayGrad)" />
                  <circle cx="-5" cy="-40" r="2.5" fill="#0284c7" />
                  <circle cx="7" cy="-35" r="2" fill="#38bdf8" />
                  <text x="0" y="-55" textAnchor="middle" fill="#b91c1c" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    BREACH: CENTRE [{config.leak_severity}]
                  </text>
                </g>
              )}
            </g>

            {/* LEAK POINT RIGHT (x = 660) */}
            <g transform="translate(660, 135)">
              <circle cx="0" cy="0" r="14" fill="#64748b" stroke="#334155" strokeWidth="2" />
              <circle cx="0" cy="0" r="7" fill={config.leak_location === 'Right' ? '#dc2626' : '#94a3b8'} />
              <text x="0" y="30" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="monospace">
                VALVE-R
              </text>

              {config.leak_location === 'Right' && !isHidden && (
                <g>
                  <path d="M 0 -8 L -16 -50 L 16 -50 Z" fill="url(#leakSprayGrad)" />
                  <circle cx="-4" cy="-42" r="2.5" fill="#0284c7" />
                  <circle cx="8" cy="-36" r="2" fill="#38bdf8" />
                  <text x="0" y="-55" textAnchor="middle" fill="#b91c1c" fontSize="10" fontWeight="bold" fontFamily="monospace">
                    BREACH: RIGHT [{config.leak_severity}]
                  </text>
                </g>
              )}
            </g>

            {/* SENSOR B (x = 740) */}
            <g transform="translate(740, 110)">
              <rect x="-12" y="0" width="24" height="48" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="0" cy="10" r="5" fill={rmsB > 0.12 ? '#d97706' : '#059669'} />
              <text x="0" y="-12" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                AT-01B
              </text>
              <text x="0" y="-2" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="sans-serif">
                Acoustic Contact
              </text>
              <rect x="-32" y="52" width="64" height="18" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
              <text x="0" y="65" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                {rmsB.toFixed(3)} V
              </text>
            </g>

            {/* Distance Baseline Annotation */}
            <g stroke="#94a3b8" strokeDasharray="3 2" opacity="0.7">
              <line x1="320" y1="215" x2="320" y2="235" />
              <line x1="400" y1="215" x2="400" y2="235" />
              <line x1="570" y1="215" x2="570" y2="235" />
              <line x1="660" y1="215" x2="660" y2="235" />
              <line x1="740" y1="215" x2="740" y2="235" />
              <line x1="320" y1="225" x2="740" y2="225" />
            </g>
            <text x="530" y="240" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">
              AT-01A (200mm) ──── L (350mm) ──── C (500mm) ──── R (650mm) ──── AT-01B (800mm)
            </text>
          </svg>

          {isHidden && (
            <div className="absolute top-4 right-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold font-mono shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              GROUND_TRUTH_ISOLATED (BLIND_TEST)
            </div>
          )}
        </div>
      </div>

      {/* Trainer Control Deck */}
      {!isTraineeMode && (
        <div className="p-4 bg-slate-50 text-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-slate-700" />
            <span className="font-bold text-slate-800 uppercase tracking-wider font-mono text-[11px]">
              Trainer Controlled Fault Injection Console
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Leak location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Target Leak Branch
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['No Leak', 'Left', 'Centre', 'Right'] as LeakLocation[]).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLeakSelect(loc)}
                    className={`py-1.5 px-2.5 rounded text-xs font-semibold border transition-all ${
                      config.leak_location === loc
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Leak Aperture Severity
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Small', 'Medium', 'Large'] as LeakSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    disabled={config.leak_location === 'No Leak'}
                    onClick={() => handleSeveritySelect(sev)}
                    className={`py-1.5 px-1.5 rounded text-xs font-semibold border transition-all ${
                      config.leak_severity === sev && config.leak_location !== 'No Leak'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 disabled:opacity-40'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Pump Flow */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase font-mono">
                <span>Centrifugal Flow</span>
                <span className="text-teal-700 font-bold">{config.pump_flow_percent}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={config.pump_flow_percent}
                onChange={handlePumpFlowChange}
                className="w-full accent-teal-700 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>20% Low</span>
                <span>75% Norm</span>
                <span>100% Max</span>
              </div>
            </div>

            {/* Background noise */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase font-mono">
                <span>Acoustic Floor Noise</span>
                <span className="text-amber-700 font-bold">{(config.noise_level * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.01"
                value={config.noise_level}
                onChange={handleNoiseChange}
                className="w-full accent-amber-700 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1% Clean</span>
                <span>10% Floor</span>
                <span>25% Rough</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
