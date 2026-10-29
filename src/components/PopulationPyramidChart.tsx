import React from 'react';
import { DemographicSnapshot } from '../types';

interface PopulationPyramidChartProps {
  data: DemographicSnapshot;
  countryName: string;
  flag: string;
  maxPercentageScale?: number;
}

export const PopulationPyramidChart: React.FC<PopulationPyramidChartProps> = ({
  data,
  countryName,
  flag,
  maxPercentageScale = 12,
}) => {
  const cohorts = data.cohorts;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block"></span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl">{flag}</span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {countryName} 인구 피라미드 ({data.year}년)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                유형: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data.pyramidType}</span> · <span className="text-slate-600 dark:text-slate-300">{data.dtmStageName}</span> ({data.year}년 통계)
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">남성 (Male)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">여성 (Female)</span>
            </div>
          </div>
        </div>

        {/* Axis scale markers */}
        <div className="grid grid-cols-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1.5 border-b border-slate-100 dark:border-slate-800 mb-2">
          <div className="col-span-5 flex justify-between pr-2 font-mono">
            <span>{maxPercentageScale}%</span>
            <span>{(maxPercentageScale / 2).toFixed(0)}%</span>
            <span>0%</span>
          </div>
          <div className="col-span-2 text-center text-slate-600 dark:text-slate-300">
            연령대
          </div>
          <div className="col-span-5 flex justify-between pl-2 font-mono">
            <span>0%</span>
            <span>{(maxPercentageScale / 2).toFixed(0)}%</span>
            <span>{maxPercentageScale}%</span>
          </div>
        </div>

        {/* Pyramid Bars */}
        <div className="space-y-1">
          {cohorts.map((cohort, idx) => {
            const maleWidth = Math.min((cohort.malePct / maxPercentageScale) * 100, 100);
            const femaleWidth = Math.min((cohort.femalePct / maxPercentageScale) * 100, 100);

            return (
              <div
                key={cohort.ageGroup}
                className="grid grid-cols-12 items-center text-xs group hover:bg-slate-50 dark:hover:bg-slate-800/60 py-0.5 rounded px-1 transition-colors"
              >
                {/* Male Bar */}
                <div className="col-span-5 flex items-center justify-end pr-2 space-x-1.5">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {cohort.malePct.toFixed(1)}%
                  </span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-xs overflow-hidden flex justify-end">
                    <div
                      style={{ width: `${maleWidth}%` }}
                      className={`h-full transition-all duration-500 rounded-l-xs ${
                        idx <= 3 ? 'bg-amber-600' : idx <= 13 ? 'bg-sky-600' : 'bg-emerald-600'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Age Group */}
                <div className="col-span-2 text-center">
                  <span
                    className={`inline-block w-full py-0.5 rounded text-[11px] font-semibold tracking-tight ${
                      idx === 3 || idx === 13
                        ? 'border-b-2 border-dashed border-indigo-400 font-bold'
                        : ''
                    } text-slate-700 dark:text-slate-300`}
                  >
                    {cohort.ageGroup}
                  </span>
                </div>

                {/* Female Bar */}
                <div className="col-span-5 flex items-center justify-start pl-2 space-x-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-xs overflow-hidden flex justify-start">
                    <div
                      style={{ width: `${femaleWidth}%` }}
                      className={`h-full transition-all duration-500 rounded-r-xs ${
                        idx <= 3 ? 'bg-orange-500' : idx <= 13 ? 'bg-rose-500' : 'bg-teal-500'
                      }`}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {cohort.femalePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Age Structure Summary 3-Column Box */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
            유소년 (0~14세)
          </div>
          <div className="text-base font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
            {data.youthRate}%
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
          <div className="text-[10px] text-sky-700 dark:text-sky-300 font-bold uppercase tracking-wider">
            청장년층 (15~64세)
          </div>
          <div className="text-base font-black text-sky-800 dark:text-sky-200 mt-0.5">
            {data.workingRate}%
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
            노년층 (65세+)
          </div>
          <div className="text-base font-black text-amber-800 dark:text-amber-200 mt-0.5">
            {data.elderlyRate}%
          </div>
        </div>
      </div>
    </div>
  );
};
