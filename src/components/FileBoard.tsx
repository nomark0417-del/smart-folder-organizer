import { useState } from 'react';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  FolderPlus,
  Filter,
  ChevronsUpDown,
  FileUp,
} from 'lucide-react';
import type { FileItem, Category } from '../types';
import { formatBytes, formatDate } from '../utils/format';

interface FileBoardProps {
  files: FileItem[];
  categories: Category[];
  smartClusters: { suggestedName: string; fileIds: string[]; reason: string }[];
  onReassignFile: (fileId: string, newCategoryId: string) => void;
  onApplyCluster: (suggestedName: string, fileIds: string[]) => void;
  onSelectDirectory: () => void;
  onSelectFiles: () => void;
  onLoadDemo: () => void;
  onDropFiles?: (files: FileList) => void;
}

type ViewFilter = 'non-empty' | 'all' | 'uncategorized';

function getFileIcon(ext: string) {
  const lower = ext.toLowerCase();
  if (['.docx', '.doc', '.pdf', '.hwp', '.hwpx', '.txt', '.md', '.pptx', '.ppt'].includes(lower)) {
    return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (['.xlsx', '.xls', '.csv'].includes(lower)) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
  }
  if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.fig', '.psd', '.ai'].includes(lower)) {
    return <FileImage className="h-4 w-4 text-purple-500 shrink-0" />;
  }
  if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.py', '.yaml', '.yml'].includes(lower)) {
    return <FileCode className="h-4 w-4 text-amber-500 shrink-0" />;
  }
  if (['.zip', '.tar', '.gz', '.7z', '.exe', '.msi', '.dmg'].includes(lower)) {
    return <FileArchive className="h-4 w-4 text-rose-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-slate-400 shrink-0" />;
}

