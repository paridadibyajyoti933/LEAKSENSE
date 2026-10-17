# LEAKSENSE — Intelligent Diagnostic Training & Skill Assessment Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg?style=flat-square)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local--First-003B57.svg?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Arduino](https://img.shields.io/badge/Hardware-Arduino_UNO_Q-00979D.svg?style=flat-square&logo=arduino)](https://www.arduino.cc/)
[![Tests](https://img.shields.io/badge/Pytest-100%25_Passing-brightgreen.svg?style=flat-square)](https://docs.pytest.org/)

> **LEAKSENSE** is an industrial-grade vocational training, diagnostic telemetry, and skill assessment platform tailored for Industrial Training Institute (ITI) plumbing candidates. Built for **Smart India Hackathon 2026**, it interfaces with a standardized PVC test rig or simulated physics model, providing trainees with realistic diagnostic experiences and giving instructors verifiable, automated scoring dossiers.

---

## 📌 Table of Contents

- [Problem Statement & Background](#-problem-statement--background)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [PVC Training Rig Physical Specification](#-pvc-training-rig-physical-specification)
- [Dual Operational Modes](#-dual-operational-modes)
- [Signal Processing & Machine Learning Pipeline](#-signal-processing--machine-learning-pipeline)
- [Automatic Skill Assessment Rubric](#-automatic-skill-assessment-rubric)
- [Documented Telemetry Contract](#-documented-telemetry-contract)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Installation & Setup](#-installation--setup)
- [API Reference](#-api-reference)
- [SIH 2026 10-Stage Guided Evaluation](#-sih-2026-10-stage-guided-evaluation)
- [Running Automated Tests](#-running-automated-tests)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🎯 Problem Statement & Background

Non-Revenue Water (NRW) due to pipeline leakage accounts for up to 40% of municipal water losses in developing infrastructure. Conventional leak detection training in vocational institutions (ITIs) relies on destructive, ad-hoc physical demonstrations lacking objective evaluation.

**LEAKSENSE** resolves this gap:
- **Standardized Diagnostic Rig:** Three controlled leak ports (Left, Centre, Right) along a PVC pipeline loop.
- **Transducer Instrumentation:** Dual contact acoustic transducers (piezo-accelerometers) and an in-line piezoresistive pressure transmitter.
- **Edge TinyML:** Offline classification on Arduino UNO Q microcontrollers without requiring continuous cloud dependencies.
- **Ground-Truth Isolated Assessment:** Instructors configure hidden pipe leaks; trainees diagnose using real-time waveforms and pressure metrics. The system calculates objective scores based on time, accuracy, independence, and compliance.

---

## 🏗 System Architecture

```
                                  PHYSICAL OR VIRTUAL TEST RIG
                   ┌─────────────────────────────────────────────────────────┐
                   │  Tank (TK-01) ── Pump (P-01) ── PVC Loop (Schedule 40)  │
                   │    AT-01A (200mm) ── Valve-L ── PT-01 ── Valve-C        │
                   │             Valve-R ── AT-01B (800mm)                   │
                   └────────────────────────────┬────────────────────────────┘
                                                │
                                                ▼
                                    ARDUINO UNO Q MICROCONTROLLER
                   ┌─────────────────────────────────────────────────────────┐
                   │  • 1000 Hz Sampling & Feature Extraction (RMS, FFT)     │
                   │  • Edge Random Forest / TinyML Offline Inference        │
                   │  • Serial / WiFi Telemetry Packet Broadcaster           │
                   └────────────────────────────┬────────────────────────────┘
                                                │  JSON Contract (HTTP / WS)
                                                ▼
                                       FASTAPI CORE BACKEND
                   ┌─────────────────────────────────────────────────────────┐
                   │  • REST Endpoints & WebSocket Server (/ws/telemetry)    │
                   │  • Deterministic Synthetic Acoustic & Pressure Physics  │
                   │  • Pluggable Scikit-Learn Model Adapter                 │
                   │  • 4-Factor Candidate Scoring Engine                    │
                   │  • Local-First SQLite Persistence                       │
                   │  • Offline-First Cloud Sync Queue (Firebase-ready)      │
                   │  • ReportLab Official PDF Dossier Generation            │
                   └────────────────────────────┬────────────────────────────┘
                                                │  JSON REST + WebSocket
                                                ▼
                                    REACT + TYPESCRIPT DASHBOARD
                   ┌─────────────────────────────────────────────────────────┐
                   │  • Industrial Instrumentation Aesthetic (Dark Steel)    │
                   │  • Interactive CAD P&ID Rig Schematic with Water Flow   │
                   │  • Multichannel Real-Time Oscilloscope Visualizer       │
                   │  • Candidate Evaluation Terminal (Isolated Ground Truth)│
                   │  • Class-Wise Confusion Matrix & Progress Analytics     │
                   │  • 10-Stage SIH Demonstration Walkthrough Modal         │
                   └─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Industrial Instrumentation Aesthetic:**
   - Designed using industrial instrumentation conventions (Siemens / Schneider / Bosch Rexroth control surfaces).
   - High-contrast precision typography (`Plus Jakarta Sans` and `JetBrains Mono`).
   - Physical-style LED channel indicators (`led-green`, `led-amber`, `led-red`).
   - CAD-style Schedule 40 PVC piping diagram with hydraulic flow animations.

2. **Interactive PVC Training Rig Simulator:**
   - 100% functional without hardware for demonstration purposes.
   - Configurable leak locations: `No Leak`, `Left`, `Centre`, `Right`.
   - Variable leak severities: `Small` (pin-hole), `Medium` (joint fissure), `Large` (pipe crack).
   - Adjustable pump flow (20% – 100%) and acoustic noise floor.

3. **Multichannel Oscilloscope Visualizer:**
   - Real-time telemetry streaming via WebSockets at 10 Hz (100ms refresh).
   - Channel 1 (Sensor A RMS), Channel 2 (Sensor B RMS), and Channel 3 (Pressure kPa).
   - 15s / 30s / 50s time-window buffering and Freeze/Resume capabilities.
   - Raw waveform visualization mode with explicit `UNAVAILABLE` labeling when real hardware transmits RMS-only features to uphold engineering integrity.

4. **Blind Assessment Mode with Ground-Truth Isolation:**
   - The instructor configures concealed faults.
   - Sensitive ground-truth and AI predictions are scrubbed from trainee-facing API responses.
   - Candidate operates an assessment terminal with a live stopclock and pushbuttons.

5. **Objective 4-Factor Rubric & PDF Dossiers:**
   - Transparent scoring out of 100 points.
   - Immediate feedback with technical suggestions.
   - Downloadable, printable evaluation dossiers compiled using ReportLab.

6. **Performance Analytics & Confusion Matrix:**
   - Cumulative accuracy tracking across training history.
   - Class-wise confusion matrix ($4 \times 4$) mapping actual faults against candidate submissions.
   - Speed benchmarks and difficulty breakdown.

---

## 📐 PVC Training Rig Physical Specification

| Component | Tag | Coordinate / Position | Purpose |
| :--- | :--- | :--- | :--- |
| **Water Reservoir** | TK-101 | 0 mm | Closed-loop suction supply |
| **Circulation Pump** | P-01 | 100 mm | Centrifugal pump with baseline vibration |
| **Acoustic Transducer A** | AT-01A | 200 mm | Piezo contact sensor (Left branch proximity) |
| **Leak Port Left** | VALVE-L | 350 mm | Controlled needle valve breach point |
| **Pressure Transmitter** | PT-01 | 500 mm | In-line piezoresistive gauge (0–300 kPa) |
| **Leak Port Centre** | VALVE-C | 500 mm | Midpoint tee breach point |
| **Leak Port Right** | VALVE-R | 650 mm | Controlled needle valve breach point |
| **Acoustic Transducer B** | AT-01B | 800 mm | Piezo contact sensor (Right branch proximity) |

---

## 🔄 Dual Operational Modes

### 1. Simulation Mode (`SIMULATED`)
- Operates completely stand-alone without physical rig hardware.
- Generates reproducible time-series signals modeling exponential acoustic attenuation:
  $$A_{sensor} = A_{leak} \cdot e^{-\alpha \cdot |x_{sensor} - x_{leak}|} + A_{pump} + \mathcal{N}(0, \sigma^2)$$
- Hydraulic pressure drop scales with leak aperture severity.
- All simulator outputs are prominently tagged `SIMULATED` across cards, charts, and API schemas.

### 2. Live Hardware Mode (`LIVE_HARDWARE`)
- Connects directly to an Arduino UNO Q microcontroller over USB-Serial (`COM3`, 115200 baud) or WiFi REST socket.
- Receives physical sensor telemetry and plots empirical features.
- If physical raw waveforms are not transmitted, the oscilloscope view cleanly indicates raw waveform unavailability rather than fabricating synthetic data.

---

## 🧠 Signal Processing & Machine Learning Pipeline

The backend includes a modular **Inference Adapter** (`app/ml_adapter.py`) that abstracts:

1. **Feature Extraction:**
   - Vibration Root-Mean-Square (RMS A & B): $\text{RMS} = \sqrt{\frac{1}{N}\sum_{i=1}^N v_i^2}$
   - Energy Ratio: $R = \frac{\text{RMS}_A}{\text{RMS}_B + \epsilon}$
   - Pressure Delta: $\Delta P = P - 150.0\text{ kPa}$
   - Dominant Spectral Frequency ($f_{\text{dom}}$) via FFT peak detection.

2. **Inference Engines:**
   - **Simulated Classifier:** Deterministic physical decision rule calibrated to rig geometry.
   - **Validated Scikit-Learn Random Forest:** 4-class classifier (`No Leak`, `Left`, `Centre`, `Right`) trained with calibrated probabilities (`predict_proba`).
   - **Hardware On-Device Model:** Accepts TinyML predictions directly from Arduino UNO Q.

---

## 📊 Automatic Skill Assessment Rubric

Scoring is computed objectively from session telemetry records:

$$\text{Total Score} = \frac{\text{Score}_{\text{correct}} + \text{Score}_{\text{time}} + \text{Score}_{\text{indep}} + \text{Score}_{\text{comp}}}{\text{Max Assessed Points}} \times 100$$

| Dimension | Points | Description |
| :--- | :--- | :--- |
| **Diagnostic Correctness** | **50 pts** | Awarded for an exact match between candidate submission and rig ground truth. |
| **Diagnosis Speed** | **20 pts** | Evaluated against baseline: Easy (&le;60s), Medium (&le;35s), Hard (&le;20s). Decays toward 4 pts if prolonged. |
| **Independent Completion** | **20 pts** | Starts at 20 pts. Deducts 6 pts per requested hint and 4 pts per re-attempt. |
| **Procedure Compliance** | **10 pts** | Instructor observation (PPE, valve safety). If unobserved, recorded as `NOT ASSESSED` (never assumed 100%). |

### Performance Categories:
- **Mastery (Level 4):** $\ge 85.0\%$
- **Competent (Level 3):** $70.0\% - 84.9\%$
- **Developing (Level 2):** $50.0\% - 69.9\%$
- **Novice (Level 1):** $< 50.0\%$

---

## 📡 Documented Telemetry Contract

External devices (Arduino UNO Q, ESP32, or third-party simulators) transmit telemetry via `POST /api/telemetry/ingest`:

```json
{
  "device_id": "UNOQ-001",
  "timestamp": "2026-10-17T10:00:00Z",
  "pressure_kpa": 144.2,
  "vibration_a_rms": 0.28,
  "vibration_b_rms": 0.08,
  "dominant_freq_a": 650.0,
  "dominant_freq_b": 240.0,
  "energy_ratio": 3.5,
  "pressure_deviation": -5.8,
  "predicted_class": "Left",
  "confidence": 0.89,
  "model_version": "tinyml-unoq-v1",
  "source": "hardware"
}
```

---

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS (Custom industrial palette: `#0a192f`, `#f1f5f9`, `#0284c7`)
- **Charts:** Recharts (High-frequency multi-line graphs & bar analytics)
- **Icons:** Lucide React
- **Routing:** React Router v7

### Backend
- **Framework:** FastAPI (Python 3.12)
- **ASGI Server:** Uvicorn with standard WebSockets
- **Database ORM:** SQLAlchemy with SQLite
- **Validation:** Pydantic v2
- **Data & ML:** NumPy, SciPy, Scikit-learn (RandomForestClassifier)
- **PDF Generation:** ReportLab
- **Testing:** Pytest & Pytest-asyncio

---

## 📂 Repository Structure

```
Leaksense/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app, CORS, routes & /ws/telemetry
│   │   ├── config.py          # App settings & rubric weight configuration
│   │   ├── database.py        # SQLAlchemy SQLite session manager
│   │   ├── models.py          # Trainee, TrainingSession, Device, Telemetry
│   │   ├── schemas.py         # Pydantic validation contracts
│   │   ├── simulation.py      # PVC Rig synthetic physics generator
│   │   ├── ml_adapter.py      # Pluggable ML inference engines
│   │   ├── scoring.py         # 4-factor objective assessment rubric
│   │   ├── cloud_sync.py      # Offline-first local queue manager
│   │   ├── reports.py         # ReportLab PDF & CSV generators
│   │   ├── seed.py            # Database seeder with realistic ITI records
│   │   └── routes/
│   │       ├── trainees.py    # Trainee directory CRUD
│   │       ├── sessions.py    # Session lifecycle & blind assessment
│   │       ├── telemetry.py   # Telemetry ingest, stream buffer, CSV
│   │       ├── devices.py     # Arduino UNO Q device registry
│   │       ├── analytics.py   # Confusion matrix & performance stats
│   │       ├── reports.py     # PDF & CSV download endpoints
│   │       └── demo.py        # SIH 10-step evaluator demo engine
│   ├── tests/
│   │   └── test_leaksense.py  # 5 comprehensive automated tests
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx             # Navy sidebar, status bar & demo trigger
│   │   │   ├── PvcRigSimulator.tsx    # Interactive SVG P&ID rig schematic
│   │   │   ├── LiveWaveformChart.tsx  # Oscilloscope visualizer with Recharts
│   │   │   ├── MlDiagnosticsPanel.tsx # Class probabilities & feature vector
│   │   │   └── SihDemoModal.tsx       # 10-stage guided evaluation walkthrough
│   │   ├── pages/
│   │   │   ├── Overview.tsx           # 10 KPI tiles, live charts, audit logs
│   │   │   ├── LiveMonitoring.tsx     # Sensor health & spectral analysis
│   │   │   ├── VirtualRig.tsx         # Fault injection & scenario presets
│   │   │   ├── TrainingSessions.tsx   # Session management & start/cancel
│   │   │   ├── TraineeAssessment.tsx  # Candidate blind evaluation terminal
│   │   │   ├── PerformanceAnalytics.tsx# Confusion matrix & accuracy curves
│   │   │   ├── TraineeRecords.tsx     # ITI candidate directory & history
│   │   │   ├── ReportsPage.tsx        # Official PDF dossiers & CSV exports
│   │   │   ├── DeviceManagement.tsx   # Hardware bus & packet injector
│   │   │   └── SettingsPage.tsx       # Rubric weights & offline parameters
│   │   ├── services/
│   │   │   ├── api.ts                 # Typed REST client
│   │   │   └── websocket.ts           # Resilient WebSocket hook with polling
│   │   ├── types/
│   │   │   └── index.ts               # Complete TypeScript interfaces
│   │   ├── App.tsx                    # Route definitions
│   │   ├── index.css                  # Industrial engineering CSS tokens
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/paridadibyajyoti933/LEAKSENSE.git
cd LEAKSENSE
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Seed realistic demonstration database
python -m app.seed

# Launch FastAPI ASGI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at:
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

### 3. Frontend Setup
```bash
cd ../frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser to:
- **LEAKSENSE Console:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and simulator status |
| `GET` | `/api/telemetry/latest` | Latest sensor readings (hardware or simulation) |
| `POST` | `/api/telemetry/ingest` | Ingest external Arduino UNO Q telemetry packet |
| `GET` | `/api/telemetry/simulator/config` | Read active PVC rig parameters |
| `POST` | `/api/telemetry/simulator/config` | Update leak location, severity, and flow |
| `GET` | `/api/telemetry/export-csv` | Download raw telemetry time-series as CSV |
| `GET` | `/api/sessions` | List training sessions (`role=trainer` or `role=trainee`) |
| `POST` | `/api/sessions` | Create a new training session |
| `POST` | `/api/sessions/{id}/start` | Arm and start a session timer |
| `POST` | `/api/sessions/{id}/submit` | Commit candidate diagnosis & compute score |
| `GET` | `/api/trainees` | List enrolled ITI candidates |
| `POST` | `/api/trainees` | Enroll new candidate |
| `GET` | `/api/analytics/overview` | Summary KPI metrics for dashboard |
| `GET` | `/api/analytics/performance` | Cumulative accuracy and confusion matrix |
| `GET` | `/api/reports/session/{id}/pdf` | Download official assessment PDF dossier |
| `GET` | `/api/reports/export/csv` | Export all session records as CSV |
| `POST` | `/api/demo/trigger-step?step={n}`| Execute step $n$ of SIH walkthrough sequence |
| `POST` | `/api/demo/reset` | Restore simulator to baseline state |
| `WS` | `/ws/telemetry` | Real-time 10 Hz binary/JSON streaming socket |

---

## 🏆 SIH 2026 10-Stage Guided Evaluation

For hackathon judges and evaluators, the platform includes a **1-Click Automated Walkthrough** available via the **"SIH Demo Suite"** button on the bottom-left sidebar:

1. **Stage 1 (Initialize Simulation):** Activates circulation pump (P-01) at 75% flow.
2. **Stage 2 (Inject Concealed Fault):** Configures Left branch leak with Medium severity (concealed from candidate).
3. **Stage 3 (Sample Synthetic Telemetry):** Synthesizes physical acoustic attenuation (AT-01A receives higher amplitude).
4. **Stage 4 (Execute Offline Inference):** Scikit-Learn model classifies features and predicts "Left" (88% margin).
5. **Stage 5 (Arm Candidate Assessment):** Starts trainee session timer; enforces ground-truth isolation.
6. **Stage 6 (Submit Trainee Finding):** Candidate independently diagnoses and commits "Left".
7. **Stage 7 (Compute Objective Rubric):** Calculates score (94.0%, Mastery level).
8. **Stage 8 (Persist Record to SQLite):** Validates local-first ACID storage transaction.
9. **Stage 9 (Aggregate Training Analytics):** Refreshes candidate confusion matrix and accuracy curve.
10. **Stage 10 (Export Official Dossier):** Generates and downloads the verified ReportLab PDF assessment dossier.

---

## 🧪 Running Automated Tests

A comprehensive Pytest test suite validates core business logic, safety constraints, and scoring integrity:

```bash
cd backend
python -m pytest tests/test_leaksense.py -v
```

### Verified Test Cases:
- `test_simulation_generator`: Verifies reproducible acoustic attenuation physics, pressure drop, and explicit simulation tagging.
- `test_scoring_rubric`: Validates 50/20/20/10 weight scoring, hint penalties, and unassessed compliance handling.
- `test_ground_truth_isolation`: Confirms that candidate endpoints scrub ground-truth leakage and AI predictions during active assessment.
- `test_report_generation`: Validates ReportLab PDF binary document compilation.
- `test_cloud_sync_queue`: Verifies offline SQLite queuing and sync queue states.

---

## 📄 License & Acknowledgments

Developed for **Smart India Hackathon 2026** under the theme *Smart Automation / Clean Water & Sanitation*.

Built by **Dibyajyoti Parida** & Team.
Distributed under the **MIT License**.
