import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  serial,
  date,
  numeric,
} from "drizzle-orm/pg-core";

/* ------------------------------ App tables ------------------------------ */

export const dashboards = pgTable("dashboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  dashboardId: uuid("dashboard_id")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sql: text("sql").notNull(),
  type: text("type").notNull().default("bar"),
  span: integer("span").notNull().default(6),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------- Demo business data --------------------------- */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  segment: text("segment").notNull(),
  createdAt: date("created_at").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  channel: text("channel").notNull(),
  region: text("region").notNull(),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull(),
});
