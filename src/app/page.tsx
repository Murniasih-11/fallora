'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar, { Page } from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import OverviewPage from '@/components/pages/OverviewPage';
import MonitoringPage from '@/components/pages/MonitoringPage';
import HistoryPage from '@/components/pages/HistoryPage';
import ResidentsPage from '@/components/pages/ResidentsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AboutPage from '@/components/pages/AboutPage';
import { useCamera } from '@/hooks/useCamera';
import { useDetectionState } from '@/hooks/useDetectionState';

export default function Home() {
  const [activePage, setActivePage] = useState<Page>('overview');
  const [sidebarWidth, setSidebarWidth] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fallora_sb_w');
      if (saved) {
        const val = parseInt(saved, 10);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (val >= 200 && val <= 380) setSidebarWidth(val);
      }
    } catch {}
  }, []);

  const handleStartResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 200), 380);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('fallora_sb_w', String(sidebarWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const {
    videoRef,
    cameraStatus,
    errorMessage,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const {
    status,
    detectionInfo,
    postFallSecondsLeft,
    fallStartTime,
    incidents,
    stats,
    isModelLoading,
    canvasRef,
    setFacingMode: setDetectionFacingMode,
    startDetection,
    stopDetection,
    resetStatus,
    updateIncident,
    clearIncidents,
  } = useDetectionState();

  const handleStartMonitoring = useCallback(async () => {
    const started = await startCamera(facingMode);
    if (started && videoRef.current) {
      await startDetection(videoRef.current, facingMode);
    }
  }, [startCamera, startDetection, videoRef, facingMode]);

  const handleSwitchCamera = useCallback(async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setDetectionFacingMode(nextMode);
    await switchCamera();
  }, [facingMode, switchCamera, setDetectionFacingMode]);

  const handleStopMonitoring = useCallback(() => {
    stopDetection();
    stopCamera();
  }, [stopDetection, stopCamera]);

  const handleReset = useCallback(() => {
    resetStatus();
  }, [resetStatus]);

  const navigateTo = useCallback((page: Page) => {
    setActivePage(page);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8F5] flex flex-col font-sans text-[#0F2421]">
      {/* Mobile nav header */}
      <MobileNav
        activePage={activePage}
        onNavigate={navigateTo}
        status={status}
        cameraStatus={cameraStatus}
        stats={stats}
      />

      {/* Desktop layout */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar with resizable width */}
        <div
          className="hidden md:flex md:flex-col shrink-0 transition-[width] duration-75"
          style={{ width: sidebarWidth }}
        >
          <div
            className="fixed top-0 left-0 bottom-0 z-20 transition-[width] duration-75"
            style={{ width: sidebarWidth }}
          >
            <Sidebar
              activePage={activePage}
              onNavigate={navigateTo}
              status={status}
              cameraStatus={cameraStatus}
              stats={stats}
              onStartResize={handleStartResize}
            />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activePage === 'overview' && (
              <OverviewPage
                systemStatus={status}
                cameraStatus={cameraStatus}
                isModelLoading={isModelLoading}
                stats={stats}
                incidents={incidents}
                onStartMonitoring={handleStartMonitoring}
                onNavigateMonitoring={() => navigateTo('monitoring')}
                onNavigateHistory={() => navigateTo('history')}
              />
            )}

            {/* MonitoringPage: selalu di-mount agar videoRef & canvasRef tetap terikat ke DOM.
                Sembunyikan dengan CSS saja (bukan conditional rendering) supaya video stream
                tidak terputus saat user navigasi ke halaman lain. */}
            <div style={{ display: activePage === 'monitoring' ? 'block' : 'none' }}>
              <MonitoringPage
                videoRef={videoRef}
                canvasRef={canvasRef}
                systemStatus={status}
                cameraStatus={cameraStatus}
                detectionInfo={detectionInfo}
                postFallSecondsLeft={postFallSecondsLeft}
                fallStartTime={fallStartTime}
                incidents={incidents}
                isModelLoading={isModelLoading}
                errorMessage={errorMessage}
                facingMode={facingMode}
                onStart={handleStartMonitoring}
                onStop={handleStopMonitoring}
                onReset={handleReset}
                onSwitchCamera={handleSwitchCamera}
              />
            </div>

            {activePage === 'history' && (
              <HistoryPage
                incidents={incidents}
                stats={stats}
                onUpdateIncident={updateIncident}
                onClearAll={clearIncidents}
              />
            )}

            {activePage === 'residents' && <ResidentsPage />}

            {activePage === 'settings' && (
              <SettingsPage onClearIncidents={clearIncidents} />
            )}

            {activePage === 'about' && <AboutPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
