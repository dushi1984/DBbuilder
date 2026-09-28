"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, relTime } from "@/lib/api";
import type { QueryResult, Widget, WidgetState } from "@/lib/types";
import { WidgetChart } from "@/components/Charts";
import { WidgetModal } from "@/components/WidgetModal";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ExportButtons } from "@/components/ExportButtons";
import { Icon } from "@/components/Icon";

const TYPE_ICONS: Record<string, string> = {
  kpi: "gauge",
  bar: "bar",
  line: "line",
  area: "line",
  pie: "pie",
  table: "table",
};

export default function DashboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [widgets, setWidgets] = useState<Widget[] | null>(null);
  const [states, setStates] = useState<Record<string, WidgetState>>({});
  const [modal, setModal] = useState<{ widget: Widget | null } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const anyLoading =
    widgets === null ||
    widgets.some((w) => !states[w.id] || states[w.id].status === "loading");

  const loadData = useCallback(async (list: Widget[]) => {
    setStates(
      Object.fromEntries(list.map((w) => [w.id, { status: "loading" as const }]))
    );
    await Promise.all(
      list.map(async (w) => {
        try {
          const d = await api<QueryResult>(`/api/widgets/${w.id}/run`);
          setStates((s) => ({ ...s, [w.id]: { status: "ready", data: d } }));
        } catch (e) {
          setStates((s) => ({
            ...s,
            [w.id]: { status: "error", error: (e as Error).message },
          }));
        }
      })
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await api<{
        dashboard: { id: string; name: string; updatedAt: string };
        widgets: Widget[];
      }>(`/api/dashboards/${id}`);
      setName(res.dashboard.name);
      setUpdatedAt(res.dashboard.updatedAt);
      setWidgets(res.widgets);
      await loadData(res.widgets);
    } catch {
      setNotFound(true);
    }
  }, [id, loadData]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    if (!widgets) return;
    setBusy(true);
    await loadData(widgets);
    setBusy(false);
  }

  async function removeWidget(widgetId: string) {
    await api(`/api/widgets/${widgetId}`, { method: "DELETE" });
    await load();
  }

  async function commitRename() {
    setRenaming(false);
    const next = nameDraft.trim();
    if (!next || next === name) return;
    try {
      await api(`/api/dashboards/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: next }),
      });
      setName(next);
      setUpdatedAt(new Date().toISOString());
    } catch {
      setNameDraft(name);
    }
  }

  function onDrop(targetId: string) {
    setOverId(null);
    if (!dragId || dragId === targetId || !widgets) return;
    const list = [...widgets];
    const fromIdx = list.findIndex((w) => w.id === dragId);
    if (fromIdx === -1) return;
    const [moved] = list.splice(fromIdx, 1);
    const toIdx = list.findIndex((w) => w.id === targetId);
    list.splice(toIdx, 0, moved);
    setWidgets(list);
    api(`/api/dashboards/${id}/order`, {
      method: "PATCH",
      body: JSON.stringify({ ids: list.map((w) => w.id) }),
    }).catch(() => {});
    setDragId(null);
  }

  if (notFound) {
    return (
      <div className="rounded border border-dashed border-line-strong bg-surface px-8 py-16 text-center">
        <div className="text-sm font-semibold text-ink">
          Dashboard not found
        </div>
        <button type="button" className="btn mt-4" onClick={() => router.push("/dashboards")}>
          <Icon name="chevronLeft" size={14} />
          Back to dashboards
        </button>
      </div>
    );
  }

  return (
    <div id="print-area">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="btn-icon no-print"
            aria-label="Back to dashboards"
            onClick={() => router.push("/dashboards")}
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          {renaming ? (
            <input
              className="input w-72"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setNameDraft(name);
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <>
              <h1 className="truncate text-lg font-semibold text-ink">
                {name}
              </h1>
              <button
                type="button"
                className="btn-icon no-print"
                aria-label="Rename dashboard"
                onClick={() => {
                  setNameDraft(name);
                  setRenaming(true);
                }}
              >
                <Icon name="pencil" size={14} />
              </button>
            </>
          )}
        </div>
        <div className="no-print flex shrink-0 items-center gap-2">
          <ExportButtons
            targetId="print-area"
            title={name}
            disabled={anyLoading}
          />
          <button type="button" className="btn" onClick={refresh} disabled={busy}>
            <Icon
              name="refresh"
              size={14}
              className={busy ? "animate-spin" : undefined}
            />
            {busy ? "Refreshing" : "Refresh"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModal({ widget: null })}
          >
            <Icon name="plus" size={14} />
            New widget
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-ink-3">
        {widgets === null
          ? "Loading…"
          : `${widgets.length} ${widgets.length === 1 ? "widget" : "widgets"} · updated ${relTime(updatedAt)}`}
      </div>

      <div className="mt-4">
        {widgets === null ? (
          <div className="grid grid-cols-12 gap-4" aria-hidden>
            <div className="col-span-3 h-32 animate-pulse rounded border border-line bg-surface" />
            <div className="col-span-3 h-32 animate-pulse rounded border border-line bg-surface" />
            <div className="col-span-6 h-80 animate-pulse rounded border border-line bg-surface" />
            <div className="col-span-12 h-80 animate-pulse rounded border border-line bg-surface" />
          </div>
        ) : widgets.length === 0 ? (
          <div className="rounded border border-dashed border-line-strong bg-surface px-8 py-16 text-center">
            <div className="text-sm font-semibold text-ink">
              No widgets on this dashboard yet
            </div>
            <p className="mt-2 text-[13px] text-ink-2">
              Add a widget backed by a SELECT command to get started.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setModal({ widget: null })}
            >
              <Icon name="plus" size={14} />
              New widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            {widgets.map((w) => {
              const st = states[w.id];
              return (
                <section
                  key={w.id}
                  style={{ gridColumn: `span ${w.span} / span ${w.span}` }}
                  className={`card flex flex-col overflow-hidden transition-colors ${
                    overId === w.id && dragId && dragId !== w.id
                      ? "border-primary"
                      : ""
                  } ${dragId === w.id ? "opacity-50" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragId) setOverId(w.id);
                  }}
                  onDragLeave={() =>
                    setOverId((o) => (o === w.id ? null : o))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(w.id);
                  }}
                >
                  <header className="flex h-10 shrink-0 items-center border-b border-line pl-2 pr-1">
                    <span
                      draggable
                      onDragStart={(e) => {
                        setDragId(w.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverId(null);
                      }}
                      className="no-print cursor-grab px-1 text-ink-3 transition-colors hover:text-ink active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <Icon name="grip" size={14} />
                    </span>
                    <h3 className="min-w-0 flex-1 truncate px-2 text-[13px] font-medium text-ink">
                      {w.name}
                    </h3>
                    <span
                      className="flex items-center px-1 text-ink-3"
                      title={`${w.type} widget`}
                    >
                      <Icon name={TYPE_ICONS[w.type] ?? "table"} size={14} />
                    </span>
                    <button
                      type="button"
                      className="btn-icon no-print"
                      aria-label={`Edit ${w.name}`}
                      onClick={() => setModal({ widget: w })}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <span className="no-print">
                      <ConfirmDelete onConfirm={() => removeWidget(w.id)} />
                    </span>
                  </header>

                  <div
                    className={
                      w.type === "kpi"
                        ? "widget-body h-24 p-4"
                        : `widget-body widget-body-${w.type} h-80 p-4`
                    }
                  >
                    {(!st || st.status === "loading") && (
                      <div className="flex h-full items-center justify-center text-xs text-ink-3">
                        Running query…
                      </div>
                    )}
                    {st && st.status === "error" && (
                      <div className="flex h-full flex-col items-start justify-center gap-2">
                        <div className="flex items-start gap-2 text-accent">
                          <Icon name="alert" size={16} className="mt-px shrink-0" />
                          <span className="min-w-0 break-words font-mono text-xs leading-5">
                            {st.error}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="no-print btn h-7 px-2 text-xs"
                          onClick={() => setModal({ widget: w })}
                        >
                          Fix query
                        </button>
                      </div>
                    )}
                    {st && st.status === "ready" && (
                      <WidgetChart type={w.type} result={st.data} />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <WidgetModal
          dashboardId={id}
          existing={modal.widget}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
