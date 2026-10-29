import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Award,
  CheckCircle,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  BookOpen,
  Sparkles,
  BarChart,
  FileSpreadsheet,
  HardDrive,
  Info,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  Loader2,
  ArrowUpDown,
  GraduationCap,
  Radio,
  Clock,
  PenLine,
  X,
  AlertCircle,
} from 'lucide-react';
import { StudentSubmission, ActiveStudentSession } from '../types';
import { exportSubmissionConfirmationPdf, exportCertificatePdf } from '../utils/pdfExport';
import { parseStudentId, formatStudentDisplay, formatClassLabel, CLASS_OPTIONS } from '../utils/studentInfo';

interface TeacherDashboardProps {
  submissions: StudentSubmission[];
  onUpdateSubmission: (updated: StudentSubmission) => void;
  onDeleteSubmission: (id: string) => void;
  onViewCertificate: (submission: StudentSubmission) => void;
  isExamLockEnabled: boolean;
  setIsExamLockEnabled: (enabled: boolean) => void;
  onSeedDemoSubmissions: () => void;
  onRefreshSubmissions?: () => void;
  activeStudents?: ActiveStudentSession[];
  onRefreshActiveStudents?: () => void;
  onSeedActiveStudents?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  onUpdateSubmission,
  onDeleteSubmission,
  onViewCertificate,
  isExamLockEnabled,
  setIsExamLockEnabled,
  onSeedDemoSubmissions,
  onRefreshSubmissions,
  activeStudents = [],
  onRefreshActiveStudents,
  onSeedActiveStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(10);
  const [teacherNote, setTeacherNote] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmSubmission, setDeleteConfirmSubmission] = useState<StudentSubmission | null>(null);
  const [isExportingPdfId, setIsExportingPdfId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Class filtering & sorting
  const [selectedClassFilter, setSelectedClassFilter] = useState<'all' | string | number>('all');
  const [sortBy, setSortBy] = useState<'studentId' | 'recent' | 'score' | 'name'>('studentId');

  // Active / Monitoring Tab Mode: 'active-students' (실시간 작성 중 학생) vs 'submissions' (제출 완료 답안 및 채점)
  const [activeTabMode, setActiveTabMode] = useState<'active-students' | 'submissions'>('active-students');
  const [selectedActiveDraft, setSelectedActiveDraft] = useState<ActiveStudentSession | null>(null);
  const [activeStudentsViewMode, setActiveStudentsViewMode] = useState<'table' | 'cards'>('table');

  const formatRelativeTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    try {
      const now = new Date().getTime();
      const time = new Date(timeStr).getTime();
      const diffSec = Math.floor((now - time) / 1000);
      if (diffSec < 10) return '방금 전';
      if (diffSec < 60) return `${diffSec}초 전`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}분 전`;
      const diffHour = Math.floor(diffMin / 60);
      return `${diffHour}시간 전`;
    } catch (e) {
      return timeStr;
    }
  };

  // Filter active writing students
  const filteredActiveStudents = useMemo(() => {
    return activeStudents
      .filter((s) => {
        // Class Filter
        if (selectedClassFilter !== 'all') {
          const parsed = parseStudentId(s.studentId);
          const rawCls =
            s.classNum !== undefined && s.classNum !== ''
              ? String(s.classNum)
              : parsed?.classNum !== undefined
              ? String(parsed.classNum)
              : '';
          if (String(rawCls) !== String(selectedClassFilter)) return false;
        }

        // Search Term Filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const displayTag = formatStudentDisplay(s.grade, s.classNum, s.studentNum, s.studentId).toLowerCase();

        return (
          s.studentName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          displayTag.includes(q) ||
          (s.selectedCountryAName || '').toLowerCase().includes(q) ||
          (s.selectedCountryBName || '').toLowerCase().includes(q) ||
          (s.currentDraft?.q1Answer || '').toLowerCase().includes(q) ||
          (s.currentDraft?.q2Answer || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Status priority: writing -> idle -> submitted
        const statusPriority: Record<string, number> = { writing: 1, idle: 2, submitted: 3 };
        const prioDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
        if (prioDiff !== 0) return prioDiff;

        // Class ordering
        const classA = a.classNum ?? '';
        const classB = b.classNum ?? '';
        const isNumA = typeof classA === 'number' || /^\d+$/.test(String(classA));
        const isNumB = typeof classB === 'number' || /^\d+$/.test(String(classB));
        if (isNumA && isNumB) {
          const diff = Number(classA) - Number(classB);
          if (diff !== 0) return diff;
        } else if (isNumA) {
          return -1;
        } else if (isNumB) {
          return 1;
        } else if (String(classA) !== String(classB)) {
          return String(classA).localeCompare(String(classB), 'ko');
        }

        const numA = a.studentNum ?? 0;
        const numB = b.studentNum ?? 0;
        if (numA !== numB) return numA - numB;

        return (b.totalLength ?? 0) - (a.totalLength ?? 0);
      });
  }, [activeStudents, selectedClassFilter, searchTerm]);

  const writingCount = useMemo(() => activeStudents.filter((s) => s.status === 'writing').length, [activeStudents]);
  const idleCount = useMemo(() => activeStudents.filter((s) => s.status === 'idle').length, [activeStudents]);
  const activeCheatingCount = useMemo(
    () => activeStudents.filter((s) => (s.tabSwitchCount ?? 0) > 0).length,
    [activeStudents]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadStudentPdf = async (
    sub: StudentSubmission,
    type: 'confirmation' | 'certificate' = 'confirmation'
  ) => {
    setIsExportingPdfId(sub.id);
    try {
      if (type === 'confirmation') {
        await exportSubmissionConfirmationPdf(sub);
      } else {
        await exportCertificatePdf(sub);
      }
      showToast(`${sub.studentName} 학생의 PDF 저장이 완료되었습니다.`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExportingPdfId(null);
    }
  };

  // Class submission breakdown statistics
  const classBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; totalScore: number }> = {};
    submissions.forEach((s) => {
      const parsed = parseStudentId(s.studentId);
      const rawCls =
        s.classNum !== undefined && s.classNum !== ''
          ? String(s.classNum)
          : parsed?.classNum !== undefined
          ? String(parsed.classNum)
          : '';
      if (rawCls) {
        if (!counts[rawCls]) counts[rawCls] = { count: 0, totalScore: 0 };
        counts[rawCls].count += 1;
        counts[rawCls].totalScore +=
          s.teacherOverriddenScore !== undefined
            ? s.teacherOverriddenScore
            : s.evaluationResult?.totalScore ?? 0;
      }
    });
    return counts;
  }, [submissions]);

  // List of distinct classes that actually have submissions (1~9 first, then 예비)
  const activeClassList = useMemo(() => {
    return Object.keys(classBreakdown).sort((a, b) => {
      const isNumA = /^\d+$/.test(a);
      const isNumB = /^\d+$/.test(b);
      if (isNumA && isNumB) return Number(a) - Number(b);
      if (isNumA) return -1;
      if (isNumB) return 1;
      return a.localeCompare(b, 'ko');
    });
  }, [classBreakdown]);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((s) => {
        // Class Filter
        if (selectedClassFilter !== 'all') {
          const parsed = parseStudentId(s.studentId);
          const rawCls =
            s.classNum !== undefined && s.classNum !== ''
              ? String(s.classNum)
              : parsed?.classNum !== undefined
              ? String(parsed.classNum)
              : '';
          if (String(rawCls) !== String(selectedClassFilter)) return false;
        }

        // Search Term Filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const displayTag = formatStudentDisplay(s.grade, s.classNum, s.studentNum, s.studentId).toLowerCase();

        return (
          s.studentName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          displayTag.includes(q) ||
          s.countryAName.includes(q) ||
          s.countryBName.includes(q) ||
          (s.q1Answer || '').includes(q) ||
          (s.q2Answer || '').includes(q) ||
          (s.q3Answer || '').includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'studentId') {
          const parsedA = parseStudentId(a.studentId);
          const parsedB = parseStudentId(b.studentId);
          const gradeA = a.grade ?? parsedA?.grade ?? 1;
          const gradeB = b.grade ?? parsedB?.grade ?? 1;
          const classA = a.classNum ?? parsedA?.classNum ?? '';
          const classB = b.classNum ?? parsedB?.classNum ?? '';
          const numA = a.studentNum ?? parsedA?.studentNum ?? 0;
          const numB = b.studentNum ?? parsedB?.studentNum ?? 0;

          if (gradeA !== gradeB) return gradeA - gradeB;

          // Numeric classes 1..9 sorted first, then non-numeric like '예비'
          const isNumA = typeof classA === 'number' || /^\d+$/.test(String(classA));
          const isNumB = typeof classB === 'number' || /^\d+$/.test(String(classB));
          if (isNumA && isNumB) {
            const diff = Number(classA) - Number(classB);
            if (diff !== 0) return diff;
          } else if (isNumA) {
            return -1;
          } else if (isNumB) {
            return 1;
          } else if (String(classA) !== String(classB)) {
            return String(classA).localeCompare(String(classB), 'ko');
          }

          if (numA !== numB) return numA - numB;
          return a.studentId.localeCompare(b.studentId);
        } else if (sortBy === 'score') {
          const scoreA = a.teacherOverriddenScore ?? a.evaluationResult?.totalScore ?? 0;
          const scoreB = b.teacherOverriddenScore ?? b.evaluationResult?.totalScore ?? 0;
          return scoreB - scoreA;
        } else if (sortBy === 'name') {
          return a.studentName.localeCompare(b.studentName, 'ko');
        } else {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
      });
  }, [submissions, selectedClassFilter, searchTerm, sortBy]);

  const targetSubmissionsForStats =
    selectedClassFilter === 'all'
      ? submissions
      : submissions.filter((s) => {
          const parsed = parseStudentId(s.studentId);
          const rawCls =
            s.classNum !== undefined && s.classNum !== ''
              ? String(s.classNum)
              : parsed?.classNum !== undefined
              ? String(parsed.classNum)
              : '';
          return String(rawCls) === String(selectedClassFilter);
        });

  const averageScore =
    targetSubmissionsForStats.length > 0
      ? (
          targetSubmissionsForStats.reduce(
            (acc, s) =>
              acc +
              (s.teacherOverriddenScore !== undefined
                ? s.teacherOverriddenScore
                : s.evaluationResult?.totalScore ?? 0),
            0
          ) / targetSubmissionsForStats.length
        ).toFixed(1)
      : '0.0';

  const highTierCount = targetSubmissionsForStats.filter(
    (s) => (s.teacherOverriddenScore ?? s.evaluationResult?.totalScore ?? 0) >= 9
  ).length;

  const totalTabSwitchedCount = targetSubmissionsForStats.filter(
    (s) => (s.tabSwitchCount ?? 0) > 0
  ).length;

  const handleOpenReview = (sub: StudentSubmission) => {
    setSelectedSubmission(sub);
    setOverrideScore(sub.teacherOverriddenScore ?? sub.evaluationResult?.totalScore ?? 10);
    setTeacherNote(sub.teacherCustomNote || '');
  };

  const handleSaveReview = () => {
    if (!selectedSubmission) return;
    const updated: StudentSubmission = {
      ...selectedSubmission,
      teacherOverriddenScore: overrideScore,
      teacherCustomNote: teacherNote,
      isConfirmedByTeacher: true,
    };
    onUpdateSubmission(updated);
    setSelectedSubmission(null);
  };

  const handleRefresh = async () => {
    if (onRefreshSubmissions) {
      setIsRefreshing(true);
      await onRefreshSubmissions();
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to CSV with full student written answers included (with separate grade, class, number columns)
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('다운로드할 학생 제출 데이터가 없습니다.');
      return;
    }

    const headers = [
      '학년',
      '반',
      '번호',
      '학번코드',
      '학생성명',
      '탐구국가A(선진국)',
      '탐구국가B(개발도상국)',
      '문항1_피라미드분석_작성답안',
      '문항2_원인_파급효과_맞춤형정책_작성답안',
      '문항1점수(5점)',
      '문항2점수(5점)',
      'AI채점점수(10점)',
      '교사최종점수(10점)',
      '등급',
      '이탈및복사감지횟수',
      '이상행위기록',
      '제출일시',
      '검증코드',
      '교사의견',
    ];

    const rows = filteredSubmissions.map((s) => {
      const parsed = parseStudentId(s.studentId);
      const grade = s.grade ?? parsed?.grade ?? 1;
      const classNum = s.classNum ?? parsed?.classNum ?? '';
      const studentNum = s.studentNum ?? parsed?.studentNum ?? '';

      return [
        `"${grade}학년"`,
        `"${classNum !== '' ? formatClassLabel(classNum) : ''}"`,
        `"${studentNum ? `${studentNum}번` : ''}"`,
        `"${s.studentId}"`,
        `"${s.studentName}"`,
        `"${s.countryAName}"`,
        `"${s.countryBName}"`,
        `"${(s.q1Answer || '').replace(/"/g, '""')}"`,
        `"${(s.q2Answer || '').replace(/"/g, '""')}"`,
        s.evaluationResult?.q1Score ?? 0,
        s.evaluationResult?.q2Score ?? 0,
        s.evaluationResult?.totalScore ?? 0,
        s.teacherOverriddenScore ?? s.evaluationResult?.totalScore ?? 0,
        `"${s.evaluationResult?.gradeLevel || '미채점'}"`,
        s.tabSwitchCount ?? 0,
        `"${(s.tabSwitchLogs || []).map((l) => `${l.timestamp}: ${l.message}`).join('; ')}"`,
        `"${s.submittedAt}"`,
        `"${s.verificationCode}"`,
        `"${(s.teacherCustomNote || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const classLabel = selectedClassFilter === 'all' ? '전체학급' : formatClassLabel(selectedClassFilter);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `2024_고1통합사회_인구수행평가_${classLabel}_학생답안성적_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Dashboard Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Classroom Monitor & Grading
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                실시간 학생 응시 감독 및 답안·성적 관리
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mt-1.5 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
              교사용 학생 실시간 응시 감독 및 답안·성적 관리 대시보드
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                setIsRefreshing(true);
                if (onRefreshActiveStudents) await onRefreshActiveStudents();
                if (onRefreshSubmissions) await onRefreshSubmissions();
                setTimeout(() => setIsRefreshing(false), 500);
                showToast('실시간 학생 작성 현황 및 제출 목록을 새로고침했습니다.');
              }}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="실시간 작성 중 학생 및 제출 현황 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>실시간 새로고침</span>
            </button>

            {onSeedActiveStudents && (
              <button
                onClick={async () => {
                  await onSeedActiveStudents();
                  showToast('시연용 실시간 작성 중 학생 4명이 생성되었습니다.');
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-emerald-100"
                title="실시간 작성 중인 학생 4명의 시연 데이터 생성"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>샘플 작성 중 학생 채우기</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="학생들이 작성한 답안 전문과 점수를 엑셀(CSV)로 다운로드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>성적표 CSV 다운로드</span>
            </button>

            {submissions.length === 0 && (
              <button
                onClick={onSeedDemoSubmissions}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-indigo-100"
                title="시연용 샘플 학생 2명의 제출 데이터 생성"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>샘플 제출 데이터 채우기</span>
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
            <span className="flex items-center justify-center gap-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {writingCount}명
            </span>
            <span className="text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider text-[11px] mt-1 block">
              🟢 실시간 작성 중
            </span>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
            <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">
              {idleCount}명
            </span>
            <span className="text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px] mt-1 block">
              🟡 3분 이상 대기·멈춤
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {submissions.length}명
            </span>
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mt-1 block">
              📋 총 제출 완료 학생 수
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className={`block text-2xl font-black ${(totalTabSwitchedCount + activeCheatingCount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
              {totalTabSwitchedCount + activeCheatingCount}명
            </span>
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px] mt-1 block">
              ⚠️ 유의사항 위반(이탈/복사)
            </span>
          </div>
        </div>

        {/* Real-time sync notice */}
        <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-950 dark:text-emerald-200">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold flex items-center gap-1.5">
              <span>학생 실시간 작성 현황 모니터링 기능 가동 중</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                4~6초 주기 자동 동기화
              </span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              학생들이 로그인하여 수행평가 답안을 작성할 때마다 <strong>선택 국가, 문항 1·2 작성 글자 수, 실시간 초안 내용, 화면 이탈 여부</strong>가 실시간으로 교사 대시보드에 업데이트됩니다. 우측 상단 <strong>[샘플 작성 중 학생 채우기]</strong>를 누르면 실제 작성 중인 학생 현황을 즉시 시연해 보실 수 있습니다.
            </p>
          </div>
        </div>

        {/* Main Tab Switcher: Active Students vs Submitted Students */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5 space-x-2 pt-2">
          <button
            type="button"
            id="tab-active-students"
            onClick={() => setActiveTabMode('active-students')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-sm transition-all cursor-pointer ${
              activeTabMode === 'active-students'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className={`w-4 h-4 ${writingCount > 0 ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>🟢 실시간 작성/응시 중 학생 모니터링</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {filteredActiveStudents.length}명
            </span>
          </button>

          <button
            type="button"
            id="tab-submissions"
            onClick={() => setActiveTabMode('submissions')}
            className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-sm transition-all cursor-pointer ${
              activeTabMode === 'submissions'
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>📋 최종 제출 완료 학생 답안 & 채점</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {filteredSubmissions.length}명
            </span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODE 1: LIVE ACTIVE STUDENTS MONITORING SECTION                           */}
      {/* ========================================================================= */}
      {activeTabMode === 'active-students' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          {/* Active Students Toolbar & Filter */}
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>실시간 작성 중 학생 명단 및 입력 현황</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {filteredActiveStudents.length}명
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedClassFilter === 'all'
                      ? '모든 학급에서 로그인하여 답안을 작성 중인 학생들을 모니터링 중입니다.'
                      : `${formatClassLabel(selectedClassFilter)}의 실시간 작성 중 학생들을 집중 모니터링 중입니다.`}
                  </p>
                </div>
              </div>

              {/* View Mode Toggle & Refresh */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshing(true);
                    if (onRefreshActiveStudents) await onRefreshActiveStudents();
                    setTimeout(() => setIsRefreshing(false), 500);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  title="실시간 현황 갱신"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>새로고침</span>
                </button>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setActiveStudentsViewMode('table')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeStudentsViewMode === 'table'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    <span>📋 실시간 현황표</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStudentsViewMode('cards')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeStudentsViewMode === 'cards'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>🪪 학생별 카드 뷰</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Class Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>학급 필터:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedClassFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedClassFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                전체 학급 ({activeStudents.length}명)
              </button>

              {CLASS_OPTIONS.map((cls) => {
                const countInClass = activeStudents.filter((s) => {
                  const parsed = parseStudentId(s.studentId);
                  const rawCls =
                    s.classNum !== undefined && s.classNum !== ''
                      ? String(s.classNum)
                      : parsed?.classNum !== undefined
                      ? String(parsed.classNum)
                      : '';
                  return String(rawCls) === String(cls);
                }).length;

                return (
                  <button
                    key={String(cls)}
                    type="button"
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      String(selectedClassFilter) === String(cls)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{formatClassLabel(cls)}</span>
                    {countInClass > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          String(selectedClassFilter) === String(cls)
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {countInClass}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="학생 성명, 학번(1예비12), 탐구 대상 국가, 작성 답안 키워드로 실시간 검색..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          {/* Active Students Content */}
          {filteredActiveStudents.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                현재 선택한 조건의 실시간 작성 중 학생이 없습니다
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                학생들이 로그인하여 수행평가 답안을 작성하기 시작하면 실시간으로 여기에 표시됩니다. 우측 상단이나 아래 버튼을 눌러 시연용 샘플 학생 데이터를 불러올 수 있습니다.
              </p>
              {onSeedActiveStudents && (
                <button
                  type="button"
                  onClick={async () => {
                    await onSeedActiveStudents();
                    showToast('시연용 작성 중 학생 4명이 생성되었습니다.');
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>시연용 작성 중 학생 불러오기</span>
                </button>
              )}
            </div>
          ) : activeStudentsViewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5 text-center">응시 상태</th>
                    <th className="py-3 px-3.5">학급 / 번호</th>
                    <th className="py-3 px-3.5">학생 성명</th>
                    <th className="py-3 px-3.5">학번 코드</th>
                    <th className="py-3 px-3.5">선택 탐구 국가 (A vs B)</th>
                    <th className="py-3 px-3.5">실시간 작성 분량</th>
                    <th className="py-3 px-3.5 text-center">유의사항 준수</th>
                    <th className="py-3 px-3.5">최근 활동</th>
                    <th className="py-3 px-3.5 text-center">실시간 답안 열람</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredActiveStudents.map((s) => {
                    const totalChars = s.totalLength ?? (s.q1Length + s.q2Length);
                    const progressPercent = Math.min(100, Math.round((totalChars / 400) * 100));

                    return (
                      <tr
                        key={s.studentId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Status Badge */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {s.status === 'writing' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              작성 중
                            </span>
                          ) : s.status === 'idle' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300">
                              🟡 대기 중
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300">
                              ✅ 제출 완료
                            </span>
                          )}
                        </td>

                        {/* Class / Number */}
                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatStudentDisplay(s.grade, s.classNum, s.studentNum, s.studentId)}
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-3.5 font-black text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                          {s.studentName}
                        </td>

                        {/* Student ID */}
                        <td className="py-3 px-3.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                          {s.studentId}
                        </td>

                        {/* Chosen Countries */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              A: {s.selectedCountryAName}
                            </span>
                            <span className="text-slate-400 text-xs">vs</span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              B: {s.selectedCountryBName}
                            </span>
                          </div>
                        </td>

                        {/* Real-time Character Counts & Progress */}
                        <td className="py-3 px-3.5 min-w-[180px]">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                총 {totalChars.toLocaleString()}자
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                문1: {s.q1Length}자 / 문2: {s.q2Length}자
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  progressPercent >= 80
                                    ? 'bg-emerald-500'
                                    : progressPercent >= 40
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Cheating & Integrity Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {(s.tabSwitchCount ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{s.tabSwitchCount}회 이탈</span>
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>정상 준수</span>
                            </span>
                          )}
                        </td>

                        {/* Last Active Time */}
                        <td className="py-3 px-3.5 text-slate-500 font-medium text-xs whitespace-nowrap">
                          <span className="flex items-center gap-1" title={s.lastActiveAt}>
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatRelativeTime(s.lastActiveAt)}
                          </span>
                        </td>

                        {/* View Draft Button */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedActiveDraft(s)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="학생이 현재 입력 중인 실시간 초안 열람"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>작성 답안 보기</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActiveStudents.map((s) => {
                const totalChars = s.totalLength ?? (s.q1Length + s.q2Length);
                return (
                  <div
                    key={s.studentId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {s.studentName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({s.studentId})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                          {formatStudentDisplay(s.grade, s.classNum, s.studentNum, s.studentId)}
                        </span>
                      </div>

                      {s.status === 'writing' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          작성 중
                        </span>
                      ) : s.status === 'idle' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          🟡 대기 중
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          ✅ 제출 완료
                        </span>
                      )}
                    </div>

                    {/* Countries */}
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-[11px] flex items-center justify-between font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">A: {s.selectedCountryAName}</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-emerald-600 dark:text-emerald-400">B: {s.selectedCountryBName}</span>
                    </div>

                    {/* Character Counts */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          작성 분량: 총 {totalChars.toLocaleString()}자
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {formatRelativeTime(s.lastActiveAt)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-center font-bold">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          문항 1: {s.q1Length}자
                        </div>
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          문항 2: {s.q2Length}자
                        </div>
                      </div>
                    </div>

                    {/* Draft snippet preview */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      "{s.currentDraft?.q1Answer || s.currentDraft?.q2Answer || '아직 작성한 초안 내용이 없습니다.'}"
                    </div>

                    {/* Cheating Alert */}
                    {(s.tabSwitchCount ?? 0) > 0 && (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>화면 이탈 {s.tabSwitchCount}회 감지됨</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedActiveDraft(s)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>실시간 작성 답안 열람</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: COMPLETED SUBMISSIONS SECTION                                      */}
      {/* ========================================================================= */}
      {activeTabMode === 'submissions' && (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        {/* Class Selection & Filter Bar (반별 데이터 수집) */}
        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>반별 데이터 수집 및 제출 학생 목록</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {filteredSubmissions.length}명
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedClassFilter === 'all'
                    ? '전체 학급 학생들의 제출 답안을 열람 중입니다.'
                    : `${formatClassLabel(selectedClassFilter)} 학생들의 제출 답안 및 성적을 집중 수집·열람 중입니다.`}
                </p>
              </div>
            </div>

            {/* Sorting & View Mode Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort selector */}
              <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-slate-500 font-bold">정렬:</span>
                <select
                  id="teacher-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="studentId">학번순 (반·번호순 / 나이스 성적 입력용)</option>
                  <option value="recent">최신 제출순</option>
                  <option value="score">최종 점수순</option>
                  <option value="name">학생 성명순</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  <span>📋 요약 테이블</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📖 학생 답안 집중 열람 뷰</span>
                </button>
              </div>
            </div>
          </div>

          {/* Class Filter Pills (반별 빠른 탭 필터) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>학급 필터:</span>
            </span>

            <button
              type="button"
              id="filter-class-all"
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedClassFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              전체 학급 ({submissions.length}명)
            </button>

            {/* Existing Active Classes Buttons */}
            {activeClassList.map((c) => {
              const info = classBreakdown[c];
              const isSelected = String(selectedClassFilter) === String(c);
              return (
                <button
                  key={`class-filter-pill-${c}`}
                  type="button"
                  id={`filter-class-${c}`}
                  onClick={() => setSelectedClassFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  <span>{formatClassLabel(c)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                    }`}
                  >
                    {info?.count || 0}명
                  </span>
                </button>
              );
            })}

            {/* Quick Dropdown to filter ANY class (1~9반 및 예비반) */}
            <div className="relative ml-auto">
              <select
                id="select-any-class-filter"
                value={selectedClassFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setSelectedClassFilter('all');
                  } else if (val === '예비' || val === '예비반') {
                    setSelectedClassFilter('예비');
                  } else {
                    setSelectedClassFilter(Number(val));
                  }
                }}
                className="py-1.5 pl-2.5 pr-7 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">학급 직접 선택 (전체)</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={`select-opt-cls-${c}`} value={c}>
                    {formatClassLabel(c)} {classBreakdown[String(c)] ? `(${classBreakdown[String(c)].count}명 제출)` : '(미제출)'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Search Box Bar */}
        <div className="mb-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="학생 이름, 반, 번호, 학번, 탐구 국가, 작성 답안 본문 검색..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {searchTerm || selectedClassFilter !== 'all'
                ? '선택하신 조건(학급/검색어)과 일치하는 학생 답안이 없습니다.'
                : '아직 제출된 학생 답안이 없습니다.'}
            </p>
            <p className="mt-1 text-slate-500">
              학생들이 자신의 기기에서 소속 반을 선택하고 번호를 입력하여 제출하면 실시간으로 이곳에 등록됩니다.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* View Mode 1: Table View with Inline Accordion Expand */
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700 w-12">펼치기</th>
                  <th className="py-2.5 px-3 text-left border-b border-slate-200 dark:border-slate-700">소속 학급 (반·번호)</th>
                  <th className="py-2.5 px-3 text-left border-b border-slate-200 dark:border-slate-700">학번(ID)</th>
                  <th className="py-2.5 px-3 text-left border-b border-slate-200 dark:border-slate-700">학생 성명</th>
                  <th className="py-2.5 px-3 text-left border-b border-slate-200 dark:border-slate-700">비교 탐구 국가</th>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">작성 분량</th>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">교사 최종 점수</th>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">이상행위 감지</th>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">제출일시</th>
                  <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">답안 열람 및 채점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSubmissions.map((sub) => {
                  const finalScore =
                    sub.teacherOverriddenScore !== undefined
                      ? sub.teacherOverriddenScore
                      : sub.evaluationResult?.totalScore ?? 0;
                  const switchCount = sub.tabSwitchCount ?? 0;
                  const isExpanded = expandedRowId === sub.id;
                  const totalLength = (sub.q1Answer?.length || 0) + (sub.q2Answer?.length || 0);
                  const studentDisplay = formatStudentDisplay(sub.grade, sub.classNum, sub.studentNum, sub.studentId);

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedRowId(isExpanded ? null : sub.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title={isExpanded ? '답안 미리보기 접기' : '테이블 내 답안 미리보기 펼치기'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{studentDisplay}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                          {sub.studentId || '-'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {sub.studentName || '미기입'}
                        </td>
                        <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400 font-bold">
                          {sub.countryAName} vs {sub.countryBName}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {totalLength.toLocaleString()}자
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {finalScore}점
                          {sub.teacherOverriddenScore !== undefined && (
                            <span className="text-[9px] text-amber-600 font-bold block">(교사 직접채점)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {switchCount > 0 ? (
                            <span
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-300 dark:border-rose-800"
                              title={`이상 행위 총 ${switchCount}회 감지`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>감지 {switchCount}회</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>정상(0회)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 text-[10px]">
                          {sub.submittedAt.slice(5, 16)}
                        </td>
                        <td className="py-3 px-3 text-center space-x-1.5 whitespace-nowrap">
                          {/* Prominent View Student Answers Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(sub)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title="학생이 작성한 답안 전문 확인 및 채점"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>📄 답안 보기</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadStudentPdf(sub, 'confirmation')}
                            disabled={isExportingPdfId === sub.id}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="학생 작성 답안 PDF 바로 다운로드"
                          >
                            {isExportingPdfId === sub.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 inline" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewCertificate(sub)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="공식 성적표 양식 인쇄/다운로드"
                          >
                            <Eye className="w-3.5 h-3.5 inline" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSubmission(sub)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="제출 답안 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>

                      {/* Inline Accordion for instant answer reading */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-800/80">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                                  <FileText className="w-4 h-4" />
                                  <span>{sub.studentName} ({sub.studentId}) 학생의 작성 답안 미리보기</span>
                                </span>
                                <button
                                  onClick={() => handleOpenReview(sub)}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                                >
                                  <span>전체 화면으로 열기 & 채점하기 →</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                                  <span className="font-bold text-indigo-600 block">[문제 1] 자료 분석 및 피라미드 유형 분류 (5점 배점 / {sub.q1Answer?.length || 0}자)</span>
                                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                                    {sub.q1Answer || '(답안 없음)'}
                                  </p>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                                  <span className="font-bold text-indigo-600 block">[문제 2] 원인, 파급효과 및 맞춤형 정책 (5점 배점 / {sub.q2Answer?.length || 0}자)</span>
                                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                                    {sub.q2Answer || '(답안 없음)'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Card / Student Answers Focused View */
          <div className="grid grid-cols-1 gap-5">
            {filteredSubmissions.map((sub) => {
              const finalScore =
                sub.teacherOverriddenScore !== undefined
                  ? sub.teacherOverriddenScore
                  : sub.evaluationResult?.totalScore ?? 0;

              return (
                <div
                  key={`card-${sub.id}`}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        <span className="text-[10px] text-indigo-500 font-normal">
                          {sub.classNum !== undefined && sub.classNum !== '' ? formatClassLabel(sub.classNum) : '학급'}
                        </span>
                        <span className="text-sm font-black">
                          {sub.studentNum ? `${sub.studentNum}번` : sub.studentId?.slice(-2) || '00'}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-base text-slate-900 dark:text-slate-50">
                            {sub.studentName}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1">
                            <GraduationCap className="w-3 h-3 text-indigo-600" />
                            <span>{formatStudentDisplay(sub.grade, sub.classNum, sub.studentNum, sub.studentId)}</span>
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-bold">
                            ID: {sub.studentId}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          비교 국가: {sub.countryAName} vs {sub.countryBName} · 제출시각: {sub.submittedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">점수</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{finalScore} / 10점</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadStudentPdf(sub, 'confirmation')}
                        disabled={isExportingPdfId === sub.id}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="학생 작성 답안 PDF 다운로드"
                      >
                        {isExportingPdfId === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReview(sub)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        채점 및 피드백 수정
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmSubmission(sub)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="제출 답안 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Answers Full View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Q1 */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">
                            [문제 1] 자료 분석 및 피라미드 유형 분류 (5점)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sub.q1Answer?.length || 0}자
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {sub.q1Answer || '(작성 답안 없음)'}
                        </p>
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400">
                            [문제 2] 원인, 파급 효과 및 맞춤형 정책 (5점)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sub.q2Answer?.length || 0}자
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {sub.q2Answer || '(작성 답안 없음)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Integrity Warning status on card */}
                  {(sub.tabSwitchCount ?? 0) > 0 && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center justify-between text-rose-700 dark:text-rose-300">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-bold">이상 행위(화면 이탈 및 복사/붙여넣기) 총 {sub.tabSwitchCount}회 감지됨</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {(sub.tabSwitchLogs || []).map(l => l.message).slice(-1)[0]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* Real-time In-Progress Student Draft Modal */}
      {selectedActiveDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl p-6 sm:p-7 space-y-5 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Student Draft (실시간 작성 답안)
                  </span>
                  <span className="text-xs text-slate-400">
                    최근 입력: {formatRelativeTime(selectedActiveDraft.lastActiveAt)} ({selectedActiveDraft.lastActiveAt})
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                  <span>{selectedActiveDraft.studentName} 학생</span>
                  <span className="text-sm font-bold text-slate-500 font-mono">
                    ({selectedActiveDraft.studentId})
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {formatStudentDisplay(selectedActiveDraft.grade, selectedActiveDraft.classNum, selectedActiveDraft.studentNum, selectedActiveDraft.studentId)}
                  </span>
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  비교 탐구 국가: 선진국(A) {selectedActiveDraft.selectedCountryAName} vs 개발도상국(B) {selectedActiveDraft.selectedCountryBName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActiveDraft(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Synchronizing Notice Banner */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start space-x-2">
              <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <span className="font-bold">실시간 타이핑 동기화 중 (Live Telemetry)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  학생이 현재 기기에서 작성 중인 답안이 4~6초 주기로 자동 수신됩니다. 학생이 제출 버튼을 누르기 전이라도 선생님께서는 실시간으로 작성 분량과 내용을 확인하고 지도하실 수 있습니다.
                </p>
              </div>
            </div>

            {/* Integrity / Tab Switch Detection */}
            {(selectedActiveDraft.tabSwitchCount ?? 0) > 0 ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center justify-between text-rose-700 dark:text-rose-300">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-bold">
                    ⚠️ 시험 중 화면 이탈 또는 복사/붙여넣기 시도 총 {selectedActiveDraft.tabSwitchCount}회 감지됨
                  </span>
                </div>
                <span className="text-[11px] font-mono text-rose-600">감독 주의 대상</span>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>시험 유의사항을 준수하여 이탈 없이 원활하게 작성 중입니다.</span>
              </div>
            )}

            {/* Draft Answers Full Reading View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  실시간 작성 답안 전문
                </h4>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  총 {(selectedActiveDraft.totalLength ?? (selectedActiveDraft.q1Length + selectedActiveDraft.q2Length)).toLocaleString()}자 작성 완료
                </span>
              </div>

              {/* Q1 Draft */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    [문제 1] 자료 분석 및 인구 피라미드 유형 분류 (5점 배점)
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedActiveDraft.currentDraft?.q1Answer?.length || selectedActiveDraft.q1Length || 0}자
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedActiveDraft.currentDraft?.q1Answer || '', 'live-q1')}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                      title="답안 복사"
                    >
                      {copiedId === 'live-q1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium min-h-[90px]">
                  {selectedActiveDraft.currentDraft?.q1Answer || (
                    <span className="text-slate-400 italic">아직 [문제 1] 답안을 작성하지 않았습니다.</span>
                  )}
                </div>
              </div>

              {/* Q2 Draft */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책 (5점 배점)
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedActiveDraft.currentDraft?.q2Answer?.length || selectedActiveDraft.q2Length || 0}자
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedActiveDraft.currentDraft?.q2Answer || '', 'live-q2')}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                      title="답안 복사"
                    >
                      {copiedId === 'live-q2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium min-h-[90px]">
                  {selectedActiveDraft.currentDraft?.q2Answer || (
                    <span className="text-slate-400 italic">아직 [문제 2] 답안을 작성하지 않았습니다.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  if (onRefreshActiveStudents) {
                    await onRefreshActiveStudents();
                    const updated = activeStudents.find((s) => s.studentId === selectedActiveDraft.studentId);
                    if (updated) setSelectedActiveDraft(updated);
                    showToast('최신 작성 내용을 동기화했습니다.');
                  }
                }}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>답안 즉시 새로고침</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedActiveDraft(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Review & Full Answers Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl p-6 sm:p-7 space-y-5 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">
                    Student Submission Review
                  </span>
                  <span className="text-xs text-slate-400">제출시각: {selectedSubmission.submittedAt}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  학생 작성 답안 확인 및 채점: {selectedSubmission.studentName} ({selectedSubmission.studentId})
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  비교 탐구 국가: {selectedSubmission.countryAName} vs {selectedSubmission.countryBName} · 문서 검증 코드: {selectedSubmission.verificationCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cheating & Integrity Log Section */}
            {(selectedSubmission.tabSwitchCount ?? 0) > 0 ? (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>시험 중 이상 행위(화면 이탈 및 복사/붙여넣기) 감지 기록 (총 {selectedSubmission.tabSwitchCount}회)</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono max-h-28 overflow-y-auto pl-2">
                  {(selectedSubmission.tabSwitchLogs || []).map((log, idx) => (
                    <div key={`modal-log-${idx}`} className="flex justify-between border-b border-rose-100 dark:border-rose-900/40 pb-0.5">
                      <span>• {log.message}</span>
                      <span className="text-slate-400">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>시험 중 화면 이탈 및 복사/붙여넣기 없이 정상 응시 완료되었습니다.</span>
              </div>
            )}

            {/* Student Answers Full Reading View (Large & Comfortable) */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>학생 작성 답안 전문 (Student's Written Answers)</span>
                <span className="text-[11px] font-normal text-slate-400">
                  총 {(selectedSubmission.q1Answer.length + selectedSubmission.q2Answer.length).toLocaleString()}자
                </span>
              </h4>

              {/* Q1 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    [문제 1] 자료 분석 및 인구 피라미드 유형 분류 (5점 배점)
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">{selectedSubmission.q1Answer.length}자</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedSubmission.q1Answer, 'q1')}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                      title="답안 복사"
                    >
                      {copiedId === 'q1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                  {selectedSubmission.q1Answer || '(작성 답안 없음)'}
                </p>
              </div>

              {/* Q2 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책 (5점 배점)
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">{selectedSubmission.q2Answer.length}자</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedSubmission.q2Answer, 'q2')}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                      title="답안 복사"
                    >
                      {copiedId === 'q2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                  {selectedSubmission.q2Answer || '(작성 답안 없음)'}
                </p>
              </div>
            </div>

            {/* Score Override & Note Editor for Teacher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  교사 최종 부여 점수 (10점 만점)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xl font-black text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * AI 참고 채점 점수: {selectedSubmission.evaluationResult?.totalScore ?? '-'}점 (학생에게는 미공개됨)
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  교사 개별 지도 피드백 코멘트
                </label>
                <textarea
                  rows={3}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="생활기록부 교과 세특 및 개별 피드백용 의견을 입력하세요..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadStudentPdf(selectedSubmission, 'confirmation')}
                  disabled={isExportingPdfId === selectedSubmission.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  title="학생이 제출한 답안 전문 PDF 다운로드"
                >
                  {isExportingPdfId === selectedSubmission.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>📄 답안 PDF 저장</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadStudentPdf(selectedSubmission, 'certificate')}
                  disabled={isExportingPdfId === selectedSubmission.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  title="공식 성적확인서 PDF 다운로드"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🎓 성적확인서 PDF 저장</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmSubmission(selectedSubmission)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                  title="이 학생의 제출 답안 및 채점 기록 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>제출 기록 삭제</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  채점 결과 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (100% iframe-safe, no window.confirm) */}
      {deleteConfirmSubmission && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  학생 제출 답안 삭제
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  선택한 제출 기록을 삭제하시겠습니까?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">학생 성명:</span>
                <span className="font-black text-slate-900 dark:text-slate-100">{deleteConfirmSubmission.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">학번 / 반:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{deleteConfirmSubmission.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">비교 탐구 대상국:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {deleteConfirmSubmission.countryAName} vs {deleteConfirmSubmission.countryBName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">제출 시각:</span>
                <span className="text-slate-600 dark:text-slate-300">{deleteConfirmSubmission.submittedAt}</span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
              ⚠️ <strong>주의:</strong> 삭제 즉시 교사 대시보드와 서버 데이터베이스에서 영구적으로 삭제되며, 해당 학생은 새로운 답안을 다시 작성하여 제출할 수 있게 됩니다.
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = deleteConfirmSubmission.id;
                  const name = deleteConfirmSubmission.studentName;
                  onDeleteSubmission(idToDelete);
                  if (selectedSubmission?.id === idToDelete) {
                    setSelectedSubmission(null);
                  }
                  setDeleteConfirmSubmission(null);
                  showToast(`${name} 학생의 제출 기록이 정상적으로 삭제되었습니다.`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                네, 영구 삭제합니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
