import React, { useEffect, useRef, useState } from 'react';
import { BottomNav, TabId } from './components/BottomNav';
import { CameraView } from './components/CameraView';
import { CategoryPickerModal } from './components/CategoryPickerModal';
import { CorrectionSheet } from './components/CorrectionSheet';
import { Header } from './components/Header';
import { LearnScreen } from './components/LearnScreen';
import { MeScreen } from './components/MeScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { PlaceholderScreen } from './components/Placeholders';
import { ResultView } from './components/ResultView';
import { ScanScreen } from './components/ScanScreen';
import { SitesScreen } from './components/SitesScreen';
import { RuleEntry } from './data/rules';
import { Language, i18n } from './i18n';
import { buildLocalLessons } from './lib/lessons';
import { callAskAiTextApi, callScanPhotoApi } from './services/api';
import { storageService } from './services/storage';
import { AppSettings, Category, ScanFeedback, ScanRecord, ScannedItem } from './types';
import { processInputImage } from './utils/image';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [activeTab, setActiveTab] = useState<TabId>('scan');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Active scan result state
  const [activeRecord, setActiveRecord] = useState<ScanRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [sitesFilter, setSitesFilter] = useState<Category | 'all'>('all');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [lastScanAction, setLastScanAction] = useState<
    { type: 'photo'; file: File | Blob } | { type: 'text'; query: string } | null
  >(null);

  // Modals & Sheets
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);
  const [isCorrectionSheetOpen, setIsCorrectionSheetOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [itemToCorrect, setItemToCorrect] = useState<ScannedItem | null>(null);

  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  // Undo notification state (5-second undo toast)
  const [undoToast, setUndoToast] = useState<{
    recordId: string;
    previousFeedback?: ScanFeedback;
    message: string;
  } | null>(null);

  // Records list for history
  const [records, setRecords] = useState<ScanRecord[]>(() => storageService.getRecords());

  // Listen for online / offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker gracefully if supported
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration skipped or failed:', err);
        });
      } catch (err) {
        console.warn('SW registration error caught:', err);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    storageService.setLanguage(newLang);
    setSettings((prev) => ({ ...prev, language: newLang }));
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated = storageService.saveSettings(partial);
    setSettings(updated);
    if (partial.language) {
      setLanguage(partial.language);
    }
  };

  // Convert RuleEntry from local database into a ScannedItem
  const createScannedItemFromRule = (rule: RuleEntry): ScannedItem => {
    return {
      itemKey: rule.itemKey,
      nameEn: rule.nameEn,
      nameHi: rule.nameHi,
      category: rule.category,
      drySubtype: rule.drySubtype,
      hazard: rule.hazard,
      confidence: 1.0,
      confidenceReason: 'Verified in statutory rules table',
      alternatives: [],
      steps:
        language === 'hi'
          ? rule.stepsHi || ['गीले या सूखे बिन में न मिलाएं।', 'निर्देशानुसार निस्तारण करें।']
          : rule.stepsEn || ['Keep separate as per SWM Rules 2026.', 'Dispose at designated point.'],
      why:
        (language === 'hi' ? rule.noteHi : rule.noteEn) ||
        `SWM Rules 2026: ${rule.category}`,
    };
  };

  // 1. Photo Scanning Handler
  const handleImageSelected = async (file: File | Blob) => {
    setIsLoading(true);
    setErrorMessage('');
    setIsQuotaError(false);
    setLoadingMessage(i18n[language].analyzingImage);
    setLastScanAction({ type: 'photo', file });

    try {
      const processed = await processInputImage(file);
      const userLessons = buildLocalLessons(storageService.getRecords());

      const res = await callScanPhotoApi({
        imageBase64: processed.fullBase64,
        mimeType: processed.mimeType,
        lang: language,
        modelId: settings.modelScan,
        imageHash: processed.hash,
        userLessons,
      });

      if (res.isQuotaError) {
        setIsQuotaError(true);
        setErrorMessage(i18n[language].quotaLimitReached);
        setIsLoading(false);
        return;
      }

      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.data) {
        const record: ScanRecord = {
          id: `scan_${Date.now()}`,
          timestamp: Date.now(),
          language,
          source: 'photo',
          thumbnail: settings.saveThumbnails ? processed.thumbnailBase64 : undefined,
          modelId: settings.modelScan,
          items: res.data.items,
        };

        storageService.addRecord(record);
        setRecords(storageService.getRecords());
        setActiveRecord(record);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : i18n[language].aiBusyError
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Rule Item Selection Handler (Instant offline match)
  const handleRuleItemSelected = (rule: RuleEntry) => {
    const item = createScannedItemFromRule(rule);
    const record: ScanRecord = {
      id: `rule_${Date.now()}`,
      timestamp: Date.now(),
      language,
      source: 'text',
      modelId: 'local_rules',
      items: [item],
    };

    storageService.addRecord(record);
    setRecords(storageService.getRecords());
    setActiveRecord(record);
    setErrorMessage('');
  };

  // 3. Text Query via AI (Fallback if not in local rules)
  const handleAskAiText = async (query: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setIsQuotaError(false);
    setLoadingMessage(i18n[language].analyzingText);
    setLastScanAction({ type: 'text', query });

    try {
      const userLessons = buildLocalLessons(storageService.getRecords());
      const res = await callAskAiTextApi({
        text: query,
        lang: language,
        modelId: settings.modelSmart,
        userLessons,
      });

      if (res.isQuotaError) {
        setIsQuotaError(true);
        setErrorMessage(i18n[language].quotaLimitReached);
        setIsLoading(false);
        return;
      }

      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.data) {
        const record: ScanRecord = {
          id: `ai_text_${Date.now()}`,
          timestamp: Date.now(),
          language,
          source: 'text',
          modelId: settings.modelSmart,
          items: res.data.items,
        };

        storageService.addRecord(record);
        setRecords(storageService.getRecords());
        setActiveRecord(record);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : i18n[language].aiBusyError
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Feedback: Confirm correctness
  const handleConfirmFeedback = () => {
    if (!activeRecord) return;
    const feedback: ScanFeedback = { confirmed: true };
    storageService.updateRecordFeedback(activeRecord.id, feedback);
    setActiveRecord({ ...activeRecord, feedback });
    setRecords(storageService.getRecords());
  };

  // 5. Open Correction Sheet
  const handleOpenCorrection = (item: ScannedItem) => {
    setItemToCorrect(item);
    setIsCorrectionSheetOpen(true);
  };

  // 6. Save Correction with 5-second Undo
  const handleSaveCorrection = (feedback: ScanFeedback) => {
    if (!activeRecord) return;
    const prevFeedback = activeRecord.feedback;

    storageService.updateRecordFeedback(activeRecord.id, feedback);
    const updatedRecord = { ...activeRecord, feedback };
    setActiveRecord(updatedRecord);
    setRecords(storageService.getRecords());

    // Trigger 5-second Undo Toast
    setUndoToast({
      recordId: activeRecord.id,
      previousFeedback: prevFeedback,
      message: i18n[language].savedToast,
    });

    setTimeout(() => {
      setUndoToast((curr) => (curr?.recordId === activeRecord.id ? null : curr));
    }, 5000);
  };

  // 7. Revert Feedback (Undo)
  const handleUndoCorrection = () => {
    if (!undoToast || !activeRecord) return;
    storageService.updateRecordFeedback(
      undoToast.recordId,
      undoToast.previousFeedback || { confirmed: undefined }
    );
    setActiveRecord({ ...activeRecord, feedback: undoToast.previousFeedback });
    setRecords(storageService.getRecords());
    setUndoToast(null);
  };

  // 8. Low-Confidence Chip Selection
  const handleSelectAlternative = (itemIndex: number, newCategory: Category) => {
    if (!activeRecord) return;
    const items = [...activeRecord.items];
    const target = items[itemIndex];
    if (!target) return;

    target.category = newCategory;
    target.confidence = 0.85;

    const feedback: ScanFeedback = {
      confirmed: false,
      correctedCategory: newCategory,
    };

    storageService.updateRecordFeedback(activeRecord.id, feedback);
    const updated = { ...activeRecord, items, feedback };
    setActiveRecord(updated);
    setRecords(storageService.getRecords());
  };

  // 9. Manual category selection from picker modal
  const handleCategoryPickedManually = (category: Category) => {
    const catMeta = i18n[language].categories[category];
    const item: ScannedItem = {
      itemKey: `manual_${category}`,
      nameEn: catMeta.label,
      nameHi: catMeta.label,
      category,
      hazard: 'none',
      confidence: 1.0,
      confidenceReason: 'Manually selected',
      alternatives: [],
      steps: [
        language === 'hi' ? 'सामग्री को साफ और सूखा रखें।' : 'Ensure item is clean and dry.',
        language === 'hi' ? `सीधे ${catMeta.binName} में डालें।` : `Deposit in ${catMeta.binName}.`,
      ],
      why: catMeta.basis,
    };

    const record: ScanRecord = {
      id: `manual_${Date.now()}`,
      timestamp: Date.now(),
      language,
      source: 'text',
      modelId: 'manual_picker',
      items: [item],
    };

    storageService.addRecord(record);
    setRecords(storageService.getRecords());
    setActiveRecord(record);
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] md:bg-[#EFEFEA] text-[#1C1C1A] antialiased overflow-x-hidden flex flex-col">
      {/* Responsive centered app shell: full width on mobile, intermediate on tablet, max-w-5xl/6xl on desktop */}
      <div className="mx-auto flex min-h-screen w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl flex-col border-x-0 sm:border-x border-[#E6E5E0] bg-[#FAFAF8] sm:shadow-xs relative transition-all duration-150">
        {/* Header */}
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          isOnline={isOnline}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-4 md:py-6 overflow-x-hidden">
          {activeTab === 'scan' && (
            <>
              {activeRecord ? (
                <ResultView
                  items={activeRecord.items}
                  thumbnail={activeRecord.thumbnail}
                  source={activeRecord.source}
                  language={language}
                  onConfirmFeedback={handleConfirmFeedback}
                  onOpenCorrection={handleOpenCorrection}
                  onSelectAlternative={handleSelectAlternative}
                  onResetScan={() => setActiveRecord(null)}
                  feedback={activeRecord.feedback}
                  userCoords={userCoords}
                  onOpenSitesCategory={(cat) => {
                    setSitesFilter(cat);
                    setActiveTab('sites');
                  }}
                  onOpenAddSite={() => {
                    setSitesFilter(activeRecord.items[0]?.category || 'all');
                    setActiveTab('sites');
                  }}
                />
              ) : (
                <ScanScreen
                  onImageSelected={handleImageSelected}
                  onRuleItemSelected={handleRuleItemSelected}
                  onAskAiText={handleAskAiText}
                  onOpenCategoryPicker={() => setIsCategoryPickerOpen(true)}
                  onOpenInAppCamera={() => setIsCameraOpen(true)}
                  onRetryLast={() => {
                    if (lastScanAction?.type === 'photo') {
                      handleImageSelected(lastScanAction.file);
                    } else if (lastScanAction?.type === 'text') {
                      handleAskAiText(lastScanAction.query);
                    }
                  }}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  errorMessage={errorMessage}
                  isQuotaError={isQuotaError}
                  language={language}
                  isOnline={isOnline}
                />
              )}
            </>
          )}

          {activeTab === 'sites' && (
            <SitesScreen
              initialFilter={sitesFilter}
              language={language}
            />
          )}

          {activeTab === 'learn' && (
            <LearnScreen language={language} isOnline={isOnline} />
          )}

          {activeTab === 'me' && (
            <MeScreen
              records={records}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onSelectRecord={(rec) => {
                setActiveRecord(rec);
                setActiveTab('scan');
              }}
              onClearRecords={() => setRecords([])}
              language={language}
            />
          )}
        </main>

        {/* 5-Second Undo Toast */}
        {undoToast && (
          <div className="fixed bottom-20 sm:bottom-24 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-sm sm:max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-[#2F3E46] bg-[#2F3E46] px-4 py-3 text-xs sm:text-sm text-white shadow-xl animate-fade-in min-h-[44px]">
            <span className="truncate">{undoToast.message}</span>
            <button
              type="button"
              onClick={handleUndoCorrection}
              className="rounded font-bold text-amber-300 underline hover:text-amber-200 active:scale-95 min-h-[36px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
            >
              {i18n[language].undo}
            </button>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'scan') {
              setErrorMessage('');
            }
          }}
          language={language}
        />

        {/* First Run Onboarding Modal */}
        {!settings.hasSeenPrivacyNotice && (
          <OnboardingModal
            language={language}
            onSelectLanguage={handleLanguageChange}
            onComplete={(dontShowAgain) => {
              handleUpdateSettings({ hasSeenPrivacyNotice: dontShowAgain });
            }}
          />
        )}

        {/* Correction Bottom Sheet */}
        {isCorrectionSheetOpen && itemToCorrect && (
          <CorrectionSheet
            isOpen={isCorrectionSheetOpen}
            onClose={() => setIsCorrectionSheetOpen(false)}
            currentItem={itemToCorrect}
            onSaveCorrection={handleSaveCorrection}
            language={language}
          />
        )}

        {/* Category Picker Modal */}
        <CategoryPickerModal
          isOpen={isCategoryPickerOpen}
          onClose={() => setIsCategoryPickerOpen(false)}
          onSelectCategory={handleCategoryPickedManually}
          language={language}
        />

        {/* Real In-App Camera View */}
        {isCameraOpen && (
          <CameraView
            onCapture={(blob) => {
              setIsCameraOpen(false);
              handleImageSelected(blob);
            }}
            onClose={() => setIsCameraOpen(false)}
            onFallback={() => {
              setIsCameraOpen(false);
              fallbackFileInputRef.current?.click();
            }}
            language={language}
          />
        )}

        {/* Hidden Fallback Camera File Input */}
        <input
          type="file"
          ref={fallbackFileInputRef}
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageSelected(file);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
