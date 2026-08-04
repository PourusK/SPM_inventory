import { z } from "zod";

export const sourceTypeSchema = z.enum(["main_fleet", "offshore", "recycled"]);

export const vesselInputSchema = z.object({
  imoNo: z.string().trim().min(1, "IMO number is required"),
  name: z.string().trim().min(1, "Vessel name is required"),
  exNames: z.array(z.string().trim()).default([]),
  sourceType: sourceTypeSchema,
  vesselType: z.string().trim().optional().nullable(),
  builtYear: z.coerce.number().int().optional().nullable(),
  ldt: z.coerce.number().optional().nullable(),
  owner: z.string().trim().optional().nullable(),
  plotNo: z.string().trim().optional().nullable(),
  beachedDate: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
});

export type VesselInput = z.infer<typeof vesselInputSchema>;

export const machineryItemInputSchema = z.object({
  categoryId: z.coerce.number().int(),
  maker: z.string().trim().optional().nullable(),
  modelType: z.string().trim().optional().nullable(),
  serialNo: z.string().trim().optional().nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
  rawText: z.string().trim().optional().nullable(),
  needsReview: z.boolean().default(false),
});

export type MachineryItemInput = z.infer<typeof machineryItemInputSchema>;
