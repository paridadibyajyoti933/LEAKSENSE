import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Wrench, Calendar, Award, BarChart3,
  Users, FileText, Cpu, Settings, PlayCircle, HardDrive, Wifi,
  Sliders, ShieldCheck, Database
} from 'lucide-react';
import { SihDemoModal } from './SihDemoModal';
import { TelemetryPacket, OverviewMetrics } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  latestTelemetry?: TelemetryPacket | null;
  metrics?: OverviewMetrics | null;
}

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/monitoring', label: 'Live Telemetry', icon: Activity },
  { path: '/virtual-rig', label: 'PVC Rig Simulator', icon: Wrench },
  { path: '/sessions', label: 'Training Sessions', icon: Calendar },
  { path: '/assessment', label: 'Trainee Assessment', icon: Award },
  { path: '/analytics', label: 'Skill Analytics', icon: BarChart3 },
  { path: '/trainees', label: 'Trainee Records', icon: Users },
  { path: '/reports', label: 'Audit Reports', icon: FileText },
  { path: '/devices', label: 'Hardware Bus', icon: Cpu },
  { path: '/settings', label: 'System Settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children, latestTelemetry, metrics }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isSimulated = latestTelemetry ? latestTelemetry.source === 'simulation' : true;
  const isHardware = !isSimulated;

  return (
    <div className="flex h-screen bg-slate-100/90 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-[#0a192f] text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 z-20">
        <div>
          {/* Engineering Brand Header */}
          <div className="px-5 py-4 border-b border-slate-800/90 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-mono font-bold text-base shadow-inner">
              LS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-widest uppercase font-mono">
                  LEAKSENSE
                </h1>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Vocational Training Rig System
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2.5 space-y-0.5">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Platform Modules
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-semibold border-l-2 border-teal-500 pl-2.5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* SIH Evaluation Walkthrough Trigger in Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-[#071324]">
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-teal-400 group-hover:text-teal-300" />
              <div className="text-left">
                <span className="block text-[11px] leading-tight text-white font-bold">SIH Demo Suite</span>
                <span className="block text-[9px] text-slate-400 font-mono">10-Step Guided Flow</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-700">
              Run
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control & Hardware Bus Status Bar */}
        <header className="h-13 bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 z-10 text-xs">
          {/* Status Metrics Strip */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Operating Mode Indicator */}
            <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded bg-slate-50 border border-slate-200">
              <span className={`led-indicator ${isHardware ? 'led-green' : 'led-amber'}`} />
              <span className="font-semibold text-slate-700">
                Mode: <span className="font-mono text-slate-900">{isHardware ? 'HARDWARE' : 'SIMULATION'}</span>
              </span>
            </div>

            {/* Hardware Bus State */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>Arduino UNO Q:</span>
              <span className={`font-mono font-bold ${isHardware ? 'text-emerald-700' : 'text-slate-600'}`}>
                {isHardware ? 'COM3 [115200 baud]' : 'SYNTHETIC_BUS'}
              </span>
            </div>

            {/* Telemetry Clock / Rate */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>Rate: <b>10.0 Hz</b> (100ms)</span>
            </div>

            {/* Local Database Engine */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Database className="w-3 h-3 text-slate-400" />
              <span>Store: <b>SQLite (Local-First)</b></span>
            </div>
          </div>

          {/* User / Session Context */}
          <div className="flex items-center gap-3">
            {metrics?.active_session_code ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Session: <b className="font-mono">{metrics.active_session_code}</b></span>
              </div>
            ) : (
              <span className="hidden sm:inline-block text-slate-400 font-mono text-[11px]">
                STANDBY_IDLE
              </span>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right">
                <span className="font-bold text-slate-800 block text-xs leading-none">ITI Lab Bench 1</span>
                <span className="text-[10px] text-slate-400 font-mono leading-none">Instructor Console</span>
              </div>
              <div className="w-7 h-7 rounded bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
                INS
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-5 bg-[#f1f5f9]">
          <div className="max-w-[1400px] mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>

      {/* SIH Demo Walkthrough Modal */}
      <SihDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigateTo={(path) => {
          setIsDemoModalOpen(false);
          navigate(path);
        }}
      />
    </div>
  );
};
