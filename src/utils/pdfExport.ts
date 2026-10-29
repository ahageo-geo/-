import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentSubmission, AssessmentFormState, CountryData, AiEvaluationResponse } from '../types';
import { SAMPLE_MODEL_ANSWERS } from '../data/rubricData';
import { formatStudentDisplay } from './studentInfo';

/**
 * Utility to reliably download a Blob as a file across desktop & mobile browsers and iframes.
 */
export function downloadBlob(blob: Blob, fileName: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    link.target = '_self';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.error('downloadBlob failed:', err);
    return false;
  }
}

/**
 * Helper to split Korean text and wrap character-by-character into lines fitting maxWidth.
 */
export function wrapKoreanText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';
    for (let i = 0; i < para.length; i++) {
      const char = para[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Helper to draw multi-line text and return ending Y position.
 */
function drawWrappedLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  color: string = '#0f172a'
): number {
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let currentY = startY;
  for (const line of lines) {
    if (line !== '') {
      ctx.fillText(line, x, currentY);
    }
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Draw official red verification seal on canvas
 */
function drawOfficialStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string = '제출확인'
) {
  ctx.save();
  ctx.strokeStyle = '#dc2626';
  ctx.fillStyle = '#dc2626';
  ctx.lineWidth = 3.5;

  // Double circle
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 33, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy - 7);

  ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
  ctx.fillText('통합사회 II', cx, cy + 11);

  ctx.restore();
}

/**
 * Export a high-resolution Canvas to a multi-page jsPDF document.
 */
function canvasToPdf(canvas: HTMLCanvasElement, fileName: string): boolean {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate height in mm corresponding to the canvas aspect ratio
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pageCanvasHeight = (canvas.width * pdfHeight) / pdfWidth;
    let renderedHeight = 0;
    let pageIndex = 0;

    // Slice canvas into A4 page chunks for crisp, non-stretched multi-page PDF
    while (renderedHeight < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const chunkHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);

      // Create temporary canvas for this page chunk
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageCanvasHeight;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        pageCtx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          chunkHeight,
          0,
          0,
          canvas.width,
          chunkHeight
        );

        const chunkData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(chunkData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      renderedHeight += pageCanvasHeight;
      pageIndex++;
    }

    const pdfBlob = pdf.output('blob');
    const downloaded = downloadBlob(pdfBlob, fileName);
    if (!downloaded) {
      pdf.save(fileName);
    }
    return true;
  } catch (err) {
    console.error('canvasToPdf error:', err);
    return false;
  }
}

/**
 * 1. Renders the Student Submission Confirmation Document to High-Resolution Canvas
 * Includes full student answers for Q1, Q2, and Q3 with character counts and verification codes.
 */
