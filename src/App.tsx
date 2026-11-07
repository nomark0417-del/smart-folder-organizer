import { useState, useMemo, useEffect, useRef } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { CategoryManager } from './components/CategoryManager';
import { FileBoard } from './components/FileBoard';
import { ExecutionModal } from './components/ExecutionModal';
import { useCategories } from './hooks/useCategories';
import type { FileItem, Category } from './types';
import {
  selectAndScanDirectory,
  executeFileOrganization,
  isFileSystemAccessSupported,
  createFileItemsFromFiles,
} from './utils/fileSystem';
import { classifyFile, discoverSmartClusters } from './utils/classifier';
import { generateDemoFiles } from './utils/demoData';
import { AlertTriangle, Folder, LayoutGrid } from 'lucide-react';

export function App() {
  const { categories, addCategory, updateCategory, deleteCategory, resetToDefaults } = useCategories();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [dirName, setDirName] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // 모바일/태블릿용 탭 전환 상태 ('board' | 'categories')
  const [mobileTab, setMobileTab] = useState<'board' | 'categories'>('board');

  // 실행 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFileName: '' });
  const [execResult, setExecResult] = useState<{
    successCount: number;
    failCount: number;
    errors: { fileName: string; error: string }[];
  } | null>(null);

  const isSupported = useMemo(() => isFileSystemAccessSupported(), []);

  // 카테고리가 추가/수정/삭제될 때 수동 배정되지 않은 파일들과 삭제된 카테고리의 파일들을 자동 재분류
  useEffect(() => {
    setFiles(prev => {
      if (prev.length === 0) return prev;
      const validCatIds = new Set(categories.map(c => c.id));

      return prev.map(file => {
        const categoryDeleted = file.assignedCategoryId !== 'uncategorized' && !validCatIds.has(file.assignedCategoryId);
        // 수동으로 고정한 파일이면서 해당 카테고리가 아직 존재하면 그대로 유지
        if (file.isManual && !categoryDeleted) {
          return file;
        }
        const match = classifyFile({ name: file.name, extension: file.extension }, categories);
        return {
          ...file,
          assignedCategoryId: match.categoryId,
          suggestedCategoryId: match.categoryId,
          matchReason: match.reason,
          isManual: false,
        };
      });
    });
  }, [categories]);

  // 통계 계산
  const stats = useMemo(() => {
    let totalSize = 0;
    let categorizedCount = 0;
    const counts: Record<string, number> = {};

    for (const f of files) {
      totalSize += f.size;
      counts[f.assignedCategoryId] = (counts[f.assignedCategoryId] || 0) + 1;
      if (f.assignedCategoryId !== 'uncategorized') {
        categorizedCount++;
      }
    }

    return { totalSize, categorizedCount, counts };
  }, [files]);

  // 실행 전 확인 모달에 표시할 폴더별 이동 요약
  const folderSummaries = useMemo(() => {
    const allGroups: Pick<Category, 'id' | 'name' | 'color'>[] = [
      ...categories,
      { id: 'uncategorized', name: '기타_미분류', color: '#94a3b8' },
    ];
    return allGroups
      .map(g => ({
        folderName: g.name,
        color: g.color || '#3b82f6',
        count: stats.counts[g.id] || 0,
      }))
      .filter(item => item.count > 0);
  }, [categories, stats.counts]);

  // 스마트 연관성 클러스터 추천
  const smartClusters = useMemo(() => {
    return discoverSmartClusters(files);
  }, [files]);

  // 폴더 열기
  const handleSelectDirectory = async () => {
    try {
      setIsScanning(true);
      const result = await selectAndScanDirectory(categories);
      setDirHandle(result.dirHandle);
      setDirName(result.dirName);
      setIsDemoMode(false);
      setFiles(result.files);
      setMobileTab('board');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(err?.message || '폴더를 열지 못했습니다.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // 개별 파일 추가 공통 로직
  const addRawFiles = (newRawFiles: File[] | FileList) => {
    if (!newRawFiles || newRawFiles.length === 0) return;
    const newItems = createFileItemsFromFiles(newRawFiles, categories);

    setFiles(prev => {
      // 동일한 이름이 있는 경우 덮어쓰거나 고유하게 추가
      const existingNames = new Set(prev.map(f => f.name));
      const filteredNew = newItems.filter(item => !existingNames.has(item.name));
      return [...prev, ...filteredNew];
    });

    if (!dirName) {
      setDirName('직접 추가한 파일 목록');
      setIsDemoMode(false);
    }
    setMobileTab('board');
  };

  // 개별 파일 선택창 오픈
  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // input change 이벤트
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addRawFiles(e.target.files);
    }
  };

  // 드래그 앤 드롭 파일 수신
  const handleDropFiles = (droppedFiles: FileList) => {
    addRawFiles(droppedFiles);
  };

  // 데모 파일 로드
  const handleLoadDemo = () => {
    const demoFiles = generateDemoFiles(categories);
    setDirHandle(null);
    setDirName('Downloads (샘플 체험 폴더)');
    setIsDemoMode(true);
    setFiles(demoFiles);
    setMobileTab('board');
  };

  // 모든 파일에 현재 규칙 강제 재적용 (수동 변경 초기화 포함)
  const handleReclassifyAll = () => {
    setFiles(prev =>
      prev.map(file => {
        const match = classifyFile({ name: file.name, extension: file.extension }, categories);
        return {
          ...file,
          assignedCategoryId: match.categoryId,
          suggestedCategoryId: match.categoryId,
          matchReason: match.reason,
          isManual: false,
        };
      })
    );
  };

  // 파일의 카테고리 수동 재배정
  const handleReassignFile = (fileId: string, newCategoryId: string) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? {
              ...f,
              assignedCategoryId: newCategoryId,
              matchReason: '사용자 직접 지정',
              isManual: true,
            }
          : f
      )
    );
  };

  // AI 추천 클러스터 수락 (새 카테고리 생성 후 파일 일괄 이동)
  const handleApplyCluster = (suggestedName: string, fileIds: string[]) => {
    const newCat = addCategory(suggestedName);
    if (!newCat) return;

    setFiles(prev =>
      prev.map(f => {
        if (fileIds.includes(f.id)) {
          return {
            ...f,
            assignedCategoryId: newCat.id,
            matchReason: 'AI 클러스터 그룹핑 적용',
            isManual: true,
          };
        }
        return f;
      })
    );
  };

  // 정리 실행 버튼 클릭 -> 확인 모달 오픈
  const handleOpenExecuteConfirm = () => {
    if (files.length === 0) return;
    setIsConfirmStep(true);
    setIsExecuting(false);
    setExecResult(null);
    setIsModalOpen(true);
  };

  // 확인 모달에서 [지금 정리 시작] 클릭 -> 실제 파일 정리 실행
  const handleConfirmExecute = async () => {
    if (files.length === 0) return;

    let targetDirHandle = dirHandle;

    // 만약 개별 파일만 업로드해서 대상 폴더 핸들이 없는 상태라면, 저장할 폴더를 선택받음
    const hasRealFiles = files.some(f => f.rawFile || f.handle);
    if (!isDemoMode && !targetDirHandle && hasRealFiles && isSupported) {
      try {
        alert('분류된 파일들을 저장할 내 컴퓨터의 대상 폴더를 선택해 주세요.');
        const pickedHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        if (pickedHandle) {
          targetDirHandle = pickedHandle;
          setDirHandle(pickedHandle);
          setDirName((pickedHandle as any).name || '선택한 폴더');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // 사용자가 취소함
          return;
        }
        alert('대상 폴더를 열지 못했습니다: ' + (err?.message || '알 수 없음'));
        return;
      }
    }

    setIsConfirmStep(false);
    setIsExecuting(true);
    setProgress({ current: 0, total: files.length, currentFileName: '' });
    setExecResult(null);

    try {
      const result = await executeFileOrganization(
        targetDirHandle,
        files,
        categories,
        (current, total, fileName) => {
          setProgress({ current, total, currentFileName: fileName });
        }
      );
      setExecResult({
        successCount: result.successCount,
        failCount: result.failCount,
        errors: result.errors,
      });

      // 성공한 파일 ID만 정확히 목록에서 제거
      const movedSet = new Set(result.movedFileIds);
      setFiles(prev => prev.filter(f => !movedSet.has(f.id)));
    } catch (e: any) {
      alert('정리 중 오류가 발생했습니다: ' + (e?.message || '알 수 없음'));
      setIsModalOpen(false);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100">
      {/* 브라우저 미지원 경고 */}
      {!isSupported && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          현재 브라우저는 File System Access API를 지원하지 않습니다. 데모 체험은 가능하며, 실제 내 PC 폴더 이동은 Chrome, Edge, Whale 브라우저를 이용해 주세요.
        </div>
      )}

      {/* 숨겨진 개별 파일 선택 Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* 상단 헤더 바 */}
      <HeaderBar
        dirName={dirName}
        isDemoMode={isDemoMode}
        totalFiles={files.length}
        totalSize={stats.totalSize}
        categorizedCount={stats.categorizedCount}
        isScanning={isScanning}
        onSelectDirectory={handleSelectDirectory}
        onSelectFiles={handleSelectFiles}
        onLoadDemo={handleLoadDemo}
        onReclassifyAll={handleReclassifyAll}
        onExecute={handleOpenExecuteConfirm}
        canExecute={files.length > 0 && !isExecuting}
      />

      {/* 모바일/태블릿 전용 탭 전환 바 (768px 미만에서 표시) */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 md:hidden">
        <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setMobileTab('board')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              mobileTab === 'board'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            파일 분류 보드 ({files.length})
          </button>
          <button
            onClick={() => setMobileTab('categories')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              mobileTab === 'categories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            내 업무 폴더 설정 ({categories.length})
          </button>
        </div>
      </div>

      {/* 메인 2열 레이아웃 */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-4 sm:p-6 overflow-hidden">
        {/* 좌측: 내 업무 폴더 관리자 (데스크톱 상시 표시, 모바일 탭 선택 시 표시) */}
        <aside
          className={`w-full md:w-80 shrink-0 ${
            mobileTab === 'categories' ? 'block' : 'hidden md:block'
          }`}
        >
          <CategoryManager
            categories={categories}
            fileCountsByCategory={stats.counts}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onResetToDefaults={resetToDefaults}
          />
        </aside>

        {/* 우측: 파일 분류 보드 & 미리보기 */}
        <section
          className={`flex-1 min-w-0 ${
            mobileTab === 'board' ? 'block' : 'hidden md:block'
          }`}
        >
          <FileBoard
            files={files}
            categories={categories}
            smartClusters={smartClusters}
            onReassignFile={handleReassignFile}
            onApplyCluster={handleApplyCluster}
            onSelectDirectory={handleSelectDirectory}
            onSelectFiles={handleSelectFiles}
            onLoadDemo={handleLoadDemo}
            onDropFiles={handleDropFiles}
          />
        </section>
      </main>

      {/* 실행 확인 & 진행 모달 */}
      <ExecutionModal
        isOpen={isModalOpen}
        isConfirmStep={isConfirmStep}
        isDemoMode={isDemoMode}
        isExecuting={isExecuting}
        folderSummaries={folderSummaries}
        totalFilesCount={files.length}
        progress={progress}
        result={execResult}
        onConfirmStart={handleConfirmExecute}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default App;
