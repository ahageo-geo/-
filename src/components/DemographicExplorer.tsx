import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Calendar,
  Activity,
  HeartHandshake,
  Lightbulb,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { CountryData } from '../types';
import { PopulationPyramidChart } from './PopulationPyramidChart';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DemographicExplorerProps {
  countries: CountryData[];
  selectedCountryA: CountryData;
  setSelectedCountryA: (country: CountryData) => void;
  selectedCountryB: CountryData;
  setSelectedCountryB: (country: CountryData) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onGoToAssessment: () => void;
}

export const DemographicExplorer: React.FC<DemographicExplorerProps> = ({
  countries,
  selectedCountryA,
  setSelectedCountryA,
  selectedCountryB,
  setSelectedCountryB,
  selectedYear,
  setSelectedYear,
  onGoToAssessment,
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'tfr' | 'rates' | 'elderly' | 'dependency'>('tfr');
  const [showCaseStudy, setShowCaseStudy] = useState<boolean>(true);

  const dataA = selectedCountryA.historicalData[selectedYear] || selectedCountryA.historicalData[2024];
  const dataB = selectedCountryB.historicalData[selectedYear] || selectedCountryB.historicalData[2024];

  // Helper for Aging stage badge
  const getAgingBadge = (elderlyRate: number) => {
    if (elderlyRate >= 20) {
      return { text: '초고령사회 (20%+)', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' };
    } else if (elderlyRate >= 14) {
      return { text: '고령사회 (14~20%)', color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800' };
    } else if (elderlyRate >= 7) {
      return { text: '고령화사회 (7~14%)', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' };
    } else {
      return { text: '청장년/유소년형 (<7%)', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
    }
  };

  // Prepare time-series chart data for both countries
  const years = [1970, 1995, 2024, 2050, 2070];
  const chartData = years.map((yr) => {
    const sA = selectedCountryA.historicalData[yr];
    const sB = selectedCountryB.historicalData[yr];
    return {
      year: yr,
      [`${selectedCountryA.name}_TFR`]: sA?.tfr,
      [`${selectedCountryB.name}_TFR`]: sB?.tfr,
      [`${selectedCountryA.name}_출생률(CBR)`]: sA?.cbr,
      [`${selectedCountryA.name}_사망률(CDR)`]: sA?.cdr,
      [`${selectedCountryB.name}_출생률(CBR)`]: sB?.cbr,
      [`${selectedCountryB.name}_사망률(CDR)`]: sB?.cdr,
      [`${selectedCountryA.name}_고령화율(%)`]: sA?.elderlyRate,
      [`${selectedCountryB.name}_고령화율(%)`]: sB?.elderlyRate,
      [`${selectedCountryA.name}_총부양비`]: sA?.totalDependencyRatio,
      [`${selectedCountryB.name}_총부양비`]: sB?.totalDependencyRatio,
    };
  });

  const developedCountries = countries.filter((c) => c.developmentGroup === 'developed');
  const developingCountries = countries.filter((c) => c.developmentGroup === 'developing');

  return (
    <div className="space-y-6">
      {/* Top Controls: Country Selector & Timeline */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Country A and Country B Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Country A (선진국) */}
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  비교 대상 국가 1 (국가 A)
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  🏛️ 선진국 (6개국)
                </span>
              </div>
              <div className="relative">
                <select
                  id="select-country-a"
                  value={selectedCountryA.id}
                  onChange={(e) => {
                    const found = developedCountries.find((c) => c.id === e.target.value);
                    if (found) setSelectedCountryA(found);
                  }}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                >
                  {developedCountries.map((c) => (
                    <option key={`a-${c.id}`} value={c.id}>
                      {c.flag} {c.name} ({c.typeCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* VS Divider Badge */}
            <div className="self-end pb-2 hidden sm:flex items-center px-1">
              <span className="text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-2xs">
                VS
              </span>
            </div>

            {/* Country B (개발도상국) */}
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  비교 대상 국가 2 (국가 B)
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🌱 개발도상국 (6개국)
                </span>
              </div>
              <div className="relative">
                <select
                  id="select-country-b"
                  value={selectedCountryB.id}
                  onChange={(e) => {
                    const found = developingCountries.find((c) => c.id === e.target.value);
                    if (found) setSelectedCountryB(found);
                  }}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                >
                  {developingCountries.map((c) => (
                    <option key={`b-${c.id}`} value={c.id}>
                      {c.flag} {c.name} ({c.typeCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Year Buttons / Timeline */}
          <div className="w-full lg:w-auto">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>탐구 연도 타임라인 (1970 ~ 2070 장래추계)</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {years.map((yr) => (
                <button
                  key={yr}
                  id={`year-btn-${yr}`}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedYear === yr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {yr}년{yr >= 2050 ? ' (예측)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Short Summary Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-2">
            <span className="text-base">{selectedCountryA.flag}</span>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                {selectedCountryA.name} ({selectedCountryA.typeCategory})
              </span>
              <span className="text-slate-600 dark:text-slate-300">{selectedCountryA.summary}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start space-x-2">
            <span className="text-base">{selectedCountryB.flag}</span>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                {selectedCountryB.name} ({selectedCountryB.typeCategory})
              </span>
              <span className="text-slate-600 dark:text-slate-300">{selectedCountryB.summary}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Task Objective High-Contrast Hero Card (Geometric Balance Archetype) */}
      <section className="bg-indigo-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-indigo-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-2 h-4 bg-indigo-400 rounded-full inline-block"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Unit 04. Inquiry & Assessment Objective
              </span>
            </div>
            <p className="text-base sm:text-lg font-light leading-relaxed text-slate-100">
              제시된 두 국가의 <strong className="font-bold text-indigo-300">인구 피라미드 변화 양상</strong>과 핵심 통계 지표(출생률, 사망률, 부양비)를 비교 분석하고, 미래 사회에 발생할 구조적 문제점에 대한 <strong className="font-bold text-indigo-300">지속가능한 맞춤형 정책 대안</strong>을 10점 수행평가 보고서로 완성하시오.
            </p>
          </div>

          <button
            onClick={onGoToAssessment}
            className="shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
          >
            <GraduationCap className="w-4 h-4" />
            <span>수행평가 바로가기</span>
          </button>
        </div>
      </section>

      {/* Population Pyramids Side by Side */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopulationPyramidChart
          data={dataA}
          countryName={selectedCountryA.name}
          flag={selectedCountryA.flag}
          maxPercentageScale={12}
        />
        <PopulationPyramidChart
          data={dataB}
          countryName={selectedCountryB.name}
          flag={selectedCountryB.flag}
          maxPercentageScale={12}
        />
      </section>

      {/* Comparative Demographic Indicators Metric Board */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                국가별 인구 통계 지표 정밀 대조표 ({selectedYear}년)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                합계출산율, 조출생률, 조사망률, 유소년/노년 부양비, 노령화지수 비교
              </p>
            </div>
          </div>
        </div>

        {/* Geometric Balance Key Stat Metric 4-Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Stat 1: Country A TFR */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className={`block text-2xl font-black ${dataA.tfr < 1.3 ? 'text-rose-600' : dataA.tfr < 2.1 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {dataA.tfr.toFixed(2)}명
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1 block">
              {selectedCountryA.name} 합계출산율 (TFR)
            </span>
          </div>

          {/* Stat 2: Country B TFR */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className={`block text-2xl font-black ${dataB.tfr < 1.3 ? 'text-rose-600' : dataB.tfr < 2.1 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {dataB.tfr.toFixed(2)}명
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1 block">
              {selectedCountryB.name} 합계출산율 (TFR)
            </span>
          </div>

          {/* Stat 3: Country A Elderly Rate */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {dataA.elderlyRate}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1 block">
              {selectedCountryA.name} 65세 이상 고령화율
            </span>
          </div>

          {/* Stat 4: Country B Elderly Rate */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {dataB.elderlyRate}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1 block">
              {selectedCountryB.name} 65세 이상 고령화율
            </span>
          </div>
        </div>

        {/* Detailed Comparison Table (Geometric Balance Design Style) */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 text-left border-b border-slate-200 dark:border-slate-700">비교 항목</th>
                <th className="py-2.5 px-4 text-center border-b border-slate-200 dark:border-slate-700 font-bold">
                  {selectedCountryA.flag} {selectedCountryA.name}
                </th>
                <th className="py-2.5 px-4 text-center border-b border-slate-200 dark:border-slate-700 font-bold">
                  {selectedCountryB.flag} {selectedCountryB.name}
                </th>
                <th className="py-2.5 px-4 text-left border-b border-slate-200 dark:border-slate-700">통합사회 II 교과 해석</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                  피라미드 형태 분류
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                  {dataA.pyramidType}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-100">
                  {dataB.pyramidType}
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  피라미드형(확장형) vs 종형(정체형) vs 방추형(감퇴형)
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                  인구 변천 모델(DTM) 단계
                </td>
                <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                  {dataA.dtmStageName}
                </td>
                <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                  {dataB.dtmStageName}
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  산업화·보건의료 수준에 따른 출생/사망률 변천 과정
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                  조출생률(CBR) / 조사망률(CDR)
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold">
                  <span className="text-sky-600">{dataA.cbr}‰</span> / <span className="text-rose-600">{dataA.cdr}‰</span>
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold">
                  <span className="text-sky-600">{dataB.cbr}‰</span> / <span className="text-rose-600">{dataB.cdr}‰</span>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  인구 1,000명당 연간 출생자 수 및 사망자 수
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                  부양비 구조 (유소년 / 노년)
                </td>
                <td className="py-3 px-4 text-center font-mono">
                  유소년 <span className="font-bold text-emerald-600">{dataA.youthDependencyRatio}</span> / 노년 <span className="font-bold text-amber-600">{dataA.elderlyDependencyRatio}</span>
                </td>
                <td className="py-3 px-4 text-center font-mono">
                  유소년 <span className="font-bold text-emerald-600">{dataB.youthDependencyRatio}</span> / 노년 <span className="font-bold text-amber-600">{dataB.elderlyDependencyRatio}</span>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  청장년층(15~64세) 100명이 감당하는 부양 부담 지표
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                  노령화지수 (Aging Index)
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                  {dataA.agingIndex}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                  {dataB.agingIndex}
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                  (65세 이상 노년층 인구 / 0~14세 유소년 인구) × 100
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Teacher's Tip Box (Geometric Balance Archetype) */}
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
            Teacher's Tip & Curriculum Check
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
            "단순히 인구가 줄거나 늘어난다는 현상 나열을 넘어, 청장년층 감소에 따른 총부양비 급증과 국가 복지 재정의 지속가능성 등 인구 구조적 위기에 주목하세요."
          </p>
        </div>
      </section>

      {/* Interactive Time-Series Charts (1970 ~ 2070) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                시계열 추이 비교 그래프 (1970년 ~ 2070년 예측)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                과거 50년의 역사적 추이와 미래 50년의 인구 구조 변동 궤적 시각화
              </p>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveMetricTab('tfr')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeMetricTab === 'tfr'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              합계출산율 (TFR)
            </button>
            <button
              onClick={() => setActiveMetricTab('rates')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeMetricTab === 'rates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              출생률 vs 사망률
            </button>
            <button
              onClick={() => setActiveMetricTab('elderly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeMetricTab === 'elderly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              고령화율 (%)
            </button>
            <button
              onClick={() => setActiveMetricTab('dependency')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeMetricTab === 'dependency'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              총부양비
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 600 }} />

              {activeMetricTab === 'tfr' && (
                <>
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryA.name}_TFR`}
                    name={`${selectedCountryA.flag} ${selectedCountryA.name} 합계출산율`}
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryB.name}_TFR`}
                    name={`${selectedCountryB.flag} ${selectedCountryB.name} 합계출산율`}
                    stroke="#e11d48"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {activeMetricTab === 'rates' && (
                <>
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryA.name}_출생률(CBR)`}
                    name={`${selectedCountryA.name} 조출생률(‰)`}
                    stroke="#0284c7"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryA.name}_사망률(CDR)`}
                    name={`${selectedCountryA.name} 조사망률(‰)`}
                    stroke="#e11d48"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryB.name}_출생률(CBR)`}
                    name={`${selectedCountryB.name} 조출생률(‰)`}
                    stroke="#059669"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryB.name}_사망률(CDR)`}
                    name={`${selectedCountryB.name} 조사망률(‰)`}
                    stroke="#ea580c"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </>
              )}

              {activeMetricTab === 'elderly' && (
                <>
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryA.name}_고령화율(%)`}
                    name={`${selectedCountryA.flag} ${selectedCountryA.name} 65세 이상 비율(%)`}
                    stroke="#d97706"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryB.name}_고령화율(%)`}
                    name={`${selectedCountryB.flag} ${selectedCountryB.name} 65세 이상 비율(%)`}
                    stroke="#0891b2"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </>
              )}

              {activeMetricTab === 'dependency' && (
                <>
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryA.name}_총부양비`}
                    name={`${selectedCountryA.flag} ${selectedCountryA.name} 총부양비`}
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedCountryB.name}_총부양비`}
                    name={`${selectedCountryB.flag} ${selectedCountryB.name} 총부양비`}
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Case Study & Learning Insights */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                국가별 인구 과제 및 정책 사례 (Case Study)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                수행평가 문항 2(원인·파급효과) 및 문항 3(정책 대안) 작성 시 필수 참고 자료
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country A Case */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-2xl">{selectedCountryA.flag}</span>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedCountryA.name} ({selectedCountryA.typeCategory})
                </h4>
                <span className="text-[11px] text-slate-500">{selectedCountryA.englishName}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-l-4 border-slate-300 dark:border-slate-600 pl-3 py-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  당면한 사회적 과제 및 문제점:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {selectedCountryA.caseStudyContext.socialChallenges.map((ch, idx) => (
                    <li key={idx}>{ch}</li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-3 py-0.5">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                  추진 중인 주요 정책 및 해결 방안:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {selectedCountryA.caseStudyContext.majorPolicies.map((pol, idx) => (
                    <li key={idx}>{pol}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Country B Case */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-2xl">{selectedCountryB.flag}</span>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedCountryB.name} ({selectedCountryB.typeCategory})
                </h4>
                <span className="text-[11px] text-slate-500">{selectedCountryB.englishName}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-l-4 border-slate-300 dark:border-slate-600 pl-3 py-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  당면한 사회적 과제 및 문제점:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {selectedCountryB.caseStudyContext.socialChallenges.map((ch, idx) => (
                    <li key={idx}>{ch}</li>
                  ))}
                </ul>
              </div>

              <div className="border-l-4 border-indigo-500 pl-3 py-0.5">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                  추진 중인 주요 정책 및 해결 방안:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {selectedCountryB.caseStudyContext.majorPolicies.map((pol, idx) => (
                    <li key={idx}>{pol}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