export function renderStudentSubmissionToCanvas(submission: StudentSubmission): HTMLCanvasElement {
  // First calculate required content height
  const baseWidth = 1240;
  const paddingX = 60;
  const contentWidth = baseWidth - paddingX * 2;

  // Measurement canvas
  const mCanvas = document.createElement('canvas');
  mCanvas.width = baseWidth;
  mCanvas.height = 100;
  const mCtx = mCanvas.getContext('2d')!;

  mCtx.font = '15.5px "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  const q1Lines = wrapKoreanText(mCtx, submission.q1Answer || '(작성된 답안이 없습니다)', contentWidth - 40);
  const q2Lines = wrapKoreanText(mCtx, submission.q2Answer || '(작성된 답안이 없습니다)', contentWidth - 40);

  const lineHeight = 24;
  const q1BoxH = Math.max(140, q1Lines.length * lineHeight + 40);
  const q2BoxH = Math.max(180, q2Lines.length * lineHeight + 40);

  // Calculate total required canvas height
  const estimatedHeight = 650 + q1BoxH + q2BoxH + 180;
  // Snap to multiple of A4 ratio (1240 : 1754)
  const a4PageHeight = 1754;
  const pageCount = Math.max(1, Math.ceil(estimatedHeight / a4PageHeight));
  const finalCanvasHeight = pageCount * a4PageHeight;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = finalCanvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cursorY = 55;

  // 1. Header Section
  ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.textAlign = 'center';
  ctx.fillText('[고등학교 통합사회 II 수행평가 결과물]', canvas.width / 2, cursorY);
  cursorY += 28;

  ctx.font = 'bold 30px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('세계 인구 탐구 수행평가 제출 확인서', canvas.width / 2, cursorY);
  cursorY += 38;

  ctx.font = '14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    `제출일시: ${submission.submittedAt}  |  검증코드: ${submission.verificationCode}  |  총 분량: ${(submission.q1Answer.length + submission.q2Answer.length).toLocaleString()}자`,
    canvas.width / 2,
    cursorY
  );
  cursorY += 24;

  // Divider
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(canvas.width - paddingX, cursorY);
  ctx.stroke();
  cursorY += 20;

  // 2. Student Info Table Box
  const tableHeight = 80;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddingX, cursorY, contentWidth, tableHeight);

  // Background for headers
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, cursorY, 140, 40);
  ctx.fillRect(paddingX + contentWidth / 2, cursorY, 140, 40);
  ctx.fillRect(paddingX, cursorY + 40, 140, 40);
  ctx.fillRect(paddingX + contentWidth / 2, cursorY + 40, 140, 40);

  // Table borders
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY + 40);
  ctx.lineTo(paddingX + contentWidth, cursorY + 40);
  ctx.moveTo(paddingX + contentWidth / 2, cursorY);
  ctx.lineTo(paddingX + contentWidth / 2, cursorY + tableHeight);

  ctx.moveTo(paddingX + 140, cursorY);
  ctx.lineTo(paddingX + 140, cursorY + tableHeight);
  ctx.moveTo(paddingX + contentWidth / 2 + 140, cursorY);
  ctx.lineTo(paddingX + contentWidth / 2 + 140, cursorY + tableHeight);
  ctx.stroke();

  // Cell texts
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';

  ctx.fillText('학생 성명', paddingX + 70, cursorY + 20);
  ctx.fillText('소속 학급 / 학번', paddingX + contentWidth / 2 + 70, cursorY + 20);
  ctx.fillText('탐구 대상국', paddingX + 70, cursorY + 60);
  ctx.fillText('제출 상태', paddingX + contentWidth / 2 + 70, cursorY + 60);

  ctx.textAlign = 'left';
  ctx.font = '15px "Malgun Gothic", sans-serif';
  ctx.fillText(submission.studentName || '미기입', paddingX + 155, cursorY + 20);
  const displayId = formatStudentDisplay(submission.grade, submission.classNum, submission.studentNum, submission.studentId);
  const idText = submission.studentId && submission.studentId !== displayId ? `${displayId} (${submission.studentId})` : displayId;
  ctx.fillText(idText, paddingX + contentWidth / 2 + 155, cursorY + 20);

  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.fillText(`${submission.countryAName}  vs  ${submission.countryBName}`, paddingX + 155, cursorY + 60);

  ctx.fillStyle = '#059669';
  ctx.fillText('제출 접수 완료 (교사 채점 검토 대기)', paddingX + contentWidth / 2 + 155, cursorY + 60);

  cursorY += tableHeight + 16;

  // 3. Notice Banner
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(paddingX, cursorY, contentWidth, 42);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.strokeRect(paddingX, cursorY, contentWidth, 42);

  ctx.font = 'bold 13.5px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#065f46';
  ctx.textAlign = 'left';
  ctx.fillText(
    '✓ 본 확인서는 수행평가 답안이 교과 담당 선생님께 정상 제출되었음을 증명하며, 학생에게는 점수를 비공개하고 교사가 정밀 평가합니다.',
    paddingX + 16,
    cursorY + 21
  );

  cursorY += 56;

  // 4. Questions & Answers Section Title
  ctx.font = 'bold 18px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('■ 학생이 작성하여 제출한 답안 전문 (무단 복제 방지 검증본)', paddingX, cursorY);
  cursorY += 26;

  // Helper to draw question & answer box
  const drawQuestionBlock = (
    qNumber: number,
    qTitle: string,
    score: string,
    qDesc: string,
    answerLines: string[],
    rawAnswerText: string,
    boxHeight: number
  ) => {
    // Question Title Bar
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[문항 ${qNumber}] ${qTitle}`, paddingX, cursorY);

    ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#4f46e5';
    ctx.textAlign = 'right';
    ctx.fillText(`배점: ${score}  |  작성 분량: ${rawAnswerText.length}자`, canvas.width - paddingX, cursorY);
    cursorY += 20;

    // Underline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, cursorY);
    ctx.lineTo(canvas.width - paddingX, cursorY);
    ctx.stroke();
    cursorY += 8;

    // Prompt Instruction
    ctx.font = '13.5px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(qDesc, paddingX, cursorY);
    cursorY += 22;

    // Answer Box Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(paddingX, cursorY, contentWidth, boxHeight);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddingX, cursorY, contentWidth, boxHeight);

    // Answer Text Lines
    ctx.font = '15px "Malgun Gothic", sans-serif';
    drawWrappedLines(
      ctx,
      answerLines,
      paddingX + 18,
      cursorY + 16,
      lineHeight,
      rawAnswerText ? '#0f172a' : '#94a3b8'
    );

    cursorY += boxHeight + 20;
  };

  // Draw Q1
  drawQuestionBlock(
    1,
    '문제 1. 자료 분석 및 인구 피라미드 유형 분류',
    '5점',
    '두 국가의 인구 피라미드 형태 분류 및 2가지 이상의 주요 통계 자료(출생률, 사망률, 청장년층/노년층 비율 등) 비교 분석',
    q1Lines,
    submission.q1Answer,
    q1BoxH
  );

  // Draw Q2
  drawQuestionBlock(
    2,
    '문제 2. 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책',
    '5점',
    '두 국가의 인구 문제 원인, 미래 사회 파급 효과(노동력, 경제 성장 등) 및 맞춤형 정책(제도적 및 문화/기술적 대안) 종합 서술',
    q2Lines,
    submission.q2Answer,
    q2BoxH
  );

  // 5. Footer & Stamp
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(canvas.width - paddingX, cursorY);
  ctx.stroke();
  cursorY += 26;

  ctx.font = '13px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('• 본 문서는 교내 학업성적관리규정에 의거하여 보관되는 수행평가 공식 제출 확인본입니다.', paddingX, cursorY);
  ctx.fillText(`• 고유 검증 코드: ${submission.verificationCode} (학교 데이터베이스 대조 가능)`, paddingX, cursorY + 20);

  // Official Stamp graphic
  drawOfficialStamp(ctx, canvas.width - paddingX - 60, cursorY + 10, '제출확인');

  return canvas;
}

/**
 * 2. Renders the Official Teacher Certificate / Grading Report to High-Resolution Canvas
 * Includes detailed 10-point rubric breakdown, student answers, teacher feedback, and official seal.
 */
export function renderOfficialCertificateToCanvas(submission: StudentSubmission): HTMLCanvasElement {
  const evalRes = submission.evaluationResult || {
    totalScore: 10,
    maxScore: 10,
    gradeLevel: '탁월(상)',
    q1Score: 5,
    q1Max: 5,
    q1Feedback: 'A·B 국가의 피라미드 형태와 주요 통계 수치를 비교 기준에 맞추어 매우 정확하게 분석함.',
    q2Score: 5,
    q2Max: 5,
    q2Feedback: 'A·B 국가의 인구 문제 원인, 미래 사회 파급 효과 및 맞춤형 정책을 논리적으로 도출함.',
    overallComment: '전반적인 자료 분석력과 인구 문제 해결을 위한 비판적 사고력이 매우 우수함.',
  };

  const finalScore = submission.teacherOverriddenScore !== undefined ? submission.teacherOverriddenScore : evalRes.totalScore;

  const baseWidth = 1240;
  const paddingX = 60;
  const contentWidth = baseWidth - paddingX * 2;

  // Pre-calculate answer heights
  const mCanvas = document.createElement('canvas');
  mCanvas.width = baseWidth;
  mCanvas.height = 100;
  const mCtx = mCanvas.getContext('2d')!;
  mCtx.font = '15px "Malgun Gothic", sans-serif';

  const q1Lines = wrapKoreanText(mCtx, submission.q1Answer || '(작성된 답안이 없습니다)', contentWidth - 40);
  const q2Lines = wrapKoreanText(mCtx, submission.q2Answer || '(작성된 답안이 없습니다)', contentWidth - 40);

  const lineHeight = 24;
  const q1BoxH = Math.max(120, q1Lines.length * lineHeight + 36);
  const q2BoxH = Math.max(160, q2Lines.length * lineHeight + 36);

  const estimatedHeight = 900 + q1BoxH + q2BoxH + 180;
  const a4PageHeight = 1754;
  const pageCount = Math.max(1, Math.ceil(estimatedHeight / a4PageHeight));
  const finalCanvasHeight = pageCount * a4PageHeight;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = finalCanvasHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cursorY = 55;

  // Header
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.textAlign = 'center';
  ctx.fillText('[고등학교 통합사회 II 평가 결과 통지표]', canvas.width / 2, cursorY);
  cursorY += 28;

  ctx.font = 'bold 30px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('세계 인구 탐구 수행평가 공식 성적확인서', canvas.width / 2, cursorY);
  cursorY += 38;

  ctx.font = '14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    `발행일시: ${submission.submittedAt}  |  검증코드: ${submission.verificationCode}  |  성취 수준: ${evalRes.gradeLevel}`,
    canvas.width / 2,
    cursorY
  );
  cursorY += 24;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(canvas.width - paddingX, cursorY);
  ctx.stroke();
  cursorY += 22;

  // Student Info Table
  const infoH = 50;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddingX, cursorY, contentWidth, infoH);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, cursorY, 120, infoH);
  ctx.fillRect(paddingX + contentWidth / 4, cursorY, 120, infoH);
  ctx.fillRect(paddingX + (contentWidth / 4) * 2, cursorY, 120, infoH);
  ctx.fillRect(paddingX + (contentWidth / 4) * 3, cursorY, 120, infoH);

  ctx.beginPath();
  ctx.moveTo(paddingX + contentWidth / 4, cursorY);
  ctx.lineTo(paddingX + contentWidth / 4, cursorY + infoH);
  ctx.moveTo(paddingX + (contentWidth / 4) * 2, cursorY);
  ctx.lineTo(paddingX + (contentWidth / 4) * 2, cursorY + infoH);
  ctx.moveTo(paddingX + (contentWidth / 4) * 3, cursorY);
  ctx.lineTo(paddingX + (contentWidth / 4) * 3, cursorY + infoH);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';

  ctx.fillText('학생 성명', paddingX + 60, cursorY + 25);
  ctx.fillText('학번 / 반', paddingX + contentWidth / 4 + 60, cursorY + 25);
  ctx.fillText('탐구 대상국', paddingX + (contentWidth / 4) * 2 + 60, cursorY + 25);
  ctx.fillText('최종 점수', paddingX + (contentWidth / 4) * 3 + 60, cursorY + 25);

  ctx.textAlign = 'left';
  ctx.font = '14.5px "Malgun Gothic", sans-serif';
  ctx.fillText(submission.studentName || '미기입', paddingX + 130, cursorY + 25);
  ctx.fillText(submission.studentId || '미기입', paddingX + contentWidth / 4 + 130, cursorY + 25);
  ctx.fillText(`${submission.countryAName} vs ${submission.countryBName}`, paddingX + (contentWidth / 4) * 2 + 130, cursorY + 25);

  ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.fillText(`${finalScore}점 / 10점 (${evalRes.gradeLevel})`, paddingX + (contentWidth / 4) * 3 + 130, cursorY + 25);

  cursorY += infoH + 24;

  // Rubric Score Table Header
  ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('■ 공식 10점 만점 루브릭 채점 세부 내역', paddingX, cursorY);
  cursorY += 20;

  // Rubric Table
  const rubricRows = [
    {
      area: '문제 1. 자료 분석 및 인구 피라미드 유형 분류',
      max: '5점',
      score: `${evalRes.q1Score}점`,
      feedback: evalRes.q1Feedback || '피라미드 형태 분류와 2가지 이상의 주요 통계 수치를 비교 분석함.',
    },
    {
      area: '문제 2. 인구 문제 원인, 파급 효과 및 맞춤형 정책',
      max: '5점',
      score: `${evalRes.q2Score}점`,
      feedback: evalRes.q2Feedback || '인구 문제 원인, 미래 사회 파급 효과 및 맞춤형 정책을 종합 서술함.',
    },
  ];

  const colWidths = [340, 70, 90, contentWidth - 500];
  const rowH = 46;
  const tableH = rowH * 4;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(paddingX, cursorY, contentWidth, tableH);

  // Table Head
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, cursorY, contentWidth, rowH);

  ctx.beginPath();
  for (let r = 1; r <= 3; r++) {
    ctx.moveTo(paddingX, cursorY + rowH * r);
    ctx.lineTo(paddingX + contentWidth, cursorY + rowH * r);
  }
  let accX = paddingX;
  for (let c = 0; c < 3; c++) {
    accX += colWidths[c];
    ctx.moveTo(accX, cursorY);
    ctx.lineTo(accX, cursorY + tableH);
  }
  ctx.stroke();

  // Head Titles
  ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('평가 영역 및 문항', paddingX + colWidths[0] / 2, cursorY + rowH / 2);
  ctx.fillText('배점', paddingX + colWidths[0] + colWidths[1] / 2, cursorY + rowH / 2);
  ctx.fillText('취득점수', paddingX + colWidths[0] + colWidths[1] + colWidths[2] / 2, cursorY + rowH / 2);
  ctx.fillText('교사 피드백 및 평가 의견 (4개 기준 만족도)', paddingX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] / 2, cursorY + rowH / 2);

  // Rows
  rubricRows.forEach((row, idx) => {
    const ry = cursorY + rowH * (idx + 1);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(row.area, paddingX + 14, ry + rowH / 2);

    ctx.textAlign = 'center';
    ctx.font = '14px "Malgun Gothic", sans-serif';
    ctx.fillText(row.max, paddingX + colWidths[0] + colWidths[1] / 2, ry + rowH / 2);

    ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#4f46e5';
    ctx.fillText(row.score, paddingX + colWidths[0] + colWidths[1] + colWidths[2] / 2, ry + rowH / 2);

    ctx.textAlign = 'left';
    ctx.font = '13.5px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(row.feedback, paddingX + colWidths[0] + colWidths[1] + colWidths[2] + 14, ry + rowH / 2);
  });

  // Total Row
  const totalY = cursorY + rowH * 3;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(paddingX, totalY, contentWidth, rowH);

  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('총계 (최종 성적)', paddingX + colWidths[0] / 2, totalY + rowH / 2);
  ctx.fillText('10점', paddingX + colWidths[0] + colWidths[1] / 2, totalY + rowH / 2);

  ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText(`${finalScore}점`, paddingX + colWidths[0] + colWidths[1] + colWidths[2] / 2, totalY + rowH / 2);

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`종합 등급: ${evalRes.gradeLevel} (성취평가기준 충족)`, paddingX + colWidths[0] + colWidths[1] + colWidths[2] + 14, totalY + rowH / 2);

  cursorY += tableH + 16;

  // Overall Comment Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(paddingX, cursorY, contentWidth, 54);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(paddingX, cursorY, contentWidth, 54);

  ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('교사 종합 평가 의견:', paddingX + 16, cursorY + 20);

  ctx.font = '14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    submission.teacherCustomNote || evalRes.overallComment || '성실하게 수행평가 과제를 완수하였음.',
    paddingX + 160,
    cursorY + 20
  );

  cursorY += 70;

  // Student Written Answers Section Header
  ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('■ 학생 제출 답안 원문 기록 (교사 확인 대조용)', paddingX, cursorY);
  cursorY += 24;

  const drawCertAnswer = (qNum: number, title: string, answerLines: string[], boxH: number, raw: string) => {
    ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(`[문항 ${qNum}] ${title}`, paddingX, cursorY);
    ctx.font = '13px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(`작성 분량: ${raw.length}자`, canvas.width - paddingX, cursorY);
    cursorY += 18;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(paddingX, cursorY, contentWidth, boxH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddingX, cursorY, contentWidth, boxH);

    ctx.font = '14.5px "Malgun Gothic", sans-serif';
    drawWrappedLines(ctx, answerLines, paddingX + 16, cursorY + 14, lineHeight, raw ? '#0f172a' : '#94a3b8');

    cursorY += boxH + 18;
  };

  drawCertAnswer(1, '자료 분석 및 인구 피라미드 유형 분류 답안 (5점)', q1Lines, q1BoxH, submission.q1Answer);
  drawCertAnswer(2, '인구 문제 원인, 미래 사회 파급 효과 및 맞춤형 정책 답안 (5점)', q2Lines, q2BoxH, submission.q2Answer);

  // Footer & Official Stamp
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(canvas.width - paddingX, cursorY);
  ctx.stroke();
  cursorY += 26;

  ctx.font = '13px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('• 본 성적확인서는 학교생활기록부 교과학습발달상황 및 세부능력및특기사항 기재 근거 자료로 활용됩니다.', paddingX, cursorY);
  ctx.fillText(`• 평가 교과: 통합사회 II  |  담당 교사: 사회과 교과협의회  |  고유번호: ${submission.verificationCode}`, paddingX, cursorY + 20);

  drawOfficialStamp(ctx, canvas.width - paddingX - 60, cursorY + 10, '평가완료');

  return canvas;
}

/**
 * 3. Renders the Assessment Worksheet to High-Resolution Canvas
 */
export function renderWorksheetToCanvas(params: {
  formState: AssessmentFormState;
  countryA: CountryData;
  countryB: CountryData;
  evaluationResult?: AiEvaluationResponse | null;
  printMode: 'student-result' | 'blank' | 'teacher-rubric';
  submission?: StudentSubmission | null;
  isTeacher?: boolean;
}): HTMLCanvasElement {
  const { formState, countryA, countryB, evaluationResult, printMode, submission, isTeacher = false } = params;

  const baseWidth = 1240;
  const paddingX = 60;
  const contentWidth = baseWidth - paddingX * 2;

  // Resolve answers
  const q1Text =
    printMode === 'blank'
      ? ''
      : printMode === 'teacher-rubric'
      ? SAMPLE_MODEL_ANSWERS.q1
      : formState.q1Answer || submission?.q1Answer || '';

  const q2Text =
    printMode === 'blank'
      ? ''
      : printMode === 'teacher-rubric'
      ? SAMPLE_MODEL_ANSWERS.q2
      : formState.q2Answer || submission?.q2Answer || '';

  const mCanvas = document.createElement('canvas');
  mCanvas.width = baseWidth;
  mCanvas.height = 100;
  const mCtx = mCanvas.getContext('2d')!;
  mCtx.font = '15px "Malgun Gothic", sans-serif';

  const q1Lines = wrapKoreanText(mCtx, q1Text || (printMode === 'blank' ? '' : '(작성된 답안이 없습니다)'), contentWidth - 40);
  const q2Lines = wrapKoreanText(mCtx, q2Text || (printMode === 'blank' ? '' : '(작성된 답안이 없습니다)'), contentWidth - 40);

  const lineHeight = 24;
  const q1BoxH = printMode === 'blank' ? 180 : Math.max(140, q1Lines.length * lineHeight + 40);
  const q2BoxH = printMode === 'blank' ? 220 : Math.max(180, q2Lines.length * lineHeight + 40);

  const estimatedHeight = 750 + q1BoxH + q2BoxH + 180;
  const a4PageHeight = 1754;
  const pageCount = Math.max(1, Math.ceil(estimatedHeight / a4PageHeight));
  const finalCanvasHeight = pageCount * a4PageHeight;

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = finalCanvasHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cursorY = 55;

  // Header
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.fillText('[고등학교 통합사회 II 수행평가 활동지]', canvas.width / 2, cursorY);
  cursorY += 28;

  ctx.font = 'bold 30px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('세계 인구 탐구 수행평가 활동지', canvas.width / 2, cursorY);
  cursorY += 36;

  ctx.font = '14px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('단원: Ⅱ. 인구 문제와 미래 사회  |  영역: 인구 구조 분석 및 지속가능한 미래 설계', canvas.width / 2, cursorY);
  cursorY += 24;

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(canvas.width - paddingX, cursorY);
  ctx.stroke();
  cursorY += 20;

  // Student Info Table
  const tableH = 75;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddingX, cursorY, contentWidth, tableH);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, cursorY, 130, 37);
  ctx.fillRect(paddingX + contentWidth / 2, cursorY, 130, 37);
  ctx.fillRect(paddingX, cursorY + 37, 130, 38);

  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY + 37);
  ctx.lineTo(paddingX + contentWidth, cursorY + 37);
  ctx.moveTo(paddingX + contentWidth / 2, cursorY);
  ctx.lineTo(paddingX + contentWidth / 2, cursorY + 37);
  ctx.moveTo(paddingX + 130, cursorY);
  ctx.lineTo(paddingX + 130, cursorY + tableH);
  ctx.moveTo(paddingX + contentWidth / 2 + 130, cursorY);
  ctx.lineTo(paddingX + contentWidth / 2 + 130, cursorY + 37);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#0f172a';

  ctx.fillText('학번 / 반', paddingX + 65, cursorY + 18);
  ctx.fillText('성명', paddingX + contentWidth / 2 + 65, cursorY + 18);
  ctx.fillText('탐구 대상 국가', paddingX + 65, cursorY + 56);

  ctx.textAlign = 'left';
  ctx.font = '15px "Malgun Gothic", sans-serif';
  ctx.fillText(formState.studentId || submission?.studentId || '_______________', paddingX + 145, cursorY + 18);
  ctx.fillText(formState.studentName || submission?.studentName || '_______________', paddingX + contentWidth / 2 + 145, cursorY + 18);

  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.fillText(`[국가 1 (선진국): ${countryA.flag} ${countryA.name}]  vs  [국가 2 (개발도상국): ${countryB.flag} ${countryB.name}]`, paddingX + 145, cursorY + 56);

  cursorY += tableH + 24;

  // Prompts
  const drawPrompt = (
    qNum: number,
    title: string,
    score: string,
    desc: string,
    lines: string[],
    rawText: string,
    boxH: number
  ) => {
    ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(`[문항 ${qNum}] ${title}`, paddingX, cursorY);

    ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right';
    ctx.fillText(`배점: ${score}`, canvas.width - paddingX, cursorY);
    cursorY += 20;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, cursorY);
    ctx.lineTo(canvas.width - paddingX, cursorY);
    ctx.stroke();
    cursorY += 8;

    ctx.font = '13.5px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.fillText(desc, paddingX, cursorY);
    cursorY += 22;

    ctx.fillStyle = printMode === 'blank' ? '#ffffff' : '#f8fafc';
    ctx.fillRect(paddingX, cursorY, contentWidth, boxH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddingX, cursorY, contentWidth, boxH);

    if (printMode !== 'blank') {
      ctx.font = '15px "Malgun Gothic", sans-serif';
      drawWrappedLines(ctx, lines, paddingX + 18, cursorY + 16, lineHeight, rawText ? '#0f172a' : '#94a3b8');
    }

    cursorY += boxH + 20;
  };

  drawPrompt(
    1,
    '자료 분석 및 인구 피라미드 유형 분류',
    '3점',
    '제시된 두 국가의 인구 피라미드 형태를 분류하고 출생률, 사망률, 부양비, 고령화율 지표를 비교하여 서술하시오.',
    q1Lines,
    q1Text,
    q1BoxH
  );

  drawPrompt(
    2,
    '문제 2. 인구 문제 원인 및 미래 사회 파급 효과 및 맞춤형 정책',
    '5점',
    '두 국가가 직면한 인구 문제의 사회·경제적 원인을 정확하게 기술하고, 각 국가별 미래 사회 파급 효과(노동력, 경제 성장 등)와 맞춤형 정책(제도적 및 사회문화/기술적 대안)을 모두 정확하게 서술하시오.',
    q2Lines,
    q2Text,
    q2BoxH
  );

  // Grade sheet if evaluation exists
  if (evaluationResult) {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, cursorY);
    ctx.lineTo(canvas.width - paddingX, cursorY);
    ctx.stroke();
    cursorY += 18;

    ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('[채점 기록표 / 평가 기준 루브릭]', paddingX, cursorY);
    cursorY += 16;

    const colW = contentWidth / 3;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(paddingX, cursorY, contentWidth, 65);

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(paddingX, cursorY, contentWidth, 30);
    ctx.beginPath();
    ctx.moveTo(paddingX, cursorY + 30);
    ctx.lineTo(paddingX + contentWidth, cursorY + 30);
    for (let i = 1; i < 3; i++) {
      ctx.moveTo(paddingX + colW * i, cursorY);
      ctx.lineTo(paddingX + colW * i, cursorY + 65);
    }
    ctx.stroke();

    ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('문항 1: 피라미드 분석 (5점)', paddingX + colW * 0 + colW / 2, cursorY + 15);
    ctx.fillText('문항 2: 원인·파급효과·맞춤형정책 (5점)', paddingX + colW * 1 + colW / 2, cursorY + 15);
    ctx.fillText('총점 (10점 만점)', paddingX + colW * 2 + colW / 2, cursorY + 15);

    const q1ScoreText = isTeacher && evaluationResult ? `${evaluationResult.q1Score} / 5` : '   / 5';
    const q2ScoreText = isTeacher && evaluationResult ? `${evaluationResult.q2Score} / 5` : '   / 5';
    const totalScoreText = isTeacher && evaluationResult ? `${evaluationResult.totalScore} / 10 (${evaluationResult.gradeLevel})` : '   / 10';

    ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
    ctx.fillText(q1ScoreText, paddingX + colW * 0 + colW / 2, cursorY + 48);
    ctx.fillText(q2ScoreText, paddingX + colW * 1 + colW / 2, cursorY + 48);

    ctx.fillStyle = isTeacher && evaluationResult ? '#4f46e5' : '#0f172a';
    ctx.fillText(totalScoreText, paddingX + colW * 2 + colW / 2, cursorY + 48);
  }

  return canvas;
}

/**
 * Direct export functions that guarantee complete student answers in PDF!
 */
export async function exportSubmissionConfirmationPdf(
  submission: StudentSubmission,
  fileName?: string
): Promise<boolean> {
  const studentTag = submission.studentName ? `${submission.studentId}_${submission.studentName}` : '학생';
  const finalFileName = fileName || `세계인구탐구_수행평가_제출확인서_${studentTag}_${submission.verificationCode}.pdf`;
  const canvas = renderStudentSubmissionToCanvas(submission);
  return canvasToPdf(canvas, finalFileName);
}

export async function exportCertificatePdf(
  submission: StudentSubmission,
  fileName?: string
): Promise<boolean> {
  const studentTag = submission.studentName ? `${submission.studentId}_${submission.studentName}` : '학생';
  const finalFileName = fileName || `세계인구탐구_수행평가_공식성적확인서_${studentTag}_${submission.verificationCode}.pdf`;
  const canvas = renderOfficialCertificateToCanvas(submission);
  return canvasToPdf(canvas, finalFileName);
}

export async function exportWorksheetPdf(
  params: {
    formState: AssessmentFormState;
    countryA: CountryData;
    countryB: CountryData;
    evaluationResult?: AiEvaluationResponse | null;
    printMode: 'student-result' | 'blank' | 'teacher-rubric';
    submission?: StudentSubmission | null;
    isTeacher?: boolean;
  },
  fileName?: string
): Promise<boolean> {
  const studentTag = params.formState.studentName
    ? `${params.formState.studentId}_${params.formState.studentName}`
    : '활동지';
  const finalFileName = fileName || `세계인구탐구_수행평가_${studentTag}_${params.printMode}.pdf`;
  const canvas = renderWorksheetToCanvas(params);
  return canvasToPdf(canvas, finalFileName);
}

/**
 * Universal fallback element-to-PDF export function.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string = '세계인구탐구_수행평가.pdf'
): Promise<boolean> {
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    fileName += '.pdf';
  }

  try {
    // Attempt html2canvas with unconstrained clone
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
      width: element.scrollWidth || 1000,
      height: element.scrollHeight || element.offsetHeight,
      scrollY: 0,
      scrollX: 0,
      onclone: (clonedDoc: Document) => {
        const clonedRoot = clonedDoc.querySelector(`[id="${element.id}"]`) as HTMLElement || clonedDoc.body;
        if (clonedRoot) {
          clonedRoot.style.maxHeight = 'none';
          clonedRoot.style.height = 'auto';
          clonedRoot.style.overflow = 'visible';
        }
        const scrollables = clonedDoc.querySelectorAll('.overflow-y-auto, [class*="max-h-"]');
        scrollables.forEach((el) => {
          const h = el as HTMLElement;
          h.style.maxHeight = 'none';
          h.style.height = 'auto';
          h.style.overflow = 'visible';
        });
      },
    });

    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return canvasToPdf(canvas, fileName);
    }
  } catch (err) {
    console.warn('html2canvas failed, attempting canvas reconstruction:', err);
  }

  return false;
}

/**
 * Cleanly prints the assessment worksheet by creating an isolated iframe
 * with dedicated A4 print styles (works consistently across all browsers & iframes).
 */
export function printWorksheetHtml(title: string, printableHtml: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 10.5pt;
            line-height: 1.55;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .worksheet-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          th, td {
            border: 1px solid #1e293b;
            padding: 6px 10px;
            text-align: left;
            font-size: 9.5pt;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: bold;
            text-align: center;
          }
          .header-title {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .sub-tag {
            font-size: 8.5pt;
            font-weight: bold;
            color: #475569;
            margin-bottom: 3px;
          }
          .main-title {
            font-size: 15pt;
            font-weight: 900;
            color: #020617;
            letter-spacing: -0.3px;
          }
          .meta-desc {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 3px;
          }
          .section-box {
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .prompt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .prompt-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #0f172a;
          }
          .score-badge {
            font-size: 8.5pt;
            font-weight: 900;
            background: #e2e8f0 !important;
            padding: 2px 8px;
            border-radius: 4px;
          }
          .prompt-desc {
            font-size: 9pt;
            color: #334155;
            margin-bottom: 6px;
            line-height: 1.45;
          }
          .answer-box {
            border: 1px solid #94a3b8;
            border-radius: 4px;
            padding: 10px 12px;
            background-color: #f8fafc !important;
            min-height: 85px;
            font-size: 9.5pt;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .answer-box.blank {
            min-height: 120px;
            background-color: #ffffff !important;
          }
          .grade-sheet {
            margin-top: 16px;
            padding-top: 10px;
            border-top: 2px solid #0f172a;
            page-break-inside: avoid;
          }
          .grade-title {
            font-size: 9.5pt;
            font-weight: bold;
            margin-bottom: 6px;
          }
          .feedback-box {
            margin-top: 8px;
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #f8fafc !important;
            font-size: 8.5pt;
            color: #334155;
          }
        </style>
      </head>
      <body>
        <div class="worksheet-container">
          ${printableHtml}
        </div>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe failed:', err);
        window.print();
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 400);
  } catch (e) {
    console.error('printWorksheetHtml error:', e);
    window.print();
  }
}
