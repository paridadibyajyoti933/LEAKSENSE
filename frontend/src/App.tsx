import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { VirtualRig } from './pages/VirtualRig';
import { TrainingSessions } from './pages/TrainingSessions';
import { TraineeAssessment } from './pages/TraineeAssessment';
import { PerformanceAnalytics } from './pages/PerformanceAnalytics';
import { TraineeRecords } from './pages/TraineeRecords';
import { ReportsPage } from './pages/ReportsPage';
import { DeviceManagement } from './pages/DeviceManagement';
import { SettingsPage } from './pages/SettingsPage';
import { useTelemetryStream } from './services/websocket';

export const App: React.FC = () => {
  const { telemetry, history, isConnected, isPaused, togglePause } = useTelemetryStream(true);

  return (
    <BrowserRouter>
      <Layout latestTelemetry={telemetry}>
        <Routes>
          <Route
            path="/"
            element={
              <Overview
                latestTelemetry={telemetry}
                history={history}
                isPaused={isPaused}
                onTogglePause={togglePause}
              />
            }
          />
          <Route
            path="/monitoring"
            element={
              <LiveMonitoring
                latestTelemetry={telemetry}
                history={history}
                isPaused={isPaused}
                onTogglePause={togglePause}
              />
            }
          />
          <Route
            path="/virtual-rig"
            element={<VirtualRig latestTelemetry={telemetry} />}
          />
          <Route
            path="/sessions"
            element={<TrainingSessions />}
          />
          <Route
            path="/assessment"
            element={
              <TraineeAssessment
                latestTelemetry={telemetry}
                history={history}
                isPaused={isPaused}
                onTogglePause={togglePause}
              />
            }
          />
          <Route
            path="/analytics"
            element={<PerformanceAnalytics />}
          />
          <Route
            path="/trainees"
            element={<TraineeRecords />}
          />
          <Route
            path="/reports"
            element={<ReportsPage />}
          />
          <Route
            path="/devices"
            element={<DeviceManagement />}
          />
          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
