import { useState, useEffect } from 'react';
import type { Category } from '../types';
import { sanitizeFolderName } from '../utils/format';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'work-docs',
    name: '기획_업무문서',
    description: '보고서, 사업계획서, 기획서, 회의록',
    keywords: ['기획', '보고', '전략', '회의', '제안', '계획', '발표', '검토', '안내', '매뉴얼', '정리', '공지'],
    extensions: [],
    color: '#3b82f6', // blue
    isDefault: true,
  },
  {
    id: 'finance-tax',
    name: '회계_영수증_재무',
    description: '세금계산서, 법인카드 영수증, 견적서, 급여명세서',
    keywords: ['영수증', '세금', '계산서', '급여', '원천징수', '비용', '정산', '견적', '재무', '회계', 'invoice', 'receipt', 'tax', 'bill'],
    extensions: [],
    color: '#10b981', // emerald
    isDefault: true,
  },
  {
    id: 'design-media',
    name: '디자인_이미지_시안',
    description: '디자인 에셋, 로고, 스크린샷, 시안 파일',
    keywords: ['시안', '디자인', '로고', '배너', '아이콘', '캡처', '스크린샷', '포스터', 'screenshot', 'capture', 'mockup', 'asset'],
    extensions: [],
    color: '#8b5cf6', // violet
    isDefault: true,
  },
  {
    id: 'dev-code',
    name: '개발_소스코드',
    description: '스크립트, 데이터베이스 덤프, 패키지 및 소스파일',
    keywords: ['코드', '개발', '소스', 'api', 'db', 'backup', 'patch', 'fix', 'schema', 'query', 'sql', 'dump'],
    extensions: [],
    color: '#f59e0b', // amber
    isDefault: true,
  },
  {
    id: 'installers',
    name: '설치_임시파일',
    description: '프로그램 설치 파일, 인스톨러, 셋업 바이너리',
    keywords: ['setup', 'installer', 'install', 'update', 'driver', '설치', '패치', 'client', '다운로드'],
    extensions: [],
    color: '#64748b', // slate
    isDefault: true,
  },
];

const STORAGE_KEY = 'smart-folder-organizer:categories:v2';

function parseRulesPayload(rawPayload: string): Category[] | null {
  try {
    const jsonStr = decodeURIComponent(atob(rawPayload));
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any, i: number) => ({
        id: `cat-${Date.now()}-${i}`,
        name: sanitizeFolderName(item.n || item.name) || '폴더',
        description: '',
        keywords: Array.isArray(item.k || item.keywords)
          ? (item.k || item.keywords).map((k: any) => String(k).trim().toLowerCase()).filter(Boolean)
          : [],
        extensions: [],
        color: item.c || item.color || '#3b82f6',
      }));
    }
  } catch (e) {
    console.warn('Failed to parse rules from URL payload', e);
  }
  return null;
}

export function useCategories() {
  const [importedFromUrlCount, setImportedFromUrlCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashMatch = window.location.hash.match(/rules=([^&]+)/);
      const queryMatch = window.location.search.match(/[?&]rules=([^&]+)/);
      const rawPayload = hashMatch ? hashMatch[1] : (queryMatch ? queryMatch[1] : null);
      if (rawPayload) {
        const urlCategories = parseRulesPayload(rawPayload);
        if (urlCategories && urlCategories.length > 0) {
          setImportedFromUrlCount(urlCategories.length);
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
        }
      }
    }
  }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    // 1. URL 해시 또는 쿼리에서 공유된 규칙 우선 확인
    if (typeof window !== 'undefined') {
      const hashMatch = window.location.hash.match(/rules=([^&]+)/);
      const queryMatch = window.location.search.match(/[?&]rules=([^&]+)/);
      const rawPayload = hashMatch ? hashMatch[1] : (queryMatch ? queryMatch[1] : null);

      if (rawPayload) {
        const urlCategories = parseRulesPayload(rawPayload);
        if (urlCategories && urlCategories.length > 0) {
          return urlCategories;
        }
      }
    }

    // 2. localStorage 확인
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  const addCategory = (name: string, keywords: string[] = [], extensions: string[] = [], color = '#3b82f6') => {
    const safeName = sanitizeFolderName(name);
    if (!safeName) return null;

    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCategory: Category = {
      id,
      name: safeName,
      keywords: keywords.map(k => k.trim().toLowerCase()).filter(Boolean),
      extensions: extensions
        .map(e => (e.trim().toLowerCase().startsWith('.') ? e.trim().toLowerCase() : `.${e.trim().toLowerCase()}`))
        .filter(Boolean),
      color,
    };

    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== id) return cat;
        const nextName = updates.name !== undefined ? sanitizeFolderName(updates.name) || cat.name : cat.name;
        return {
          ...cat,
          ...updates,
          name: nextName,
          keywords: updates.keywords
            ? updates.keywords.map(k => k.trim().toLowerCase()).filter(Boolean)
            : cat.keywords,
          extensions: updates.extensions
            ? updates.extensions
              .map(e => (e.trim().toLowerCase().startsWith('.') ? e.trim().toLowerCase() : `.${e.trim().toLowerCase()}`))
              .filter(Boolean)
            : cat.extensions,
        };
      })
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const resetToDefaults = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  const exportCategories = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(categories, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `folder-rules-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export categories', e);
      alert('규칙 내보내기에 실패했습니다.');
    }
  };

  const importCategories = async (file: File): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validCategories: Category[] = parsed
          .filter((item: any) => item && typeof item.name === 'string' && item.name.trim())
          .map((item: any) => ({
            id: typeof item.id === 'string' ? item.id : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: sanitizeFolderName(item.name) || '폴더',
            description: typeof item.description === 'string' ? item.description : '',
            keywords: Array.isArray(item.keywords)
              ? item.keywords.map((k: any) => String(k).trim().toLowerCase()).filter(Boolean)
              : [],
            extensions: [],
            color: typeof item.color === 'string' ? item.color : '#3b82f6',
          }));

        if (validCategories.length === 0) {
          throw new Error('유효한 폴더 규칙을 찾을 수 없습니다.');
        }

        setCategories(validCategories);
        return { success: true, count: validCategories.length };
      } else {
        throw new Error('올바른 형식의 규칙 파일(JSON)이 아닙니다.');
      }
    } catch (e: any) {
      console.error('Failed to import categories', e);
      return { success: false, error: e?.message || '규칙 가져오기에 실패했습니다.' };
    }
  };

  const copyShareLink = async (): Promise<boolean> => {
    try {
      const minimal = categories.map(c => ({
        n: c.name,
        k: c.keywords,
        c: c.color,
      }));
      const jsonStr = JSON.stringify(minimal);
      const base64 = btoa(encodeURIComponent(jsonStr));
      const shareUrl = `${window.location.origin}${window.location.pathname}#rules=${base64}`;
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (e) {
      console.error('Failed to copy share link', e);
      return false;
    }
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
    exportCategories,
    importCategories,
    copyShareLink,
    importedFromUrlCount,
    dismissImportedBanner: () => setImportedFromUrlCount(null),
  };
}
