import { CheckCircle2, AlertCircle, Loader2, X, FolderCheck, Play } from 'lucide-react';

interface FolderPlanSummary {
  folderName: string;
  color: string;
  count: number;
}

interface ExecutionModalProps {
  isOpen: boolean;
  isConfirmStep: boolean;
  isDemoMode: boolean;
  isExecuting: boolean;
  folderSummaries: FolderPlanSummary[];
  totalFilesCount: number;
  progress: { current: number; total: number; currentFileName: string };
  result: { successCount: number; failCount: number; errors: { fileName: string; error: string }[] } | null;
  onConfirmStart: () => void;
  onClose: () => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  isConfirmStep,
  isDemoMode,
  isExecuting,
  folderSummaries,
  totalFilesCount,
  progress,
  result,
  onConfirmStart,
  onClose,
}) => {
  if (!isOpen) return null;

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {isConfirmStep
              ? '폴더 정리 실행 전 최종 확인'
              : isExecuting
                ? '폴더 정리 진행 중...'
                : '폴더 정리 완료'}
          </h3>
          {!isExecuting && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 1단계: 실행 전 요약 확인 */}
        {isConfirmStep && !isExecuting && (
          <div className="py-5 space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              총 <strong className="text-blue-600 dark:text-blue-400">{totalFilesCount}개</strong>의 파일을 아래{' '}
              <strong>{folderSummaries.length}개</strong>의 업무 폴더로 분류하여 이동합니다.
              {isDemoMode && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  * 현재 데모 모드이므로 실제 PC 파일은 변경되지 않고 시뮬레이션으로 실행됩니다.
                </span>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
              {folderSummaries.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">📁 {item.folderName}</span>
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">{item.count}개 파일</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                취소
              </button>
              <button
                onClick={onConfirmStart}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                지금 정리 시작
              </button>
            </div>
          </div>
        )}

        {/* 2단계: 진행 중 상태 */}
        {isExecuting && (
          <div className="py-6 space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {progress.current} / {progress.total} ({percentage}%)
              </div>
              <div
                className="text-xs text-slate-400 truncate max-w-xs mx-auto mt-1"
                title={progress.currentFileName}
              >
                이동 중: {progress.currentFileName}
              </div>
            </div>
            {/* 프로그레스 바 */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* 3단계: 완료 상태 */}
        {!isConfirmStep && !isExecuting && result && (
          <div className="py-6 space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                성공적으로 정리되었습니다!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                이동 완료: <strong className="text-emerald-600">{result.successCount}</strong>개
                {result.failCount > 0 && (
                  <span className="ml-2 text-red-500">(실패: {result.failCount}개)</span>
                )}
              </p>
            </div>

            {/* 에러 리스트 */}
            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
                <div className="font-semibold mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> 실패 항목:
                </div>
                {result.errors.map((err, i) => (
                  <div key={i} className="truncate">
                    • {err.fileName}: {err.error}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
