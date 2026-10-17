import React, { useEffect, useState } from 'react';
import {
  Cpu, Wifi, WifiOff, Plus, Send, CheckCircle2, AlertTriangle,
  Code, Activity, Radio, RefreshCw
} from 'lucide-react';
import { DeviceItem, TelemetryPacket } from '../types';
import { fetchDevices, registerDevice, ingestTelemetryPacket } from '../services/api';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: 'UNOQ-002',
    name: 'Arduino UNO Q Rig Module (Lab Bench B)',
    firmware_version: '1.0.4-unoq',
    ip_or_port: 'COM4'
  });

  // Test Telemetry Ingestion packet editor
  const [samplePacket, setSamplePacket] = useState<string>(JSON.stringify({
    device_id: 'UNOQ-001',
    timestamp: new Date().toISOString(),
    pressure_kpa: 144.2,
    vibration_a_rms: 0.28,
    vibration_b_rms: 0.08,
    predicted_class: 'Left',
    confidence: 0.89,
    model_version: 'tinyml-unoq-v1',
    source: 'hardware'
  }, null, 2));

  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  const loadDevices = async () => {
    try {
      const list = await fetchDevices();
      setDevices(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerDevice(newDevice);
      setIsRegisterOpen(false);
      loadDevices();
    } catch (err) {
      console.error('Failed to register device', err);
    }
  };

  const handleSendTestTelemetry = async () => {
    try {
      const parsed = JSON.parse(samplePacket);
      parsed.timestamp = new Date().toISOString();
      const res = await ingestTelemetryPacket(parsed);
      setIngestStatus(`Success: Ingested hardware packet (${res.received_at})`);
      setTimeout(() => setIngestStatus(null), 4000);
      loadDevices();
    } catch (err: any) {
      setIngestStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Arduino UNO Q & Device Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hardware interface contracts, TinyML on-device inference reception, and telemetry gateway.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register UNO Q Unit
        </button>
      </div>

      {/* Connected Hardware Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.id} className="industrial-card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-teal-400 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{d.name}</h3>
                  <span className="font-mono text-xs text-teal-600 font-bold block">{d.device_id}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                d.status === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {d.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Port / Bus</span>
                <span className="font-semibold text-slate-800">{d.ip_or_port || 'USB-Serial'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Firmware</span>
                <span className="font-semibold text-slate-800">{d.firmware_version}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">On-Board Model</span>
                <span className="font-semibold text-slate-800">{d.model_version}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Last Heartbeat</span>
                <span className="font-semibold text-slate-800">
                  {d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* JSON Telemetry Contract Specification */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Documented UNO Q JSON Telemetry Contract
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            REST Endpoint: POST /api/telemetry/ingest
          </span>
        </div>

        <p className="text-xs text-slate-600">
          Arduino UNO Q firmware runs feature extraction and offline TinyML inference, then transmits JSON telemetry packets over Serial / WiFi / HTTP socket to this contract:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-teal-300 overflow-x-auto">
            <pre>{samplePacket}</pre>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold block text-slate-900">Contract Verification Rules:</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li><code>source</code> must be explicitly <code>"hardware"</code> or <code>"simulation"</code>.</li>
                <li><code>vibration_a_rms</code> and <code>vibration_b_rms</code> must be in Volts RMS.</li>
                <li><code>pressure_kpa</code> represents hydraulic gauge pressure in kPa.</li>
                <li>Raw waveforms are labeled unavailable when sending RMS features only.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSendTestTelemetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow transition-all"
              >
                <Send className="w-4 h-4" /> Inject Hardware Test Packet
              </button>
              {ingestStatus && (
                <span className="text-xs font-semibold text-emerald-700">
                  {ingestStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Register Device Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Register Arduino UNO Q Hardware</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Device ID (e.g. UNOQ-002)</label>
                <input
                  type="text"
                  required
                  value={newDevice.device_id}
                  onChange={(e) => setNewDevice({ ...newDevice, device_id: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Device Label / Description</label>
                <input
                  type="text"
                  required
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Serial Port / IP</label>
                  <input
                    type="text"
                    required
                    value={newDevice.ip_or_port}
                    onChange={(e) => setNewDevice({ ...newDevice, ip_or_port: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Firmware Version</label>
                  <input
                    type="text"
                    required
                    value={newDevice.firmware_version}
                    onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
