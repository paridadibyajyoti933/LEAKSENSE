export type LeakLocation = 'No Leak' | 'Left' | 'Centre' | 'Right';
export type LeakSeverity = 'None' | 'Small' | 'Medium' | 'Large';
export type SessionType = 'practice' | 'assessment';
export type SessionStatus = 'CREATED' | 'READY' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ProcedureCompliance = 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_ASSESSED';

export interface Trainee {
  id: number;
  trainee_id: string;
  full_name: string;
  iti_centre: string;
  trade: string;
  batch: string;
  status: string;
  enrollment_date?: string;
  created_at?: string;
  completed_sessions_count?: number;
  average_score?: number | null;
}

export interface TrainingSession {
  id: number;
  session_code: string;
  trainee_id: number;
  trainee_name?: string;
  trainee_code?: string;
  session_type: SessionType;
  status: SessionStatus;
  difficulty: Difficulty;
  ground_truth_leak?: LeakLocation | null;
  leak_severity?: LeakSeverity | null;
  trainee_diagnosis?: LeakLocation | null;
  is_correct?: boolean | null;
  duration_seconds?: number | null;
  hints_used: number;
  attempts: number;
  procedure_compliance: ProcedureCompliance;
  ai_prediction?: LeakLocation | null;
  ai_confidence?: number | null;
  ai_model_source: string;
  score_correctness?: number | null;
  score_time?: number | null;
  score_independence?: number | null;
  score_compliance?: number | null;
  total_score?: number | null;
  performance_category?: string | null;
  trainer_notes?: string | null;
  feedback_remarks?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface TelemetryPacket {
  device_id: string;
  timestamp: string;
  pressure_kpa: number;
  vibration_a_rms: number;
  vibration_b_rms: number;
  dominant_freq_a?: number;
  dominant_freq_b?: number;
  energy_ratio?: number;
  pressure_deviation?: number;
  predicted_class: LeakLocation;
  confidence: number;
  model_version: string;
  source: 'hardware' | 'simulation';
  session_id?: number | null;
  waveform_a?: number[];
  waveform_b?: number[];
  waveform_available?: boolean;
  ml_details?: {
    model_name: string;
    model_version: string;
    inference_source: string;
    predicted_class: string;
    confidence: number;
    probabilities: Record<string, number>;
    latency_ms: number;
    uncertainty_warning: boolean;
    input_quality: string;
  };
}

export interface SimulatorConfig {
  is_running: boolean;
  leak_location: LeakLocation;
  leak_severity: LeakSeverity;
  pump_flow_percent: number;
  noise_level: number;
  conceal_from_trainee: boolean;
}

export interface OverviewMetrics {
  device_connection_status: string;
  active_device_name: string;
  is_live_hardware: boolean;
  active_session_code: string | null;
  active_session_trainee: string | null;
  current_prediction: LeakLocation;
  detection_confidence: number;
  latest_pressure_kpa: number | null;
  vibration_a_rms: number | null;
  vibration_b_rms: number | null;
  completed_sessions_count: number;
  average_trainee_accuracy: number;
  average_diagnosis_time: number;
  sensor_health_a: string;
  sensor_health_b: string;
  sensor_health_pressure: string;
  cloud_sync_status: string;
  pending_sync_count: number;
}

export interface PerformanceAnalytics {
  has_data: boolean;
  total_sessions: number;
  accuracy_percent: number;
  average_time_seconds: number;
  accuracy_over_time: Array<{
    session_code: string;
    index: number;
    date: string;
    cumulative_accuracy: number;
    session_score: number;
    duration: number;
    is_correct: boolean;
  }>;
  confusion_matrix: Array<{
    actual: string;
    [key: string]: any;
  }>;
  location_performance: Array<{
    location: string;
    total_attempts: number;
    correct_attempts: number;
    accuracy_percent: number;
  }>;
  difficulty_breakdown: Array<{
    difficulty: string;
    total_sessions: number;
    accuracy_percent: number;
    average_time: number;
  }>;
  hint_dependency: Array<{
    hints_used: string;
    count: number;
    accuracy_percent: number;
  }>;
}

export interface DeviceItem {
  id: number;
  device_id: string;
  name: string;
  status: string;
  firmware_version: string;
  model_version: string;
  ip_or_port?: string;
  last_heartbeat?: string;
  last_telemetry_timestamp?: string;
  is_active: boolean;
}
