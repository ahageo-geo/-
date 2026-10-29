import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// File-backed storage for cross-device persistence of student submissions
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions-data.json");

function loadSubmissionsFromFile(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read submissions file:", err);
  }
  return [];
}

function saveSubmissionsToFile(submissions: any[]) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write submissions file:", err);
  }
}

let serverSubmissions: any[] = loadSubmissionsFromFile();

// In-memory store for currently logged-in and active/writing students
const activeStudentSessions: Map<string, any> = new Map();

function computeStudentStatus(student: any): 'writing' | 'idle' | 'submitted' {
  if (student.isSubmitted) return 'submitted';
  const lastActiveTime = new Date(student.lastActiveAt).getTime();
  const now = Date.now();
  // Active within 3 minutes = writing, otherwise idle
  if (now - lastActiveTime < 3 * 60 * 1000) {
    return 'writing';
  }
  return 'idle';
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "population-assessment-evaluator" });
});

// GET all submissions (for Teacher Dashboard across all student devices)
app.get("/api/submissions", (_req, res) => {
  // Always read latest from file or memory
  const freshSubmissions = loadSubmissionsFromFile();
  if (freshSubmissions.length > 0) {
    serverSubmissions = freshSubmissions;
  }
  res.json(serverSubmissions);
});

// POST student heartbeat / active writing progress
app.post("/api/students/heartbeat", (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }
    const existing = activeStudentSessions.get(data.studentId);
    const updated = {
      ...(existing || {}),
      ...data,
      lastActiveAt: new Date().toISOString(),
    };
    updated.status = computeStudentStatus(updated);
    activeStudentSessions.set(data.studentId, updated);
    return res.json({ success: true, session: updated });
  } catch (err: any) {
    console.error("Error in student heartbeat:", err);
    return res.status(500).json({ error: "Failed to update heartbeat" });
  }
});

// GET active students for Teacher Dashboard
app.get("/api/students/active", (_req, res) => {
  const students = Array.from(activeStudentSessions.values()).map((s) => ({
    ...s,
    status: computeStudentStatus(s),
  }));
  // Sort: writing first, then idle, then submitted; within that, lastActiveAt desc
  students.sort((a, b) => {
    if (a.status !== b.status) {
      const order = { writing: 0, idle: 1, submitted: 2 };
      return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9);
    }
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });
  res.json(students);
});

// Student Logout
app.post("/api/students/logout", (req, res) => {
  const { studentId } = req.body;
  if (studentId && activeStudentSessions.has(studentId)) {
    activeStudentSessions.delete(studentId);
  }
  res.json({ success: true });
});

