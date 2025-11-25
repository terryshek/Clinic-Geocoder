import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RAW_CLINIC_DATA } from './data';
import { ClinicData, ProcessingStatus } from './types';
import { ClinicTable } from './components/ClinicTable';
import { ClinicMap } from './components/ClinicMap';
import { getCoordinatesFromAddress } from './services/geminiService';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progress, setProgress] = useState({ processed: 0, totalToProcess: 0, successful: 0 });
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');
  
  // Using ref to control the loop interrupt without re-rendering loop logic
  const stopProcessingRef = useRef(false);

  // Load initial data
  useEffect(() => {
    setClinics(RAW_CLINIC_DATA as ClinicData[]);
  }, []);

  // Stats
  const totalRecords = clinics.length;
  const missingCoordsCount = clinics.filter(c => !c.LatLng).length;
  const hasCoordsCount = totalRecords - missingCoordsCount;

  const handleStartProcessing = async () => {
    if (status === ProcessingStatus.PROCESSING) return;
    
    setStatus(ProcessingStatus.PROCESSING);
    stopProcessingRef.current = false;

    const missingList = clinics.filter(c => !c.LatLng);
    // Only process items that are actually missing coords
    // If we paused and resumed, we only want to process what is STILL missing
    // However, for simplicity, we'll just iterate the whole state again but skip processed ones
    
    const itemsToProcessIndices = clinics
        .map((c, i) => ({ ...c, originalIndex: i }))
        .filter(c => !c.LatLng);

    setProgress({ 
        processed: 0, 
        totalToProcess: itemsToProcessIndices.length, 
        successful: 0 
    });

    const BATCH_SIZE = 5; // Requests per batch
    const DELAY_BETWEEN_BATCHES = 500; // ms, helps avoid rate limits

    let successful = 0;
    let processed = 0;
    
    // Working on a copy of indices to process
    for (let i = 0; i < itemsToProcessIndices.length; i += BATCH_SIZE) {
        if (stopProcessingRef.current) {
            setStatus(ProcessingStatus.PAUSED);
            return;
        }

        const batch = itemsToProcessIndices.slice(i, i + BATCH_SIZE);
        
        // Process batch
        const batchResults = await Promise.all(batch.map(async (item) => {
             const address = item.Address[0]?.Address;
             if (!address) return { originalIndex: item.originalIndex, result: null };

             const result = await getCoordinatesFromAddress(address, item.PHFName);
             return { originalIndex: item.originalIndex, result };
        }));

        // Update State
        setClinics(prevClinics => {
            const nextClinics = [...prevClinics];
            batchResults.forEach(({ originalIndex, result }) => {
                if (result) {
                    nextClinics[originalIndex] = {
                        ...nextClinics[originalIndex],
                        LatLng: `${result.lat}, ${result.lng}`
                    };
                }
            });
            return nextClinics;
        });

        // Update Counts
        const batchSuccessCount = batchResults.filter(r => r.result !== null).length;
        successful += batchSuccessCount;
        processed += batch.length;

        setProgress(prev => ({
            ...prev,
            processed,
            successful
        }));

        // Small delay
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }

    setStatus(ProcessingStatus.COMPLETED);
  };

  const handlePause = () => {
    stopProcessingRef.current = true;
    setStatus(ProcessingStatus.PAUSED); // Will be set by loop break, but setting here provides immediate feedback if logic allows
  };

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(clinics, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clinics_with_latlng.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simple progress percentage
  const percentComplete = progress.totalToProcess > 0 
    ? Math.round((progress.processed / progress.totalToProcess) * 100) 
    : 0;

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 z-20">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                CG
            </div>
            <h1 className="text-xl font-bold text-slate-800">Clinic Geocoder</h1>
         </div>
         
         <div className="flex gap-3">
             <button 
                onClick={handleDownloadJson}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export JSON
             </button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dashboard</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-2xl font-bold text-slate-700">{totalRecords}</div>
                        <div className="text-xs text-slate-500 font-medium">Total Records</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{hasCoordsCount}</div>
                        <div className="text-xs text-green-600 font-medium">Found</div>
                    </div>
                </div>

                {/* Progress Section */}
                {(status === ProcessingStatus.PROCESSING || status === ProcessingStatus.PAUSED) && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex justify-between text-xs font-semibold text-blue-700 mb-2">
                            <span>{status === ProcessingStatus.PAUSED ? 'Paused' : 'Processing...'}</span>
                            <span>{percentComplete}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${percentComplete}%` }}
                            />
                        </div>
                        <div className="text-xs text-blue-600 flex justify-between">
                            <span>{progress.processed}/{progress.totalToProcess}</span>
                            <span>+{progress.successful} New</span>
                        </div>
                    </div>
                )}

                {/* Main Action Button */}
                {status === ProcessingStatus.PROCESSING ? (
                     <button 
                        onClick={handlePause}
                        className="w-full py-3 px-4 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Pause
                     </button>
                ) : (
                    <button 
                        onClick={handleStartProcessing}
                        disabled={missingCoordsCount === 0}
                        className={`w-full py-3 px-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-white shadow-md active:translate-y-0.5
                            ${missingCoordsCount === 0 
                                ? 'bg-green-500 opacity-60 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {status === ProcessingStatus.PAUSED ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Resume
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                {missingCoordsCount === 0 ? 'Complete' : `Geocode ${missingCoordsCount} Items`}
                            </>
                        )}
                    </button>
                )}
                
                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Using Gemini 2.5 Flash to interpret addresses and infer coordinates. Results are approximate.
                </p>
            </div>

            <div className="p-4 flex-grow overflow-y-auto">
               <div className="space-y-2">
                  <div 
                    onClick={() => setActiveTab('table')}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 text-sm font-medium
                        ${activeTab === 'table' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7-4h14M4 6h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" /></svg>
                      Data Table
                  </div>
                  <div 
                    onClick={() => setActiveTab('map')}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 text-sm font-medium
                        ${activeTab === 'map' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Map Visualization
                  </div>
               </div>
            </div>
        </aside>

        {/* Main View */}
        <main className="flex-grow bg-slate-50 p-6 overflow-hidden relative">
            {activeTab === 'table' ? (
                <ClinicTable data={clinics} className="h-full w-full" />
            ) : (
                <ClinicMap data={clinics} className="h-full w-full" />
            )}
        </main>

      </div>
    </div>
  );
};

export default App;