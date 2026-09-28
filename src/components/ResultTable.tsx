"use client";

import { fmtCell, isNumericColumn } from "@/lib/api";

export function ResultTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink-3">
        No rows returned
      </div>
    );
  }

  return (
    <div className="table-scroll h-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className={`sticky top-0 z-10 whitespace-nowrap border-b border-line bg-raised px-2 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-3 ${
                  isNumericColumn(rows, c) ? "text-right" : "text-left"
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-raised">
              {columns.map((c) => {
                const v = r[c];
                const empty = v === null || v === undefined;
                return (
                  <td
                    key={c}
                    className={`whitespace-nowrap border-b border-line/60 px-2 py-2 font-mono text-xs ${
                      isNumericColumn(rows, c) ? "text-right" : "text-left"
                    } ${empty ? "text-ink-3" : "text-ink"}`}
                  >
                    {empty ? "—" : fmtCell(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