// Seed sample in-progress students (for Teacher Dashboard testing & demonstration)
app.post("/api/students/seed-active", (_req, res) => {
  const sampleStudents = [
    {
      studentId: "1예비14",
      studentName: "한지우",
      grade: 1,
      classNum: "예비",
      studentNum: 14,
      loginTime: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString("ko-KR"),
      lastActiveAt: new Date(Date.now() - 25 * 1000).toISOString(),
      selectedCountryAId: "korea",
      selectedCountryAName: "대한민국",
      selectedCountryBId: "nigeria",
      selectedCountryBName: "나이지리아",
      q1Length: 195,
      q2Length: 220,
      totalLength: 415,
      tabSwitchCount: 0,
      isSubmitted: false,
      status: "writing" as const,
      currentDraft: {
        q1Answer: "한국은 65세 이상 노년층 비율이 19.2%에 육박하고 합계출산율이 0.72명으로 방추형 인구 피라미드에 해당합니다. 반면 나이지리아는 유소년 인구 비율이 42.1%로 높고 합계출산율이 4.8명인 전형적인 피라미드형 인구 구조를 나타내고 있습니다.",
        q2Answer: "한국은 청년층의 주거 비용과 높은 사교육비 부담으로 결혼과 출산을 기피하여 초저출산이 심화되고 있습니다. 미래 사회에 청장년층 인구 감소로 연금 고갈이 우려됩니다. 나이지리아는 조혼과 여성 교육 부족으로 급격한 인구 증가가 발생하여 청년 실업과 도시 인프라 과부하가 초래됩니다. 이를 해결하기 위해...",
        lastSavedAt: new Date(Date.now() - 25 * 1000).toLocaleTimeString("ko-KR"),
      },
    },
    {
      studentId: "1예비20",
      studentName: "강도현",
      grade: 1,
      classNum: "예비",
      studentNum: 20,
      loginTime: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString("ko-KR"),
      lastActiveAt: new Date(Date.now() - 45 * 1000).toISOString(),
      selectedCountryAId: "japan",
      selectedCountryAName: "일본",
      selectedCountryBId: "india",
      selectedCountryBName: "인도",
      q1Length: 142,
      q2Length: 98,
      totalLength: 240,
      tabSwitchCount: 1,
      isSubmitted: false,
      status: "writing" as const,
      currentDraft: {
        q1Answer: "일본은 65세 이상 인구 비중이 29.8%로 초고령사회 방추형 피라미드입니다. 인도는 중위연령이 28세로 청장년층 비중이 매우 큰 종형 과도기 구조를 보입니다.",
        q2Answer: "일본의 경우 노동력 부족과 지방 소멸 위기가 심각합니다. 정년 연장과 간병 로봇 기술 도입 정책이 시급합니다.",
        lastSavedAt: new Date(Date.now() - 45 * 1000).toLocaleTimeString("ko-KR"),
      },
    },
    {
      studentId: "1예비08",
      studentName: "송민서",
      grade: 1,
      classNum: "예비",
      studentNum: 8,
      loginTime: new Date(Date.now() - 12 * 60 * 1000).toLocaleTimeString("ko-KR"),
      lastActiveAt: new Date(Date.now() - 15 * 1000).toISOString(),
      selectedCountryAId: "germany",
      selectedCountryAName: "독일",
      selectedCountryBId: "uganda",
      selectedCountryBName: "우간다",
      q1Length: 168,
      q2Length: 145,
      totalLength: 313,
      tabSwitchCount: 0,
      isSubmitted: false,
      status: "writing" as const,
      currentDraft: {
        q1Answer: "독일은 노년층 비율이 22.4%로 종형/방추형 구조입니다. 우간다는 14세 이하 유소년 비율이 44.5%에 달하는 전형적인 피라미드형 인구 구조를 보이고 있습니다.",
        q2Answer: "독일은 연금 재정과 숙련 노동자 부족이 주된 파급효과이며, 우간다는 조혼과 여성 교육 부족으로 인한 급격한 인구 증가가 식량 및 학교 부족을 초래합니다. 맞춤형 정책으로...",
        lastSavedAt: new Date(Date.now() - 15 * 1000).toLocaleTimeString("ko-KR"),
      },
    },
    {
      studentId: "1예비02",
      studentName: "이예비",
      grade: 1,
      classNum: "예비",
      studentNum: 2,
      loginTime: new Date(Date.now() - 8 * 60 * 1000).toLocaleTimeString("ko-KR"),
      lastActiveAt: new Date(Date.now() - 35 * 1000).toISOString(),
      selectedCountryAId: "sweden",
      selectedCountryAName: "스웨덴",
      selectedCountryBId: "ethiopia",
      selectedCountryBName: "에티오피아",
      q1Length: 110,
      q2Length: 85,
      totalLength: 195,
      tabSwitchCount: 0,
      isSubmitted: false,
      status: "writing" as const,
      currentDraft: {
        q1Answer: "스웨덴은 노년층 비율이 20.3%인 안정된 종형 구조입니다. 에티오피아는 피라미드형으로 유소년 인구 비율이 매우 높고 출산율이 4.1명입니다.",
        q2Answer: "스웨덴은 저출산 고령화 대책으로 성평등 육아휴직을 실시하고 있으며, 에티오피아는 기초 의무 교육과 모자보건 지원이 필요합니다.",
        lastSavedAt: new Date(Date.now() - 35 * 1000).toLocaleTimeString("ko-KR"),
      },
    },
  ];

  sampleStudents.forEach((st) => {
    activeStudentSessions.set(st.studentId, st);
  });

  res.json({ success: true, count: sampleStudents.length });
});

