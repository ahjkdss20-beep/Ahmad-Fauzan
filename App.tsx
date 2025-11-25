
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { DashboardSummary } from './components/DashboardSummary';
import { JobManager } from './components/JobManager';
import { GoogleIntegrationModal } from './components/GoogleIntegrationModal';
import { Job } from './types';

function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(() => {
    return localStorage.getItem('jne_google_script_url') || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Data Persistence
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('jne_jobs_data');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to LocalStorage whenever jobs change
  useEffect(() => {
    localStorage.setItem('jne_jobs_data', JSON.stringify(jobs));
  }, [jobs]);

  // Save Google Script URL
  useEffect(() => {
    localStorage.setItem('jne_google_script_url', googleScriptUrl);
    if (googleScriptUrl) {
      fetchFromGoogle(googleScriptUrl);
    }
  }, [googleScriptUrl]);

  // Sync function (Debounced ideally, but direct for this demo)
  const syncToGoogle = useCallback(async (currentJobs: Job[]) => {
    if (!googleScriptUrl) return;
    
    setIsSyncing(true);
    try {
      await fetch(googleScriptUrl, {
        method: 'POST',
        // 'no-cors' needed if using direct GAS Web App without proxy, 
        // but note: 'no-cors' makes response opaque. 
        // We use text/plain content type to avoid OPTIONS preflight if possible.
        body: JSON.stringify(currentJobs)
      });
      // console.log("Synced to Google Drive");
    } catch (error) {
      console.error("Failed to sync to Google:", error);
      // alert("Gagal menyinkronkan data ke Google Drive.");
    } finally {
      setIsSyncing(false);
    }
  }, [googleScriptUrl]);

  const fetchFromGoogle = async (url: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Simple merge strategy: Remote overwrites local if remote has data
        // In production, you'd want timestamp based merging
        setJobs(data);
        alert("Data berhasil dimuat dari Google Drive!");
      }
    } catch (error) {
      console.error("Failed to fetch from Google:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavigate = (cat: string | null, sub: string | null) => {
    setActiveCategory(cat);
    setActiveSubCategory(sub);
  };

  const updateJobsWrapper = (newJobs: Job[]) => {
    setJobs(newJobs);
    if (googleScriptUrl) {
      // Small delay to allow state update before sync
      setTimeout(() => syncToGoogle(newJobs), 1000);
    }
  };

  const handleAddJob = (job: Job) => {
    const newJobs = [job, ...jobs];
    updateJobsWrapper(newJobs);
  };

  const handleUpdateJob = (id: string, updates: Partial<Job>) => {
    const newJobs = jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    updateJobsWrapper(newJobs);
  };

  const handleDeleteJob = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data ini?")) {
      const newJobs = jobs.filter(j => j.id !== id);
      updateJobsWrapper(newJobs);
    }
  };

  const handleBulkAdd = (newJobsList: Job[]) => {
    const newJobs = [...newJobsList, ...jobs];
    updateJobsWrapper(newJobs);
  };

  return (
    <Layout 
      activeCategory={activeCategory} 
      activeSubCategory={activeSubCategory} 
      onNavigate={handleNavigate}
      onOpenSettings={() => setIsSettingsOpen(true)}
      isSyncing={isSyncing}
    >
      {!activeCategory ? (
        <DashboardSummary jobs={jobs} />
      ) : (
        activeSubCategory && (
          <JobManager 
            category={activeCategory}
            subCategory={activeSubCategory}
            jobs={jobs}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onBulkAddJobs={handleBulkAdd}
          />
        )
      )}

      <GoogleIntegrationModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        scriptUrl={googleScriptUrl}
        onSaveUrl={setGoogleScriptUrl}
      />
    </Layout>
  );
}

export default App;
