import { useRef, useEffect, useState, type ChangeEvent } from 'react';
import { FloatingDock } from './components/layout/FloatingDock';
import { CommandPalette } from './components/layout/CommandPalette';
import { HeaderNav } from './components/layout/HeaderNav';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { AuditTrailPage } from './components/pages/AuditTrailPage';
import { DocumentationPage } from './components/pages/DocumentationPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { LoginPage } from './components/pages/LoginPage';
import { OverviewPage } from './components/pages/OverviewPage';
import { PrivacyCentrePage } from './components/pages/PrivacyCentrePage';
import { WorkspacePage } from './components/pages/WorkspacePage';
import { ToastViewport } from './components/shared/ToastViewport';
import { useAppRoute } from './hooks/useAppRoute';
import { useAuthSession, type AuthFormInput } from './hooks/useAuthSession';
import { useSanitizationSession } from './hooks/useSanitizationSession';
import { useTheme } from './hooks/useTheme';

export function App() {
  const { theme, toggleTheme } = useTheme('light');
  const { route, navigate } = useAppRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const globalUploadRef = useRef<HTMLInputElement>(null);

  const auth = useAuthSession();
  const sanitization = useSanitizationSession(auth.isAuthenticated);

  // Enforce /login URL cleanly when unauthenticated
  useEffect(() => {
    if (!auth.isAuthenticated && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  }, [auth.isAuthenticated]);

  // Global Ctrl/Cmd+K shortcut strictly when authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const handleGlobalCommandShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalCommandShortcut);
    return () => window.removeEventListener('keydown', handleGlobalCommandShortcut);
  }, [auth.isAuthenticated]);

  const handleSignIn = (input: AuthFormInput) => {
    const res = auth.signIn(input);
    if (res.ok) {
      // Always navigate to Overview on sign in; avoids stale-route-while-unauthenticated edge case
      navigate('/');
    }
    return res;
  };

  const handleDemoAccess = () => {
    const res = auth.signInDemo();
    if (res.ok) {
      navigate('/');
    }
    return res;
  };

  const handleLogout = () => {
    setSettingsOpen(false);
    setCommandPaletteOpen(false);
    sanitization.clearAllSessionData();
    auth.logout();
    navigate('/login');
  };

  const handleGlobalUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void sanitization.handleFileUpload(file).then(() => {
        navigate('/workspace');
      });
    }
    event.target.value = '';
  };

  // Mandatory Login Gate: render only Login page until authenticated
  if (!auth.isAuthenticated) {
    return (
      <LoginPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignIn={handleSignIn}
        onDemoAccess={handleDemoAccess}
      />
    );
  }

  return (
    // Full-width layout: dock is fixed/floating, content takes full width with left padding offset
    <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#173D30] focus:px-4 focus:py-2 focus:font-display focus:text-xs focus:font-semibold focus:text-[#FBFAF6]"
      >
        Skip to main content
      </a>

      {/* Hidden global file upload trigger */}
      <input
        ref={globalUploadRef}
        type="file"
        accept=".txt,.csv,text/plain,text/csv"
        onChange={handleGlobalUploadChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Floating Dock — fixed position, doesn't affect document flow */}
      <FloatingDock
        route={route}
        onNavigate={navigate}
        onTriggerUpload={() => globalUploadRef.current?.click()}
        onLoadSample={sanitization.loadSampleData}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeEntityCount={sanitization.result.counts.total}
        sessionCount={sanitization.sessionDocuments.length}
        redactionMode={sanitization.redactionMode}
      />

      {/* Main content shell — offset on desktop to clear the 64px dock + 12px gap + 12px margin = 88px */}
      <div className="flex flex-col md:pl-[88px]">
        <HeaderNav
          route={route}
          onNavigate={navigate}
          session={auth.session}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((prev) => !prev)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Extra bottom padding on mobile so content clears the fixed bottom nav */}
        <main id="main-content" className="flex-1 pb-16 md:pb-0">
          {route === '/' && (
            <OverviewPage
              onNavigate={navigate}
              sanitization={sanitization}
              onTriggerUpload={() => globalUploadRef.current?.click()}
            />
          )}

          {route === '/workspace' && (
            <WorkspacePage sanitization={sanitization} onNavigate={navigate} />
          )}

          {route === '/documents' && (
            <DocumentsPage sanitization={sanitization} onNavigate={navigate} />
          )}

          {route === '/audit-trail' && (
            <AuditTrailPage sanitization={sanitization} onNavigate={navigate} />
          )}

          {route === '/privacy-centre' && (
            <PrivacyCentrePage sanitization={sanitization} onNavigate={navigate} />
          )}

          {route === '/documentation' && (
            <DocumentationPage
              onNavigate={navigate}
              enabledCategories={sanitization.enabledCategories}
              onToggleCategory={sanitization.toggleCategory}
            />
          )}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        theme={theme}
        onNavigate={navigate}
        onChangeMode={sanitization.handleModeChange}
        onLoadSampleData={sanitization.loadSampleData}
        onLoadSamplePreset={sanitization.loadSamplePreset}
        onTriggerUpload={() => globalUploadRef.current?.click()}
        onStartScan={sanitization.rescanNow}
        onCopySanitized={sanitization.handleCopySanitized}
        onDownloadTxt={sanitization.handleDownloadTxt}
        onDownloadCsv={sanitization.handleDownloadCsv}
        onClearDocument={sanitization.clearDocument}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={sanitization.settings}
        onUpdateSettings={sanitization.updateSettings}
      />

      <ToastViewport
        toasts={sanitization.toasts}
        onDismiss={sanitization.dismissToast}
      />
    </div>
  );
}

export default App;
