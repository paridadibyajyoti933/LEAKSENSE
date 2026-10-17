import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { Play, Pause, Download, AlertCircle, Waves, Gauge } from 'lucide-react';
import { TelemetryPacket } from '../types';

interface LiveWaveformChartProps {
  history: TelemetryPacket[];
  latestTelemetry?: TelemetryPacket | null;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const LiveWaveformChart: React.FC<LiveWaveformChartProps> = ({
  history,
  latestTelemetry,
  isPaused,
  onTogglePause
}) => {
  const [timeWindow, setTimeWindow] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'acoustic' | 'pressure' | 'raw_waveform'>('acoustic');

  const filteredHistory = history.slice(-timeWindow);

  const chartData = filteredHistory.map((item, idx) => ({
    time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString().slice(3) : `#${idx}`,
    vibrationA: item.vibration_a_rms,
    vibrationB: item.vibration_b_rms,
    pressure: item.pressure_kpa,
    energyRatio: item.energy_ratio || Number((item.vibration_a_rms / (item.vibration_b_rms + 0.0001)).toFixed(2))
  }));

  const rawWaveformData = (latestTelemetry?.waveform_a && latestTelemetry?.waveform_b)
    ? latestTelemetry.waveform_a.slice(0, 50).map((valA, idx) => ({
        point: idx,
        sensorA: valA,
        sensorB: latestTelemetry.waveform_b?.[idx] ?? 0
      }))
    : [];

  const handleExportCsv = () => {
    window.open('/api/telemetry/export-csv', '_blank');
  };

  const isSimulated = latestTelemetry?.source === 'simulation';

  return (
    <div className="industrial-panel overflow-hidden">
      {/* Chart Top Controls */}
      <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/90 p-0.5 rounded">
            <button
              onClick={() => setActiveTab('acoustic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === 'acoustic'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-blue-600" />
              <span>CH1 / CH2 Acoustic RMS</span>
            </button>
            <button
              onClick={() => setActiveTab('pressure')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === 'pressure'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-slate-700" />
              <span>CH3 Pipeline Pressure (kPa)</span>
            </button>
            <button
              onClick={() => setActiveTab('raw_waveform')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeTab === 'raw_waveform'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Oscilloscope Window (1 kHz)</span>
            </button>
          </div>

          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
            isSimulated
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}>
            {isSimulated ? 'SRC: SYNTHETIC_TELEMETRY' : 'SRC: ARDUINO_UNO_Q'}
          </span>
        </div>

        {/* Time Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-600 mr-2 font-mono">
            <span>Buffer:</span>
            {[15, 30, 50].map(windowSize => (
              <button
                key={windowSize}
                onClick={() => setTimeWindow(windowSize)}
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  timeWindow === windowSize
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {windowSize}s
              </button>
            ))}
          </div>

          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              isPaused
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isPaused ? 'Resume' : 'Freeze'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="p-4 bg-white">
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <AlertCircle className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-mono">Synchronizing telemetry channel...</p>
          </div>
        ) : activeTab === 'acoustic' ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 'dataMax + 0.05']} tickLine={false} fontFamily="monospace" unit=" V" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="vibrationA"
                  name="CH1: Sensor A (Left Branch) RMS"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="vibrationB"
                  name="CH2: Sensor B (Right Branch) RMS"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : activeTab === 'pressure' ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} domain={[80, 180]} tickLine={false} fontFamily="monospace" unit=" kPa" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  name="CH3: Gauge Pressure Transducer (kPa)"
                  stroke="#1e3a8a"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full">
            {latestTelemetry?.waveform_available && rawWaveformData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rawWaveformData} margin={{ top: 8, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                  <XAxis dataKey="point" stroke="#64748b" fontSize={10} label={{ value: 'Sample Index (1 kHz)', position: 'insideBottom', offset: -4, fontSize: 9 }} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[-0.4, 0.4]} unit=" V" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '4px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="linear" dataKey="sensorA" name="Waveform CH1 (Acoustic A)" stroke="#0284c7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="linear" dataKey="sensorB" name="Waveform CH2 (Acoustic B)" stroke="#d97706" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 border border-dashed border-slate-300 rounded p-6">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <span className="text-xs font-mono font-bold text-slate-800">Genuine Raw Oscilloscope Stream Unavailable</span>
                <span className="text-[11px] text-slate-500 max-w-md text-center">
                  Arduino UNO Q sends calibrated RMS features. To prevent misleading interpretations, raw continuous waveforms are not fabricated from RMS values.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Engineering Measurement Strip */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-sans">RMS Ratio (A / B)</span>
          <span className="font-bold text-slate-800 text-sm">
            {latestTelemetry?.energy_ratio?.toFixed(3) ?? '1.000'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-sans">Dominant Freq A</span>
          <span className="font-bold text-slate-800 text-sm">
            {latestTelemetry?.dominant_freq_a ?? 60.0} Hz
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-sans">Dominant Freq B</span>
          <span className="font-bold text-slate-800 text-sm">
            {latestTelemetry?.dominant_freq_b ?? 60.0} Hz
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-sans">Pressure Variance</span>
          <span className={`font-bold text-sm ${
            (latestTelemetry?.pressure_deviation ?? 0) < -10 ? 'text-rose-700' : 'text-slate-800'
          }`}>
            {latestTelemetry?.pressure_deviation?.toFixed(1) ?? '0.0'} kPa
          </span>
        </div>
      </div>
    </div>
  );
};
