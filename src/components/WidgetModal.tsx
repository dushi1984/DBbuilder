"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  SPANS,
  WIDGET_TYPES,
  type QueryResult,
  type Widget,
  type WidgetType,
} from "@/lib/types";
import { Icon } from "./Icon";
import { ResultTable } from "./ResultTable";

const EXAMPLES: Record<WidgetType, string> = {
  kpi: `SELECT round(sum(unit_price * quantity)) AS value,
       'Revenue, last 12 months' AS sub
FROM orders
WHERE status <> 'cancelled'`,
  bar: `SELECT to_char(ordered_at, 'YYYY-MM') AS month,
       round(sum(unit_price * quantity)) AS revenue
FROM orders
WHERE status <> 'cancelled'
GROUP BY 1 ORDER BY 1`,
  line: `SELECT to_char(ordered_at, 'YYYY-MM') AS month,
       count(*) AS orders
FROM orders
GROUP BY 1 ORDER BY 1`,
  area: `SELECT to_char(ordered_at, 'YYYY-MM') AS month,
       round(avg(quantity * unit_price)) AS avg_value
FROM orders
GROUP BY 1 ORDER BY 1`,
  pie: `SELECT channel AS name,
       round(sum(unit_price * quantity)) AS revenue
FROM orders
WHERE status <> 'cancelled'
GROUP BY 1 ORDER BY 2 DESC`,
  table: `SELECT p.name AS product,
       count(o.id) AS orders,
       round(sum(o.unit_price * o.quantity)) AS revenue
FROM orders o JOIN products p ON p.id = o.product_id
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 10`,
};

export function WidgetModal({
  dashboardId,
  existing,
  onClose,
  onSaved,
}: {
  dashboardId: string;
  existing: Widget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<WidgetType>(existing?.type ?? "bar");
  const [span, setSpan] = useState(existing?.span ?? 6);
  const [sqlText, setSqlText] = useState(
    existing?.sql ?? EXAMPLES[existing?.type ?? "bar"]
  );
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const r = await api<QueryResult>("/api/query", {
        method: "POST",
        body: JSON.stringify({ sql: sqlText }),
      });
      setTestResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    if (!name.trim()) {
      setError("Widget name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await api(`/api/widgets/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, sql: sqlText, type, span }),
        });
      } else {
        await api("/api/widgets", {
          method: "POST",
          body: JSON.stringify({ dashboardId, name, sql: sqlText, type, span }),
        });
      }
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-8"
      onMouseDown={onClose}
    >
      <div
        className="card flex max-h-[calc(100vh-64px)] w-full max-w-2xl flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="text-sm font-semibold">
            {existing ? "Edit widget" : "New widget"}
          </h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-auto p-4">
          <div className="grid grid-cols-[1fr_160px_144px] items-end gap-4">
            <div>
              <label className="label mb-2 block" htmlFor="w-name">
                Name
              </label>
              <input
                id="w-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly revenue"
                autoFocus
              />
            </div>
            <div>
              <label className="label mb-2 block" htmlFor="w-type">
                Type
              </label>
              <select
                id="w-type"
                className="input cursor-pointer"
                value={type}
                onChange={(e) => setType(e.target.value as WidgetType)}
              >
                {WIDGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-2 block" htmlFor="w-span">
                Width
              </label>
              <select
                id="w-span"
                className="input cursor-pointer"
                value={span}
                onChange={(e) => setSpan(Number(e.target.value))}
              >
                {SPANS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label">SQL command</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                  onClick={() => setSqlText(EXAMPLES[type])}
                >
                  Use example
                </button>
                <span className="h-4 w-px bg-line" />
                <button
                  type="button"
                  className="btn h-7 px-2 text-xs"
                  onClick={runTest}
                  disabled={testing}
                >
                  <Icon name="play" size={12} />
                  {testing ? "Running…" : "Test query"}
                </button>
              </div>
            </div>
            <textarea
              className="h-48 w-full cursor-text rounded border border-line bg-surface p-2 font-mono text-xs leading-5 text-ink placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={sqlText}
              onChange={(e) => {
                setSqlText(e.target.value);
                setTestResult(null);
              }}
              spellCheck={false}
              placeholder="SELECT …"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded border border-accent/30 bg-accent-tint px-4 py-2 text-[13px] text-accent">
              <Icon name="alert" size={16} className="mt-px shrink-0" />
              <span className="min-w-0 break-words font-mono text-xs leading-5">
                {error}
              </span>
            </div>
          )}

          {testResult && (
            <div>
              <div className="mb-2 text-xs text-ink-3">
                {testResult.rowCount} rows · {testResult.ms} ms
              </div>
              <div className="h-48 overflow-hidden rounded border border-line">
                <ResultTable
                  columns={testResult.columns}
                  rows={testResult.rows.slice(0, 100)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-4">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={saving || testing}
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Add widget"}
          </button>
        </div>
      </div>
    </div>
  );
}
