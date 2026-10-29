import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { DemographicExplorer } from './components/DemographicExplorer';
import { AssessmentWorksheet } from './components/AssessmentWorksheet';
import { RubricView } from './components/RubricView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AiEvaluationResultModal } from './components/AiEvaluationResultModal';
import { PrintWorksheetModal } from './components/PrintWorksheetModal';
import { StudentSubmissionCertificate } from './components/StudentSubmissionCertificate';
import { StudentSubmissionConfirmationModal } from './components/StudentSubmissionConfirmationModal';
import { AuthPortal } from './components/AuthPortal';
import { TeacherPinModal } from './components/TeacherPinModal';
import { CheatingWarningModal, IntegrityWarningType } from './components/CheatingWarningModal';
import { COUNTRIES, DEVELOPED_COUNTRIES, DEVELOPING_COUNTRIES } from './data/demographicData';
import { SAMPLE_MODEL_ANSWERS } from './data/rubricData';
import {
  CountryData,
  AssessmentFormState,
  AiEvaluationResponse,
  StudentSubmission,
  UserSession,
  TabSwitchLog,
  ActiveStudentSession,
} from './types';
import { parseStudentId, formatStudentId } from './utils/studentInfo';

// Helper to construct a blank form state
const createDefaultFormState = (
  studentName = '',
  studentId = '',
  grade = 1,
  classNum?: number | string,
  studentNum?: number,
  countryAId = 'korea',
  countryBId = 'nigeria'
): AssessmentFormState => {
  const parsed = parseStudentId(studentId);
  return {
    studentName,
    studentId,
    grade: grade || parsed?.grade || 1,
    classNum: classNum ?? parsed?.classNum,
    studentNum: studentNum ?? parsed?.studentNum,
    selectedCountryAId: countryAId,
    selectedCountryBId: countryBId,
    q1Answer: '',
    q2Answer: '',
    q3Answer: '',
  };
};

// Helper to get student-isolated draft key
const getStudentDraftKey = (studentId?: string) => {
  const clean = studentId?.trim();
  return clean ? `geo_assessment_student_draft_${clean}` : null;
};

