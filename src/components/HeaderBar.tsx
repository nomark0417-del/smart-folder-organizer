import { FolderOpen, Play, AlertTriangle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { formatBytes } from '../utils/format';

interface HeaderBarProps {
  dirName: string | null;
  isDemoMode: boolean;
  totalFiles: number;
  totalSize: number;
  categorizedCount: number;
  isScanning: boolean;
  onSelectDirectory: () => void;
  onLoadDemo: () => void;
  onReclassifyAll: () => void;
  onExecute: () => void;
  canExecute: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  dirName,
  isDemoMode,
  totalFiles,
  totalSize,
  categorizedCount,
  isScanning,
  onSelectDirectory,
  onLoadDemo,
  onReclassifyAll,
  onExecute,
  canExecute,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* 로고 & 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Smart Folder Organizer
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50">
                <ShieldCheck className="h-3 w-3" /> 100% 로컬 처리
              </span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/50">
                  <Sparkles className="h-3 w-3" /> 체험용 데모 모드
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              다운로드·바탕화면의 뒤섞인 파일을 내 업무 폴더 규칙과 파일명 연관성으로 자동 분류합니다
            </p>
          </div>
        </div>

        {/* 우측 컨트롤 버튼 영역 */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {dirName ? (
            <div className="hidden xl:flex flex-col items-end text-xs mr-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className={`inline-block h-2 w-2 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="max-w-[180px] truncate">{dirName}</span>
                <span className="text-slate-400">({totalFiles}개, {formatBytes(totalSize)})</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                자동 분류 완료: <strong className="text-blue-600 dark:text-blue-400">{categorizedCount}</strong> / {totalFiles}
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              정리할 폴더를 선택하거나 데모 모드로 체험해 보세요
            </div>
          )}

          {totalFiles > 0 && (
            <button
              onClick={onReclassifyAll}
              title="현재 설정된 업무 폴더 규칙으로 모든 파일을 다시 분류합니다"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 cursor-pointer dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">규칙 재적용</span>
            </button>
          )}

          {!dirName && (
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition active:scale-95 cursor-pointer dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              샘플 체험
            </button>
          )}

          <button
            onClick={onSelectDirectory}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {dirName ? '다른 폴더 열기' : '폴더 선택하기'}
          </button>

          <button
            onClick={onExecute}
            disabled={!canExecute}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
              canExecute
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            정리 실행하기
          </button>
        </div>
      </div>
    </header>
  );
};
