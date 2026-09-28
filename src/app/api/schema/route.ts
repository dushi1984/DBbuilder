import { pool } from "@/db";
import { errorResponse } from "@/lib/errors";
import type { SchemaTable } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cols = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    const pks = await pool.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    `);

    const pkSet = new Set(
      (pks.rows as { table_name: string; column_name: string }[]).map(
        (r) => `${r.table_name}.${r.column_name}`
      )
    );

    const byTable = new Map<string, SchemaTable>();
    for (const r of cols.rows as {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }[]) {
      let t = byTable.get(r.table_name);
      if (!t) {
        t = { name: r.table_name, rowCount: 0, columns: [] };
        byTable.set(r.table_name, t);
      }
      t.columns.push({
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === "YES",
        primary: pkSet.has(`${r.table_name}.${r.column_name}`),
      });
    }

    const tables = [...byTable.values()];
    for (const t of tables) {
      const c = await pool.query(`SELECT count(*)::int AS n FROM "${t.name}"`);
      t.rowCount = (c.rows[0] as { n: number }).n;
    }

    return Response.json({ tables });
  } catch (e) {
    return errorResponse(e);
  }
}