// Initialize with sample active students if empty
const initSampleActive = [
  {
    studentId: "1예비14",
    studentName: "한지우",
    grade: 1,
    classNum: "예비",
    studentNum: 14,
    loginTime: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString("ko-KR"),
    lastActiveAt: new Date(Date.now() - 25 * 1000).toISOString(),
    selectedCountryAId: "korea",
    selectedCountryAName: "대한민국",
    selectedCountryBId: "nigeria",
    selectedCountryBName: "나이지리아",
    q1Length: 195,
    q2Length: 220,
    totalLength: 415,
    tabSwitchCount: 0,
    isSubmitted: false,
    status: "writing" as const,
    currentDraft: {
      q1Answer: "한국은 65세 이상 노년층 비율이 19.2%에 육박하고 합계출산율이 0.72명으로 방추형 인구 피라미드에 해당합니다. 반면 나이지리아는 유소년 인구 비율이 42.1%로 높고 합계출산율이 4.8명인 전형적인 피라미드형 인구 구조를 나타내고 있습니다.",
      q2Answer: "한국은 청년층의 주거 비용과 높은 사교육비 부담으로 결혼과 출산을 기피하여 초저출산이 심화되고 있습니다. 미래 사회에 청장년층 인구 감소로 연금 고갈이 우려됩니다. 나이지리아는 조혼과 여성 교육 부족으로 급격한 인구 증가가 발생하여 청년 실업과 도시 인프라 과부하가 초래됩니다. 이를 해결하기 위해...",
      lastSavedAt: new Date(Date.now() - 25 * 1000).toLocaleTimeString("ko-KR"),
    },
  },
  {
    studentId: "1예비20",
    studentName: "강도현",
    grade: 1,
    classNum: "예비",
    studentNum: 20,
    loginTime: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString("ko-KR"),
    lastActiveAt: new Date(Date.now() - 45 * 1000).toISOString(),
    selectedCountryAId: "japan",
    selectedCountryAName: "일본",
    selectedCountryBId: "india",
    selectedCountryBName: "인도",
    q1Length: 142,
    q2Length: 98,
    totalLength: 240,
    tabSwitchCount: 1,
    isSubmitted: false,
    status: "writing" as const,
    currentDraft: {
      q1Answer: "일본은 65세 이상 인구 비중이 29.8%로 초고령사회 방추형 피라미드입니다. 인도는 중위연령이 28세로 청장년층 비중이 매우 큰 종형 과도기 구조를 보입니다.",
      q2Answer: "일본의 경우 노동력 부족과 지방 소멸 위기가 심각합니다. 정년 연장과 간병 로봇 기술 도입 정책이 시급합니다.",
      lastSavedAt: new Date(Date.now() - 45 * 1000).toLocaleTimeString("ko-KR"),
    },
  },
  {
    studentId: "1예비08",
    studentName: "송민서",
    grade: 1,
    classNum: "예비",
    studentNum: 8,
    loginTime: new Date(Date.now() - 12 * 60 * 1000).toLocaleTimeString("ko-KR"),
    lastActiveAt: new Date(Date.now() - 15 * 1000).toISOString(),
    selectedCountryAId: "germany",
    selectedCountryAName: "독일",
    selectedCountryBId: "uganda",
    selectedCountryBName: "우간다",
    q1Length: 168,
    q2Length: 145,
    totalLength: 313,
    tabSwitchCount: 0,
    isSubmitted: false,
    status: "writing" as const,
    currentDraft: {
      q1Answer: "독일은 노년층 비율이 22.4%로 종형/방추형 구조입니다. 우간다는 14세 이하 유소년 비율이 44.5%에 달하는 전형적인 피라미드형 인구 구조를 보이고 있습니다.",
      q2Answer: "독일은 연금 재정과 숙련 노동자 부족이 주된 파급효과이며, 우간다는 조혼과 여성 교육 부족으로 인한 급격한 인구 증가가 식량 및 학교 부족을 초래합니다. 맞춤형 정책으로...",
      lastSavedAt: new Date(Date.now() - 15 * 1000).toLocaleTimeString("ko-KR"),
    },
  },
  {
    studentId: "1예비02",
    studentName: "이예비",
    grade: 1,
    classNum: "예비",
    studentNum: 2,
    loginTime: new Date(Date.now() - 8 * 60 * 1000).toLocaleTimeString("ko-KR"),
    lastActiveAt: new Date(Date.now() - 35 * 1000).toISOString(),
    selectedCountryAId: "sweden",
    selectedCountryAName: "스웨덴",
    selectedCountryBId: "ethiopia",
    selectedCountryBName: "에티오피아",
    q1Length: 110,
    q2Length: 85,
    totalLength: 195,
    tabSwitchCount: 0,
    isSubmitted: false,
    status: "writing" as const,
    currentDraft: {
      q1Answer: "스웨덴은 노년층 비율이 20.3%인 안정된 종형 구조입니다. 에티오피아는 피라미드형으로 유소년 인구 비율이 매우 높고 출산율이 4.1명입니다.",
      q2Answer: "스웨덴은 저출산 고령화 대책으로 성평등 육아휴직을 실시하고 있으며, 에티오피아는 기초 의무 교육과 모자보건 지원이 필요합니다.",
      lastSavedAt: new Date(Date.now() - 35 * 1000).toLocaleTimeString("ko-KR"),
    },
  },
];
initSampleActive.forEach((st) => activeStudentSessions.set(st.studentId, st));

