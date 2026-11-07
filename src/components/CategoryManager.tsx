import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Check, X, Folder, RotateCcw, Download, Upload, Link, CheckCheck } from 'lucide-react';
import type { Category } from '../types';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

interface CategoryManagerProps {
  categories: Category[];
  fileCountsByCategory: Record<string, number>;
  onAddCategory: (name: string, keywords: string[], extensions: string[], color?: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  onDeleteCategory: (id: string) => void;
  onResetToDefaults: () => void;
  onExportRules?: () => void;
  onImportRules?: (file: File) => Promise<{ success: boolean; count?: number; error?: string }>;
  onCopyShareLink?: () => Promise<boolean>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  fileCountsByCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetToDefaults,
  onExportRules,
  onImportRules,
  onCopyShareLink,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditKeywords(cat.keywords.join(', '));
    setEditColor(cat.color || PRESET_COLORS[0]);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateCategory(id, {
      name: editName.trim(),
      keywords: editKeywords.split(',').map(s => s.trim()).filter(Boolean),
      color: editColor,
    });
    setEditingId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCategory(
      newName.trim(),
      newKeywords.split(',').map(s => s.trim()).filter(Boolean),
      [],
      newColor
    );
    setNewName('');
    setNewKeywords('');
    setNewColor(PRESET_COLORS[(categories.length + 1) % PRESET_COLORS.length]);
    setIsAdding(false);
  };

  const handleCopyLink = async () => {
    if (onCopyShareLink) {
      const ok = await onCopyShareLink();
      if (ok) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportRules) {
      const res = await onImportRules(file);
      if (res.success) {
        alert(`${res.count}개의 업무 폴더 규칙을 성공적으로 불러왔습니다!`);
      } else {
        alert(res.error || '규칙을 불러오지 못했습니다.');
      }
    }
    if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-blue-500" />
            내 업무 폴더 규칙 ({categories.length})
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            폴더명과 매칭 키워드를 추가·수정하면 즉시 분류에 반영됩니다
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/60 transition cursor-pointer shrink-0"
        >
          {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isAdding ? '취소' : '폴더 추가'}
        </button>
      </div>

      {/* 새 폴더 추가 폼 */}
      {isAdding && (
        <form onSubmit={handleCreateCategory} className="border-b border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                폴더명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 2026_인사평가, 거래처_견적서"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                매칭 키워드 <span className="text-red-500">*</span> <span className="font-normal text-slate-400">(쉼표 구분, 파일명에 포함 시 분류)</span>
              </label>
              <input
                type="text"
                placeholder="예: 인사, 평가, 면접, 이력서"
                value={newKeywords}
                onChange={e => setNewKeywords(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">폴더 라벨 색상</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`h-5 w-5 rounded-full transition cursor-pointer ${
                      newColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 dark:ring-offset-slate-900' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer dark:border-slate-700 dark:text-slate-400"
              >
                취소
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                폴더 생성
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 카테고리 목록 */}
      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/70">
        {categories.map(cat => {
          const isEditing = editingId === cat.id;
          const count = fileCountsByCategory[cat.id] || 0;

          if (isEditing) {
            return (
              <div key={cat.id} className="p-3 bg-blue-50/50 rounded-lg dark:bg-blue-950/20 my-1 space-y-2.5 text-xs border border-blue-200/60 dark:border-blue-900/50">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">폴더명</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">키워드 (쉼표 구분)</label>
                  <input
                    type="text"
                    value={editKeywords}
                    onChange={e => setEditKeywords(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">색상</label>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className={`h-4 w-4 rounded-full transition cursor-pointer ${
                          editColor === color ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-70'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded px-2 py-1 text-slate-500 hover:bg-slate-200/60 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleSaveEdit(cat.id)}
                    className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 font-semibold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> 저장
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              onDoubleClick={() => handleStartEdit(cat)}
              className="group flex flex-col gap-1.5 rounded-lg p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate" title={cat.name}>
                    {cat.name}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      count > 0
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    title="폴더명 및 키워드 수정"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                    title="폴더 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 키워드 태그 프리뷰 */}
              {cat.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-4">
                  {cat.keywords.slice(0, 5).map((kw, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      #{kw}
                    </span>
                  ))}
                  {cat.keywords.length > 5 && (
                    <span className="text-[10px] text-slate-400 self-center">+{cat.keywords.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 동기화 및 백업 유틸리티 */}
      <div className="border-t border-slate-100 p-3 space-y-2 dark:border-slate-800">
        <input
          type="file"
          ref={jsonFileInputRef}
          accept=".json"
          onChange={handleJsonFileChange}
          className="hidden"
        />

        {/* 1클릭 URL 동기화 링크 복사 (가장 추천하는 방법) */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
            copiedLink
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95'
          }`}
          title="이 링크를 다른 PC에서 열기만 하면 내 폴더 규칙이 1초 만에 그대로 적용됩니다"
        >
          {copiedLink ? (
            <>
              <CheckCheck className="h-4 w-4" />
              <span>링크 복사 완료! (다른 PC에서 열면 즉시 적용)</span>
            </>
          ) : (
            <>
              <Link className="h-3.5 w-3.5" />
              <span>내 규칙 공유 링크 복사 (다른 PC용)</span>
            </>
          )}
        </button>

        {/* 보조: 파일 백업/복원 및 기본값 복원 */}
        <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
          <button
            type="button"
            onClick={onExportRules}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer transition text-[10px]"
            title="현재 폴더 규칙들을 JSON 파일로 내보냅니다"
          >
            <Download className="h-2.5 w-2.5 text-blue-500" />
            <span>파일 백업</span>
          </button>
          <button
            type="button"
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer transition text-[10px]"
            title="저장해둔 규칙 JSON 파일을 불러옵니다"
          >
            <Upload className="h-2.5 w-2.5 text-indigo-500" />
            <span>파일 복원</span>
          </button>
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-transparent px-1.5 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition text-[10px]"
            title="처음 기본 업무 폴더 프리셋으로 되돌립니다"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>기본 복원</span>
          </button>
        </div>
      </div>
    </div>
  );
};
