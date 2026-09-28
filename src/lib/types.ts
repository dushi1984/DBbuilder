export type WidgetType = "kpi" | "bar" | "line" | "area" | "pie" | "table";

export const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "kpi", label: "KPI number" },
  { value: "bar", label: "Bar chart" },
  { value: "line", label: "Line chart" },
  { value: "area", label: "Area chart" },
  { value: "pie", label: "Donut chart" },
  { value: "table", label: "Table" },
];

export const SPANS = [
  { value: 3, label: "1/4 width" },
  { value: 4, label: "1/3 width" },
  { value: 6, label: "1/2 width" },
  { value: 12, label: "Full width" },
];

export interface Dashboard {
  id: string;
  name: string;
  updatedAt: string;
  widgetCount: number;
}

export interface Widget {
  id: string;
  dashboardId: string;
  name: string;
  sql: string;
  type: WidgetType;
  span: number;
  order: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  ms: number;
  command?: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

export interface SchemaTable {
  name: string;
  rowCount: number;
  columns: SchemaColumn[];
}

export type WidgetState =
  | { status: "loading" }
  | { status: "ready"; data: QueryResult }
  | { status: "error"; error: string };
