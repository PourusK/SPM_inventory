import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  vector,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sourceTypeEnum = pgEnum("source_type", [
  "main_fleet",
  "offshore",
  "recycled",
]);

export const itemSourceEnum = pgEnum("item_source", ["upload", "manual"]);

export const uploadStatusEnum = pgEnum("upload_status", [
  "processing",
  "review",
  "done",
  "failed",
]);

export const matchTierEnum = pgEnum("match_tier", ["1", "2", "3"]);

export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "confirmed",
  "rejected",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Critical fields drive match scoring; reference fields are shown but never scored
// (serial number, weight, year live here for every category).
export type CategoryFieldDef = {
  key: string;
  label: string;
  unit?: string;
  type: "text" | "number";
  tolerancePct?: number; // only meaningful for critical numeric fields
};

export const machineryCategories = pgTable("machinery_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  criticalFields: jsonb("critical_fields").$type<CategoryFieldDef[]>().notNull().default([]),
  referenceFields: jsonb("reference_fields").$type<CategoryFieldDef[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vessels = pgTable("vessels", {
  id: serial("id").primaryKey(),
  imoNo: varchar("imo_no", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  exNames: text("ex_names").array().notNull().default([]),
  sourceType: sourceTypeEnum("source_type").notNull(),
  vesselType: varchar("vessel_type", { length: 120 }),
  builtYear: integer("built_year"),
  ldt: numeric("ldt"),
  owner: varchar("owner", { length: 255 }),
  plotNo: varchar("plot_no", { length: 120 }),
  beachedDate: date("beached_date"),
  country: varchar("country", { length: 120 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id")
    .notNull()
    .references(() => vessels.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  status: uploadStatusEnum("status").notNull().default("processing"),
  extractedCount: integer("extracted_count").notNull().default(0),
  errorMessage: text("error_message"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const machineryItems = pgTable("machinery_items", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id")
    .notNull()
    .references(() => vessels.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => machineryCategories.id),
  maker: varchar("maker", { length: 255 }),
  modelType: varchar("model_type", { length: 255 }),
  serialNo: varchar("serial_no", { length: 255 }),
  // Free-form values keyed by the owning category's field defs (critical + reference).
  specs: jsonb("specs").$type<Record<string, string | number | null>>().notNull().default({}),
  rawText: text("raw_text"),
  embedding: vector("embedding", { dimensions: 1536 }),
  needsReview: boolean("needs_review").notNull().default(false),
  source: itemSourceEnum("source").notNull().default("manual"),
  uploadId: integer("upload_id").references(() => uploads.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  recycledItemId: integer("recycled_item_id")
    .notNull()
    .references(() => machineryItems.id, { onDelete: "cascade" }),
  ownedItemId: integer("owned_item_id")
    .notNull()
    .references(() => machineryItems.id, { onDelete: "cascade" }),
  tier: matchTierEnum("tier").notNull(),
  confidenceScore: numeric("confidence_score").notNull(),
  reason: text("reason").notNull(),
  status: matchStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vesselsRelations = relations(vessels, ({ many }) => ({
  machineryItems: many(machineryItems),
  uploads: many(uploads),
}));

export const machineryItemsRelations = relations(machineryItems, ({ one, many }) => ({
  vessel: one(vessels, { fields: [machineryItems.vesselId], references: [vessels.id] }),
  category: one(machineryCategories, {
    fields: [machineryItems.categoryId],
    references: [machineryCategories.id],
  }),
  upload: one(uploads, { fields: [machineryItems.uploadId], references: [uploads.id] }),
  matchesAsRecycled: many(matches, { relationName: "recycledItem" }),
  matchesAsOwned: many(matches, { relationName: "ownedItem" }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  recycledItem: one(machineryItems, {
    fields: [matches.recycledItemId],
    references: [machineryItems.id],
    relationName: "recycledItem",
  }),
  ownedItem: one(machineryItems, {
    fields: [matches.ownedItemId],
    references: [machineryItems.id],
    relationName: "ownedItem",
  }),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
  vessel: one(vessels, { fields: [uploads.vesselId], references: [vessels.id] }),
  items: many(machineryItems),
}));
