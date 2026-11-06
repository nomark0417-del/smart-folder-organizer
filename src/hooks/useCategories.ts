import { useState, useEffect } from 'react';
import type { Category } from '../types';
import { sanitizeFolderName } from '../utils/format';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'work-docs',
    name: '기획_업무문서',
    description: '보고서, 사업계획서, 기획서, 회의록',
    keywords: ['기획', '보고', '전략', '회의', '제안', '계획', '발표', '검토', '안내', '매뉴얼', '정리'],
    extensions: ['.docx', '.doc', '.pptx', '.ppt', '.pdf', '.hwp', '.hwpx', '.txt', '.md'],
    color: '#3b82f6', // blue
    isDefault: true,
  },
  {
    id: 'finance-tax',
    name: '회계_영수증_재무',
    description: '세금계산서, 법인카드 영수증, 견적서, 급여명세서',
    keywords: ['영수증', '세금', '계산서', '급여', '원천징수', '비용', '정산', '견적', 'invoice', 'receipt', 'tax', 'bill'],
    extensions: ['.pdf', '.xlsx', '.xls', '.csv'],
    color: '#10b981', // emerald
    isDefault: true,
  },
  {
    id: 'design-media',
    name: '디자인_이미지_시안',
    description: '디자인 에셋, 로고, 스크린샷, 시안 파일',
    keywords: ['시안', '디자인', '로고', '배너', '아이콘', '캡처', '스크린샷', 'screenshot', 'capture', 'mockup', 'asset'],
    extensions: ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.psd', '.ai', '.fig'],
    color: '#8b5cf6', // violet
    isDefault: true,
  },
  {
    id: 'dev-code',
    name: '개발_소스코드',
    description: '스크립트, 데이터베이스 덤프, 패키지 및 소스파일',
    keywords: ['코드', '개발', '소스', 'api', 'db', 'backup', 'patch', 'fix', 'schema', 'query'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.py', '.yaml', '.yml', '.env'],
    color: '#f59e0b', // amber
    isDefault: true,
  },
  {
    id: 'installers',
    name: '설치_임시파일',
    description: '프로그램 설치 파일, 인스톨러, 셋업 바이너리',
    keywords: ['setup', 'installer', 'install', 'update', 'driver', '설치', '패치', 'client'],
    extensions: ['.exe', '.msi', '.dmg', '.pkg', '.iso', '.zip'],
    color: '#64748b', // slate
    isDefault: true,
  },
];

const STORAGE_KEY = 'smart-folder-organizer:categories:v1';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
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

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
  };
}
