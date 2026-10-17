import math
import time
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Tuple
from .config import settings

class PvcRigSimulator:
    """
    Educational approximation of a PVC plumbing training rig:
    - Circulation pump (x = 0)
    - Acoustic Sensor A (x = 20 cm)
    - Leak Point L (x = 35 cm)
    - Leak Point C (x = 50 cm)
    - Leak Point R (x = 65 cm)
    - Acoustic Sensor B (x = 80 cm)
    - Water Pressure Sensor (x = 50 cm)
    """

    POS_PUMP = 0.0
    POS_SENSOR_A = 20.0
    POS_LEAK_L = 35.0
    POS_LEAK_C = 50.0
    POS_LEAK_R = 65.0
    POS_SENSOR_B = 80.0

    LEAK_POSITIONS = {
        "No Leak": None,
        "Left": POS_LEAK_L,
        "Centre": POS_LEAK_C,
        "Right": POS_LEAK_R
    }

    SEVERITY_FACTORS = {
        "None": 0.0,
        "Small": 1.2,
        "Medium": 2.5,
        "Large": 4.5
    }

    def __init__(self):
        self.is_running: bool = True
        self.leak_location: str = "No Leak"
        self.leak_severity: str = "None"
        self.pump_flow_percent: float = 75.0
        self.noise_level: float = 0.04
        self.conceal_from_trainee: bool = True
        self.device_id: str = "SIM-UNOQ-001"
        self.start_time: float = time.time()
        self.sample_counter: int = 0

    def configure(self, leak_location: str, leak_severity: str, pump_flow: float = 75.0, noise_level: float = 0.04):
        self.leak_location = leak_location
        self.leak_severity = leak_severity if leak_location != "No Leak" else "None"
        self.pump_flow_percent = max(10.0, min(100.0, pump_flow))
        self.noise_level = max(0.01, min(0.5, noise_level))

    def generate_packet(self, session_id: int = None) -> Dict[str, Any]:
        """
        Generates consistent, time-varying synthetic sensor packet.
        Always explicitly tagged with source='simulation'.
        """
        now = datetime.utcnow()
        t = time.time() - self.start_time
        self.sample_counter += 1

        flow_norm = self.pump_flow_percent / 100.0
        # Baseline pump vibration: ~0.04 - 0.08 RMS at sensors
        pump_vib = 0.04 * flow_norm

        leak_pos = self.LEAK_POSITIONS.get(self.leak_location)
        sev_factor = self.SEVERITY_FACTORS.get(self.leak_severity, 0.0)

        # Baseline pressure: 155 kPa at 75% flow
        base_pressure = 130.0 + (flow_norm * 30.0)
        pressure_drop = 0.0

        vib_a = pump_vib
        vib_b = pump_vib
        freq_a = 50.0 + (flow_norm * 10.0)
        freq_b = 50.0 + (flow_norm * 10.0)

        if leak_pos is not None and sev_factor > 0:
            # Distance attenuation
            dist_a = abs(self.POS_SENSOR_A - leak_pos)
            dist_b = abs(self.POS_SENSOR_B - leak_pos)

            atten_a = math.exp(-settings.ATTENUATION_COEFF * dist_a)
            atten_b = math.exp(-settings.ATTENUATION_COEFF * dist_b)

            leak_vib_base = 0.08 * sev_factor
            vib_a += leak_vib_base * atten_a
            vib_b += leak_vib_base * atten_b

            # Turbulent acoustic leak whistle frequency: ~450 - 850 Hz
            leak_freq = 600.0 + (sev_factor * 50.0)
            freq_a = (freq_a * 0.3) + (leak_freq * 0.7 * atten_a)
            freq_b = (freq_b * 0.3) + (leak_freq * 0.7 * atten_b)

            # Pressure drop
            pressure_drop = 8.0 * sev_factor

        # Add physical-like dynamic fluctuations
        fluctuation_a = math.sin(t * 2.8) * 0.005 + math.sin(t * 7.1) * 0.003
        fluctuation_b = math.sin(t * 3.1) * 0.005 + math.sin(t * 6.5) * 0.003
        pressure_ripple = math.sin(t * 1.5) * 0.8

        # Configurable noise
        noise_a = np.random.normal(0, self.noise_level * 0.05)
        noise_b = np.random.normal(0, self.noise_level * 0.05)
        noise_p = np.random.normal(0, self.noise_level * 1.5)

        rms_a = max(0.01, round(float(vib_a + fluctuation_a + noise_a), 4))
        rms_b = max(0.01, round(float(vib_b + fluctuation_b + noise_b), 4))
        pressure = max(50.0, round(float(base_pressure - pressure_drop + pressure_ripple + noise_p), 2))

        energy_ratio = round(float(rms_a / (rms_b + 1e-6)), 3)
        pressure_deviation = round(float(pressure - 150.0), 2)

        # Deterministic simulation ML prediction based on sensor physics
        predicted_class, confidence = self._calculate_simulated_prediction(rms_a, rms_b, pressure)

        # Synthetic 128-point waveform for visualization
        waveform_points = 64
        t_arr = np.linspace(0, 0.05, waveform_points)
        wave_a = (rms_a * 1.414 * np.sin(2 * np.pi * freq_a * t_arr) + np.random.normal(0, 0.01, waveform_points)).round(4).tolist()
        wave_b = (rms_b * 1.414 * np.sin(2 * np.pi * freq_b * t_arr) + np.random.normal(0, 0.01, waveform_points)).round(4).tolist()

        return {
            "device_id": self.device_id,
            "timestamp": now.isoformat() + "Z",
            "pressure_kpa": pressure,
            "vibration_a_rms": rms_a,
            "vibration_b_rms": rms_b,
            "dominant_freq_a": round(float(freq_a), 1),
            "dominant_freq_b": round(float(freq_b), 1),
            "energy_ratio": energy_ratio,
            "pressure_deviation": pressure_deviation,
            "predicted_class": predicted_class,
            "confidence": confidence,
            "model_version": "sim-rf-v1",
            "source": "simulation",  # Mandatory explicit label
            "session_id": session_id,
            "waveform_a": wave_a,
            "waveform_b": wave_b,
            "waveform_available": True
        }

    def _calculate_simulated_prediction(self, rms_a: float, rms_b: float, pressure: float) -> Tuple[str, float]:
        """
        Calculates diagnostic classification score using physical thresholds.
        Used as educational fallback simulation when hardware model is unavailable.
        """
        ratio = rms_a / (rms_b + 1e-6)
        total_rms = rms_a + rms_b

        # High pressure and low vibration -> No Leak
        if pressure > 145.0 and total_rms < 0.14:
            conf = min(0.96, max(0.70, 1.0 - (total_rms * 2)))
            return "No Leak", round(float(conf), 2)

        # Asymmetric high at A -> Left
        if ratio > 1.45:
            conf = min(0.98, max(0.75, 0.65 + (ratio * 0.1)))
            return "Left", round(float(conf), 2)

        # Asymmetric high at B -> Right
        if ratio < 0.68:
            conf = min(0.98, max(0.75, 0.65 + ((1.0 / ratio) * 0.1)))
            return "Right", round(float(conf), 2)

        # Balanced high vibration at both A & B + pressure drop -> Centre
        conf = min(0.95, max(0.72, 0.70 + (total_rms * 0.8)))
        return "Centre", round(float(conf), 2)


# Global simulator instance
rig_simulator = PvcRigSimulator()
