import {
  Trainee, TrainingSession, SimulatorConfig,
  OverviewMetrics, PerformanceAnalytics, DeviceItem, TelemetryPacket
} from '../types';

const BASE_URL = '';

export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  const res = await fetch(`${BASE_URL}/api/analytics/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

export async function fetchPerformanceAnalytics(params?: { trainee_id?: number; difficulty?: string; session_type?: string }): Promise<PerformanceAnalytics> {
  const query = new URLSearchParams();
  if (params?.trainee_id) query.append('trainee_id', String(params.trainee_id));
  if (params?.difficulty) query.append('difficulty', params.difficulty);
  if (params?.session_type) query.append('session_type', params.session_type);
  
  const res = await fetch(`${BASE_URL}/api/analytics/performance?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch performance analytics');
  return res.json();
}

export async function fetchTrainees(query?: string, status?: string): Promise<Trainee[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (status) params.append('status', status);
  const res = await fetch(`${BASE_URL}/api/trainees?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch trainees');
  return res.json();
}

export async function createTrainee(data: Partial<Trainee>): Promise<Trainee> {
  const res = await fetch(`${BASE_URL}/api/trainees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create trainee');
  }
  return res.json();
}

export async function fetchSessions(role: 'trainer' | 'trainee' = 'trainer', trainee_id?: number): Promise<TrainingSession[]> {
  const params = new URLSearchParams({ role });
  if (trainee_id) params.append('trainee_id', String(trainee_id));
  const res = await fetch(`${BASE_URL}/api/sessions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function createSession(data: {
  trainee_id: number;
  session_type: string;
  difficulty: string;
  ground_truth_leak: string;
  leak_severity: string;
  trainer_notes?: string;
}): Promise<TrainingSession> {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function startSession(sessionId: number): Promise<TrainingSession> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start session');
  return res.json();
}

export async function cancelSession(sessionId: number): Promise<TrainingSession> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to cancel session');
  return res.json();
}

export async function submitDiagnosis(sessionId: number, data: {
  trainee_diagnosis: string;
  hints_used: number;
  attempts: number;
  duration_seconds?: number;
  procedure_compliance?: string;
}): Promise<TrainingSession> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to submit diagnosis');
  }
  return res.json();
}

export async function updateTrainerSession(sessionId: number, data: {
  procedure_compliance?: string;
  trainer_notes?: string;
}): Promise<TrainingSession> {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/trainer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update session');
  return res.json();
}

export async function fetchSimulatorConfig(): Promise<SimulatorConfig> {
  const res = await fetch(`${BASE_URL}/api/telemetry/simulator/config`);
  if (!res.ok) throw new Error('Failed to fetch simulator config');
  return res.json();
}

export async function updateSimulatorConfig(config: SimulatorConfig): Promise<SimulatorConfig> {
  const res = await fetch(`${BASE_URL}/api/telemetry/simulator/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update simulator config');
  return res.json();
}

export async function fetchLatestTelemetry(): Promise<TelemetryPacket> {
  const res = await fetch(`${BASE_URL}/api/telemetry/latest`);
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  return res.json();
}

export async function fetchSensorDiagnostics() {
  const res = await fetch(`${BASE_URL}/api/telemetry/diagnostics`);
  if (!res.ok) throw new Error('Failed to fetch diagnostics');
  return res.json();
}

export async function fetchDevices(): Promise<DeviceItem[]> {
  const res = await fetch(`${BASE_URL}/api/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function registerDevice(data: { device_id: string; name: string; firmware_version?: string; ip_or_port?: string }): Promise<DeviceItem> {
  const res = await fetch(`${BASE_URL}/api/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register device');
  return res.json();
}

export async function ingestTelemetryPacket(packet: any) {
  const res = await fetch(`${BASE_URL}/api/telemetry/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packet)
  });
  if (!res.ok) throw new Error('Failed to ingest telemetry');
  return res.json();
}

export async function triggerDemoStep(step: number) {
  const res = await fetch(`${BASE_URL}/api/demo/trigger-step?step=${step}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger demo step');
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
  return res.json();
}
