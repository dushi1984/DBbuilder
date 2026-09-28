"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { QueryResult, SchemaTable } from "@/lib/types";
import { ResultTable } from "@/components/ResultTable";
import { Icon } from "@/components/Icon";

const SAMPLE_QUERY = `SELECT to_char(ordered_at, 'YYYY-MM') AS month,
       round(sum(unit_price * quantity)) AS revenue,
       count(*) AS orders
FROM orders
WHERE status <> 'cancelled'
GROUP BY 1
ORDER BY 1`;

export default function DataPage() {
  const [tab, setTab] = useState<"tables" | "query">("tables");

  /* ------------------------------- Tables tab ------------------------------ */
  const [tables, setTables] = useState<SchemaTable[] | null>(null);
  const [schemaErr, setSchemaErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<QueryResult | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  const loadSchema = useCallback(async () => {
    try {
      const res = await api<{ tables: SchemaTable[] }>("/api/schema");
      setTables(res.tables);
      setSchemaErr(null);
      setSelected((cur) => {
        if (cur && res.tables.some((t) => t.name === cur)) return cur;
        if (res.tables.length === 0) return null;
        return (
          res.tables.find((t) => t.name === "orders") ?? res.tables[0]
        ).name;
      });
    } catch (e) {
      setTables([]);
      setSchemaErr((e as Error).message);
    }
  }, []);

  const loadPreview = useCallback(async (table: string) => {
    setPreview(null);
    setPreviewErr(null);
    try {
      const r = await api<QueryResult>("/api/query", {
        method: "POST",
        body: JSON.stringify({ sql: `SELECT * FROM "${table}" LIMIT 50` }),
      });
      setPreview(r);
    } catch (e) {
      setPreviewErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  useEffect(() => {
    if (selected) loadPreview(selected);
  }, [selected, loadPreview]);

  const activeTable = tables?.find((t) => t.name === selected) ?? null;

  /* ------------------------------- Query tab ------------------------------- */
  const [sqlText, setSqlText] = useState(SAMPLE_QUERY);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [qerr, setQerr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setQerr(null);
    setResult(null);
    try {
      const r = await api<QueryResult>("/api/query", {
        method: "POST",
        body: JSON.stringify({ sql: sqlText }),
      });
      setResult(r);
      if (r.command && r.command.split(" · ").some((c) => c !== "SELECT")) {
        loadSchema();
      }
    } catch (e) {
      setQerr((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-ink">Data</h1>
        <span className="text-xs text-ink-3">
          Full SQL access · SELECT results capped at 1,000 rows
        </span>
      </div>

      {schemaErr && (
        <div className="mt-4 flex items-start gap-2 rounded border border-accent/30 bg-accent-tint px-4 py-2 text-xs text-accent">
          <Icon name="alert" size={14} className="mt-px shrink-0" />
          <span className="min-w-0 break-words leading-5">{schemaErr}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-8 border-b border-line">
        <button
          type="button"
          className={`tab ${tab === "tables" ? "tab-active" : ""}`}
          onClick={() => setTab("tables")}
        >
          <Icon name="db" size={16} />
          Tables
        </button>
        <button
          type="button"
          className={`tab ${tab === "query" ? "tab-active" : ""}`}
          onClick={() => setTab("query")}
        >
          <Icon name="terminal" size={16} />
          Query
        </button>
      </div>

      {tab === "tables" && (
        <div className="mt-4 grid grid-cols-[280px_1fr] items-start gap-4">
          <div className="card p-2">
            {tables === null ? (
              <div className="flex h-8 items-center justify-center text-xs text-ink-3">
                Loading schema…
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {tables.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setSelected(t.name)}
                    className={`flex h-8 items-center justify-between gap-2 rounded px-2 text-left transition-colors ${
                      selected === t.name
                        ? "bg-primary-tint text-primary"
                        : "text-ink-2 hover:bg-raised hover:text-ink"
                    }`}
                  >
                    <span className="truncate font-mono text-xs">
                      {t.name}
                    </span>
                    <span
                      className={`text-xs ${selected === t.name ? "text-primary/70" : "text-ink-3"}`}
                    >
                      {t.rowCount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTable ? (
            <div className="card overflow-hidden">
              <div className="flex h-12 items-center justify-between border-b border-line px-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[13px] font-medium text-ink">
                    {activeTable.name}
                  </span>
                  <span className="text-xs text-ink-3">
                    {activeTable.rowCount.toLocaleString()} rows ·{" "}
                    {activeTable.columns.length} columns
                  </span>
                </div>
                <button
                  type="button"
                  className="btn h-7 px-2 text-xs"
                  onClick={() => loadPreview(activeTable.name)}
                >
                  <Icon name="refresh" size={12} />
                  Reload
                </button>
              </div>

              <div className="border-b border-line px-4 py-4">
                <div className="label mb-2">Columns</div>
                <div className="flex flex-wrap gap-2">
                  {activeTable.columns.map((c) => (
                    <span
                      key={c.name}
                      className="inline-flex items-center gap-2 rounded border border-line bg-raised px-2 py-1 font-mono text-xs text-ink"
                    >
                      {c.primary && (
                        <span className="rounded bg-primary-tint px-1 text-[10px] font-medium text-primary">
                          PK
                        </span>
                      )}
                      {c.name}
                      <span className="text-ink-3">{c.type}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <div className="label mb-2">Preview · first 50 rows</div>
                {previewErr && (
                  <div className="flex items-start gap-2 rounded border border-accent/30 bg-accent-tint px-4 py-2 text-xs text-accent">
                    <Icon name="alert" size={14} className="mt-px shrink-0" />
                    <span className="font-mono">{previewErr}</span>
                  </div>
                )}
                <div className="h-80 overflow-hidden rounded border border-line">
                  {preview ? (
                    <ResultTable
                      columns={preview.columns}
                      rows={preview.rows}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-ink-3">
                      {previewErr ? "" : "Loading preview…"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-line-strong bg-surface px-8 py-16 text-center text-[13px] text-ink-2">
              Select a table to inspect its columns and rows.
            </div>
          )}
        </div>
      )}

      {tab === "query" && (
        <div className="card mt-4 overflow-hidden">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="text-[13px] font-medium text-ink">SQL console</span>
            <span className="text-xs text-ink-3">
              SELECT, DML and DDL allowed · multi-statement OK
            </span>
          </div>
          <div className="p-4">
            <textarea
              className="h-48 w-full cursor-text rounded border border-line bg-surface p-2 font-mono text-xs leading-5 text-ink placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              spellCheck={false}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
              }}
            />
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={run}
                disabled={running}
              >
                <Icon name="play" size={14} />
                {running ? "Running…" : "Run query"}
              </button>
              <span className="text-xs text-ink-3">
                Cmd/Ctrl + Enter to run
              </span>
            </div>

            {qerr && (
              <div className="mt-4 flex items-start gap-2 rounded border border-accent/30 bg-accent-tint px-4 py-2 text-xs text-accent">
                <Icon name="alert" size={14} className="mt-px shrink-0" />
                <span className="min-w-0 break-words font-mono leading-5">
                  {qerr}
                </span>
              </div>
            )}

            {result && (
              <div className="mt-4">
                <div className="mb-2 text-xs text-ink-3">
                  {result.command ? `${result.command} · ` : ""}
                  {result.rowCount} rows · {result.ms} ms
                </div>
                <div className="h-80 overflow-hidden rounded border border-line">
                  <ResultTable columns={result.columns} rows={result.rows} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
