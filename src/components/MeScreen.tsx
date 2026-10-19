import React, { useState } from 'react';
import {
  Clock,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  BarChart2,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { calculateAccuracyStats, exportRecordsToCsv } from '../lib/lessons';
import { storageService } from '../services/storage';
import { AppSettings, ScanRecord } from '../types';

interface MeScreenProps {
  records: ScanRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSelectRecord: (record: ScanRecord) => void;
  onClearRecords: () => void;
  language: Language;
}

export const MeScreen: React.FC<MeScreenProps> = ({
  records,
  settings,
  onUpdateSettings,
  onSelectRecord,
  onClearRecords,
  language,
}) => {
  const t = i18n[language];
  const [activeSection, setActiveSection] = useState<'history' | 'accuracy' | 'settings'>('history');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const dailyCount = storageService.getDailyAiCount();
  const accuracyStats = calculateAccuracyStats(records);

  const handleExportJson = () => {
    const dataStr = storageService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin-saathi-dataset-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvStr = exportRecordsToCsv(records);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin-saathi-scans-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = storageService.importAllData(text);
        if (ok) {
          setImportStatus('Data imported successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          setImportStatus('Failed to import: invalid data format');
        }
      } catch {
        setImportStatus('Failed to import: read error');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm(t.clearDataConfirm)) {
      storageService.clearAllData();
      onClearRecords();
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto flex flex-col space-y-4 pb-24 sm:pb-28 pt-1">
      {/* 3-Way Top Toggle: History | Accuracy | Settings */}
      <div className="flex rounded-xl border border-[#E6E5E0] bg-white p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition min-h-[44px] cursor-pointer ${
            activeSection === 'history'
              ? 'bg-[#2F3E46] text-white shadow-xs'
              : 'text-[#6B6B66] hover:text-[#1C1C1A]'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{t.tabHistory}</span>
          <span className="text-[10px] sm:text-xs opacity-75">({records.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('accuracy')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition min-h-[44px] cursor-pointer ${
            activeSection === 'accuracy'
              ? 'bg-[#2F3E46] text-white shadow-xs'
              : 'text-[#6B6B66] hover:text-[#1C1C1A]'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>{t.tabAccuracy}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-medium transition min-h-[44px] cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-[#2F3E46] text-white shadow-xs'
              : 'text-[#6B6B66] hover:text-[#1C1C1A]'
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>{t.tabSettings}</span>
        </button>
      </div>

      {/* History Section */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="rounded-xl border border-[#E6E5E0] bg-white p-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-[#6B6B66]/60" />
              <p className="mt-2 text-xs sm:text-sm text-[#6B6B66]">{t.historyEmpty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {records.map((record) => {
                const dominantItem = record.items[0];
                const activeCat = record.feedback?.correctedCategory || dominantItem?.category || 'unknown';
                const catMeta = t.categories[activeCat] || t.categories.unknown;
                const catColor = CATEGORY_COLORS[activeCat] || '#7A7A75';
                const dateStr = new Date(record.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                  day: 'numeric',
                });

                const itemName =
                  record.feedback?.correctedName ||
                  (language === 'hi' ? dominantItem?.nameHi : dominantItem?.nameEn) ||
                  'Waste Item';

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelectRecord(record)}
                    className="flex w-full items-center justify-between p-3.5 sm:p-4 text-left transition hover:bg-[#FAFAF8] group rounded-xl border border-[#E6E5E0] bg-white shadow-2xs min-h-[68px] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {record.thumbnail ? (
                        <img
                          src={record.thumbnail}
                          alt="Thumbnail"
                          className="h-11 w-11 shrink-0 rounded-xl border border-[#E6E5E0] object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
                          style={{ backgroundColor: catColor }}
                        >
                          {itemName.slice(0, 1)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-[#1C1C1A] truncate max-w-[200px] sm:max-w-none">{itemName}</span>
                          {record.feedback?.conflictsWithRules && (
                            <span title="User override conflicts with statutory rule">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6B6B66]">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span>{catMeta.label}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#6B6B66] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accuracy Section (Section 7) */}
      {activeSection === 'accuracy' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-[#6B6B66]">{t.accuracyTotalScans}</span>
              <div className="mt-1 text-2xl sm:text-3xl font-bold text-[#1C1C1A]">
                {accuracyStats.totalScans}
              </div>
              <span className="text-[10px] sm:text-xs text-[#6B6B66]">
                {accuracyStats.feedbackCount} with feedback
              </span>
            </div>

            <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-[#6B6B66]">{t.accuracyShareConfirmed}</span>
              <div className="mt-1 text-2xl sm:text-3xl font-bold text-[#2F3E46]">
                {accuracyStats.shareConfirmed}%
              </div>
              <span className="text-[10px] sm:text-xs text-[#6B6B66]">
                {accuracyStats.confirmedCount} of {accuracyStats.feedbackCount} confirmed
              </span>
            </div>
          </div>

          {/* Observed Accuracy per Confidence Band */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">
              {t.accuracyConfidenceBands}
            </h3>
            <p className="mt-0.5 text-xs text-[#6B6B66] leading-relaxed">
              {accuracyStats.feedbackCount >= 20
                ? t.accuracyCalibrationNote
                : t.accuracyCalibrationPending(accuracyStats.feedbackCount)}
            </p>

            {/* Bands List */}
            <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
              {/* High Band */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#1C1C1A]">
                    {t.accuracyBandHigh(accuracyStats.bands.high.pct, accuracyStats.bands.high.n)}
                  </span>
                  <span className="font-semibold text-[#2F3E46]">{accuracyStats.bands.high.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${accuracyStats.bands.high.pct}%` }}
                  />
                </div>
              </div>

              {/* Medium Band */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#1C1C1A]">
                    {t.accuracyBandMed(accuracyStats.bands.med.pct, accuracyStats.bands.med.n)}
                  </span>
                  <span className="font-semibold text-[#2F3E46]">{accuracyStats.bands.med.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${accuracyStats.bands.med.pct}%` }}
                  />
                </div>
              </div>

              {/* Low Band */}
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#1C1C1A]">
                    {t.accuracyBandLow(accuracyStats.bands.low.pct, accuracyStats.bands.low.n)}
                  </span>
                  <span className="font-semibold text-[#2F3E46]">{accuracyStats.bands.low.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-400 transition-all duration-300"
                    style={{ width: `${accuracyStats.bands.low.pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Confusions */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">
              {t.accuracyTopConfusions}
            </h3>
            <div className="mt-3 space-y-2 text-xs sm:text-sm">
              {accuracyStats.topConfusions.length > 0 ? (
                accuracyStats.topConfusions.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 px-3.5 py-2.5 border border-[#E6E5E0]/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F3E46]/10 text-xs font-bold text-[#2F3E46]">
                        {i + 1}
                      </span>
                      <span>
                        AI said <strong className="text-[#1C1C1A]">{t.categories[c.from]?.label || c.from}</strong> → User said{' '}
                        <strong className="text-[#2F3E46]">{t.categories[c.to]?.label || c.to}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#6B6B66]">{c.count}x</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B6B66] italic leading-relaxed">
                  {t.accuracyNoConfusions}
                </p>
              )}
            </div>
          </div>

          {/* Export & Import Actions */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-[#1C1C1A]">Dataset & Labeled Data</h3>
            <p className="text-xs text-[#6B6B66]">
              Export labeled scans with user corrections and thumbnails to train or evaluate on-device models.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] py-3 text-xs sm:text-sm font-semibold text-[#1C1C1A] shadow-2xs hover:bg-neutral-100 active:scale-95 min-h-[44px] cursor-pointer"
              >
                <FileJson className="h-4 w-4 text-[#2F3E46]" />
                <span>{t.exportJson}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] py-3 text-xs sm:text-sm font-semibold text-[#1C1C1A] shadow-2xs hover:bg-neutral-100 active:scale-95 min-h-[44px] cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                <span>{t.exportCsv}</span>
              </button>
            </div>

            <div className="pt-1">
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] py-3 text-xs sm:text-sm font-medium text-[#6B6B66] hover:bg-neutral-100 active:scale-95 min-h-[44px]">
                <Upload className="h-4 w-4" />
                <span>{t.importDataset}</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          {/* Daily requests counter */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 shadow-2xs">
            <div className="text-xs sm:text-sm font-medium text-[#1C1C1A]">
              {t.aiRequestsToday(dailyCount)}
            </div>
            <p className="mt-1 text-xs text-[#6B6B66]">
              Calculated on-device. Uses local rules first to conserve quota.
            </p>
          </div>

          {/* Model Configuration */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 space-y-3.5">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6B6B66]">
              AI Models (Configurable)
            </h3>

            <div>
              <label className="text-xs sm:text-sm font-medium text-[#1C1C1A]">{t.modelScanLabel}</label>
              <input
                type="text"
                value={settings.modelScan}
                onChange={(e) => onUpdateSettings({ modelScan: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1A] font-mono min-h-[44px] outline-none focus:border-[#2F3E46]"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-[#1C1C1A]">{t.modelSmartLabel}</label>
              <input
                type="text"
                value={settings.modelSmart}
                onChange={(e) => onUpdateSettings({ modelSmart: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#E6E5E0] bg-[#FAFAF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#1C1C1A] font-mono min-h-[44px] outline-none focus:border-[#2F3E46]"
              />
            </div>
          </div>

          {/* Storage & Privacy Options */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 space-y-3.5">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6B6B66]">
              Preferences
            </h3>

            <label className="flex items-center justify-between text-xs sm:text-sm text-[#1C1C1A] min-h-[44px] cursor-pointer">
              <span>{t.saveThumbnailsLabel}</span>
              <input
                type="checkbox"
                checked={settings.saveThumbnails}
                onChange={(e) => onUpdateSettings({ saveThumbnails: e.target.checked })}
                className="h-5 w-5 rounded border-[#E6E5E0] accent-[#2F3E46]"
              />
            </label>

            <div className="pt-3 border-t border-[#E6E5E0]/60">
              <label className="flex items-start justify-between gap-3 text-xs sm:text-sm text-[#1C1C1A] cursor-pointer min-h-[44px]">
                <div>
                  <div className="font-semibold text-[#1C1C1A]">{t.shareWithCommunityLabel}</div>
                  <div className="mt-0.5 text-xs text-[#6B6B66] leading-relaxed">
                    {t.shareWithCommunityDesc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.shareWithCommunity)}
                  onChange={(e) => onUpdateSettings({ shareWithCommunity: e.target.checked })}
                  className="h-5 w-5 rounded border-[#E6E5E0] accent-[#2F3E46] shrink-0 mt-0.5"
                />
              </label>
            </div>
          </div>

          {/* Backup / Export / Import / Clear Data */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#6B6B66]">
              Data Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E6E5E0] bg-white py-3 text-xs sm:text-sm font-medium text-[#1C1C1A] hover:bg-neutral-50 min-h-[44px] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{t.exportData}</span>
              </button>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E6E5E0] bg-white py-3 text-xs sm:text-sm font-medium text-[#1C1C1A] hover:bg-neutral-50 min-h-[44px]">
                <Upload className="h-4 w-4" />
                <span>{t.importData}</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="text-xs font-medium text-[#2F3E46]">{importStatus}</p>
            )}

            <button
              type="button"
              onClick={handleClear}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-3 text-xs sm:text-sm font-medium text-red-700 hover:bg-red-50 min-h-[44px] cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.clearData}</span>
            </button>
          </div>

          {/* About & Legal Basis */}
          <div className="rounded-xl border border-[#E6E5E0] bg-white p-4 sm:p-5 text-xs sm:text-sm space-y-2.5">
            <h3 className="font-semibold text-[#1C1C1A]">{t.aboutTitle}</h3>
            <p className="text-[#6B6B66] leading-relaxed">{t.aboutLegal}</p>
            <p className="text-xs text-[#6B6B66]/90 border-t border-[#E6E5E0] pt-2.5">
              {t.disclaimerText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