export const FileBoard: React.FC<FileBoardProps> = ({
  files,
  categories,
  smartClusters,
  onReassignFile,
  onApplyCluster,
  onSelectDirectory,
  onSelectFiles,
  onLoadDemo,
  onDropFiles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('non-empty');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onDropFiles) {
        onDropFiles(e.dataTransfer.files);
      }
    }
  };

  if (files.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-full min-h-[480px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99] dark:bg-blue-950/40'
            : 'border-slate-300 bg-white/70 dark:border-slate-800 dark:bg-slate-900/50'
        }`}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 dark:from-blue-950/60 dark:to-indigo-950/60 dark:text-blue-400 mb-4 shadow-xs border border-blue-100 dark:border-blue-900/50">
          <FolderPlus className="h-8 w-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
          {isDragOver ? '파일을 여기에 놓아주세요!' : '정리할 폴더나 개별 파일을 선택해 주세요'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          폴더를 통째로 선택하거나, 여러 개별 파일을 직접 선택/드래그하여
          <br className="hidden sm:inline" /> 내 업무 폴더 키워드 규칙에 따라 안전하게 자동 분류할 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={onSelectDirectory}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95 cursor-pointer"
          >
            <FolderPlus className="h-4 w-4" />
            내 컴퓨터에서 폴더 선택
          </button>
          <button
            onClick={onSelectFiles}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition active:scale-95 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <FileUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            개별 파일 여러 개 업로드
          </button>
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition active:scale-95 cursor-pointer dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
          >
            <Sparkles className="h-4 w-4" />
            샘플 데모 체험
          </button>
        </div>

        {/* 3단계 간단 가이드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-left">
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">STEP 1. 폴더 규칙 커스텀</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              좌측에서 내 업무 폴더명과 매칭 키워드를 자유롭게 추가·수정합니다.
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">STEP 2. AI 연관성 & 미세조정</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              자동 분류 결과를 확인하고 추천 폴더를 묶거나 드롭다운으로 조정합니다.
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">STEP 3. 원클릭 폴더 이동</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              [정리 실행하기]를 누르면 실제 하위 폴더가 생성되며 깔끔히 정리됩니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 검색어 필터링
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorizedCount = files.filter(f => f.assignedCategoryId !== 'uncategorized').length;
  const uncategorizedCount = files.length - categorizedCount;
  const matchRate = files.length > 0 ? Math.round((categorizedCount / files.length) * 100) : 0;

  // 카테고리별 그룹화
  const allCategoryGroups = [
    ...categories,
    { id: 'uncategorized', name: '기타_미분류', color: '#94a3b8', keywords: [], extensions: [] },
  ];

  const visibleGroups = allCategoryGroups.filter(cat => {
    if (viewFilter === 'uncategorized') return cat.id === 'uncategorized';
    const groupCount = filteredFiles.filter(f => f.assignedCategoryId === cat.id).length;
    if (viewFilter === 'non-empty' || searchTerm) return groupCount > 0;
    return true;
  });

  const handleToggleAllCollapse = () => {
    const anyCollapsed = visibleGroups.some(g => collapsedGroups[g.id]);
    const nextState: Record<string, boolean> = {};
    for (const g of visibleGroups) {
      nextState[g.id] = !anyCollapsed;
    }
    setCollapsedGroups(nextState);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex h-full flex-col gap-3.5 transition-all ${
        isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl dark:ring-offset-slate-950' : ''
      }`}
    >
      {/* 드래그 오버레이 피드백 */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-xs border-2 border-dashed border-blue-500 text-blue-700 dark:text-blue-300 font-bold text-sm pointer-events-none">
          <FileUp className="h-6 w-6 mr-2 animate-bounce" />
          파일을 여기에 놓으면 즉시 목록에 추가됩니다!
        </div>
      )}

      {/* 상단 분류 요약 대시보드 바 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">전체 스캔 파일</div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            {files.length}개
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>업무 폴더 매칭률</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{matchRate}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${matchRate}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">분류 완료 / 미분류</div>
          <div className="text-base font-bold mt-0.5">
            <span className="text-emerald-600 dark:text-emerald-400">{categorizedCount}</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1.5">/</span>
            <span className="text-slate-500 dark:text-slate-400">{uncategorizedCount}</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">AI 패턴 발견</div>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {smartClusters.length}건
          </div>
        </div>
      </div>

      {/* 스마트 클러스터 추천 배너 (있을 때만 표시) */}
      {smartClusters.length > 0 && (
        <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-purple-50/90 p-3.5 shadow-2xs dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-purple-950/40">
          <div className="flex items-center gap-2 mb-2 text-indigo-950 dark:text-indigo-200">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold">
              AI 연관성 발견: 미분류 파일에서 공통 키워드·날짜 패턴을 감지했습니다 (클릭 시 새 업무 폴더로 즉시 분류)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartClusters.map((cluster, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-indigo-200/80 bg-white/95 px-3 py-1.5 shadow-2xs dark:border-indigo-800 dark:bg-slate-900/90"
              >
                <div className="text-xs">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    📂 {cluster.suggestedName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                    ({cluster.reason})
                  </span>
                </div>
                <button
                  onClick={() => onApplyCluster(cluster.suggestedName, cluster.fileIds)}
                  className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shrink-0"
                >
                  + 이 폴더로 묶기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 바 & 보기 필터 컨트롤 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="파일명 실시간 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setViewFilter('non-empty')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                viewFilter === 'non-empty'
                  ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/70 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              파일 있는 폴더만
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                viewFilter === 'all'
                  ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/70 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              전체 폴더 ({allCategoryGroups.length})
            </button>
            <button
              onClick={() => setViewFilter('uncategorized')}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                viewFilter === 'uncategorized'
                  ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/70 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              미분류 ({uncategorizedCount})
            </button>
          </div>

          <button
            onClick={onSelectFiles}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
            title="개별 파일을 추가로 업로드합니다"
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>파일 추가</span>
          </button>

          <button
            onClick={handleToggleAllCollapse}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            title="모든 폴더 펼치기/접기"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            <span>모두 접기/펼치기</span>
          </button>
        </div>
      </div>

      {/* 그룹화된 파일 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {visibleGroups.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <Filter className="h-6 w-6 mx-auto mb-2 text-slate-300" />
            조건에 해당하는 파일이나 폴더가 없습니다.
          </div>
        ) : (
          visibleGroups.map(cat => {
            const groupFiles = filteredFiles.filter(f => f.assignedCategoryId === cat.id);
            const isCollapsed = collapsedGroups[cat.id];

            return (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
              >
                {/* 그룹 헤더 */}
                <div
                  onClick={() => toggleGroup(cat.id)}
                  className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 cursor-pointer hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/50 transition select-none"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      📁 {cat.name}
                    </span>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {groupFiles.length}개
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isCollapsed ? '펼치기' : '접기'}
                  </span>
                </div>

                {/* 파일 리스트 */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {groupFiles.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        배정된 파일이 없습니다.
                      </div>
                    ) : (
                      groupFiles.map(file => (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition text-xs"
                        >
                          {/* 파일 기본 정보 */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {getFileIcon(file.extension)}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-slate-900 dark:text-white" title={file.name}>
                                {file.name}
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <span>{formatBytes(file.size)}</span>
                                <span>•</span>
                                <span>{formatDate(file.lastModified)}</span>
                                {file.matchReason && (
                                  <>
                                    <span>•</span>
                                    <span
                                      className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                                        file.isManual
                                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                      }`}
                                    >
                                      {file.matchReason}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 이동 대상 폴더 변경 드롭다운 */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <span className="text-[11px] text-slate-400 hidden lg:inline">이동 폴더:</span>
                            <select
                              value={file.assignedCategoryId}
                              onChange={e => onReassignFile(file.id, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                            >
                              {allCategoryGroups.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
