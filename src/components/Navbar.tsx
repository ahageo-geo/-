import React from 'react';
import {
  BarChart3,
  FileEdit,
  ClipboardCheck,
  Printer,
  Sparkles,
  RotateCcw,
  Users,
  ShieldCheck,
  GraduationCap,
  School,
  LogOut,
  Lock,
  Home,
  Download,
} from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  activeTab: 'explorer' | 'assessment' | 'rubric' | 'teacher';
  setActiveTab: (tab: 'explorer' | 'assessment' | 'rubric' | 'teacher') => void;
  onOpenPrint: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  hasSubmission: boolean;
  submissionCount: number;
  isExamLockEnabled: boolean;
  userSession: UserSession;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPrint,
  onLoadSample,
  onReset,
  hasSubmission,
  submissionCount,
  isExamLockEnabled,
  userSession,
  onLogout,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b-2 border-indigo-600 text-slate-900 dark:text-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Subject Info */}
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              id="btn-nav-home"
              onClick={onLogout}
              title="초기화면(로그인 포털)으로 이동"
              className="flex items-center space-x-3 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 bg-indigo-900 text-white rounded-xl flex items-center justify-center shadow-xs border border-indigo-700 shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                    Unit 04. 인구 문제와 미래 사회
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  세계 인구 탐구 수행 평가
                </h1>
              </div>
            </button>
          </div>

          {/* Navigation Tabs (Geometric Balance style) */}
          <nav id="nav-tabs" className="hidden lg:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="tab-btn-explorer"
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'explorer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-200/70'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>1. 통계·피라미드 탐구</span>
            </button>

            <button
              id="tab-btn-assessment"
              onClick={() => setActiveTab('assessment')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
                activeTab === 'assessment'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-200/70'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>2. 수행평가 작성</span>
              {hasSubmission && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="tab-btn-rubric"
              onClick={() => setActiveTab('rubric')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'rubric'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-200/70'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>3. 평가 기준</span>
            </button>

            <button
              id="tab-btn-teacher"
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-200/70'
              }`}
            >
              {userSession.role === 'teacher' ? (
                <Users className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>4. 교사 관리 대시보드</span>
              {submissionCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                  {submissionCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Session Profile Badge & Action Tools */}
          <div className="flex items-center space-x-2">
            {/* Direct Home / Initial Screen button */}
            <button
              type="button"
              id="btn-goto-home"
              onClick={onLogout}
              title="초기화면(로그인/역할선택)으로 돌아가기"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs transition-all shadow-xs"
            >
              <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">초기화면</span>
            </button>

            {/* User Session Chip */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold">
              {userSession.role === 'student' ? (
                <div className="flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-300">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="max-w-[120px] sm:max-w-none truncate">
                    {userSession.studentId} {userSession.studentName}
                  </span>
                  <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 bg-indigo-200/70 dark:bg-indigo-900/80 rounded font-black text-indigo-800 dark:text-indigo-200">
                    학생
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300">
                  <School className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-lg font-bold text-emerald-800 dark:text-emerald-200">
                    교사 관리자
                  </span>
                </div>
              )}

              <button
                type="button"
                id="btn-navbar-logout"
                onClick={onLogout}
                title="로그아웃 및 초기화면 이동"
                className="ml-2 pl-2 border-l border-slate-300 dark:border-slate-600 text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1 text-[11px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            </div>

            <button
              id="btn-print-worksheet"
              onClick={onOpenPrint}
              title="수행평가지 PDF 저장 및 인쇄"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
              <span className="hidden sm:inline">활동지 PDF 저장</span>
              <span className="sm:hidden">PDF 저장</span>
            </button>

            <button
              id="btn-reset-data"
              onClick={onReset}
              title="새로 작성 (초기화)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Tab bar */}
        <div className="flex lg:hidden py-2 border-t border-slate-200 dark:border-slate-800 space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
              activeTab === 'explorer' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            1. 통계 탐구
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
              activeTab === 'assessment' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            2. 수행평가 작성
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
              activeTab === 'rubric' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            3. 평가 기준
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
              activeTab === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            4. 교사 관리 ({submissionCount})
          </button>
        </div>
      </div>
    </header>
  );
};

