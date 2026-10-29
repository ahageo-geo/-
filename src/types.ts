export interface AgeCohort {
  ageGroup: string;
  malePct: number;
  femalePct: number;
  malePop: number; // in thousands or millions
  femalePop: number;
}

export interface DemographicSnapshot {
  year: number;
  totalPop: string; // e.g. "5,170만 명", "2억 2,000만 명"
  totalPopNumber: number; // in millions
  tfr: number; // 합계출산율 (Total Fertility Rate)
  cbr: number; // 조출생률 (Crude Birth Rate, ‰)
  cdr: number; // 조사망률 (Crude Death Rate, ‰)
  naturalGrowthRate: number; // 자연증가율 (%)
  youthRate: number; // 유소년 인구 비율 (0~14세, %)
  workingRate: number; // 청장년층 인구 비율 (15~64세, %)
  elderlyRate: number; // 노년층 인구 비율 (65세 이상, %)
  youthDependencyRatio: number; // 유소년 부양비
  elderlyDependencyRatio: number; // 노년 부양비
  totalDependencyRatio: number; // 총부양비
  agingIndex: number; // 노령화 지수
  medianAge: number; // 중위 연령
  lifeExpectancy: number; // 기대수명
  dtmStage: number; // 인구 변천 모델 단계 (1~5)
  dtmStageName: string; // 예: "4단계: 저위 정체기", "2단계: 초기 팽창기", "5단계: 감퇴기"
  pyramidType: '피라미드형 (확장형)' | '종형 (정체형)' | '방추형 (감퇴형)' | '종형 (정체형 전환기)' | '별형' | '표주박형';
  cohorts: AgeCohort[];
  keyIssues: string[];
  policyFocus: string[];
}

export interface CountryData {
  id: string;
  name: string;
  englishName: string;
  flag: string;
  continent: string;
  developmentGroup: 'developed' | 'developing'; // 'developed': 선진국, 'developing': 개발도상국
  typeCategory: string;
  summary: string;
  historicalData: Record<number, DemographicSnapshot>;
  availableYears: number[];
  caseStudyContext: {
    economicContext: string;
    socialChallenges: string[];
    majorPolicies: string[];
    futureProspects: string;
  };
}

export interface RubricLevel {
  levelName: '상' | '중' | '하' | '최하';
  scoreRange: string;
  score: number;
  description: string;
}

export interface RubricCriterion {
  id: number;
  title: string;
  subTitle: string;
  maxScore: number;
  evaluationGoal: string;
  levels: RubricLevel[];
}

export interface AiEvaluationResponse {
  totalScore: number;
  maxScore: number;
  gradeLevel: string;
  q1Score: number;
  q1Max: number;
  q1Feedback: string;
  q1CriteriaMet?: boolean[];
  q2Score: number;
  q2Max: number;
  q2Feedback: string;
  q2CriteriaMet?: boolean[];
  q3Score?: number;
  q3Max?: number;
  q3Feedback?: string;
  overallComment: string;
  recommendedAction: string;
}

export interface TabSwitchLog {
  timestamp: string;
  message: string;
}

export interface AssessmentFormState {
  studentName: string;
  studentId: string;
  grade?: number;
  classNum?: number | string;
  studentNum?: number;
  selectedCountryAId: string;
  selectedCountryBId: string;
  q1Answer: string;
  q2Answer: string;
  q3Answer?: string;
  tabSwitchCount?: number;
  tabSwitchLogs?: TabSwitchLog[];
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  grade?: number;
  classNum?: number | string;
  studentNum?: number;
  countryAId: string;
  countryAName: string;
  countryBId: string;
  countryBName: string;
  q1Answer: string;
  q2Answer: string;
  q3Answer?: string;
  evaluationResult: AiEvaluationResponse;
  submittedAt: string;
  verificationCode: string;
  tabSwitchCount?: number;
  tabSwitchLogs?: TabSwitchLog[];
  teacherOverriddenScore?: number;
  teacherCustomNote?: string;
  isConfirmedByTeacher?: boolean;
}

export interface UserSession {
  isLoggedIn: boolean;
  role: 'student' | 'teacher';
  studentId?: string;
  studentName?: string;
  grade?: number;
  classNum?: number | string;
  studentNum?: number;
  teacherName?: string;
  loginTime?: string;
}

export interface ActiveStudentSession {
  studentId: string;
  studentName: string;
  grade?: number;
  classNum?: number | string;
  studentNum?: number;
  loginTime: string;
  lastActiveAt: string;
  selectedCountryAId?: string;
  selectedCountryAName?: string;
  selectedCountryBId?: string;
  selectedCountryBName?: string;
  q1Length: number;
  q2Length: number;
  totalLength: number;
  tabSwitchCount: number;
  isSubmitted: boolean;
  submittedAt?: string;
  status: 'writing' | 'idle' | 'submitted';
  currentDraft?: {
    q1Answer?: string;
    q2Answer?: string;
    lastSavedAt?: string;
  };
}

export interface ChecklistState {
  hasPyramidType: boolean;
  hasStatsQuoted: boolean;
  hasTwoCausesOrEffects: boolean;
  hasPolicySeparation: boolean;
}
