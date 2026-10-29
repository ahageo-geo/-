import React from 'react';
import { AlertTriangle, ShieldAlert, X, EyeOff, Copy, ClipboardPaste, Scissors, MousePointer } from 'lucide-react';
import { TabSwitchLog } from '../types';

export type IntegrityWarningType = 'tab_switch' | 'copy' | 'paste' | 'cut' | 'contextmenu' | 'general';

interface CheatingWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabSwitchCount: number;
  latestLog?: TabSwitchLog;
  warningType?: IntegrityWarningType;
}

export const CheatingWarningModal: React.FC<CheatingWarningModalProps> = ({
  isOpen,
  onClose,
  tabSwitchCount,
  latestLog,
  warningType = 'tab_switch',
}) => {
  if (!isOpen) return null;

  // Determine actual violation category (check warningType or fallback to parsing log message)
  const isPaste =
    warningType === 'paste' ||
    (latestLog?.message && latestLog.message.includes('붙여넣기'));
  const isCopy =
    warningType === 'copy' ||
    (latestLog?.message && latestLog.message.includes('복사'));
  const isCut =
    warningType === 'cut' ||
    (latestLog?.message && latestLog.message.includes('잘라내기'));
  const isContextMenu =
    warningType === 'contextmenu' ||
    (latestLog?.message && latestLog.message.includes('우클릭'));

  // Content configurations based on violation type
  let categoryBadge = '수행평가 시험 관리 시스템 경고';
  let modalTitle = '다른 창 / 탭 이동 감지';
  let alertHeader = '화면 이탈이 감지되어 기록되었습니다.';
  let alertDesc =
    '수행평가 작성 중 다른 웹 브라우저 탭을 열거나 외부 프로그램 창으로 전환한 것이 감지되었습니다.';
  let mainIcon = <ShieldAlert className="w-6 h-6 text-white" />;
  let acknowledgeText = '주의사항을 확인하였으며 계속 작성합니다';

  if (isPaste) {
    categoryBadge = '수행평가 시험 부정행위 방지 경고';
    modalTitle = '붙여넣기(Paste) 기능 사용 감지';
    alertHeader = '외부 답안 및 텍스트 붙여넣기 시도가 감지되었습니다.';
    alertDesc =
      '수행평가 답안 작성 중 외부 웹페이지, ChatGPT 등 생성형 AI 챗봇, 또는 외부 문서에서 내용을 복사하여 붙여넣는 행위가 감지되었습니다. 본 평가는 학생의 순수 분석 능력 평가를 목적으로 하므로 외부 텍스트 붙여넣기를 엄격히 금지합니다.';
    mainIcon = <ClipboardPaste className="w-6 h-6 text-white" />;
    acknowledgeText = '주의사항을 확인하였으며 직접 타이핑하여 작성합니다';
  } else if (isCopy) {
    categoryBadge = '수행평가 시험 부정행위 방지 경고';
    modalTitle = '복사(Copy) 기능 사용 감지';
    alertHeader = '평가 내용 복사(Copy) 시도가 감지되었습니다.';
    alertDesc =
      '수행평가 문항 또는 작성 중인 답안 내용을 복사하여 외부로 유출하거나 메신저·AI 등으로 전달하는 행위는 공정한 시험 운영을 위해 엄격히 제한됩니다.';
    mainIcon = <Copy className="w-6 h-6 text-white" />;
    acknowledgeText = '주의사항을 확인하였으며 계속 작성합니다';
  } else if (isCut) {
    categoryBadge = '수행평가 시험 관리 시스템 경고';
    modalTitle = '잘라내기(Cut) 기능 사용 감지';
    alertHeader = '답안 내용 잘라내기(Cut) 시도가 감지되었습니다.';
    alertDesc = '작성 중인 답안의 잘라내기 기능 사용이 감지되었습니다. 직접 키보드를 이용하여 작성해 주세요.';
    mainIcon = <Scissors className="w-6 h-6 text-white" />;
  } else if (isContextMenu) {
    categoryBadge = '수행평가 시험 관리 시스템 경고';
    modalTitle = '마우스 우클릭 메뉴 사용 감지';
    alertHeader = '마우스 우클릭(컨텍스트 메뉴) 사용이 감지되었습니다.';
    alertDesc = '복사 및 붙여넣기 등 부정행위 방지를 위해 마우스 우클릭 메뉴 사용이 제한됩니다.';
    mainIcon = <MousePointer className="w-6 h-6 text-white" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Warning Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs shadow-inner">
              {mainIcon}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-rose-100 flex items-center gap-1.5">
                <span>{categoryBadge}</span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                <span>{modalTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-amber-200 text-xs font-mono font-bold">
                  누적 {tabSwitchCount}회
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-6 space-y-4 text-slate-800 dark:text-slate-100">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs leading-relaxed space-y-2">
            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{alertHeader}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-normal">
              {alertDesc}
            </p>
            {latestLog && (
              <div className="pt-2 border-t border-rose-200 dark:border-rose-800/60 font-mono text-[11px] text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>감지 내역: {latestLog.message}</span>
                <span className="font-bold text-rose-700 dark:text-rose-300">교사용 대시보드 실시간 기록</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <span>📌 학생 준수 및 유의 안내 사항:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300 pl-1 leading-relaxed">
              {isPaste ? (
                <>
                  <li>
                    <strong>직접 타이핑 원칙</strong>: 제시된 통계 데이터와 학습 개념을 바탕으로 <strong>본인의 문장으로 직접 키보드를 타이핑</strong>하여 작성해야 합니다.
                  </li>
                  <li>
                    <strong>외부 AI 및 검색문 붙여넣기 금지</strong>: ChatGPT 등 외부 AI 답변이나 웹 문서 복사·붙여넣기는 <strong>부정행위로 처리</strong>됩니다.
                  </li>
                  <li>
                    <strong>교사용 대시보드 실시간 전송</strong>: 모든 붙여넣기 시도 일시와 횟수는 <strong>선생님의 채점 관리 화면에 실시간으로 전송 및 영구 보관</strong>됩니다.
                  </li>
                </>
              ) : isCopy ? (
                <>
                  <li>
                    <strong>시험 문항 및 답안 유출 금지</strong>: 평가 문항과 작성 답안의 <strong>외부 복사, 공유 및 유출 행위는 엄격히 금지</strong>됩니다.
                  </li>
                  <li>
                    <strong>실시간 감지 기록</strong>: 복사 시도 이력 및 발생 시각이 선생님의 평가 시스템에 실시간으로 기록됩니다.
                  </li>
                  <li>
                    <strong>자율적 해결</strong>: 외부 도움 없이 본인의 실력으로 문제 해결 방안을 기술하세요.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    공정한 수행평가를 위해 <strong>AI 챗봇 검색, 외부 검색창 등 외부 창 사용이 엄격히 제한</strong>됩니다.
                  </li>
                  <li>
                    모든 화면 이탈 횟수와 상세 발생 시각은 <strong>선생님의 채점 관리 화면에 실시간으로 전송 및 기록</strong>됩니다.
                  </li>
                  <li>
                    제시된 인구 통계 자료와 교과서 학습 내용을 바탕으로 <strong>스스로 생각하여 답안을 작성</strong>해 주시기 바랍니다.
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {acknowledgeText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
