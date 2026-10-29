import React, { useState } from 'react';
import { Lock, X, ArrowRight, AlertCircle } from 'lucide-react';

interface TeacherPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacherName?: string) => void;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validKeys = ['0513'];
    if (validKeys.includes(pin.trim())) {
      setError('');
      onSuccess('교사 관리자');
      onClose();
    } else {
      setError('교사용 인증 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center border border-indigo-300 dark:border-indigo-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              교사 관리자 인증
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              교사 관리 대시보드 접근을 위해 비밀번호를 입력하세요.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>교사 인증 비밀번호 *</span>
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="교사 비밀번호 입력"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>교사 모드 승인</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
