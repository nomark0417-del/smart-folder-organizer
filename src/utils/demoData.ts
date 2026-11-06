import type { Category, FileItem } from '../types';
import { classifyFile } from './classifier';

const RAW_DEMO_FILES = [
  { name: '2026_상반기_신사업_전략기획서_v2.pptx', size: 4820100, daysAgo: 1 },
  { name: '주간업무보고_기획팀_최종.docx', size: 842000, daysAgo: 2 },
  { name: '서비스_운영매뉴얼_검토본.hwp', size: 1250400, daysAgo: 4 },
  { name: '법인카드_영수증_11월정산.pdf', size: 612000, daysAgo: 1 },
  { name: '2026_원천징수영수증_세무사제출용.pdf', size: 450200, daysAgo: 5 },
  { name: '거래처_솔루션도입_견적서_2026.xlsx', size: 328000, daysAgo: 3 },
  { name: '메인페이지_리뉴얼_시안_v3.fig', size: 15400000, daysAgo: 2 },
  { name: '모바일앱_프로모션_배너_최종.png', size: 2150000, daysAgo: 1 },
  { name: '브랜드_공식로고_가이드.svg', size: 380000, daysAgo: 10 },
  { name: '고객DB_마이그레이션_스키마_backup.sql', size: 8920000, daysAgo: 6 },
  { name: 'payment_gateway_api_spec.json', size: 42100, daysAgo: 3 },
  { name: 'ChromeSetup.exe', size: 1420000, daysAgo: 14 },
  { name: 'ZoomInstallerFull.msi', size: 38400000, daysAgo: 20 },
  // 아래 파일들은 기본 키워드에는 없지만 AI 스마트 연관성(공통 단어 '알파프로젝트', 공통 연월 '2026-10')으로 감지될 파일들
  { name: '알파프로젝트_킥오프_녹취록.m4a', size: 3128000, daysAgo: 7 },
  { name: '알파프로젝트_산출물_패키지.7z', size: 12540000, daysAgo: 7 },
  { name: '알파프로젝트_현장브리핑_영상.mp4', size: 28890000, daysAgo: 6 },
  { name: '2026-10-15_외부미팅_보이스메모.mp3', size: 12400000, daysAgo: 22 },
  { name: '2026-10-21_세미나_녹화본.mkv', size: 45200000, daysAgo: 16 },
];

export function generateDemoFiles(categories: Category[]): FileItem[] {
  const now = Date.now();
  return RAW_DEMO_FILES.map((raw, idx) => {
    const ext = raw.name.includes('.') ? `.${raw.name.split('.').pop()!.toLowerCase()}` : '';
    const match = classifyFile({ name: raw.name, extension: ext }, categories);

    return {
      id: `demo-file-${idx + 1}`,
      name: raw.name,
      extension: ext,
      size: raw.size,
      lastModified: now - raw.daysAgo * 86400 * 1000,
      assignedCategoryId: match.categoryId,
      suggestedCategoryId: match.categoryId,
      matchReason: match.reason,
      isManual: false,
      status: 'pending',
    };
  });
}
