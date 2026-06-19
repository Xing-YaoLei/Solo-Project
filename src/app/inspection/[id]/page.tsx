'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { ANNOTATION_TYPE_LABELS, AnnotationType } from '@/types';

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { inspections } = useDashboardStore();
  const inspection = inspections.find((i) => i.id === params.id);

  const [annotations, setAnnotations] = useState(inspection?.annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentType, setCurrentType] = useState<AnnotationType>('scratch');
  const [currentRemark, setCurrentRemark] = useState('');
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  if (!inspection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-industrial-900 text-industrial-300">
        未找到该质检记录
      </div>
    );
  }

  const getPercentCoords = (clientX: number, clientY: number) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPercentCoords(e.clientX, e.clientY);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) return;
    const pos = getPercentCoords(e.clientX, e.clientY);
    setCurrentBox({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && currentBox.w > 2 && currentBox.h > 2) {
      const newAnn = {
        id: `ann-${Date.now()}`,
        type: currentType,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.w,
        height: currentBox.h,
        remark: currentRemark || ANNOTATION_TYPE_LABELS[currentType],
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setCurrentRemark('');
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-industrial-900">
      <div className="sticky top-0 z-40 border-b border-industrial-700 bg-industrial-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 rounded-md border border-industrial-600 bg-industrial-800 px-3 py-1.5 text-xs font-medium text-industrial-200 transition hover:bg-industrial-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回仪表盘
            </button>
            <div>
              <h1 className="font-display text-base font-bold text-white">质检详情 · {inspection.vehiclePlate}</h1>
              <p className="text-[11px] text-industrial-400">工单号: {inspection.workorderId}</p>
            </div>
          </div>

          {inspection.hasAnomaly && (
            <span className="flex items-center gap-1.5 rounded-md border border-risk-danger/50 bg-risk-danger/10 px-3 py-1.5 text-xs font-semibold text-risk-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              {annotations.length} 处异常标注
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-industrial-700 bg-industrial-800/60 p-4">
          <div
            className="relative select-none overflow-hidden rounded-lg bg-industrial-900"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={inspection.photoUrl}
              alt="质检照片"
              className="w-full cursor-crosshair"
              draggable={false}
            />
            {annotations.map((ann, idx) => (
              <div
                key={ann.id}
                className="group absolute border-2 border-risk-danger"
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  width: `${ann.width}%`,
                  height: `${ann.height}%`,
                  backgroundColor: 'rgba(220, 38, 38, 0.15)',
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-risk-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {idx + 1}. {ANNOTATION_TYPE_LABELS[ann.type]}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(ann.id);
                  }}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-risk-danger text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {currentBox && (
              <div
                className="absolute border-2 border-dashed border-risk-warning bg-risk-warning/20"
                style={{
                  left: `${currentBox.x}%`,
                  top: `${currentBox.y}%`,
                  width: `${currentBox.w}%`,
                  height: `${currentBox.h}%`,
                }}
              />
            )}
          </div>
          <p className="mt-3 text-[11px] text-industrial-400">
            💡 提示：在照片上按住鼠标拖动画框即可添加异常标注
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-industrial-700 bg-industrial-800/60 p-4">
            <h3 className="mb-3 font-display text-sm font-bold text-white">添加标注</h3>

            <div className="mb-3">
              <label className="mb-1.5 block text-[11px] font-semibold text-industrial-300">异常类型</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(ANNOTATION_TYPE_LABELS) as AnnotationType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setCurrentType(t)}
                    className={`rounded-md border p-2 text-[11px] transition ${
                      currentType === t
                        ? 'border-risk-info bg-risk-info/15 font-semibold text-risk-info'
                        : 'border-industrial-700 bg-industrial-900 text-industrial-300 hover:border-industrial-500'
                    }`}
                  >
                    {ANNOTATION_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-[11px] font-semibold text-industrial-300">备注</label>
              <input
                type="text"
                value={currentRemark}
                onChange={(e) => setCurrentRemark(e.target.value)}
                placeholder="可选：异常描述"
                className="w-full rounded-md border border-industrial-700 bg-industrial-900 px-3 py-2 text-xs text-white placeholder-industrial-500 outline-none focus:border-risk-info"
              />
            </div>
          </div>

          <div className="rounded-xl border border-industrial-700 bg-industrial-800/60 p-4">
            <h3 className="mb-3 flex items-center justify-between font-display text-sm font-bold text-white">
              标注列表
              <span className="text-[11px] font-normal text-industrial-400">{annotations.length} 项</span>
            </h3>
            <div className="max-h-[300px] space-y-2 overflow-auto">
              {annotations.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-industrial-500">暂无标注，在照片上画框添加</p>
              ) : (
                annotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-industrial-700 bg-industrial-900 p-2.5"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-risk-danger text-[9px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="rounded bg-risk-danger/15 px-1.5 py-0.5 text-[10px] font-medium text-risk-danger">
                          {ANNOTATION_TYPE_LABELS[ann.type]}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-industrial-300">{ann.remark}</p>
                    </div>
                    <button
                      onClick={() => deleteAnnotation(ann.id)}
                      className="rounded p-1 text-industrial-500 transition hover:bg-risk-danger/20 hover:text-risk-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-risk-info py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600">
            <Save className="h-3.5 w-3.5" />
            保存标注
          </button>
        </div>
      </div>
    </div>
  );
}
