import type { ConflictCheckResultDTO } from '@legal/shared';

interface ConflictCheckCardProps {
  check: ConflictCheckResultDTO;
  onArchive?: (checkId: string) => void;
}

export default function ConflictCheckCard({ check, onArchive }: ConflictCheckCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        check.hasConflict
          ? 'border-red-200 bg-red-50'
          : 'border-green-200 bg-green-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              check.hasConflict ? 'bg-red-100' : 'bg-green-100'
            }`}
          >
            {check.hasConflict ? '⚠️' : '✅'}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {check.hasConflict ? '存在利益冲突' : '无利益冲突'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              检查人: {check.checkedBy} · {check.checkedAt ? new Date(check.checkedAt).toLocaleString('zh-CN') : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.archivedAt ? (
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
              已归档
            </span>
          ) : (
            onArchive && (
              <button
                onClick={() => onArchive(check.caseId)}
                className="text-xs bg-white border border-slate-300 text-slate-600 px-3 py-1 rounded-md hover:bg-slate-50 transition-colors"
              >
                归档
              </button>
            )
          )}
        </div>
      </div>

      {check.hasConflict && check.conflictDetails && (
        <div className="mt-3 bg-white rounded-md p-3 border border-red-100">
          <p className="text-sm text-red-700">{check.conflictDetails}</p>
        </div>
      )}

      {check.hasConflict && check.conflictingCaseIds && check.conflictingCaseIds.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">冲突案件:</p>
          <div className="flex flex-wrap gap-1.5">
            {check.conflictingCaseIds.map((id) => (
              <span
                key={id}
                className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
