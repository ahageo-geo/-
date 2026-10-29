/**
 * Student Identification and Class Utilities
 * Supports structured class (반) selection (1~9반 and 예비반), student number (번호) input,
 * and standard NEIS student ID formatting (e.g. 10312 = 1학년 03반 12번, 1예비12 = 1학년 예비반 12번).
 */

export const CLASS_OPTIONS: (number | string)[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, '예비'];

export function formatClassLabel(classVal?: number | string): string {
  if (classVal === undefined || classVal === null || classVal === '') return '';
  const str = String(classVal).trim();
  if (str === '예비' || str === '예비반') {
    return '예비반';
  }
  return `${str}반`;
}

export function formatStudentId(
  grade: number = 1,
  classNum: number | string,
  studentNum: number | string
): string {
  const g = Math.max(1, typeof grade === 'number' ? grade : parseInt(String(grade), 10) || 1);
  const n = Math.max(1, typeof studentNum === 'number' ? studentNum : parseInt(String(studentNum), 10) || 1)
    .toString()
    .padStart(2, '0');

  const cStr = String(classNum).trim();
  if (cStr === '예비' || cStr === '예비반') {
    return `${g}예비${n}`;
  }

  const cNum = parseInt(cStr, 10);
  const c = (!isNaN(cNum) ? cNum : 1).toString().padStart(2, '0');
  return `${g}${c}${n}`;
}

export function parseStudentId(
  id: string
): { grade: number; classNum: number | string; studentNum: number } | null {
  if (!id) return null;
  const clean = id.trim();

  // Pattern 0: 예비반 e.g. "1예비05", "1-예비-5", "예비반 5번", "1예비5"
  const yebiMatch = clean.match(/^(?:(\d+)[-학년\s]*)?예비(?:반)?[-번\s]*(\d+)$/);
  if (yebiMatch) {
    const grade = yebiMatch[1] ? parseInt(yebiMatch[1], 10) : 1;
    const studentNum = parseInt(yebiMatch[2], 10);
    return { grade, classNum: '예비', studentNum };
  }

  // Pattern 1: 5 digits e.g. 10312 -> 1학년 3반 12번
  if (/^\d{5}$/.test(clean)) {
    const grade = parseInt(clean[0], 10);
    const classNum = parseInt(clean.slice(1, 3), 10);
    const studentNum = parseInt(clean.slice(3, 5), 10);
    return { grade, classNum, studentNum };
  }

  // Pattern 2: "1학년 3반 12번" or "3반 12번" or "1학년 예비반 12번"
  const koreanMatch = clean.match(/(?:(\d+)학년\s*)?(?:(\d+)반|예비(?:반)?)\s*(\d+)번/);
  if (koreanMatch) {
    const grade = koreanMatch[1] ? parseInt(koreanMatch[1], 10) : 1;
    const isYebi = clean.includes('예비');
    const classNum = isYebi ? '예비' : parseInt(koreanMatch[2], 10);
    const studentNum = parseInt(koreanMatch[3], 10);
    return { grade, classNum, studentNum };
  }

  // Pattern 3: "1-3-12" or "3-12" or "1-예비-12"
  const dashMatch = clean.match(/^(?:(\d+)-)?(\d+|예비)-(\d+)$/);
  if (dashMatch) {
    const grade = dashMatch[1] ? parseInt(dashMatch[1], 10) : 1;
    const classVal = dashMatch[2] === '예비' ? '예비' : parseInt(dashMatch[2], 10);
    const studentNum = parseInt(dashMatch[3], 10);
    return { grade, classNum: classVal, studentNum };
  }

  return null;
}

export function formatStudentDisplay(
  grade?: number,
  classNum?: number | string,
  studentNum?: number | string,
  fallbackId?: string
): string {
  if (classNum !== undefined && classNum !== '' && studentNum !== undefined && studentNum !== '') {
    const g = grade || 1;
    const classText = formatClassLabel(classNum);
    return `${g}학년 ${classText} ${studentNum}번`;
  }

  if (fallbackId) {
    const parsed = parseStudentId(fallbackId);
    if (parsed) {
      const classText = formatClassLabel(parsed.classNum);
      return `${parsed.grade}학년 ${classText} ${parsed.studentNum}번`;
    }
    return fallbackId;
  }

  return '미기입';
}
