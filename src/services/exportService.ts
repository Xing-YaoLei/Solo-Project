import type { FilterParams, Hearing } from '@/types';
import { formatDate, generateFilterHash, getAttendanceStatusLabel } from '@/lib/utils';

export function getFilterDescription(filters: FilterParams): string {
  const parts: string[] = [];

  if (filters.dateRange) {
    parts.push(
      `时间范围: ${formatDate(filters.dateRange.start)} 至 ${formatDate(filters.dateRange.end)}`
    );
  }
  if (filters.caseTypes && filters.caseTypes.length > 0) {
    parts.push(`案件类型: ${filters.caseTypes.join(', ')}`);
  }
  if (filters.attendanceStatuses && filters.attendanceStatuses.length > 0) {
    parts.push(
      `到场状态: ${filters.attendanceStatuses.map(getAttendanceStatusLabel).join(', ')}`
    );
  }
  if (filters.hasConflicts !== undefined) {
    parts.push(`利益冲突: ${filters.hasConflicts ? '有' : '无'}`);
  }
  if (filters.timeSlots && filters.timeSlots.length > 0) {
    parts.push(`时段: ${filters.timeSlots.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '全部数据';
}

export async function captureScreenshot(
  element: HTMLElement,
  filters: FilterParams,
  title: string
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('captureScreenshot can only be called in the browser');
  }

  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    backgroundColor: '#f8fafc',
    scale: 2,
    useCORS: true,
  });

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(30, 58, 95, 0.9)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Noto Sans SC';
    ctx.textAlign = 'left';
    ctx.fillText(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 20, canvas.height - 35);
    ctx.fillText(`筛选条件: ${getFilterDescription(filters)}`, 20, canvas.height - 15);

    const filterHash = generateFilterHash(filters as unknown as Record<string, unknown>);
    ctx.textAlign = 'right';
    ctx.fillText(`取数标识: ${filterHash.slice(0, 16)}...`, canvas.width - 20, canvas.height - 25);
  }

  return canvas.toDataURL('image/png');
}

export async function exportToPDF(
  element: HTMLElement,
  filters: FilterParams,
  title: string
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('exportToPDF can only be called in the browser');
  }

  const { default: jsPDF } = await import('jspdf');
  const dataUrl = await captureScreenshot(element, filters, title);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 20;
  const imgHeight = (imgWidth * 297) / 420;

  pdf.setFontSize(16);
  pdf.text(title, pageWidth / 2, 20, { align: 'center' });

  pdf.setFontSize(10);
  pdf.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 10, 35);
  pdf.text(`筛选条件: ${getFilterDescription(filters)}`, 10, 45);

  const filterHash = generateFilterHash(filters as unknown as Record<string, unknown>);
  pdf.text(`取数标识: ${filterHash}`, pageWidth - 10, 45, { align: 'right' });

  pdf.addImage(dataUrl, 'PNG', 10, 55, imgWidth, imgHeight);

  pdf.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function exportToExcel(
  data: Hearing[],
  filters: FilterParams,
  fileName: string
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('exportToExcel can only be called in the browser');
  }

  const XLSX = await import('xlsx');

  const exportData = data.map((h) => ({
    '案件编号': h.case?.caseNumber || '',
    '案件名称': h.case?.caseName || '',
    '案件类型': h.case?.caseType || '',
    '当事人': h.case?.clientName || '',
    '开庭日期': formatDate(h.hearingDate),
    '开庭时间': h.hearingTime,
    '法庭': h.court,
    '法官': h.judge || '',
    '到场状态': getAttendanceStatusLabel(h.attendanceStatus),
    '是否有冲突': h.hasConflict ? '是' : '否',
    '容量规则': h.capacityRule || '',
    '异常说明': h.anomalyExplanation || '',
    '案件系统版本': h.caseSystemVersion,
    '日历工具版本': h.calendarToolVersion,
    '邮件附件版本': h.emailAttachmentVersion,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '开庭数据');

  const filterInfo = [
    { '筛选条件': getFilterDescription(filters) },
    { '导出时间': new Date().toLocaleString('zh-CN') },
    { '取数标识': generateFilterHash(filters as unknown as Record<string, unknown>) },
  ];
  const filterWs = XLSX.utils.json_to_sheet(filterInfo);
  filterWs['!cols'] = [{ wch: 15 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, filterWs, '筛选说明');

  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function generateShareLink(filters: FilterParams): string {
  if (typeof window === 'undefined') {
    const filterHash = generateFilterHash(filters as unknown as Record<string, unknown>);
    return `http://localhost:3000/export?filters=${encodeURIComponent(filterHash)}`;
  }
  const filterHash = generateFilterHash(filters as unknown as Record<string, unknown>);
  return `${window.location.origin}${window.location.pathname}?filters=${encodeURIComponent(filterHash)}`;
}