// POST new student submission (saved immediately to server)
app.post("/api/submissions", (req, res) => {
  try {
    const submission = req.body;
    if (!submission || !submission.id) {
      return res.status(400).json({ error: "유효한 제출 데이터가 아닙니다." });
    }
    const existingIndex = serverSubmissions.findIndex((s) => s.id === submission.id);
    if (existingIndex >= 0) {
      serverSubmissions[existingIndex] = submission;
    } else {
      serverSubmissions.unshift(submission);
    }
    saveSubmissionsToFile(serverSubmissions);

    // Update active student session as submitted
    if (activeStudentSessions.has(submission.studentId)) {
      const current = activeStudentSessions.get(submission.studentId);
      activeStudentSessions.set(submission.studentId, {
        ...current,
        isSubmitted: true,
        submittedAt: submission.submittedAt,
        status: "submitted",
      });
    }

    console.log(`[Submission Received] Student: ${submission.studentName} (${submission.studentId})`);
    return res.json(submission);
  } catch (error: any) {
    console.error("Error saving submission:", error);
    return res.status(500).json({ error: "제출 데이터 저장 중 오류 발생" });
  }
});

// PUT update submission (teacher review, grading, feedback)
app.put("/api/submissions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    const index = serverSubmissions.findIndex((s) => s.id === id);
    if (index >= 0) {
      serverSubmissions[index] = { ...serverSubmissions[index], ...updated };
      saveSubmissionsToFile(serverSubmissions);
      return res.json(serverSubmissions[index]);
    }
    return res.status(404).json({ error: "해당 제출 기록을 찾을 수 없습니다." });
  } catch (error: any) {
    console.error("Error updating submission:", error);
    return res.status(500).json({ error: "제출 데이터 수정 중 오류 발생" });
  }
});

// DELETE submission
app.delete("/api/submissions/:id", (req, res) => {
  try {
    const { id } = req.params;
    serverSubmissions = serverSubmissions.filter((s) => s.id !== id);
    saveSubmissionsToFile(serverSubmissions);
    return res.json({ success: true, id });
  } catch (error: any) {
    console.error("Error deleting submission:", error);
    return res.status(500).json({ error: "제출 데이터 삭제 중 오류 발생" });
  }
});

