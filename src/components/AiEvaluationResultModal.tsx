import React, { useEffect } from 'react';
import {
  X,
  Award,
  Sparkles,
  Printer,
  BookmarkCheck,
  Download,
} from 'lucide-react';
import { AiEvaluationResponse } from '../types';
import confetti from 'canvas-confetti';

interface AiEvaluationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AiEvaluationResponse | null;
  studentName: string;
  countryAName: string;
  countryBName: string;
  onOpenPrint: () => void;
}

export const AiEvaluationResultModal: React.FC<AiEvaluationResultModalProps> = ({
  isOpen,
  onClose,
  result,
  studentName,
  countryAName,
  countryBName,
  onOpenPrint,
}) => {
  useEffect(() => {
    if (isOpen && result && result.totalScore >= 8) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // silent
      }
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const getScoreColor = (score: number, max: number) => {
    const pct = score / max;
    if (pct >= 0.85) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    if (pct >= 0.65) return 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800';
    return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Header - Indigo 900 Geometric Header */}
        <div className="bg-indigo-900 text-white p-6 relative border-b-2 border-indigo-500">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-300 mb-1">
            <span className="w-2 h-4 bg-indigo-400 rounded-full inline-block"></span>
            <span>Performance Assessment Grade Report</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            {studentName ? `${studentName} 학생` : '학생'}의 수행평가 10점 루브릭 채점표
          </h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            비교 탐구: {countryAName} vs {countryBName}
          </p>

          {/* Total Score & Grade Stat Badge */}
          <div className="mt-4 flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/20">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-xl font-black text-2xl sm:text-3xl shadow-xs">
              {result.totalScore} <span className="text-sm font-bold text-slate-800">/ 10점</span>
            </div>
            <div>
              <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">루브릭 종합 등급</div>
              <div className="text-base sm:text-lg font-bold text-white flex items-center space-x-1.5 mt-0.5">
                <Award className="w-5 h-5 text-amber-300" />
                <span>{result.gradeLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Question Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              문항별 세부 채점 결과 및 교사 피드백
            </h3>

            {/* Q1 Result */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  [문제 1] 자료 분석 및 인구 피라미드 유형 분류 (5점 배점)
                </span>
                <span className={`px-2.5 py-0.5 rounded-md font-extrabold border ${getScoreColor(result.q1Score, result.q1Max)}`}>
                  {result.q1Score} / {result.q1Max}점
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {result.q1Feedback}
              </p>

              {/* Q1 Criteria Met Pills */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  채점 기준 충족 현황 (4개 항목):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q1CriteriaMet?.[0] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q1CriteriaMet?.[0] !== false ? '✓' : '•'}</span>
                    <span>A 국가 인구 피라미드 유형 기술</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q1CriteriaMet?.[1] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q1CriteriaMet?.[1] !== false ? '✓' : '•'}</span>
                    <span>B 국가 인구 피라미드 유형 기술</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q1CriteriaMet?.[2] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q1CriteriaMet?.[2] !== false ? '✓' : '•'}</span>
                    <span>A 국가 통계 2가지 이상 분석</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q1CriteriaMet?.[3] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q1CriteriaMet?.[3] !== false ? '✓' : '•'}</span>
                    <span>B 국가 통계 2가지 이상 분석</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Q2 Result */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책 (5점 배점)
                </span>
                <span className={`px-2.5 py-0.5 rounded-md font-extrabold border ${getScoreColor(result.q2Score, result.q2Max)}`}>
                  {result.q2Score} / {result.q2Max}점
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {result.q2Feedback}
              </p>

              {/* Q2 Criteria Met Pills */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  채점 기준 충족 현황 (4개 항목):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q2CriteriaMet?.[0] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q2CriteriaMet?.[0] !== false ? '✓' : '•'}</span>
                    <span>A 국가 인구 문제 원인 기술</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q2CriteriaMet?.[1] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q2CriteriaMet?.[1] !== false ? '✓' : '•'}</span>
                    <span>B 국가 인구 문제 원인 기술</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q2CriteriaMet?.[2] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q2CriteriaMet?.[2] !== false ? '✓' : '•'}</span>
                    <span>A 국가 파급 효과 & 맞춤 정책 모두 기술</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md border flex items-center space-x-1.5 ${
                    result.q2CriteriaMet?.[3] !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
                  }`}>
                    <span>{result.q2CriteriaMet?.[3] !== false ? '✓' : '•'}</span>
                    <span>B 국가 파급 효과 & 맞춤 정책 모두 기술</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Commentary Box */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-indigo-900 dark:text-indigo-200">
              <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>종합 평가 총평</span>
            </div>
            <p className="text-indigo-950 dark:text-indigo-100 leading-relaxed font-medium">
              {result.overallComment}
            </p>

            {result.recommendedAction && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                <span className="font-bold block mb-0.5">권장 후속 학습:</span>
                <p>{result.recommendedAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenPrint();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>수행평가지 / 성적표 PDF 저장</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
