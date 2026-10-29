import React, { useState } from 'react';
import {
  GraduationCap,
  School,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserSession } from '../types';
import { CLASS_OPTIONS, formatClassLabel, formatStudentId, parseStudentId } from '../utils/studentInfo';

interface AuthPortalProps {
  onLogin: (session: UserSession) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin }) => {
  const [roleTab, setRoleTab] = useState<'student' | 'teacher'>('student');

  // Student form state: 반은 선택, 번호는 직접 입력
  const [studentGrade, setStudentGrade] = useState<number>(1);
  const [studentClass, setStudentClass] = useState<number | string | ''>('');
  const [studentNum, setStudentNum] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');

  // Teacher form state
  const [teacherKey, setTeacherKey] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  // Computed student ID (e.g., 10312, 1예비12)
  const computedStudentId =
    studentClass && studentNum
      ? formatStudentId(studentGrade, studentClass, Number(studentNum))
      : '';

  // Handle Student Login
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!studentClass) {
      setErrorMessage('소속 학급(반)을 선택해 주세요.');
      return;
    }

    const numInt = parseInt(studentNum, 10);
    if (!studentNum || isNaN(numInt) || numInt < 1 || numInt > 60) {
      setErrorMessage('출석 번호(1~60번)를 올바르게 직접 입력해 주세요.');
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('학생 성명을 입력해 주세요.');
      return;
    }
    if (!studentPassword.trim()) {
      setErrorMessage('비밀번호(4자리 권장)를 입력해 주세요.');
      return;
    }

    const finalStudentId = formatStudentId(studentGrade, studentClass, numInt);

    onLogin({
      isLoggedIn: true,
      role: 'student',
      studentId: finalStudentId,
      studentName: studentName.trim(),
      grade: studentGrade,
      classNum: studentClass,
      studentNum: numInt,
      loginTime: new Date().toLocaleTimeString('ko-KR'),
    });
  };

  // Handle Teacher Login
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!teacherKey.trim()) {
      setErrorMessage('교사용 인증 비밀번호를 입력해 주세요.');
      return;
    }

    // Teacher authentication: 비밀번호 0513
    const validKeys = ['0513'];
    if (!validKeys.includes(teacherKey.trim())) {
      setErrorMessage('교사 인증 비밀번호가 일치하지 않습니다.');
      return;
    }

    onLogin({
      isLoggedIn: true,
      role: 'teacher',
      teacherName: '교사 관리자',
      loginTime: new Date().toLocaleTimeString('ko-KR'),
    });
  };

  // Quick Demo Presets
  const handleQuickStudentLogin = (name: string, grade: number, classNum: number | string, num: number) => {
    setStudentGrade(grade);
    setStudentClass(classNum);
    setStudentNum(num.toString());
    setStudentName(name);
    setStudentPassword('1234');
    const id = formatStudentId(grade, classNum, num);
    onLogin({
      isLoggedIn: true,
      role: 'student',
      studentId: id,
      studentName: name,
      grade,
      classNum,
      studentNum: num,
      loginTime: new Date().toLocaleTimeString('ko-KR'),
    });
  };

  const handleQuickTeacherLogin = () => {
    onLogin({
      isLoggedIn: true,
      role: 'teacher',
      teacherName: '교사 관리자',
      loginTime: new Date().toLocaleTimeString('ko-KR'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 mb-3 shadow-lg shadow-indigo-950">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Unit 04. 인구 문제와 미래 사회
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            세계 인구 탐구 수행 평가
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            인구 통계 분석 및 정책 제안 10점 만점 수행평가
          </p>
        </div>

        {/* Login Card (Geometric Balance Style) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 backdrop-blur-md">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              id="tab-role-student"
              onClick={() => {
                setRoleTab('student');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                roleTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>학생 로그인</span>
            </button>

            <button
              type="button"
              id="tab-role-teacher"
              onClick={() => {
                setRoleTab('teacher');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                roleTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <School className="w-4 h-4" />
              <span>교사 로그인</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {roleTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {/* Class Selection & Number Input Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    소속 학급(반 선택) 및 번호(직접 입력) *
                  </label>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    고1 통합사회
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  {/* Grade display */}
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">학년</label>
                    <div className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                      1학년
                    </div>
                  </div>

                  {/* Class Selection (반은 학생들이 선택) */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      반 선택 *
                    </label>
                    <div className="relative">
                      <select
                        id="student-class-select"
                        value={studentClass}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setStudentClass('');
                          } else if (val === '예비' || val === '예비반') {
                            setStudentClass('예비');
                          } else {
                            setStudentClass(Number(val));
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/70 dark:border-indigo-500 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="">반 선택</option>
                        {CLASS_OPTIONS.map((c) => (
                          <option key={`class-opt-${c}`} value={c}>
                            {formatClassLabel(c)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                        <span className="text-xs">▼</span>
                      </div>
                    </div>
                  </div>

                  {/* Number Direct Input (번호는 직접 입력) */}
                  <div className="col-span-5">
                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      번호 직접 입력 *
                    </label>
                    <input
                      type="number"
                      id="student-num-input"
                      min={1}
                      max={60}
                      value={studentNum}
                      onChange={(e) => setStudentNum(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                      placeholder="예: 12"
                      className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/70 dark:border-indigo-500 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* Real-time Formatted Student ID preview badge */}
                {computedStudentId ? (
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
                    <span>
                      📌 생성 학번: <strong>1학년 {formatClassLabel(studentClass)} {studentNum}번</strong>
                    </span>
                    <span className="font-mono font-bold bg-indigo-200 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-[10px]">
                      ID: {computedStudentId}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    * 소속 반을 선택한 후 자신의 출석 번호를 직접 숫자로 입력하세요.
                  </p>
                )}
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>성명 (Student Name) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">본인 성명</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="student-login-name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="성명 입력 (예: 김민준)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Student Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>비밀번호 (Password / PIN) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">4자리 권장 (임의 설정)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="student-login-password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="비밀번호 (예: 1234)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-student-login-submit"
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>수행평가 실습실 입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Student Login Presets for Easy Evaluation & Testing */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>빠른 학생 체험 (반 선택 및 번호 자동 세팅):</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('김민준', 1, '예비', 12)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">1-예비-12</span>
                    <span className="truncate block font-extrabold">예비반 12번 김민준</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('박준서', 1, '예비', 5)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">1-예비-05</span>
                    <span className="truncate block font-extrabold">예비반 5번 박준서</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('최예비', 1, '예비', 1)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-left transition-colors cursor-pointer"
                  >
                    <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">1-예비-01</span>
                    <span className="truncate block font-extrabold">예비반 1번 최예비</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TEACHER LOGIN FORM */}
          {roleTab === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>교사 인증 비밀번호 (Admin PIN) *</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="teacher-login-key"
                    value={teacherKey}
                    onChange={(e) => setTeacherKey(e.target.value)}
                    placeholder="교사용 비밀번호를 입력하세요"
                    autoComplete="current-password"
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <div className="font-bold mb-0.5 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>교사 관리자 전용 보안 구역</span>
                </div>
                전체 학생 제출물 일괄 조회, 10점 루브릭 채점 점수 수정, NEIS 성적표 CSV 다운로드 및 모범답안 잠금 제어가 가능합니다. 교사 비밀번호는 철저히 비공개로 유지해 주세요.
              </div>

              <button
                type="submit"
                id="btn-teacher-login-submit"
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>교사 관리 대시보드 입장하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400 font-medium">
          <span>인구 데이터 탐구 · 10점 서술형 수행평가 · 교사 성적 관리 시스템</span>
        </div>
      </div>
    </div>
  );
};
