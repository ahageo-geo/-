import React, { useState, useRef } from 'react';
import { X, Printer, Download, Check, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { CountryData, AssessmentFormState, AiEvaluationResponse } from '../types';
import { SAMPLE_MODEL_ANSWERS } from '../data/rubricData';
import { exportWorksheetPdf, printWorksheetHtml } from '../utils/pdfExport';
import { StudentSubmission } from '../types';
import { formatStudentDisplay } from '../utils/studentInfo';

interface PrintWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountryA: CountryData;
  selectedCountryB: CountryData;
  formState: AssessmentFormState;
  evaluationResult: AiEvaluationResponse | null;
  submission?: StudentSubmission | null;
  isTeacher?: boolean;
}

export const PrintWorksheetModal: React.FC<PrintWorksheetModalProps> = ({
  isOpen,
  onClose,
  selectedCountryA,
  selectedCountryB,
  formState,
  evaluationResult,
  submission,
  isTeacher = false,
}) => {
  const [printMode, setPrintMode] = useState<'student-result' | 'blank' | 'teacher-rubric'>('student-result');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const documentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const resolvedName = formState.studentName || submission?.studentName || '';
  const resolvedId = formState.studentId || submission?.studentId || '';
  const studentTag = resolvedName ? `${resolvedId}_${resolvedName}` : '활동지';
  const docTitle = `세계인구탐구_수행평가_${studentTag}_${new Date().toISOString().slice(0, 10)}`;

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    const fileName = `${docTitle}.pdf`;
    const success = await exportWorksheetPdf({
      formState,
      countryA: selectedCountryA,
      countryB: selectedCountryB,
      evaluationResult,
      printMode,
      submission,
      isTeacher,
    }, fileName);
    setIsExporting(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current) {
      window.print();
      return;
    }
    printWorksheetHtml(docTitle, documentRef.current.innerHTML);
  };

  return (
    <div
      id="printable-modal-wrapper"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
    >
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 print:my-0 print:shadow-none print:max-w-none print:w-full border border-slate-200">
        {/* Modal Top Controls Bar (Hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs text-slate-300">출력 모드:</span>
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('student-result')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  printMode === 'student-result'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isTeacher ? '학생 작성 답안 + 성적표' : '학생 작성 답안 활동지'}
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('blank')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  printMode === 'blank'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                교실 배부용 빈 활동지
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('teacher-rubric')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  printMode === 'teacher-rubric'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                교사용 예시 답안 활동지
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Primary PDF Download Button */}
            <button
              type="button"
              id="btn-download-pdf-worksheet"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              } disabled:opacity-70`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF 생성 중...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>PDF 다운로드 완료!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF 파일 저장</span>
                </>
              )}
            </button>

            {/* Native High-Res Print / Print-to-PDF Button */}
            <button
              type="button"
              id="btn-print-worksheet-fallback"
              onClick={handlePrint}
              title="A4 규격 인쇄 창 열기 (PDF로 저장 가능)"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>A4 인쇄 / 인쇄 대화상자</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / PDF Export A4 Document Body */}
        <div
          ref={documentRef}
          id="printable-worksheet-content"
          className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white max-h-[80vh] print:max-h-none overflow-y-auto font-sans leading-relaxed"
        >
          {/* Header Title Box */}
          <div className="header-title border-b-2 border-slate-900 pb-4 text-center">
            <div className="sub-tag text-xs font-bold text-slate-600 tracking-wider mb-1">
              [고등학교 통합사회 II 수행평가]
            </div>
            <h1 className="main-title text-xl sm:text-2xl font-black text-slate-950">
              세계 인구 탐구 수행평가 활동지
            </h1>
            <div className="meta-desc text-xs text-slate-500 mt-1">
              단원: Ⅱ. 인구 문제와 미래 사회 / 영역: 인구 구조 분석 및 지속가능한 미래 설계
            </div>
          </div>

          {/* Student & Target Countries Info Table */}
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <tbody>
              <tr className="divide-x divide-slate-900 border-b border-slate-900">
                <th className="w-24 p-2 bg-slate-100 font-bold text-center border border-slate-900">
                  학급 / 학번
                </th>
                <td className="p-2 font-medium border border-slate-900">
                  {formatStudentDisplay(
                    formState.grade || submission?.grade,
                    formState.classNum ?? submission?.classNum,
                    formState.studentNum ?? submission?.studentNum,
                    formState.studentId || submission?.studentId
                  )}
                  {(formState.studentId || submission?.studentId) && (
                    <span className="text-slate-500 text-[10px] ml-1 font-mono">
                      ({formState.studentId || submission?.studentId})
                    </span>
                  )}
                </td>
                <th className="w-24 p-2 bg-slate-100 font-bold text-center border border-slate-900">
                  성명
                </th>
                <td className="p-2 font-medium border border-slate-900">
                  {formState.studentName || submission?.studentName || '_______________'}
                </td>
              </tr>
              <tr className="divide-x divide-slate-900">
                <th className="p-2 bg-slate-100 font-bold text-center border border-slate-900">
                  탐구 대상 국가
                </th>
                <td colSpan={3} className="p-2 font-semibold border border-slate-900">
                  [국가 1 (선진국): {selectedCountryA.flag} {selectedCountryA.name}] vs [국가 2 (개발도상국): {selectedCountryB.flag} {selectedCountryB.name}]
                </td>
              </tr>
            </tbody>
          </table>

          {/* Prompt 1 */}
          <div className="section-box space-y-2 pt-2">
            <div className="prompt-header flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="prompt-title font-bold text-sm text-slate-950">
                [문제 1] 자료 분석 및 인구 피라미드 유형 분류
              </h3>
              <span className="score-badge font-black text-xs px-2 py-0.5 bg-slate-200 rounded">
                배점: 5점
              </span>
            </div>
            <p className="prompt-desc text-xs text-slate-700 font-medium leading-relaxed">
              선택한 두 국가(A: {selectedCountryA.name}, B: {selectedCountryB.name})의 인구 피라미드 형태(피라미드형/종형/방추형 등)를 분류하고, 각 국가의 통계 자료(출생률, 사망률, 유소년/청장년층/노년층 비율, 부양비 등)를 2가지 이상 정확하게 분석하여 서술하시오.
            </p>
            <div
              className={`answer-box min-h-[130px] p-3 border border-slate-400 rounded-md bg-slate-50 text-xs leading-relaxed whitespace-pre-line ${
                printMode === 'blank' ? 'blank bg-white' : ''
              }`}
            >
              {printMode === 'blank'
                ? ''
                : printMode === 'teacher-rubric'
                ? SAMPLE_MODEL_ANSWERS.q1
                : formState.q1Answer || submission?.q1Answer || '(작성된 답안이 없습니다)'}
            </div>
          </div>

          {/* Prompt 2 */}
          <div className="section-box space-y-2 pt-2">
            <div className="prompt-header flex items-center justify-between border-b border-slate-300 pb-1">
              <h3 className="prompt-title font-bold text-sm text-slate-950">
                [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책
              </h3>
              <span className="score-badge font-black text-xs px-2 py-0.5 bg-slate-200 rounded">
                배점: 5점
              </span>
            </div>
            <p className="prompt-desc text-xs text-slate-700 font-medium leading-relaxed">
              두 국가가 직면한 인구 문제의 사회·경제적 원인을 정확하게 기술하고, 각 국가별 미래 사회 파급 효과(노동력, 경제 성장, 복지 재정 등)와 맞춤형 정책(제도적 및 사회·문화/기술적 대안)을 모두 정확하게 서술하시오.
            </p>
            <div
              className={`answer-box min-h-[160px] p-3 border border-slate-400 rounded-md bg-slate-50 text-xs leading-relaxed whitespace-pre-line ${
                printMode === 'blank' ? 'blank bg-white' : ''
              }`}
            >
              {printMode === 'blank'
                ? ''
                : printMode === 'teacher-rubric'
                ? SAMPLE_MODEL_ANSWERS.q2
                : formState.q2Answer || submission?.q2Answer || '(작성된 답안이 없습니다)'}
            </div>
          </div>

          {/* Teacher Grade Sheet Box (At bottom of paper) */}
          <div className="grade-sheet mt-6 pt-4 border-t-2 border-slate-900">
            <h4 className="grade-title font-bold text-xs text-slate-900 mb-2">
              [채점 기록표 / 평가 기준 루브릭 (문제당 4개 기준 만족도에 따라 1~5점 부여)]
            </h4>
            <table className="w-full border-collapse border border-slate-900 text-xs text-center">
              <thead>
                <tr className="divide-x divide-slate-900 border-b border-slate-900">
                  <th className="p-2 bg-slate-100 font-bold border border-slate-900">문항 1: 자료 분석 및 피라미드 분류 (5점)</th>
                  <th className="p-2 bg-slate-100 font-bold border border-slate-900">문항 2: 원인·파급효과·맞춤형정책 (5점)</th>
                  <th className="p-2 bg-slate-100 font-bold border border-slate-900">총점 (10점 만점)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="divide-x divide-slate-900">
                  <td className="p-2.5 font-mono font-bold text-sm border border-slate-900">
                    {isTeacher && evaluationResult ? `${evaluationResult.q1Score} / 5` : '   / 5'}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-sm border border-slate-900">
                    {isTeacher && evaluationResult ? `${evaluationResult.q2Score} / 5` : '   / 5'}
                  </td>
                  <td className="p-2.5 font-mono font-black text-sm bg-slate-50 border border-slate-900">
                    {isTeacher && evaluationResult
                      ? `${evaluationResult.totalScore} / 10 (${evaluationResult.gradeLevel})`
                      : '   / 10'}
                  </td>
                </tr>
              </tbody>
            </table>

            {isTeacher && evaluationResult && (
              <div className="feedback-box mt-2 p-2.5 border border-slate-300 rounded text-xs text-slate-700 bg-slate-50">
                <span className="font-bold text-slate-900">교사 종합 피드백: </span>
                {evaluationResult.overallComment}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
