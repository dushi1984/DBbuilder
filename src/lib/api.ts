export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new Error(
      "Could not reach the server. Is the app still running (npm run dev)?"
    );
  }
  const text = await res.text();
  let data: unknown = {};
  let isJson = true;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    isJson = false;
  }
  if (!res.ok) {
    const msg = (data as { error?: string }).error;
    if (msg) throw new Error(msg);
    throw new Error(
      isJson
        ? `Request failed (${res.status})`
        : `Server error (${res.status}). Check the terminal running the app for details.`
    );
  }
  return data as T;
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtNum(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 16).replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

export function isNumericColumn(
  rows: Record<string, unknown>[],
  key: string
): boolean {
  const sample = rows.slice(0, 10).map((r) => r[key]);
  return sample.every(
    (v) => v === null || v === undefined || !Number.isNaN(Number(v))
  );
}
