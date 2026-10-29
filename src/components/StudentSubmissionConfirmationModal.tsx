import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileCheck2,
  Printer,
  Download,
  Calendar,
  User,
  School,
  X,
  Loader2,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { StudentSubmission } from '../types';
import { exportSubmissionConfirmationPdf, printWorksheetHtml } from '../utils/pdfExport';
import { formatStudentDisplay } from '../utils/studentInfo';

interface StudentSubmissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: StudentSubmission | null;
}

export const StudentSubmissionConfirmationModal: React.FC<StudentSubmissionConfirmationModalProps> = ({
  isOpen,
  onClose,
  submission,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen || !submission) return null;

  const studentTag = submission.studentName
    ? `${submission.studentId || ''}_${submission.studentName}`
    : '학생';
  const docTitle = `수행평가_제출확인서_${studentTag}_${submission.verificationCode}`;

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    const fileName = `${docTitle}.pdf`;
    const success = await exportSubmissionConfirmationPdf(submission, fileName);
    setIsExporting(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 print:border-none print:shadow-none print:my-0 print:max-w-none">
        {/* Top Header Bar (Controls) */}
        <div className="bg-indigo-900 text-white p-4.5 flex items-center justify-between print:hidden border-b border-indigo-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-black text-sm block">
                수행평가 답안 제출 완료
              </span>
              <span className="text-[11px] text-indigo-200 font-medium">
                선생님께 정상 접수되었습니다 · 본인 작성 답안 확인
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-confirm-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-500'
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
                  <span>다운로드 완료!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>제출 답안 PDF 저장</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              title="A4 인쇄"
              className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation Notice Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/60 px-5 py-3.5 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="font-semibold leading-relaxed">
              제출이 성공적으로 완료되었습니다! 자동 채점 점수는 안내되지 않으며, 담당 선생님께서 작성하신 내용을 확인하고 정식 평가를 진행하십니다.
            </p>
          </div>
          <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full shrink-0">
            접수 완료
          </span>
        </div>

        {/* Printable Submission Content Body */}
        <div
          ref={documentRef}
          className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 dark:border-slate-700">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1">
              [고등학교 통합사회 II 수행평가]
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-50">
              세계 인구 탐구 수행평가 제출 확인서
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              제출일시: {submission.submittedAt} · 검증 코드:{' '}
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {submission.verificationCode}
              </span>
            </p>
          </div>

          {/* Student & Submission Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                학생 성명
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {submission.studentName || '미기입'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                소속 학급 / 학번
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {formatStudentDisplay(submission.grade, submission.classNum, submission.studentNum, submission.studentId)}
              </span>
              <span className="block text-[10px] font-mono text-slate-500">
                ID: {submission.studentId || '미기입'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                비교 탐구 대상국
              </span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {submission.countryAName} vs {submission.countryBName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                제출 상태
              </span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 inline" />
                <span>제출 완료 (교사 검토 대기)</span>
              </span>
            </div>
          </div>

          {/* Student Submitted Answers Section (Prominent and Clear) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-4 bg-indigo-600 rounded-full inline-block"></span>
                <span>학생이 작성하여 제출한 답안 전문</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                총 작성 분량: {(submission.q1Answer.length + submission.q2Answer.length + (submission.q3Answer ? submission.q3Answer.length : 0)).toLocaleString()}자
              </span>
            </div>

            {/* Q1 Answer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">
                  [문항 1] 자료 분석 및 인구 피라미드 유형 분류
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {submission.q1Answer.length}자
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                {submission.q1Answer}
              </p>
            </div>

            {/* Q2 Answer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-400">
                  [문항 2] 인구 문제 원인 규명 및 미래 사회 파급 효과·맞춤형 정책
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {submission.q2Answer.length}자
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                {submission.q2Answer}
              </p>
            </div>

            {/* Optional legacy Q3 Answer */}
            {submission.q3Answer && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    [문항 3] 지속가능한 미래 사회를 위한 맞춤형 정책 제안
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {submission.q3Answer.length}자
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                  {submission.q3Answer}
                </p>
              </div>
            )}
          </div>

          {/* Footer Receipt Note */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>본 확인서는 인구 문제와 미래 사회 수행평가 제출 사실을 증명합니다.</span>
            <div className="font-serif italic font-bold text-slate-700 dark:text-slate-300">
              제출자: {submission.studentName} (확인 완료)
            </div>
          </div>
        </div>

        {/* Modal Bottom Action */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            확인 완료 및 창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
