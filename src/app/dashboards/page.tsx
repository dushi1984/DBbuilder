"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, relTime } from "@/lib/api";
import type { Dashboard } from "@/lib/types";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Icon } from "@/components/Icon";

export default function DashboardsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Dashboard[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ dashboards: Dashboard[] }>("/api/dashboards");
      setItems(res.dashboards);
    } catch (e) {
      setItems([]);
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!newName.trim()) return;
    try {
      const res = await api<{ dashboard: Dashboard }>("/api/dashboards", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      setCreating(false);
      setNewName("");
      setError(null);
      router.push(`/dashboards/${res.dashboard.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    await api(`/api/dashboards/${id}`, { method: "DELETE" });
    setItems((cur) => (cur ? cur.filter((d) => d.id !== id) : cur));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-ink">Dashboards</h1>
          {items && (
            <span className="text-xs text-ink-3">
              {items.length} {items.length === 1 ? "board" : "boards"}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCreating(true);
            setError(null);
          }}
        >
          <Icon name="plus" size={14} />
          New dashboard
        </button>
      </div>

      {creating && (
        <div className="card mt-4 flex items-center gap-2 p-4">
          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dashboard name, e.g. Store performance"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={create}
            disabled={!newName.trim()}
          >
            Create
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCreating(false);
              setNewName("");
              setError(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded border border-accent/30 bg-accent-tint px-4 py-2 text-[13px] text-accent">
          <Icon name="alert" size={16} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4">
        {items === null ? (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="card h-32 animate-pulse p-4"
                aria-hidden
              >
                <div className="h-4 w-1/2 rounded bg-line" />
                <div className="mt-8 h-3 w-2/3 rounded bg-line/60" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded border border-dashed border-line-strong bg-surface px-8 py-16 text-center">
            <div className="text-sm font-semibold text-ink">
              No dashboards yet
            </div>
            <p className="mt-2 text-[13px] text-ink-2">
              Create a dashboard, then add widgets backed by SELECT commands
              against this database.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={14} />
              New dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {items.map((d) => (
              <div
                key={d.id}
                className="card group cursor-pointer p-4 transition-colors hover:border-line-strong"
                onClick={() => router.push(`/dashboards/${d.id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && router.push(`/dashboards/${d.id}`)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-[15px] font-semibold text-ink">
                    {d.name}
                  </h2>
                  <ConfirmDelete onConfirm={() => remove(d.id)} />
                </div>
                <div className="mt-8 flex items-center justify-between text-xs text-ink-3">
                  <span>
                    {d.widgetCount} {d.widgetCount === 1 ? "widget" : "widgets"}{" "}
                    · {relTime(d.updatedAt)}
                  </span>
                  <Icon
                    name="open"
                    size={14}
                    className="text-ink-3 transition-colors group-hover:text-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
