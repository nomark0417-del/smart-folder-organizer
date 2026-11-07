export interface Category {
  id: string;
  name: string;
  description?: string;
  keywords: string[]; // 연관 단어/접두사 (예: '기획', '보고서', '계약')
  extensions?: string[]; // (레거시 호환용)
  color: string; // UI 뱃지/아이콘 색상
  isDefault?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  handle?: FileSystemFileHandle; // 데모 모드 또는 일반 파일 업로드 시 undefined 가능
  rawFile?: File; // 개별 파일 업로드 시 원본 브라우저 File 객체
  assignedCategoryId: string; // 배정된 카테고리 ID
  suggestedCategoryId?: string; // 엔진이 제안한 추천 카테고리 ID
  matchReason?: string; // 분류 근거 (예: "키워드 '기획서' 일치")
  isManual?: boolean; // 사용자가 수동으로 지정했는지 여부
  status: 'pending' | 'moving' | 'moved' | 'error';
  errorMessage?: string;
}

export interface OrganizeStats {
  totalFiles: number;
  categorizedCount: number;
  uncategorizedCount: number;
  totalSize: number;
}