// AI Evaluation Endpoint for the 10-Point Performance Assessment
app.post("/api/evaluate-assessment", async (req, res) => {
  try {
    const {
      selectedCountryA,
      selectedCountryB,
      q1Answer,
      q2Answer,
      studentName,
    } = req.body;

    if (!q1Answer && !q2Answer) {
      return res.status(400).json({ error: "문항의 답안을 작성해 주세요." });
    }

    const ai = getGenAI();

    const prompt = `
당신은 고등학교 '통합사회2' 과목의 전문 교사이자 엄격하고 공정한 수행평가 채점관입니다.
단원: '인구 문제와 미래 사회'
비교 분석 대상 국가: [국가 A: ${selectedCountryA?.name || "선택국가1"}] vs [국가 B: ${selectedCountryB?.name || "선택국가2"}]
학생명: ${studentName || "학생"}

[수행평가 채점 기준표 (총 2문항, 10점 만점)]

1. [문제 1] 자료 분석 및 인구 피라미드 유형 분류 (총 배점: 5점)
   - 세부 채점 기준 (총 4개 항목):
     ① A 국가의 인구 피라미드 유형을 정확하게 기술함.
     ② B 국가의 인구 피라미드 유형을 정확하게 기술함.
     ③ A 국가의 통계 자료를 2가지 이상 정확하게 분석함.
     ④ B 국가의 통계 자료를 2가지 이상 정확하게 분석함.
   - 배점 부여 기준:
     * 4개 만족 시: 5점
     * 3개 만족 시: 4점
     * 2개 만족 시: 3점
     * 1개 만족 시: 2점
     * 미흡이면: 1점

2. [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책 (총 배점: 5점)
   - 세부 채점 기준 (총 4개 항목):
     ① A 국가의 인구 문제 원인을 정확하게 기술함.
     ② B 국가의 인구 문제 원인을 정확하게 기술함.
     ③ A 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.
     ④ B 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.
   - 배점 부여 기준:
     * 4개 만족 시: 5점
     * 3개 만족 시: 4점
     * 2개 만족 시: 3점
     * 1개 만족 시: 2점
     * 미흡이면: 1점

[학생 제출 답안]
-------------------------------------------
[문제 1 답안 (5점 배점)]
${q1Answer || '(미작성)'}

[문제 2 답안 (5점 배점)]
${q2Answer || '(미작성)'}
-------------------------------------------

위 학생의 답안을 각 문항의 4개 세부 채점 기준 충족 여부를 면밀히 검증하여 정확하게 채점하고, 격려와 함께 구체적인 피드백을 JSON 형식으로 반환해 주세요.

JSON 응답 규격:
{
  "totalScore": number (1~10, q1Score + q2Score),
  "maxScore": 10,
  "gradeLevel": "탁월(상)" | "우수(중상)" | "보통(중)" | "노력요함(하)",
  "q1Score": number (1~5),
  "q1Max": 5,
  "q1CriteriaMet": [boolean, boolean, boolean, boolean],
  "q1Feedback": "문제 1의 4가지 세부 기준(피라미드 유형 및 통계 분석 2가지 이상) 충족 여부에 대한 교사 평가 피드백",
  "q2Score": number (1~5),
  "q2Max": 5,
  "q2CriteriaMet": [boolean, boolean, boolean, boolean],
  "q2Feedback": "문제 2의 4가지 세부 기준(원인 분석 및 미래 파급효과·맞춤형정책) 충족 여부에 대한 교사 평가 피드백",
  "overallComment": "학생의 총평, 통합사회적 통찰력에 대한 평가와 따뜻한 격려 메시지",
  "recommendedAction": "다음 학습이나 서술 보완을 위한 1~2가지 조언"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return res.status(500).json({
      error: "평가 처리 중 오류가 발생했습니다.",
      details: error?.message || "Unknown error",
    });
  }
});

// AI Topic & Scenario Generator Endpoint for Teachers / Students
app.post("/api/generate-topic-insight", async (req, res) => {
  try {
    const { countryA, countryB } = req.body;
    const ai = getGenAI();

    const prompt = `
고등학교 통합사회2 '인구 문제와 미래 사회' 단원에서 두 국가([${countryA}]와 [${countryB}])의 인구 구조 및 문제점을 비교 탐구할 때, 학생들이 주목해야 할 핵심 탐구 질문 3가지와 교과 연계 핵심 개념 3가지를 JSON 형식으로 작성해 주세요.

JSON 구조:
{
  "focusQuestions": ["질문1", "질문2", "질문3"],
  "keyConcepts": [
    {"term": "개념어1", "explanation": "설명"},
    {"term": "개념어2", "explanation": "설명"},
    {"term": "개념어3", "explanation": "설명"}
  ],
  "learningPoint": "이 두 국가 비교를 통해 배울 수 있는 핵심 교훈 요약"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (error: any) {
    console.error("Insight generation error:", error);
    return res.status(500).json({ error: "탐구 질문 생성 중 오류가 발생했습니다." });
  }
});

// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
