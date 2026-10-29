import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RUBRIC_CRITERIA, TOTAL_RUBRIC_SUMMARY, SAMPLE_MODEL_ANSWERS } from '../data/rubricData';

interface RubricViewProps {
  onLoadSampleAnswers?: () => void;
  onGoToAssessment: () => void;
}

export const RubricView: React.FC<RubricViewProps> = ({
  onGoToAssessment,
}) => {
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* Header (Geometric Balance Archetype) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                평가 기준 (Rubric)
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                통합사회 II 수행평가
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mt-1.5 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
              수행평가 공식 평가 기준표 (Rubric)
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onGoToAssessment}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
            >
              수행평가 작성하기
            </button>
          </div>
        </div>

        {/* Total Score Level 4-Card Grid (Geometric Balance Archetype) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {TOTAL_RUBRIC_SUMMARY.levels.map((lvl, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${
                idx === 0
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : idx === 1
                  ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800'
                  : idx === 2
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                  : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span
                  className={`text-sm ${
                    idx === 0
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : idx === 1
                      ? 'text-sky-800 dark:text-sky-300'
                      : idx === 2
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {lvl.grade}
                </span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                  {lvl.scoreRange}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{lvl.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid: Left 3 Criteria / Right Summary Stats (Geometric Balance Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Itemized Rubric Breakdown */}
        <section className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
              문항별 세부 평가 요소 및 배점 (총 10점)
            </h3>

            <div className="space-y-5">
              {RUBRIC_CRITERIA.map((crit) => (
                <div
                  key={crit.id}
                  className="border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        {crit.title}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        {crit.subTitle}
                      </span>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      배점: {crit.maxScore}점
                    </span>
                  </div>

                  {/* 4 Core Criteria Checklist for this question */}
                  <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>핵심 세부 채점 기준 (4개 항목):</span>
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      {crit.id === 1 ? (
                        <>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>A 국가의 인구 피라미드 유형을 정확하게 기술함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>B 국가의 인구 피라미드 유형을 정확하게 기술함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>A 국가의 통계 자료를 2가지 이상 정확하게 분석함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>B 국가의 통계 자료를 2가지 이상 정확하게 분석함.</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>A 국가의 인구 문제 원인을 정확하게 기술함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>B 국가의 인구 문제 원인을 정확하게 기술함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>A 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span>B 국가의 미래 사회 파급 효과 및 맞춤형 정책 모두 정확하게 기술함.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Level Scoring Table */}
                  <div className="space-y-1.5 bg-slate-100/70 dark:bg-slate-800/80 p-3 rounded-lg text-xs">
                    {crit.levels.map((lvl, lIdx) => (
                      <div key={lIdx} className="flex items-start justify-between gap-2">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 shrink-0 w-24">
                          [{lvl.scoreRange}]:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed flex-1">
                          {lvl.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Key Metric Indicators & Teacher's Tip */}
        <section className="lg:col-span-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center shadow-xs">
              <span className="block text-2xl font-black text-indigo-600">10점</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">
                총 만점 (5점 + 5점)
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center shadow-xs">
              <span className="block text-2xl font-black text-emerald-600">2문항</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">
                서술형 탐구 과제
              </span>
            </div>
          </div>

          {/* Teacher's Tip Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-4 bg-indigo-500 rounded-full inline-block"></span>
              Teacher's Rubric Guide
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed mb-3">
              "문제 1은 두 국가의 인구 피라미드 유형과 2가지 이상의 통계 근거를 명확히 제시해야 하며, 문제 2는 각 국가의 인구 문제 원인과 함께 미래 파급 효과 및 맞춤형 정책을 모두 기술해야 만점(5점)을 획득합니다."
            </p>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-semibold">
              💡 위 4대 세부 기준을 하나씩 체크하며 답안을 작성하세요.
            </div>
          </div>
        </section>
      </div>

      {/* Model Exemplary Answers Accordion */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                수행평가 모범 예시 답안 ({SAMPLE_MODEL_ANSWERS.pair})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                * 학생 선택 대상 외 국가({SAMPLE_MODEL_ANSWERS.pair})를 활용한 교과 성취기준 충족 예시 (총 2문항, 10점 만점)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModelAnswer(!showModelAnswer)}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            {showModelAnswer ? '접기' : '펼치기'}
          </button>
        </div>

        {showModelAnswer && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-2 text-sm">
                [문제 1] 자료 분석 및 인구 피라미드 유형 분류 (5점)
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {SAMPLE_MODEL_ANSWERS.q1}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-2 text-sm">
                [문제 2] 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책 (5점)
              </span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                {SAMPLE_MODEL_ANSWERS.q2}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
