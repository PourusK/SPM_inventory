import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";
import { z } from "zod";
import { MACHINERY_CATEGORIES, CATEGORY_SLUGS } from "@/lib/taxonomy";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_MODEL = process.env.ANTHROPIC_EXTRACTION_MODEL ?? "claude-sonnet-5";

const extractedItemSchema = z.object({
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]]),
  maker: z.string().nullable(),
  modelType: z.string().nullable(),
  serialNo: z.string().nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).default({}),
  rawText: z.string().nullable(),
  needsReview: z.boolean().default(false),
});

export type ExtractedItem = z.infer<typeof extractedItemSchema>;

const extractionToolResultSchema = z.object({
  items: z.array(extractedItemSchema),
});

const TAXONOMY_DESCRIPTION = MACHINERY_CATEGORIES.map((c) => {
  const criticalKeys = c.criticalFields.map((f) => `${f.key} (${f.label}${f.unit ? `, ${f.unit}` : ""})`).join(", ");
  const referenceKeys = c.referenceFields.map((f) => `${f.key} (${f.label})`).join(", ");
  return `- ${c.slug}: "${c.name}"\n  critical spec keys: ${criticalKeys || "none"}\n  reference spec keys: ${referenceKeys}`;
}).join("\n");

const SYSTEM_PROMPT = `You are extracting a structured machinery/spares inventory from a marine vessel document (recycling-yard spec sheet, fleet spares list, or yard drawing). These documents are unsystematic — dense pipe-delimited text, inconsistent abbreviations, OCR-unfriendly layouts, and occasional illegible/unclean tags (e.g. "unklean tag", "not clean plate", "wt-not clean mark").

Extract every distinct machinery/equipment item you can find (Main Engine, Diesel Generators, Turbochargers, Governors, Purifiers, Compressors, Pumps, Winches, Motors, Cranes, etc.) into the record_machinery_items tool.

For every item:
- Pick the single closest categorySlug from this fixed taxonomy (use "other" only if truly nothing fits):
${TAXONOMY_DESCRIPTION}
- maker: the manufacturer name, normalized to a plain readable form (e.g. "ALFA-LAVAL" -> "Alfa-Laval").
- modelType: the model/type designation as printed.
- serialNo: serial number if present, else null. This is for traceability only.
- specs: an object keyed ONLY by the critical/reference spec keys listed for that item's category above. Parse numeric values as numbers (strip units). Omit keys you have no value for rather than guessing.
- rawText: the original raw line(s) this item was extracted from, verbatim, for audit purposes.
- needsReview: true if the source text was ambiguous, illegible, marked unclean/dirty/unreadable, or you had to guess the category or a critical value. Otherwise false.

Do not invent values. Do not merge distinct physical units into one item (e.g. "02 units" of the same pump listed with two serials should usually be represented once with a note in rawText, unless specs genuinely differ per unit).`;

function toolDefinition(): Anthropic.Tool {
  return {
    name: "record_machinery_items",
    description: "Record the structured list of machinery items extracted from the document.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              categorySlug: { type: "string", enum: CATEGORY_SLUGS },
              maker: { type: ["string", "null"] },
              modelType: { type: ["string", "null"] },
              serialNo: { type: ["string", "null"] },
              specs: { type: "object" },
              rawText: { type: ["string", "null"] },
              needsReview: { type: "boolean" },
            },
            required: ["categorySlug", "maker", "modelType", "serialNo", "specs", "rawText", "needsReview"],
          },
        },
      },
      required: ["items"],
    },
  };
}

function excelToText(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `--- Sheet: ${sheetName} ---\n${csv}`;
  }).join("\n\n");
}

export async function extractMachinery(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedItem[]> {
  const content: Anthropic.ContentBlockParam[] = [];

  if (mimeType === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
    });
    content.push({ type: "text", text: `Extract the machinery inventory from this document (${fileName}).` });
  } else if (mimeType.startsWith("image/")) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
        data: buffer.toString("base64"),
      },
    });
    content.push({ type: "text", text: `Extract the machinery inventory from this photo/drawing (${fileName}).` });
  } else if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    fileName.match(/\.(xlsx|xls|csv)$/i)
  ) {
    const text = fileName.match(/\.csv$/i) ? buffer.toString("utf-8") : excelToText(buffer);
    content.push({
      type: "text",
      text: `Extract the machinery inventory from this spreadsheet (${fileName}):\n\n${text}`,
    });
  } else {
    throw new Error(`Unsupported file type: ${mimeType || fileName}`);
  }

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    tools: [toolDefinition()],
    tool_choice: { type: "tool", name: "record_machinery_items" },
    messages: [{ role: "user", content }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Extraction did not return structured output");
  }

  const parsed = extractionToolResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Extraction output failed validation: ${parsed.error.message}`);
  }

  return parsed.data.items;
}
