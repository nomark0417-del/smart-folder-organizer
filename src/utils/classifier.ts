import type { Category, FileItem } from '../types';

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// 1. 사용자 카테고리와 파일명/확장자 매칭
export function classifyFile(file: { name: string; extension: string }, categories: Category[]): ClassificationResult {
  const lowerName = file.name.toLowerCase();
  const lowerExt = file.extension.toLowerCase();

  let bestMatch: { category: Category; score: number; reason: string } | null = null;

  for (const cat of categories) {
    let score = 0;
    const reasons: string[] = [];

    // 키워드 검사 (가장 높은 가중치)
    for (const kw of cat.keywords) {
      if (lowerName.includes(kw.toLowerCase())) {
        score += 10;
        reasons.push(`키워드 '${kw}' 일치`);
        break; // 첫 매칭 키워드만 카운트
      }
    }

    // 확장자 검사
    if (cat.extensions.includes(lowerExt)) {
      score += 5;
      reasons.push(`확장자 '${lowerExt}' 일치`);
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        category: cat,
        score,
        reason: reasons.join(' + '),
      };
    }
  }

  if (bestMatch) {
    return {
      categoryId: bestMatch.category.id,
      categoryName: bestMatch.category.name,
      reason: bestMatch.reason,
      confidence: bestMatch.score >= 10 ? 'high' : 'medium',
    };
  }

  // 매칭되는 카테고리가 없는 경우: 기본 기타 분류
  return {
    categoryId: 'uncategorized',
    categoryName: '기타_미분류',
    reason: '일치하는 규칙 없음',
    confidence: 'low',
  };
}

// 2. 미분류 파일들 중에서 패턴(날짜, 공통 접두어)을 자동 발견하여 추천 카테고리 제안
export function discoverSmartClusters(files: FileItem[]): { suggestedName: string; fileIds: string[]; reason: string }[] {
  const unmatched = files.filter(f => f.assignedCategoryId === 'uncategorized');
  if (unmatched.length === 0) return [];

  const clusters: { suggestedName: string; fileIds: string[]; reason: string }[] = [];
  const assignedFileIds = new Set<string>();

  // A. 날짜 패턴 감지 (예: 2026-11, 20261106, 261106 등)
  const dateRegex = /(20\d{2})[-_.년\s]?([01]?\d)[-_.월\s]?([0-3]?\d)?/g;
  const dateGroups: Record<string, string[]> = {};

  for (const file of unmatched) {
    const match = file.name.match(dateRegex);
    if (match) {
      const yearMonth = match[0].replace(/[^\d]/g, '').slice(0, 6);
      if (yearMonth.length >= 4) {
        const groupKey = yearMonth.length >= 6 ? `${yearMonth.slice(0, 4)}-${yearMonth.slice(4, 6)}` : yearMonth;
        if (!dateGroups[groupKey]) dateGroups[groupKey] = [];
        dateGroups[groupKey].push(file.id);
      }
    }
  }

  for (const [dateKey, ids] of Object.entries(dateGroups)) {
    if (ids.length >= 2) {
      clusters.push({
        suggestedName: `날짜_${dateKey}`,
        fileIds: ids,
        reason: `${ids.length}개 파일에서 공통 연월 패턴(${dateKey}) 감지`,
      });
      ids.forEach(id => assignedFileIds.add(id));
    }
  }

  // B. 공통 단어/접두사 분석 (단어 길이 2 이상)
  const remaining = unmatched.filter(f => !assignedFileIds.has(f.id));
  const tokenCount: Record<string, string[]> = {};

  for (const file of remaining) {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const tokens = baseName.split(/[-_\s.()[\]{}]+/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 2);
    const uniqueTokens = Array.from(new Set(tokens));

    for (const t of uniqueTokens) {
      if (!tokenCount[t]) tokenCount[t] = [];
      tokenCount[t].push(file.id);
    }
  }

  // 2개 이상 파일에서 공유되는 단어 찾기
  const sortedTokens = Object.entries(tokenCount)
    .filter(([_, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [token, ids] of sortedTokens) {
    const unallocated = ids.filter(id => !assignedFileIds.has(id));
    if (unallocated.length >= 2) {
      clusters.push({
        suggestedName: `프로젝트_${token}`,
        fileIds: unallocated,
        reason: `${unallocated.length}개 파일에서 공통 키워드 '${token}' 감지`,
      });
      unallocated.forEach(id => assignedFileIds.add(id));
    }
  }

  return clusters;
}