export default function App() {
  // User Session Management (Role: student vs teacher)
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('geo_assessment_user_session_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // silent
    }
    return { isLoggedIn: false, role: 'student' };
  });

  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'explorer' | 'assessment' | 'rubric' | 'teacher'>('explorer');
  const [selectedCountryA, setSelectedCountryA] = useState<CountryData>(DEVELOPED_COUNTRIES[0]); // 한국 (선진국)
  const [selectedCountryB, setSelectedCountryB] = useState<CountryData>(DEVELOPING_COUNTRIES[0]); // 나이지리아 (개발도상국)
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  // Form State with student-isolated LocalStorage Persistence
  const [formState, setFormState] = useState<AssessmentFormState>(() => {
    try {
      const savedSession = localStorage.getItem('geo_assessment_user_session_v2');
      if (savedSession) {
        const session: UserSession = JSON.parse(savedSession);
        if (session.isLoggedIn && session.role === 'student' && session.studentId) {
          const draftKey = getStudentDraftKey(session.studentId);
          if (draftKey) {
            const saved = localStorage.getItem(draftKey);
            if (saved) return JSON.parse(saved);
          }
          return createDefaultFormState(session.studentName || '', session.studentId);
        }
      }
    } catch (e) {
      // silent
    }
    return createDefaultFormState();
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Tab switch & cheating detection integrity state (reset per student session)
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState<TabSwitchLog[]>([]);
  const [isCheatingModalOpen, setIsCheatingModalOpen] = useState<boolean>(false);
  const [integrityWarningType, setIntegrityWarningType] = useState<IntegrityWarningType>('tab_switch');
  const [toastWarning, setToastWarning] = useState<string | null>(null);
  const lastViolationTimeRef = useRef<number>(0);
  const toastTimeoutRef = useRef<any>(null);

  // Clean up legacy global storage keys on initial mount to prevent cross-student pollution
  useEffect(() => {
    try {
      localStorage.removeItem('geo_assessment_form_v2');
      localStorage.removeItem('geo_assessment_tab_switch_count_v2');
      localStorage.removeItem('geo_assessment_tab_switch_logs_v2');
    } catch (e) {}
  }, []);

  // Centralized Integrity & Cheating Warning Dispatcher
  const triggerIntegrityWarning = useCallback(
    (reason: string, type: IntegrityWarningType = 'general') => {
      const now = Date.now();
      // Debounce events within 1.2s to prevent duplicated counts on simultaneous keydown + paste/copy events
      if (now - lastViolationTimeRef.current < 1200) return;
      lastViolationTimeRef.current = now;

      const timeStr = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const nextCount = tabSwitchCount + 1;
      const newLog: TabSwitchLog = {
        timestamp: timeStr,
        message: `${reason} (${nextCount}회차 감지)`,
      };

      setTabSwitchCount((prev) => prev + 1);
      setTabSwitchLogs((prev) => [...prev, newLog]);
      setIntegrityWarningType(type);
      setIsCheatingModalOpen(true);

      // Trigger floating top toast banner
      setToastWarning(`⚠️ [부정행위 유의 경고] ${reason} (누적 ${nextCount}회 감지됨)`);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToastWarning(null);
      }, 5000);
    },
    [tabSwitchCount]
  );

  // Window blur / Tab visibility departure & Copy-Paste integrity monitoring
  useEffect(() => {
    // Only monitor if student is logged in and active
    if (!userSession.isLoggedIn || userSession.role !== 'student') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerIntegrityWarning('다른 브라우저 탭/창으로 전환 감지', 'tab_switch');
      }
    };

    const handleBlur = () => {
      triggerIntegrityWarning('외부 창/프로그램으로 포커스 이탈 감지', 'tab_switch');
    };

    const handleCopy = () => {
      triggerIntegrityWarning('복사(Copy) 기능 사용 감지', 'copy');
    };

    const handlePaste = () => {
      triggerIntegrityWarning('붙여넣기(Paste) 기능 사용 감지', 'paste');
    };

    const handleCut = () => {
      triggerIntegrityWarning('잘라내기(Cut) 기능 사용 감지', 'cut');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'v') {
          triggerIntegrityWarning('붙여넣기(Ctrl+V) 단축키 사용 감지', 'paste');
        } else if (key === 'c') {
          triggerIntegrityWarning('복사(Ctrl+C) 단축키 사용 감지', 'copy');
        } else if (key === 'x') {
          triggerIntegrityWarning('잘라내기(Ctrl+X) 단축키 사용 감지', 'cut');
        }
      }
    };

    const handleContextMenu = () => {
      triggerIntegrityWarning('마우스 우클릭(컨텍스트 메뉴) 사용 감지', 'contextmenu');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [userSession, triggerIntegrityWarning]);

  // Auto-save form state to LocalStorage (strictly isolated by student ID)
  useEffect(() => {
    if (!userSession.isLoggedIn || userSession.role !== 'student') return;
    const cleanId = formState.studentId?.trim() || userSession.studentId?.trim();
    const draftKey = getStudentDraftKey(cleanId);
    if (!draftKey) return;

    try {
      localStorage.setItem(draftKey, JSON.stringify(formState));
      const now = new Date();
      setLastSavedAt(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (e) {
      // silent
    }
  }, [formState, userSession]);

  // Submissions State with Server & LocalStorage Synchronization
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('geo_assessment_submissions_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // silent
    }
    return [];
  });

  // Pull latest submissions from the server on load and provide refresh function
  const handleRefreshSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubmissions(data);
          try {
            localStorage.setItem('geo_assessment_submissions_v2', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch server submissions:', err);
    }
  }, []);

  const [activeStudents, setActiveStudents] = useState<ActiveStudentSession[]>([]);

  // Fetch active writing students from server
  const handleRefreshActiveStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students/active');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActiveStudents(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch active students:', err);
    }
  }, []);

  // Seed sample active writing students
  const handleSeedActiveStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students/seed-active', { method: 'POST' });
      if (res.ok) {
        await handleRefreshActiveStudents();
      }
    } catch (err) {
      console.warn('Failed to seed active students:', err);
    }
  }, [handleRefreshActiveStudents]);

  // Polling active students & submissions for teacher mode (every 4 seconds)
  useEffect(() => {
    handleRefreshActiveStudents();
    handleRefreshSubmissions();

    if (userSession.role === 'teacher' || activeTab === 'teacher') {
      const interval = setInterval(() => {
        handleRefreshActiveStudents();
        handleRefreshSubmissions();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [userSession.role, activeTab, handleRefreshActiveStudents, handleRefreshSubmissions]);

  // Save submissions to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('geo_assessment_submissions_v2', JSON.stringify(submissions));
    } catch (e) {
      // silent
    }
  }, [submissions]);

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<AiEvaluationResponse | null>(null);
  const [latestStudentSubmission, setLatestStudentSubmission] = useState<StudentSubmission | null>(null);

  // Student active heartbeat & real-time writing progress sync
  useEffect(() => {
    if (!userSession.isLoggedIn || userSession.role !== 'student' || !userSession.studentId) return;

    const reportHeartbeat = () => {
      const cleanId = userSession.studentId || formState.studentId || '';
      if (!cleanId) return;

      const body = {
        studentId: cleanId,
        studentName: userSession.studentName || formState.studentName || '학생',
        grade: userSession.grade || formState.grade || 1,
        classNum: userSession.classNum ?? formState.classNum ?? '',
        studentNum: userSession.studentNum ?? formState.studentNum ?? 0,
        loginTime: userSession.loginTime || new Date().toLocaleTimeString('ko-KR'),
        selectedCountryAId: selectedCountryA.id,
        selectedCountryAName: selectedCountryA.name,
        selectedCountryBId: selectedCountryB.id,
        selectedCountryBName: selectedCountryB.name,
        q1Length: (formState.q1Answer || '').length,
        q2Length: (formState.q2Answer || '').length,
        totalLength: (formState.q1Answer || '').length + (formState.q2Answer || '').length,
        tabSwitchCount: tabSwitchCount,
        isSubmitted: latestStudentSubmission !== null,
        submittedAt: latestStudentSubmission?.submittedAt,
        currentDraft: {
          q1Answer: formState.q1Answer,
          q2Answer: formState.q2Answer,
          lastSavedAt: lastSavedAt || undefined,
        },
      };

      fetch('/api/students/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    };

    reportHeartbeat();
    const timer = setInterval(reportHeartbeat, 6000);
    return () => clearInterval(timer);
  }, [userSession, formState, selectedCountryA, selectedCountryB, tabSwitchCount, latestStudentSubmission, lastSavedAt]);
  const [isStudentConfirmModalOpen, setIsStudentConfirmModalOpen] = useState<boolean>(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedCertificateSubmission, setSelectedCertificateSubmission] = useState<StudentSubmission | null>(null);
  const [isExamLockEnabled, setIsExamLockEnabled] = useState<boolean>(false);

  // Handle Login from AuthPortal
  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    try {
      localStorage.setItem('geo_assessment_user_session_v2', JSON.stringify(session));
    } catch (e) {
      // silent
    }

    if (session.role === 'student') {
      const cleanId = session.studentId?.trim() || '';
      const draftKey = getStudentDraftKey(cleanId);
      let studentDraft: AssessmentFormState | null = null;
      if (draftKey) {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) studentDraft = JSON.parse(raw);
        } catch (e) {}
      }

      const parsedLogin = parseStudentId(cleanId);
      const sessionGrade = session.grade || parsedLogin?.grade || 1;
      const sessionClass = session.classNum ?? parsedLogin?.classNum;
      const sessionNum = session.studentNum ?? parsedLogin?.studentNum;

      // If this specific student ID has saved draft answers under their own ID, load them.
      // Otherwise (different student or new student), initialize with completely empty answers!
      const initialForm: AssessmentFormState =
        studentDraft && (studentDraft.q1Answer || studentDraft.q2Answer || studentDraft.q3Answer)
          ? {
              studentName: session.studentName || studentDraft.studentName || '',
              studentId: cleanId,
              grade: studentDraft.grade || sessionGrade,
              classNum: studentDraft.classNum ?? sessionClass,
              studentNum: studentDraft.studentNum ?? sessionNum,
              selectedCountryAId: studentDraft.selectedCountryAId || 'korea',
              selectedCountryBId: studentDraft.selectedCountryBId || 'nigeria',
              q1Answer: studentDraft.q1Answer || '',
              q2Answer: studentDraft.q2Answer || '',
              q3Answer: studentDraft.q3Answer || '',
            }
          : createDefaultFormState(session.studentName || '', cleanId, sessionGrade, sessionClass, sessionNum);

      setFormState(initialForm);

      // Synchronize country selection with the student's initialForm (선진국은 국가 1, 개발도상국은 국가 2)
      const countryA = DEVELOPED_COUNTRIES.find((c) => c.id === initialForm.selectedCountryAId) || DEVELOPED_COUNTRIES[0];
      const countryB = DEVELOPING_COUNTRIES.find((c) => c.id === initialForm.selectedCountryBId) || DEVELOPING_COUNTRIES[0];
      setSelectedCountryA(countryA);
      setSelectedCountryB(countryB);

      // Reset evaluations, warnings, and modal states for the new student
      setEvaluationResult(null);
      setTabSwitchCount(0);
      setTabSwitchLogs([]);
      setIsCheatingModalOpen(false);
      setToastWarning(null);
      setIntegrityWarningType('tab_switch');
      setIsEvalModalOpen(false);
      setIsPrintModalOpen(false);
      setSelectedCertificateSubmission(null);
      setIsStudentConfirmModalOpen(false);

      // Check if student has already submitted in this or previous session
      const existingSub = submissions.find(
        (s) => s.studentId === cleanId && s.studentId !== ''
      );
      setLatestStudentSubmission(existingSub || null);

      setActiveTab('explorer');
    } else {
      setActiveTab('teacher');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (userSession.role === 'student' && userSession.studentId) {
      fetch('/api/students/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userSession.studentId }),
      }).catch(() => {});
    }

    const emptySession: UserSession = { isLoggedIn: false, role: 'student' };
    setUserSession(emptySession);
    try {
      localStorage.removeItem('geo_assessment_user_session_v2');
      localStorage.removeItem('geo_assessment_form_v2');
      localStorage.removeItem('geo_assessment_tab_switch_count_v2');
      localStorage.removeItem('geo_assessment_tab_switch_logs_v2');
    } catch (e) {
      // silent
    }

    // Reset active form state and all modals to clean empty state so next student starts blank
    setFormState(createDefaultFormState());
    setEvaluationResult(null);
    setLatestStudentSubmission(null);
    setIsStudentConfirmModalOpen(false);
    setTabSwitchCount(0);
    setTabSwitchLogs([]);
    setIsCheatingModalOpen(false);
    setToastWarning(null);
    setIntegrityWarningType('tab_switch');
    setIsEvalModalOpen(false);
    setIsPrintModalOpen(false);
    setSelectedCertificateSubmission(null);
    setSelectedCountryA(DEVELOPED_COUNTRIES[0]);
    setSelectedCountryB(DEVELOPING_COUNTRIES[0]);
  };

  // Guard for changing tabs (Teacher Tab is PIN-protected for students)
  const handleSelectTab = (tab: 'explorer' | 'assessment' | 'rubric' | 'teacher') => {
    if (tab === 'teacher' && userSession.role === 'student') {
      setIsTeacherPinModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // Auto Load Sample Answer
  const handleLoadSample = () => {
    const korea = COUNTRIES.find((c) => c.id === 'korea') || COUNTRIES[0];
    const nigeria = COUNTRIES.find((c) => c.id === 'nigeria') || COUNTRIES[1];
    setSelectedCountryA(korea);
    setSelectedCountryB(nigeria);

    setFormState({
      studentName: userSession.studentName || '김민준',
      studentId: userSession.studentId || '1예비12',
      grade: userSession.grade || 1,
      classNum: userSession.classNum || '예비',
      studentNum: userSession.studentNum || 12,
      selectedCountryAId: 'korea',
      selectedCountryBId: 'nigeria',
      q1Answer: SAMPLE_MODEL_ANSWERS.q1,
      q2Answer: SAMPLE_MODEL_ANSWERS.q2,
      q3Answer: '',
    });

    setActiveTab('assessment');
  };

  // Reset form
  const handleReset = () => {
    const cleanId = userSession.studentId || '';
    const draftKey = getStudentDraftKey(cleanId);
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {}
    }
    try {
      localStorage.removeItem('geo_assessment_form_v2');
    } catch (e) {}

      setFormState(
        createDefaultFormState(
          userSession.studentName || '',
          cleanId,
          selectedCountryA.id,
          selectedCountryB.id
        )
      );
      setEvaluationResult(null);
      setTabSwitchCount(0);
      setTabSwitchLogs([]);
  };

  // Evaluate and register student submission
  const handleEvaluate = async () => {
    setIsEvaluating(true);

    try {
      let evalData: AiEvaluationResponse;

      try {
        const response = await fetch('/api/evaluate-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedCountryA,
            selectedCountryB,
            q1Answer: formState.q1Answer,
            q2Answer: formState.q2Answer,
            q3Answer: formState.q3Answer,
            studentName: formState.studentName || userSession.studentName || '학생',
          }),
        });

        if (!response.ok) {
          throw new Error('API Server error');
        }
        evalData = await response.json();
      } catch (err) {
        console.warn('Backend evaluation fallback used for teacher rubric reference:', err);
        const q1Len = formState.q1Answer.length;
        const q2Len = formState.q2Answer.length;

        // Question 1 (5pts): 4 criteria based
        const q1HasType = formState.q1Answer.includes('형') || formState.q1Answer.includes('피라미드') || formState.q1Answer.includes('종') || formState.q1Answer.includes('방추');
        const q1HasStats = /\d/.test(formState.q1Answer) || formState.q1Answer.includes('%') || formState.q1Answer.includes('명');
        let q1CriteriaCount = 1;
        if (q1HasType) q1CriteriaCount += 1;
        if (q1HasStats) q1CriteriaCount += 1;
        if (q1Len > 120) q1CriteriaCount += 1;
        const q1Score = Math.min(5, Math.max(1, q1CriteriaCount));

        // Question 2 (5pts): 4 criteria based
        const q2HasCause = formState.q2Answer.includes('원인') || formState.q2Answer.includes('이유') || formState.q2Answer.includes('부담') || formState.q2Answer.includes('출산');
        const q2HasPolicy = formState.q2Answer.includes('정책') || formState.q2Answer.includes('제도') || formState.q2Answer.includes('지원') || formState.q2Answer.includes('문화') || formState.q2Answer.includes('기술');
        let q2CriteriaCount = 1;
        if (q2HasCause) q2CriteriaCount += 1;
        if (q2HasPolicy) q2CriteriaCount += 1;
        if (q2Len > 150) q2CriteriaCount += 1;
        const q2Score = Math.min(5, Math.max(1, q2CriteriaCount));

        const totalScore = q1Score + q2Score;

        const gradeLevel =
          totalScore >= 9
            ? '탁월(상)'
            : totalScore >= 7
            ? '우수(중상)'
            : totalScore >= 5
            ? '보통(중)'
            : '노력요함(하)';

        evalData = {
          totalScore,
          maxScore: 10,
          gradeLevel,
          q1Score,
          q1Max: 5,
          q1CriteriaMet: [q1HasType, q1HasType, q1HasStats, q1Len > 100],
          q1Feedback: 'A·B 국가의 인구 피라미드 유형과 2가지 이상의 통계 수치(출생률, 청장년층/노년층 비율 등)를 비교 분석함.',
          q2Score,
          q2Max: 5,
          q2CriteriaMet: [q2HasCause, q2HasCause, q2HasPolicy, q2Len > 120],
          q2Feedback: 'A·B 국가의 인구 문제 원인과 미래 사회 파급 효과 및 맞춤형 정책을 종합적으로 서술함.',
          overallComment: `${formState.studentName || userSession.studentName || '학생'}님의 수행평가 답안이 정상 접수되었습니다.`,
          recommendedAction: '교과 성취기준에 따른 교사 최종 평가 진행 예정',
        };
      }

      setEvaluationResult(evalData);

      // Parse class and student number
      const parsedSub = parseStudentId(formState.studentId || userSession.studentId || '');
      const finalGrade = formState.grade || userSession.grade || parsedSub?.grade || 1;
      const finalClass = formState.classNum ?? userSession.classNum ?? parsedSub?.classNum;
      const finalNum = formState.studentNum ?? userSession.studentNum ?? parsedSub?.studentNum;
      const finalStudentId =
        formState.studentId ||
        (finalClass && finalNum ? formatStudentId(finalGrade, finalClass, finalNum) : (userSession.studentId || '1예비12'));

      // Register new student submission with integrity logs and answers
      const newSubmission: StudentSubmission = {
        id: `sub-${Date.now()}`,
        studentName: formState.studentName || userSession.studentName || '학생',
        studentId: finalStudentId,
        grade: finalGrade,
        classNum: finalClass,
        studentNum: finalNum,
        countryAId: selectedCountryA.id,
        countryAName: selectedCountryA.name,
        countryBId: selectedCountryB.id,
        countryBName: selectedCountryB.name,
        q1Answer: formState.q1Answer,
        q2Answer: formState.q2Answer,
        q3Answer: formState.q3Answer,
        evaluationResult: evalData,
        submittedAt: new Date().toLocaleString('ko-KR'),
        verificationCode: `KR-${selectedCountryA.id.toUpperCase().slice(0, 2)}${selectedCountryB.id.toUpperCase().slice(0, 2)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        tabSwitchCount: tabSwitchCount,
        tabSwitchLogs: tabSwitchLogs,
      };

      // 1. Immediately persist to server for cross-device visibility in teacher dashboard
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubmission),
        });
      } catch (err) {
        console.warn('Failed to save submission to server:', err);
      }

      // 2. Update local state and sync
      setSubmissions((prev) => [newSubmission, ...prev.filter((s) => s.id !== newSubmission.id)]);
      setLatestStudentSubmission(newSubmission);

      // 3. Open Student Confirmation Modal ONLY (NO auto-grading score shown to student!)
      setIsStudentConfirmModalOpen(true);
      setIsEvalModalOpen(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Seed Demo Submissions for Teachers
  const handleSeedDemoSubmissions = () => {
    const demo1: StudentSubmission = {
      id: 'sub-demo-1',
      studentName: '김민준',
      studentId: '1예비12',
      grade: 1,
      classNum: '예비',
      studentNum: 12,
      countryAId: 'korea',
      countryAName: '대한민국',
      countryBId: 'nigeria',
      countryBName: '나이지리아',
      q1Answer: SAMPLE_MODEL_ANSWERS.q1,
      q2Answer: SAMPLE_MODEL_ANSWERS.q2,
      tabSwitchCount: 0,
      tabSwitchLogs: [],
      evaluationResult: {
        totalScore: 10,
        maxScore: 10,
        gradeLevel: '탁월(상)',
        q1Score: 5,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, true],
        q1Feedback: 'A·B 국가의 인구 피라미드 유형(방추형/확장형)과 주요 통계 수치(출산율, 청장년층 및 노년층 비율 등) 2가지 이상을 매우 정확하게 분석함.',
        q2Score: 5,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, true],
        q2Feedback: 'A·B 국가의 인구 문제 원인과 미래 사회 파급 효과 및 제도적·문화적 맞춤형 정책을 4개 기준 모두 완벽하게 서술함.',
        overallComment: '교과 성취기준 및 2개 문항 평가 기준을 완벽히 충족한 모범 수행평가 답안입니다.',
        recommendedAction: '국가별 인구 변천 모델(DTM) 단계 심화 분석 권장',
      },
      submittedAt: '2026-08-17 14:20:00',
      verificationCode: 'KR-KORNG-88A1F',
    };

    const demo2: StudentSubmission = {
      id: 'sub-demo-2',
      studentName: '이서연',
      studentId: '1예비18',
      grade: 1,
      classNum: '예비',
      studentNum: 18,
      countryAId: 'france',
      countryAName: '프랑스',
      countryBId: 'uganda',
      countryBName: '우간다',
      q1Answer: '프랑스는 노년층 비율이 21.5%에 달하는 종형(정체형) 피라미드이며 합계출산율은 1.68명입니다. 우간다는 전형적인 확장형 피라미드로 유소년 인구 비율이 44.5%에 달하고 합계출산율은 4.4명으로 높은 인구 부양 부담을 나타냅니다.',
      q2Answer: '프랑스는 만혼화와 주거비 부담이 저출산의 주원인이며, 미래 사회에 생산연령층 부족과 연금 재정 고갈이 우려됩니다. 이에 따라 가족수당 확대 및 국공립 보육시설 확충, 성평등 양육 환경 조성이 필요합니다. 반면 우간다는 조혼 풍습과 여성 교육 기회 부족으로 급격한 인구 증가가 발생하여 청년 실업과 학교·병원 인프라 과부하가 초래됩니다. 이를 해결하기 위해 여성 의무 교육 법제화와 기초 모자보건 서비스 확충, 스마트 농업 직업훈련 정책이 필요합니다.',
      tabSwitchCount: 2,
      tabSwitchLogs: [
        { timestamp: '14:28:10', message: '다른 브라우저 탭/창으로 전환 감지 (1회차 감지)' },
        { timestamp: '14:31:05', message: '다른 브라우저 탭/창으로 전환 감지 (2회차 감지)' },
      ],
      evaluationResult: {
        totalScore: 9,
        maxScore: 10,
        gradeLevel: '탁월(상)',
        q1Score: 5,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, true],
        q1Feedback: '두 국가의 피라미드 유형과 유소년/노년층 통계 수치를 2가지 이상 적절히 인용함.',
        q2Score: 4,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, false],
        q2Feedback: '양국의 원인과 파급효과, 맞춤형 정책을 논리적으로 도출함 (우간다의 맞춤형 정책 세부 실행 계획 보강 권장).',
        overallComment: '국가별 특성을 살린 정책 제안이 돋보이는 우수 답안입니다.',
        recommendedAction: '복지국가 인구 정책 모델 비교',
      },
      submittedAt: '2026-08-17 14:35:12',
      verificationCode: 'KR-FRAUG-41C90',
    };

    const demo3: StudentSubmission = {
      id: 'sub-demo-3',
      studentName: '박지훈',
      studentId: '1예비05',
      grade: 1,
      classNum: '예비',
      studentNum: 5,
      countryAId: 'japan',
      countryAName: '일본',
      countryBId: 'india',
      countryBName: '인도',
      q1Answer: '일본은 65세 이상 노년층 비율이 29.8%로 초고령사회 방추형입니다. 인도는 14억 인구 대국으로 유소년 비율 25.3%, 청장년층 비율 67.8%로 피라미드형에서 종형으로 이행 중입니다.',
      q2Answer: '일본은 청장년층 인구 감소로 인한 지방 소멸과 간병 인력 부족이 원인이자 미래 파급 효과입니다. 정책으로 정년 70세 연장과 간병 로봇 지원이 시급합니다. 인도는 급격한 인구 규모로 인해 양질의 일자리 부족과 청년 실업이 문제입니다. 제조업 기술 훈련 학교 설립과 디지털 IT 직업 교육 확대가 필요합니다.',
      tabSwitchCount: 0,
      tabSwitchLogs: [],
      evaluationResult: {
        totalScore: 8,
        maxScore: 10,
        gradeLevel: '우수(중상)',
        q1Score: 4,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, false],
        q1Feedback: '초고령사회 통계 수치를 적절히 활용했으나 B국가 통계 비교 분석 보완 권장.',
        q2Score: 4,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, false],
        q2Feedback: '지방 소멸과 청년 실업 원인을 잘 짚었으며, 미래 사회 파급효과와 맞춤형 정책을 연계 서술함.',
        overallComment: '성실한 자료 탐구와 타당한 논리 전개가 돋보입니다.',
        recommendedAction: '인구 배당 효과(Demographic Dividend) 개념 복습',
      },
      submittedAt: '2026-08-17 14:48:50',
      verificationCode: 'KR-JPNIN-76F23',
    };

    const demo4: StudentSubmission = {
      id: 'sub-demo-4',
      studentName: '박준서',
      studentId: '1예비04',
      grade: 1,
      classNum: '예비',
      studentNum: 4,
      countryAId: 'korea',
      countryAName: '대한민국',
      countryBId: 'kenya',
      countryBName: '케냐',
      q1Answer: '한국은 노년층 비율이 19.2%에 육박하고 합계출산율 0.72명인 방추형 구조입니다. 케냐는 유소년 인구 비율이 38.5%로 매우 높고 합계출산율 3.3명인 전형적인 피라미드형 인구 구조를 보이고 있습니다.',
      q2Answer: '한국은 주거 비용 상승과 양육 부담으로 인한 초저출산이 원인이며, 미래 사회에 청장년층 인구 감소와 국가 성장 잠재력 약화가 예상됩니다. 일-가정 양립 제도와 신혼부부 주거 지원이 필요합니다. 케냐는 조혼과 보건의료 취약으로 급격한 인구 증가가 일어나 교육 시설 부족과 환경 파괴가 초래됩니다. 여학생 의무 교육 기회 확대와 가족계획 보건 상담 및 직업 기술 교육을 적극 지원해야 합니다.',
      tabSwitchCount: 0,
      tabSwitchLogs: [],
      evaluationResult: {
        totalScore: 9,
        maxScore: 10,
        gradeLevel: '탁월(상)',
        q1Score: 5,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, true],
        q1Feedback: '한국과 케냐의 피라미드 구조 대비와 수치 근거가 매우 명확함.',
        q2Score: 4,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, false],
        q2Feedback: '두 국가의 상반된 인구 문제 원인과 미래 사회 파급효과, 맞춤형 정책을 충실히 서술함.',
        overallComment: '반별 학습 목표를 충실히 달성한 우수 답안입니다.',
        recommendedAction: '국제 비교 인구 정책 심화 탐구 권장',
      },
      submittedAt: '2026-08-17 14:55:10',
      verificationCode: 'KR-KORKE-99D31',
    };

    const demo5: StudentSubmission = {
      id: 'sub-demo-5',
      studentName: '최유진',
      studentId: '1예비07',
      grade: 1,
      classNum: '예비',
      studentNum: 7,
      countryAId: 'sweden',
      countryAName: '스웨덴',
      countryBId: 'ethiopia',
      countryBName: '에티오피아',
      q1Answer: '스웨덴은 노년층 비율 20.3%, 합계출산율 1.52명인 종형/방추형 구조이며, 에티오피아는 유소년 인구가 40.2%를 차지하고 합계출산율 4.1명인 전형적인 피라미드형 구조입니다.',
      q2Answer: '스웨덴은 고령화로 인한 노동력 부족과 사회보장비 증가가 문제이며, 성평등 육아휴직제 강화와 고령자 재교육이 대안입니다. 에티오피아는 조혼과 여성 교육 부족으로 인한 인구 급증으로 식량 안보와 청년 일자리 부족이 심각하며, 여성 교육 의무화 및 기초 보건 인프라와 스마트 농업 기술 투자가 필요합니다.',
      tabSwitchCount: 0,
      tabSwitchLogs: [],
      evaluationResult: {
        totalScore: 9,
        maxScore: 10,
        gradeLevel: '탁월(상)',
        q1Score: 5,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, true],
        q1Feedback: '피라미드 분류 및 2가지 이상의 통계 비교가 매우 우수함.',
        q2Score: 4,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, false],
        q2Feedback: '원인과 경제사회적 파급효과, 국가별 맞춤형 정책을 논리적으로 제시함.',
        overallComment: '성실하고 논리적인 수행평가 보고서입니다.',
        recommendedAction: '북유럽 가족 정책 모델과 아프리카 개발협력 연계 학습',
      },
      submittedAt: '2026-08-17 15:02:40',
      verificationCode: 'KR-SWEET-12X88',
    };

    const demo6: StudentSubmission = {
      id: 'sub-demo-6',
      studentName: '최예비',
      studentId: '1예비01',
      grade: 1,
      classNum: '예비',
      studentNum: 1,
      countryAId: 'germany',
      countryAName: '독일',
      countryBId: 'uganda',
      countryBName: '우간다',
      q1Answer: '독일은 65세 이상 노년층 비율이 22.4%에 달하는 전형적인 종형(방추형) 구조이며 합계출산율은 1.53명입니다. 반면 우간다는 14세 이하 유소년 인구 비율이 44.5%로 매우 높고 합계출산율 4.4명인 확장형 피라미드 구조입니다.',
      q2Answer: '독일은 만혼과 청장년층 인구 감소로 인한 사회복지 및 연금 기금 부담이 원인이자 파급효과입니다. 숙련 노동자 이민 장려 및 유연근무제 확충이 필요합니다. 우간다는 조혼과 빈곤으로 인한 급격한 인구 증가로 학교와 병원 부족이 심각합니다. 여성 중등 의무 교육 지원과 기초 보건소 확충이 시급합니다.',
      tabSwitchCount: 0,
      tabSwitchLogs: [],
      evaluationResult: {
        totalScore: 10,
        maxScore: 10,
        gradeLevel: '탁월(상)',
        q1Score: 5,
        q1Max: 5,
        q1CriteriaMet: [true, true, true, true],
        q1Feedback: '독일과 우간다의 피라미드 형태 분류와 2개 이상의 통계 수치 인용이 정확함.',
        q2Score: 5,
        q2Max: 5,
        q2CriteriaMet: [true, true, true, true],
        q2Feedback: '양국의 인구 문제 원인과 미래 사회 파급효과, 맞춤형 정책을 성실하고 정밀하게 작성함.',
        overallComment: '예비반 학생의 모범적인 국가 비교 보고서입니다.',
        recommendedAction: 'OECD 국가와 사하라 이남 아프리카 비교 심화',
      },
      submittedAt: '2026-08-17 15:10:00',
      verificationCode: 'KR-DEUUG-77Y19',
    };

    const demos = [demo1, demo2, demo3, demo4, demo5, demo6];
    setSubmissions(demos);
    demos.forEach((d) => {
      fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      }).catch(() => {});
    });
  };

  // If not logged in, show AuthPortal
  if (!userSession.isLoggedIn) {
    return <AuthPortal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        hasSubmission={latestStudentSubmission !== null}
        submissionCount={submissions.length}
        isExamLockEnabled={isExamLockEnabled}
        userSession={userSession}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'explorer' && (
          <DemographicExplorer
            countries={COUNTRIES}
            selectedCountryA={selectedCountryA}
            setSelectedCountryA={setSelectedCountryA}
            selectedCountryB={selectedCountryB}
            setSelectedCountryB={setSelectedCountryB}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onGoToAssessment={() => setActiveTab('assessment')}
          />
        )}

        {activeTab === 'assessment' && (
          <AssessmentWorksheet
            countries={COUNTRIES}
            selectedCountryA={selectedCountryA}
            setSelectedCountryA={setSelectedCountryA}
            selectedCountryB={selectedCountryB}
            setSelectedCountryB={setSelectedCountryB}
            formState={formState}
            setFormState={setFormState}
            isEvaluating={isEvaluating}
            onEvaluate={handleEvaluate}
            evaluationResult={evaluationResult}
            onViewEvaluationModal={() => setIsStudentConfirmModalOpen(true)}
            hasSubmitted={latestStudentSubmission !== null}
            onViewSubmittedConfirmation={() => setIsStudentConfirmModalOpen(true)}
            onSaveDraft={() => {}}
            lastSavedAt={lastSavedAt}
            tabSwitchCount={tabSwitchCount}
          />
        )}

        {activeTab === 'rubric' && (
          <RubricView
            onLoadSampleAnswers={handleLoadSample}
            onGoToAssessment={() => setActiveTab('assessment')}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherDashboard
            submissions={submissions}
            activeStudents={activeStudents}
            onRefreshActiveStudents={handleRefreshActiveStudents}
            onSeedActiveStudents={handleSeedActiveStudents}
            onUpdateSubmission={async (updated) => {
              setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              try {
                await fetch(`/api/submissions/${updated.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updated),
                });
              } catch (e) {
                console.warn('Failed to update submission on server:', e);
              }
            }}
            onDeleteSubmission={async (id) => {
              setSubmissions((prev) => {
                const updated = prev.filter((s) => s.id !== id);
                try {
                  localStorage.setItem('geo_assessment_submissions_v2', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });

              if (latestStudentSubmission?.id === id) {
                setLatestStudentSubmission(null);
              }
              if (selectedCertificateSubmission?.id === id) {
                setSelectedCertificateSubmission(null);
              }

              try {
                await fetch(`/api/submissions/${id}`, {
                  method: 'DELETE',
                });
              } catch (e) {
                console.warn('Failed to delete submission on server:', e);
              }
            }}
            onViewCertificate={(sub) => setSelectedCertificateSubmission(sub)}
            isExamLockEnabled={isExamLockEnabled}
            setIsExamLockEnabled={setIsExamLockEnabled}
            onSeedDemoSubmissions={handleSeedDemoSubmissions}
            onRefreshSubmissions={handleRefreshSubmissions}
          />
        )}
      </main>

      {/* Footer - Geometric Balance Style */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest gap-2">
          <span>© 2024 통합사회 II 인구 문제와 미래 사회 평가 플랫폼</span>
          <span>
            {userSession.role === 'teacher'
              ? '교사 관리자 모드'
              : `학생 모드 (${userSession.studentId} ${userSession.studentName})`}
            {' · '}실시간 10점 루브릭 채점 가동 중
          </span>
        </div>
      </footer>

      {/* Floating Integrity Alert Toast Banner */}
      {toastWarning && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white shadow-2xl border-2 border-rose-300 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-200 animate-bounce" />
            <span>{toastWarning}</span>
          </div>
          <button
            onClick={() => setToastWarning(null)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cheating & Integrity Warning Modal */}
      <CheatingWarningModal
        isOpen={isCheatingModalOpen}
        onClose={() => setIsCheatingModalOpen(false)}
        tabSwitchCount={tabSwitchCount}
        latestLog={tabSwitchLogs[tabSwitchLogs.length - 1]}
        warningType={integrityWarningType}
      />

      {/* Student Submission Confirmation Modal (Student View without auto-grading score) */}
      <StudentSubmissionConfirmationModal
        isOpen={isStudentConfirmModalOpen}
        onClose={() => setIsStudentConfirmModalOpen(false)}
        submission={latestStudentSubmission}
      />

      {/* Evaluation Result Modal (Strictly teacher-only view) */}
      <AiEvaluationResultModal
        isOpen={isEvalModalOpen && userSession.role === 'teacher'}
        onClose={() => setIsEvalModalOpen(false)}
        result={evaluationResult}
        studentName={formState.studentName || userSession.studentName}
        countryAName={selectedCountryA.name}
        countryBName={selectedCountryB.name}
        onOpenPrint={() => setIsPrintModalOpen(true)}
      />

      {/* Printable Worksheet Modal */}
      <PrintWorksheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedCountryA={selectedCountryA}
        selectedCountryB={selectedCountryB}
        formState={formState}
        evaluationResult={evaluationResult}
        submission={latestStudentSubmission}
        isTeacher={userSession.role === 'teacher'}
      />

      {/* Official Certificate Modal */}
      {selectedCertificateSubmission && (
        <StudentSubmissionCertificate
          submission={selectedCertificateSubmission}
          onClose={() => setSelectedCertificateSubmission(null)}
        />
      )}

      {/* Teacher PIN Unlock Modal (when student clicks teacher tab) */}
      <TeacherPinModal
        isOpen={isTeacherPinModalOpen}
        onClose={() => setIsTeacherPinModalOpen(false)}
        onSuccess={() => {
          const newSession: UserSession = {
            isLoggedIn: true,
            role: 'teacher',
            teacherName: '교사 관리자',
            loginTime: new Date().toLocaleTimeString('ko-KR'),
          };
          setUserSession(newSession);
          try {
            localStorage.setItem('geo_assessment_user_session_v2', JSON.stringify(newSession));
          } catch (e) {}
          setActiveTab('teacher');
        }}
      />
    </div>
  );
}
