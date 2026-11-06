export interface Category {
  id: string;
  name: string;
  description?: string;
  keywords: string[]; // 연관 단어/접두사 (예: '기획', '보고서', '계약')
  extensions: string[]; // 연관 확장자 (예: '.pdf', '.docx')
  color: string; // UI 뱃지/아이콘 색상
  isDefault?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  handle?: FileSystemFileHandle; // 데모 모드일 때는 undefined 가능
  assignedCategoryId: string; // 배정된 카테고리 ID
  suggestedCategoryId?: string; // 엔진이 제안한 추천 카테고리 ID
  matchReason?: string; // 분류 근거 (예: "키워드 '기획서' 일치", "날짜 패턴 감지")
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
