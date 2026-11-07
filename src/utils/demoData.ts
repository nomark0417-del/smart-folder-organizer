import type { Category, FileItem } from '../types';
import { classifyFile } from './classifier';

const RAW_DEMO_FILES = [
  // 1. 수능
  { name: '2027학년도_수능_원서접수_시행세부계획.pdf', size: 1420100, daysAgo: 1 },
  { name: '9월_전국연합학력평가_성적통지표_배부명단.xlsx', size: 452000, daysAgo: 2 },
  { name: '대학수학능력시험_시험장배치_및_감독관편성표.docx', size: 820400, daysAgo: 4 },

  // 2. 기숙사
  { name: '2026학년도_1학기_기숙사_사생_입사신청서.xlsx', size: 612000, daysAgo: 1 },
  { name: '기숙사_호실배정_및_점호_운영일지.hwp', size: 950200, daysAgo: 3 },
  { name: '사생수칙_위반자_상벌점_관리대장.xlsx', size: 328000, daysAgo: 5 },
  { name: '주말_외박_외출_사전신청_승인목록.pdf', size: 280000, daysAgo: 2 },

  // 3. EBS
  { name: '2027_EBS_수능특강_국어영역_연계문항분석.pdf', size: 5400000, daysAgo: 2 },
  { name: 'EBS_수능완성_수학영역_해설지_보충자료.pdf', size: 8150000, daysAgo: 6 },
  { name: '방과후수업_EBS교재_주문수량_취합본.xlsx', size: 380000, daysAgo: 8 },

  // 4. 예산
  { name: '2026학년도_학교회계_본예산_편성안.xlsx', size: 2920000, daysAgo: 3 },
  { name: '11월_교무실환경개선_물품구매_지출품의서.pdf', size: 421000, daysAgo: 1 },
  { name: '1차_추경예산안_세출예산_사업별명세서.hwp', size: 1840000, daysAgo: 7 },
  { name: '교직원_출장여비_지출정산서_영수증.pdf', size: 680000, daysAgo: 2 },

  // 5. 서무
  { name: '2026_하반기_보안점검_및_비밀관리기록부.hwp', size: 1250000, daysAgo: 4 },
  { name: '교직원_복무관리_연가_출장_기안문.docx', size: 512000, daysAgo: 2 },
  { name: '교육지원청_발송_대외공문_시행문.pdf', size: 730000, daysAgo: 1 },
  { name: '행정실_공용차량_배차신청서_및_운행일지.xlsx', size: 340000, daysAgo: 5 },

  // 6. AI 스마트 연관성 감지용 (공통 키워드 '학부모회', 공통 연월 '2026-10')
  { name: '학부모회_총회_진행순서_안내.hwp', size: 680000, daysAgo: 10 },
  { name: '학부모회_임원진_명단_연락처.xlsx', size: 290000, daysAgo: 10 },
  { name: '2026-10-15_학교운영위원회_회의녹취.m4a', size: 12400000, daysAgo: 22 },
  { name: '2026-10-21_개교기념_기념식_녹화본.mp4', size: 45200000, daysAgo: 16 },
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
