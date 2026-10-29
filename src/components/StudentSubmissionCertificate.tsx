import React, { useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Printer,
  Download,
  Calendar,
  User,
  School,
  FileCheck,
  ShieldCheck,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { StudentSubmission } from '../types';
import { exportCertificatePdf, printWorksheetHtml } from '../utils/pdfExport';
import { formatStudentDisplay } from '../utils/studentInfo';

interface StudentSubmissionCertificateProps {
  submission: StudentSubmission;
  onClose: () => void;
}

export const StudentSubmissionCertificate: React.FC<StudentSubmissionCertificateProps> = ({
  submission,
  onClose,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    const studentTag = submission.studentName
      ? `${submission.studentId || ''}_${submission.studentName}`
      : '학생';
    const fileName = `세계인구탐구_수행평가_성적확인서_${studentTag}_${submission.verificationCode}.pdf`;

    const success = await exportCertificatePdf(submission, fileName);
    setIsExporting(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    if (!certificateRef.current) {
      window.print();
      return;
    }
    const studentTag = submission.studentName
      ? `${submission.studentId || ''}_${submission.studentName}`
      : '학생';
    const docTitle = `세계인구탐구_수행평가_성적확인서_${studentTag}_${submission.verificationCode}`;
    printWorksheetHtml(docTitle, certificateRef.current.innerHTML);
  };

  const evalRes = submission.evaluationResult;
  const finalScore = submission.teacherOverriddenScore !== undefined
    ? submission.teacherOverriddenScore
    : evalRes.totalScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-indigo-900 text-white p-4 flex items-center justify-between print:hidden border-b border-indigo-700">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-sm">
              공식 수행평가 제출 확인서 & 성적표
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-download-pdf-cert"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer ${
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
                  <span>PDF 저장 (다운로드)</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              title="브라우저 인쇄 창 열기"
              className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-800 text-slate-300 hover:text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Content - Printable Layout */}
        <div ref={certificateRef} className="p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
          {/* Certificate Header */}
          <div className="text-center pb-5 border-b-2 border-indigo-900 dark:border-indigo-600">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1">
              고등학교 통합사회 II 수행평가
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              세계 인구 탐구 수행평가 확인서
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              발급일시: {submission.submittedAt} · 문서 고유 검증 코드:{' '}
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {submission.verificationCode}
              </span>
            </p>
          </div>

          {/* Student & Assessment Meta Info */}
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
                비교 탐구 국가
              </span>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {submission.countryAName} vs {submission.countryBName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                최종 취득 점수
              </span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                {finalScore} / 10점
              </span>
            </div>
          </div>

          {/* Integrity Note Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              시험 응시 무결성 검증:
            </span>
            {(submission.tabSwitchCount ?? 0) > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                ⚠️ 외부 창 이탈 및 복사/붙여넣기 {submission.tabSwitchCount}회 감지 및 기록됨
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ 이탈 및 복사 감지 없음 (정상 응시 확인)
              </span>
            )}
          </div>

          {/* Official 10-Point Rubric Evaluation Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-4 bg-indigo-500 rounded-full inline-block"></span>
              공식 10점 만점 루브릭 채점 세부 내역
            </h3>
            <table className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                <tr>
                  <th className="py-2 px-3 text-left border-b border-slate-200 dark:border-slate-700">평가 영역 및 문항</th>
                  <th className="py-2 px-3 text-center border-b border-slate-200 dark:border-slate-700 w-20">배점</th>
                  <th className="py-2 px-3 text-center border-b border-slate-200 dark:border-slate-700 w-20">취득점수</th>
                  <th className="py-2 px-3 text-left border-b border-slate-200 dark:border-slate-700">교사 피드백 및 평가 의견</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                    1. 자료 분석 및 인구 피라미드 유형 분류
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">3점</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {evalRes.q1Score}점
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {evalRes.q1Feedback}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                    2. 인구 문제 원인 규명 및 미래 사회 파급 효과
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">3점</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {evalRes.q2Score}점
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {evalRes.q2Feedback}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                    3. 지속가능한 미래 사회를 위한 맞춤형 정책 제안
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">4점</td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {evalRes.q3Score}점
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {evalRes.q3Feedback}
                  </td>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold">
                  <td className="py-2.5 px-3 text-right">총계</td>
                  <td className="py-2.5 px-3 text-center">10점</td>
                  <td className="py-2.5 px-3 text-center text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {finalScore}점
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                    등급: <span className="text-indigo-600 font-extrabold">{evalRes.gradeLevel}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student Written Answers Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-4 bg-indigo-500 rounded-full inline-block"></span>
              학생 작성 답안 기록
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                [문항 1 답안]:
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {submission.q1Answer}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                [문항 2 답안]:
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {submission.q2Answer}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                [문항 3 답안]:
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {submission.q3Answer}
              </p>
            </div>
          </div>

          {/* Teacher Commentary or Overridden Note */}
          {submission.teacherCustomNote && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                지도교사 추가 기재 코멘트:
              </span>
              <p className="text-amber-800 dark:text-amber-200">{submission.teacherCustomNote}</p>
            </div>
          )}

          {/* Verification & Signature Section */}
          <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>본 확인서는 인공지능 루브릭 엔진 및 담당 교과 교사에 의해 정식 검증되었습니다.</span>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block">제출자(학생) 서명</span>
                <span className="font-serif italic text-sm font-bold">{submission.studentName || '김민준'} (인)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">교과 담당교사 확인</span>
                <span className="font-serif italic text-sm font-bold">인구지리연구실 (인)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
