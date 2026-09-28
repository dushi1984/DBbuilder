"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtNum } from "@/lib/api";
import type { QueryResult, WidgetType } from "@/lib/types";
import { ResultTable } from "./ResultTable";

const PALETTE = ["#2b59e0", "#e05206", "#8a94a6", "#40506b", "#c9d0da", "#2146ba"];

const AXIS_TICK = { fontSize: 11, fill: "#8a94a6" };

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function compact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${Math.round(v / 100_000) / 10}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(v);
}

function Tip(props: {
  active?: boolean;
  payload?: { name?: string; value?: unknown; dataKey?: string }[];
  label?: string;
}) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-line bg-surface px-2 py-2 text-xs">
      {label !== undefined && (
        <div className="mb-1 font-medium text-ink">{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="text-ink-2">{p.name}</span>
          <span className="font-mono text-ink">
            {typeof p.value === "number" ? fmtNum(p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-ink-3">
      {message}
    </div>
  );
}

function Kpi({ result }: { result: QueryResult }) {
  const row = result.rows[0];
  if (!row) return <Empty message="No rows returned" />;
  const valueKey = result.columns[0];
  const subKey = result.columns[1];
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="font-mono text-[24px] font-medium leading-none text-ink">
        {fmtNum(row[valueKey])}
      </div>
      {subKey && (
        <div className="mt-2 truncate text-xs text-ink-2">
          {String(row[subKey])}
        </div>
      )}
    </div>
  );
}

export function WidgetChart({
  type,
  result,
}: {
  type: WidgetType;
  result: QueryResult;
}) {
  if (type === "kpi") return <Kpi result={result} />;
  if (type === "table")
    return <ResultTable columns={result.columns} rows={result.rows} />;

  if (result.columns.length < 2) {
    return <Empty message="Chart needs at least 2 columns: x and y" />;
  }
  if (result.rows.length === 0) return <Empty message="No rows returned" />;

  const x = result.columns[0];
  const y = result.columns[1];
  const data = result.rows.map((r) => ({ ...r, [y]: toNum(r[y]) }));

  const common = (
    <>
      <CartesianGrid vertical={false} stroke="#eceef2" />
      <XAxis
        dataKey={x}
        tick={AXIS_TICK}
        axisLine={{ stroke: "#e4e7ec" }}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={16}
      />
      <YAxis
        tick={AXIS_TICK}
        axisLine={false}
        tickLine={false}
        width={48}
        tickFormatter={compact}
      />
      <Tooltip content={<Tip />} cursor={{ fill: "rgba(43, 89, 224, 0.06)" }} />
    </>
  );

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {common}
          <Bar dataKey={y} name={y} fill="#2b59e0" maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {common}
          <Line
            type="monotone"
            dataKey={y}
            name={y}
            stroke="#2b59e0"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#2b59e0", stroke: "none" }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {common}
          <Area
            type="monotone"
            dataKey={y}
            name={y}
            stroke="#2b59e0"
            strokeWidth={2}
            fill="#2b59e0"
            fillOpacity={0.08}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // pie / donut
  return (
    <div className="flex h-full gap-4">
      <div className="h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={y}
              nameKey={x}
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-40 shrink-0 flex-col justify-center gap-2 overflow-hidden">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-3 w-3 shrink-0 rounded"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-2">
              {String(d[x])}
            </span>
            <span className="font-mono text-ink">{fmtNum(d[y])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
