import React, { useState } from 'react';
import {
  FileCheck2,
  HelpCircle,
  Eye,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  FileSignature,
  Send,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { CountryData, AssessmentFormState, AiEvaluationResponse } from '../types';
import { CLASS_OPTIONS, formatClassLabel, formatStudentId, parseStudentId } from '../utils/studentInfo';

interface AssessmentWorksheetProps {
  countries: CountryData[];
  selectedCountryA: CountryData;
  setSelectedCountryA: (c: CountryData) => void;
  selectedCountryB: CountryData;
  setSelectedCountryB: (c: CountryData) => void;
  formState: AssessmentFormState;
  setFormState: React.Dispatch<React.SetStateAction<AssessmentFormState>>;
  isEvaluating: boolean;
  onEvaluate: () => void;
  evaluationResult: AiEvaluationResponse | null;
  onViewEvaluationModal: () => void;
  hasSubmitted?: boolean;
  onViewSubmittedConfirmation?: () => void;
  onSaveDraft: () => void;
  lastSavedAt: string | null;
  tabSwitchCount?: number;
}

export const AssessmentWorksheet: React.FC<AssessmentWorksheetProps> = ({
  countries,
  selectedCountryA,
  setSelectedCountryA,
  selectedCountryB,
  setSelectedCountryB,
  formState,
  setFormState,
  isEvaluating,
  onEvaluate,
  evaluationResult,
  onViewEvaluationModal,
  hasSubmitted = false,
  onViewSubmittedConfirmation,
  onSaveDraft,
  lastSavedAt,
  tabSwitchCount = 0,
}) => {
  const [showHintQ1, setShowHintQ1] = useState<boolean>(false);
  const [showHintQ2, setShowHintQ2] = useState<boolean>(false);
  const [showDataDrawer, setShowDataDrawer] = useState<boolean>(true);
  const [activeQuestion, setActiveQuestion] = useState<1 | 2>(1);

  const dataA = selectedCountryA.historicalData[2024];
  const dataB = selectedCountryB.historicalData[2024];

  const handleInputChange = (field: keyof AssessmentFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Derive current class and student number
  const parsedId = parseStudentId(formState.studentId);
  const currentGrade = formState.grade || parsedId?.grade || 1;
  const currentClass = formState.classNum ?? (parsedId?.classNum !== undefined ? parsedId.classNum : '');
  const currentNum = formState.studentNum ?? (parsedId?.studentNum !== undefined ? parsedId.studentNum : '');

  const handleClassSelect = (classVal: string) => {
    let classNum: number | string | undefined;
    if (!classVal) {
      classNum = undefined;
    } else if (classVal === '예비' || classVal === '예비반') {
      classNum = '예비';
    } else {
      classNum = parseInt(classVal, 10);
    }
    const studentNum = currentNum !== '' ? Number(currentNum) : undefined;
    const formatted = classNum && studentNum ? formatStudentId(currentGrade, classNum, studentNum) : formState.studentId;
    setFormState((prev) => ({
      ...prev,
      grade: currentGrade,
      classNum,
      studentId: formatted,
    }));
  };

  const handleNumChange = (numStr: string) => {
    const cleanNum = numStr.replace(/[^0-9]/g, '').slice(0, 2);
    const studentNum = cleanNum ? parseInt(cleanNum, 10) : undefined;
    const classNum = currentClass !== '' ? currentClass : undefined;
    const formatted = classNum && studentNum ? formatStudentId(currentGrade, classNum, studentNum) : formState.studentId;
    setFormState((prev) => ({
      ...prev,
      grade: currentGrade,
      studentNum,
      studentId: formatted,
    }));
  };

  // Progress Checklist criteria (Self-check guidance for high scores - does NOT block submission)
  const q1HasStats =
    formState.q1Answer.includes('%') ||
    formState.q1Answer.includes('명') ||
    formState.q1Answer.includes('‰') ||
    /\d/.test(formState.q1Answer);
  const q1HasPyramidType =
    formState.q1Answer.includes('형') ||
    formState.q1Answer.includes('피라미드') ||
    formState.q1Answer.includes('종') ||
    formState.q1Answer.includes('방추');

  const q2HasCauses =
    formState.q2Answer.includes('원인') ||
    formState.q2Answer.includes('이유') ||
    formState.q2Answer.includes('부담') ||
    formState.q2Answer.includes('출산') ||
    formState.q2Answer.length >= 40;
  const q2HasPolicyAndEffects =
    (formState.q2Answer.includes('정책') ||
      formState.q2Answer.includes('대안') ||
      formState.q2Answer.includes('지원') ||
      formState.q2Answer.includes('제도')) &&
    (formState.q2Answer.includes('파급') ||
      formState.q2Answer.includes('영향') ||
      formState.q2Answer.includes('효과') ||
      formState.q2Answer.includes('감소') ||
      formState.q2Answer.includes('부양'));

  // Students can submit anytime as long as student name is provided, regardless of checklist checks
  const isReadyToSubmit =
    formState.studentName.trim().length > 0 &&
    (formState.q1Answer.trim().length > 0 || formState.q2Answer.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Student Info, Status, Auto-save (Geometric Balance Archetype) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Real Student Assessment Mode: 10pts
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                통합사회 II 4단원 수행평가 실기
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mt-1.5 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
              인구 구조 비교 분석 및 지속가능 미래 정책 제안서
            </h2>
          </div>

          {/* Auto-save & Integrity Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            {tabSwitchCount > 0 ? (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>유의사항 위반 {tabSwitchCount}회 감지됨 (이탈·복사/붙여넣기)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>정상 응시 중 (이탈 및 복사 감지 없음)</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lastSavedAt ? `자동 저장됨 (${lastSavedAt})` : '실시간 자동 저장 활성'}</span>
            </div>

            {hasSubmitted && onViewSubmittedConfirmation && (
              <button
                type="button"
                id="btn-view-submitted-top"
                onClick={onViewSubmittedConfirmation}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>내가 제출한 답안 확인하기</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Identification & Target Country Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              학생 성명 (Name) *
            </label>
            <input
              type="text"
              id="student-name-input"
              value={formState.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              placeholder="예: 김민준"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>반(선택) / 번호(직접입력) *</span>
              <span className="text-[10px] text-indigo-500 font-semibold lowercase">
                {currentClass && currentNum ? `1-${formatClassLabel(currentClass)}-${currentNum}` : '반 선택+번호'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  id="worksheet-class-select"
                  value={currentClass}
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-400/80 dark:border-indigo-600 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">반 선택</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={`ws-class-${c}`} value={c}>
                      {formatClassLabel(c)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>

              <input
                type="number"
                id="worksheet-num-input"
                min={1}
                max={60}
                value={currentNum}
                onChange={(e) => handleNumChange(e.target.value)}
                placeholder="번호 (예: 12)"
                className="w-full px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-400/80 dark:border-indigo-600 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {currentClass && currentNum ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ✓ 1학년 {formatClassLabel(currentClass)} {currentNum}번 (학번: {formState.studentId})
                </span>
              ) : (
                '* 반을 선택하고 본인 출석 번호를 직접 입력하세요.'
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                비교 대상 국가 1 (선진국) *
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                🏛️ 선진국 6개국
              </span>
            </div>
            <select
              id="assessment-country-a"
              value={selectedCountryA.id}
              onChange={(e) => {
                const found = countries.filter((c) => c.developmentGroup === 'developed').find((c) => c.id === e.target.value);
                if (found) {
                  setSelectedCountryA(found);
                  handleInputChange('selectedCountryAId', found.id);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {countries.filter((c) => c.developmentGroup === 'developed').map((c) => (
                <option key={`ass-a-${c.id}`} value={c.id}>
                  {c.flag} {c.name} ({c.typeCategory})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                비교 대상 국가 2 (개발도상국) *
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                🌱 개발도상국 6개국
              </span>
            </div>
            <select
              id="assessment-country-b"
              value={selectedCountryB.id}
              onChange={(e) => {
                const found = countries.filter((c) => c.developmentGroup === 'developing').find((c) => c.id === e.target.value);
                if (found) {
                  setSelectedCountryB(found);
                  handleInputChange('selectedCountryBId', found.id);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {countries.filter((c) => c.developmentGroup === 'developing').map((c) => (
                <option key={`ass-b-${c.id}`} value={c.id}>
                  {c.flag} {c.name} ({c.typeCategory})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Data Helper (View Only for Self-Constructed Writing) */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <button
              onClick={() => setShowDataDrawer(!showDataDrawer)}
              className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors uppercase tracking-wider"
            >
              <Eye className="w-4 h-4" />
              <span>
                선택 국가({selectedCountryA.name} vs {selectedCountryB.name}) 인구 통계 참고표 {showDataDrawer ? '접기' : '열기'}
              </span>
              {showDataDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              💡 아래 통계 수치를 읽고 본인의 문장으로 직접 근거를 기술하세요.
            </span>
          </div>

          {showDataDrawer && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country A Data */}
                <div className="border-l-4 border-indigo-600 pl-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {selectedCountryA.flag} {selectedCountryA.name} (2024년 통계 지표)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    • 인구 변천 단계: <strong className="text-indigo-600">{dataA.dtmStageName}</strong><br />
                    • 합계출산율(TFR): <strong className="text-slate-900 dark:text-slate-100">{dataA.tfr}명</strong> · 조출생률: {dataA.cbr}‰ · 조사망률: {dataA.cdr}‰<br />
                    • 연령구조: 유소년 <strong className="text-emerald-600">{dataA.youthRate}%</strong>, 청장년층 {dataA.workingRate}%, 노년층 <strong className="text-amber-600">{dataA.elderlyRate}%</strong><br />
                    • 총부양비: <strong className="text-indigo-600">{dataA.totalDependencyRatio}</strong> · 노령화지수: {dataA.agingIndex}
                  </p>
                </div>

                {/* Country B Data */}
                <div className="border-l-4 border-emerald-600 pl-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {selectedCountryB.flag} {selectedCountryB.name} (2024년 통계 지표)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    • 인구 변천 단계: <strong className="text-indigo-600">{dataB.dtmStageName}</strong><br />
                    • 합계출산율(TFR): <strong className="text-slate-900 dark:text-slate-100">{dataB.tfr}명</strong> · 조출생률: {dataB.cbr}‰ · 조사망률: {dataB.cdr}‰<br />
                    • 연령구조: 유소년 <strong className="text-emerald-600">{dataB.youthRate}%</strong>, 청장년층 {dataB.workingRate}%, 노년층 <strong className="text-amber-600">{dataB.elderlyRate}%</strong><br />
                    • 총부양비: <strong className="text-indigo-600">{dataB.totalDependencyRatio}</strong> · 노령화지수: {dataB.agingIndex}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* QUESTION 1 (5 Points) */}
      <section
        onFocus={() => setActiveQuestion(1)}
        className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
          activeQuestion === 1
            ? 'border-indigo-600 ring-1 ring-indigo-600/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              01
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              문제 1. 자료 분석 및 인구 피라미드 유형 분류
            </h3>
            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              배점: 5점
            </span>
          </div>

          <button
            onClick={() => setShowHintQ1(!showHintQ1)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHintQ1 ? '힌트 닫기' : '작성 힌트 & 채점 기준 (4가지)'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          선택한 두 국가(A: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCountryA.name}</span>, B: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCountryB.name}</span>)의 2024년 인구 피라미드 형태(피라미드형/종형/방추형 등)를 분류하고, 각 국가의 인구 통계 자료(출생률, 사망률, 유소년/청장년층/노년층 비율, 부양비, 합계출산율 등)를 <strong className="text-indigo-600 dark:text-indigo-400">2가지 이상</strong> 정확하게 인용하여 비교 분석하시오.
        </p>

        {showHintQ1 && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
              [문제 1 채점 기준 (4개 항목 / 총 배점 5점)]:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              <li>• A 국가의 인구 피라미드 유형을 정확하게 기술함.</li>
              <li>• B 국가의 인구 피라미드 유형을 정확하게 기술함.</li>
              <li>• A 국가의 통계 자료를 2가지 이상 정확하게 분석함.</li>
              <li>• B 국가의 통계 자료를 2가지 이상 정확하게 분석함.</li>
            </ul>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
              배점 기준: 4개 만족 시 5점, 3개 만족 시 4점, 2개 만족 시 3점, 1개 만족 시 2점, 미흡 시 1점
            </div>
          </div>
        )}

        <div>
          <textarea
            id="q1-answer-input"
            rows={6}
            value={formState.q1Answer}
            onChange={(e) => handleInputChange('q1Answer', e.target.value)}
            placeholder="A 국가와 B 국가의 인구 피라미드 형태 유형을 각각 제시하고, 두 국가의 통계 자료(출산율, 청장년층 및 노년층 비율, 부양비 등)를 2가지 이상 인용하여 구체적으로 비교 서술하시오..."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
          ></textarea>

          <div className="flex flex-wrap justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 px-1 gap-2">
            <div className="flex items-center space-x-3">
              <span className={`flex items-center space-x-1 ${q1HasPyramidType ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>A·B 피라미드 유형 기술 (자율 점검)</span>
              </span>
              <span className={`flex items-center space-x-1 ${q1HasStats ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>A·B 통계자료 2가지 이상 인용 (자율 점검)</span>
              </span>
            </div>
            <span className="font-mono">{formState.q1Answer.length}자</span>
          </div>
        </div>
      </section>

      {/* QUESTION 2 (5 Points) */}
      <section
        onFocus={() => setActiveQuestion(2)}
        className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs space-y-3 transition-all ${
          activeQuestion === 2
            ? 'border-indigo-600 ring-1 ring-indigo-600/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              02
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              문제 2. 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책
            </h3>
            <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
              배점: 5점
            </span>
          </div>

          <button
            onClick={() => setShowHintQ2(!showHintQ2)}
            className="flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHintQ2 ? '힌트 닫기' : '작성 힌트 & 채점 기준 (4가지)'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          두 국가(A: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCountryA.name}</span>, B: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedCountryB.name}</span>)의 인구 문제(초저출산·초고령화 vs 급격한 인구 증가)의 원인을 밝히고, 미래 사회에 미칠 파급 효과(노동력, 경제 성장, 복지 재정 등)와 이를 해결하기 위한 맞춤형 정책(제도적 및 사회·문화/기술적 대안)을 모두 구체적으로 서술하시오.
        </p>

        {showHintQ2 && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
              [문제 2 채점 기준 (4개 항목 / 총 배점 5점)]:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
              <li>• A 국가의 인구 문제 원인을 정확하게 기술함.</li>
              <li>• B 국가의 인구 문제 원인을 정확하게 기술함.</li>
              <li>• A 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.</li>
              <li>• B 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.</li>
            </ul>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
              배점 기준: 4개 만족 시 5점, 3개 만족 시 4점, 2개 만족 시 3점, 1개 만족 시 2점, 미흡 시 1점
            </div>
          </div>
        )}

        <div>
          <textarea
            id="q2-answer-input"
            rows={8}
            value={formState.q2Answer}
            onChange={(e) => handleInputChange('q2Answer', e.target.value)}
            placeholder="A 국가와 B 국가 각각에 대해 1) 인구 문제의 원인, 2) 미래 사회 파급 효과, 3) 이를 해결하기 위한 맞춤형 정책(제도적/문화적/기술적)을 모두 명확하게 서술하시오..."
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
          ></textarea>

          <div className="flex flex-wrap justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 px-1 gap-2">
            <div className="flex items-center space-x-3">
              <span className={`flex items-center space-x-1 ${q2HasCauses ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>A·B 인구 문제 원인 서술 (자율 점검)</span>
              </span>
              <span className={`flex items-center space-x-1 ${q2HasPolicyAndEffects ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>파급효과 및 맞춤형 정책 모두 서술 (자율 점검)</span>
              </span>
            </div>
            <span className="font-mono">{formState.q2Answer.length}자</span>
          </div>
        </div>
      </section>

      {/* Submission Action Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
            {hasSubmitted ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>수행평가 답안 제출 완료 (교사 확인 대기)</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>수행평가 최종 답안 제출</span>
              </>
            )}
          </p>
          <p className="mt-0.5">
            {hasSubmitted
              ? '* 작성하신 답안이 담당 선생님께 정상적으로 제출되었습니다. 언제든 아래 [내가 제출한 답안 확인] 버튼을 눌러 확인 및 PDF 저장이 가능합니다.'
              : '* 작성하신 답안을 담당 선생님께 최종 제출합니다. 제출 즉시 본인이 작성한 답안을 바로 확인하고 보관할 수 있습니다. (자동 채점 결과는 비공개입니다.)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {hasSubmitted && onViewSubmittedConfirmation && (
            <button
              type="button"
              id="btn-view-submitted-work"
              onClick={onViewSubmittedConfirmation}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>내가 제출한 답안 확인하기</span>
            </button>
          )}

          <button
            id="btn-evaluate-assessment"
            onClick={onEvaluate}
            disabled={isEvaluating || !isReadyToSubmit}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all ${
              isEvaluating || !isReadyToSubmit
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : hasSubmitted
                ? 'bg-slate-700 hover:bg-slate-800 text-white cursor-pointer'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 cursor-pointer'
            }`}
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>답안 제출 중...</span>
              </>
            ) : hasSubmitted ? (
              <>
                <Send className="w-4 h-4 text-emerald-300" />
                <span>답안 수정 후 다시 제출</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                <span>수행평가 최종 답안 제출하기</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
