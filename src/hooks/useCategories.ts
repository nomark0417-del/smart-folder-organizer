import { useState, useEffect } from 'react';
import type { Category } from '../types';
import { sanitizeFolderName } from '../utils/format';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'suneung',
    name: '수능',
    description: '대학수학능력시험, 모의평가, 학력평가, 수험생 및 시험장 관련 문서',
    keywords: [
      '수능',
      '대학수학능력시험',
      '모의평가',
      '모평',
      '학력평가',
      '학평',
      '모의고사',
      '수험생',
      '수험표',
      '원서접수',
      '응시원서',
      '시험장',
      '고사장',
      '감독관',
      '성적표',
      '성적통지표',
      '평가원',
      '답안지',
      'omr',
      '문항',
      'csat',
    ],
    extensions: [],
    color: '#3b82f6', // blue
    isDefault: true,
  },
  {
    id: 'dormitory',
    name: '기숙사',
    description: '기숙사·생활관 운영, 사생 관리, 입퇴사, 점호 및 생활지도 문서',
    keywords: [
      '기숙사',
      '사생',
      '입사',
      '퇴사',
      '점호',
      '호실',
      '사감',
      '외출',
      '외박',
      '귀가',
      '귀사',
      '생활관',
      '학사',
      '기숙사비',
      '사생수칙',
      '호실배정',
      '룸메이트',
      '잔류',
      '상벌점',
      'dorm',
      'dormitory',
    ],
    extensions: [],
    color: '#10b981', // emerald
    isDefault: true,
  },
  {
    id: 'ebs',
    name: 'EBS',
    description: 'EBS 수능특강, 수능완성, 연계교재, 방송강의 및 학습자료',
    keywords: [
      'ebs',
      'ebsi',
      '수능특강',
      '수특',
      '수능완성',
      '수완',
      '연계교재',
      '방송교재',
      'ebs교재',
      '파이널',
      '정답지',
      '해설지',
      '듣기평가',
      '방과후교재',
      '인터넷수능',
    ],
    extensions: [],
    color: '#8b5cf6', // violet
    isDefault: true,
  },
  {
    id: 'budget',
    name: '예산',
    description: '학교회계, 본예산/추경, 품의, 지출결의, 정산 및 재무 문서',
    keywords: [
      '예산',
      '품의',
      '지출',
      '정산',
      '회계',
      '결산',
      '추경',
      '본예산',
      '세출',
      '세입',
      '사업비',
      '운영비',
      '에듀파인',
      'k에듀파인',
      '집행',
      '원인행위',
      '영수증',
      '세금계산서',
      '견적서',
      '여비',
      'budget',
    ],
    extensions: [],
    color: '#f59e0b', // amber
    isDefault: true,
  },
  {
    id: 'general-affairs',
    name: '서무',
    description: '공문 수발, 기안, 복무, 당직, 비품, 보안 및 일반 행정 문서',
    keywords: [
      '서무',
      '공문',
      '기안',
      '내부결재',
      '결재',
      '복무',
      '당직',
      '일직',
      '숙직',
      '출장',
      '연가',
      '조퇴',
      '병가',
      '비품',
      '물품',
      '기록물',
      '보안',
      '제증명',
      '증명서',
      '공인',
      '차량',
      '배차',
      '상훈',
      '표창',
      '행사지원',
      '회의록',
      '인계인수',
    ],
    extensions: [],
    color: '#06b6d4', // cyan
    isDefault: true,
  },
];

const STORAGE_KEY = 'smart-folder-organizer:categories:v3';

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
