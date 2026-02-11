import { sql } from "drizzle-orm";
import { text, sqliteTable, integer, real } from "drizzle-orm/sqlite-core";

export const productTable = sqliteTable("products", {
    id: integer("id").primaryKey({autoIncrement: true}),
    name: text("name").notNull(),
    stock: integer("stock").default(0).notNull(),
    category: text("category").notNull(),
    price: real("price").notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

export const salesTable = sqliteTable("sales", {
    id: integer("id").primaryKey({autoIncrement: true}),
    product_id: integer("product_id").notNull().references(() => productTable.id),
    quantity: integer("quantity").notNull(),
    total_amount: real("total_amount").notNull(),
    sale_date: text("sale_date").default(sql`CURRENT_TIMESTAMP`),
    customer_name: text("customer_name").notNull(),
    region: text("region").notNull()
});