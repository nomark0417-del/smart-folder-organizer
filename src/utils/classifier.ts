import type { Category, FileItem } from '../types';

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// 1. 오직 사용자 카테고리의 '키워드'를 기준으로 파일 분류 (확장자는 제외)
export function classifyFile(file: { name: string; extension?: string }, categories: Category[]): ClassificationResult {
  const lowerName = file.name.toLowerCase();

  let bestMatch: { category: Category; score: number; matchedKeywords: string[] } | null = null;

  for (const cat of categories) {
    if (!cat.keywords || cat.keywords.length === 0) continue;

    const matched: string[] = [];
    let score = 0;

    for (const rawKw of cat.keywords) {
      const kw = rawKw.trim().toLowerCase();
      if (!kw) continue;

      if (lowerName.includes(kw)) {
        matched.push(rawKw.trim());
        // 키워드가 길수록 더 구체적인 키워드로 간주하여 높은 점수 부여
        score += 10 + kw.length;
      }
    }

    if (matched.length > 0) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          category: cat,
          score,
          matchedKeywords: matched,
        };
      }
    }
  }

  // 일치하는 키워드가 하나라도 있는 경우 해당 카테고리로 배정
  if (bestMatch) {
    const kwText = bestMatch.matchedKeywords.slice(0, 3).map(k => `'${k}'`).join(', ');
    const moreText = bestMatch.matchedKeywords.length > 3 ? ` 외 ${bestMatch.matchedKeywords.length - 3}개` : '';
    return {
      categoryId: bestMatch.category.id,
      categoryName: bestMatch.category.name,
      reason: `키워드 ${kwText}${moreText} 일치`,
      confidence: 'high',
    };
  }

  // 키워드가 없는 파일은 무조건 '기타_미분류'로 남김
  return {
    categoryId: 'uncategorized',
    categoryName: '기타_미분류',
    reason: '일치하는 키워드 없음',
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
