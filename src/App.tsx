import React, { useEffect, useState } from 'react';
import { PageId, HistoryItem } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { NewAuditPage } from './pages/NewAuditPage';
import { AuditReportsPage } from './pages/AuditReportsPage';
import { AuditHistoryPage } from './pages/AuditHistoryPage';
import { AccountsPage } from './pages/AccountsPage';
import { EXAMPLE_ANSWER, EXAMPLE_SOURCE, PRELOADED_EXAMPLE_RESULT } from './demoData';
import { deleteAudit, getSavedAudits } from './utils/storage';

export default function App() {
  // Navigation state (synced with window location hash if available; defaults to 'new-audit' so the workspace is immediately front and center)
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    const hash = window.location.hash.replace('#', '') as PageId;
    if (['home', 'new-audit', 'reports', 'history', 'accounts'].includes(hash)) {
      return hash;
    }
    return 'new-audit';
  });

  // Shared stored audits across New Audit, Audit Reports, and Audit History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Selected report ID for inspection in Audit Reports
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Slide-in History drawer state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);

  // Load history from localStorage on initial render
  useEffect(() => {
    const saved = getSavedAudits();
    setHistory(saved);
  }, []);

  // Sync hash changes with browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (['home', 'new-audit', 'reports', 'history', 'accounts'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL hash and active page
  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Called when an audit finishes in NewAuditPage
  const handleAuditFinished = (_newItem: HistoryItem) => {
    const updated = getSavedAudits();
    setHistory(updated);
  };

  // Called when user clicks "View Complete Audit Report" from New Audit quick summary
  const handleViewCompleteReport = (item: HistoryItem) => {
    const updated = getSavedAudits();
    setHistory(updated);
    setSelectedReportId(item.id);
    handleNavigate('reports');
  };

  // Called when user clicks "View Full Report" from Audit History
  const handleViewFullReportFromHistory = (item: HistoryItem) => {
    setSelectedReportId(item.id);
    handleNavigate('reports');
  };

  // Called when selecting or closing a report in Audit Reports
  const handleSelectReport = (id: string | null) => {
    setSelectedReportId(id);
  };

  // Called when deleting an individual audit from History
  const handleDeleteAudit = (id: string) => {
    const updated = deleteAudit(id);
    setHistory(updated);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
  };

  // Preload Medicine X example and navigate to new audit
  const handleTryExampleFromHome = () => {
    handleNavigate('new-audit');
  };

  return (
    <div className="min-h-screen bg-[#0E0B2E] text-[#F5F1E8] flex flex-col selection:bg-[#FFD60A] selection:text-[#050414]">
      {/* Comic Detective Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        reportCount={history.length}
        onToggleHistoryDrawer={() => setHistoryDrawerOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onTryExample={handleTryExampleFromHome}
          />
        )}

        {currentPage === 'new-audit' && (
          <NewAuditPage
            initialSource={EXAMPLE_SOURCE}
            initialAnswer={EXAMPLE_ANSWER}
            initialResult={PRELOADED_EXAMPLE_RESULT}
            onAuditFinished={handleAuditFinished}
            onViewCompleteReport={handleViewCompleteReport}
          />
        )}

        {currentPage === 'reports' && (
          <AuditReportsPage
            reports={history}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'history' && (
          <AuditHistoryPage
            history={history}
            onDelete={handleDeleteAudit}
            onNavigate={handleNavigate}
            onViewFullReport={handleViewFullReportFromHistory}
          />
        )}

        {currentPage === 'accounts' && <AccountsPage />}
      </main>

      {/* Slide-in History Drawer with a Thick Border */}
      {historyDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Evidence File History Drawer"
          className="fixed inset-0 z-50 flex justify-end bg-[#050414]/75"
          onClick={() => setHistoryDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E0B2E] border-l-[4px] border-[#050414] shadow-[-8px_0_0_#050414] h-full overflow-y-auto p-5 sm:p-6 animate-drawer-in"
          >
            <AuditHistoryPage
              history={history}
              onDelete={handleDeleteAudit}
              onNavigate={(page) => {
                setHistoryDrawerOpen(false);
                handleNavigate(page);
              }}
              onViewFullReport={(item) => {
                setHistoryDrawerOpen(false);
                handleViewFullReportFromHistory(item);
              }}
              isDrawer={true}
              onCloseDrawer={() => setHistoryDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Footer with description and disclaimer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
