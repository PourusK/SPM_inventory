import type { CategoryFieldDef } from "@/lib/db/schema";

/**
 * Machinery taxonomy for marine spares matching.
 *
 * `criticalFields` drive match scoring (lib/matching.ts) — they're the specs that
 * actually determine physical/electrical interchangeability for that category.
 * `referenceFields` (serial no, weight, install year, etc.) are shown to reviewers
 * for identification only and are NEVER used to score a match: two units are never
 * "more similar" for sharing a serial number, and no two units ever will.
 *
 * Seeded from the categories that appear in real Alang recycling-yard spec sheets
 * (reference: ASMA/MOKHIA sample) so extraction output maps directly onto this list.
 */
export type CategoryDef = {
  name: string;
  slug: string;
  criticalFields: CategoryFieldDef[];
  referenceFields: CategoryFieldDef[];
};

const NUMERIC_REFERENCE: CategoryFieldDef[] = [
  { key: "serial_no", label: "Serial No", type: "text" },
  { key: "year", label: "Year", type: "number" },
  { key: "weight_kg", label: "Weight", unit: "kg", type: "number" },
];

export const MACHINERY_CATEGORIES: CategoryDef[] = [
  {
    name: "Main Engine",
    slug: "main-engine",
    criticalFields: [
      { key: "bore_mm", label: "Bore", unit: "mm", type: "number", tolerancePct: 5 },
      { key: "stroke_mm", label: "Stroke", unit: "mm", type: "number", tolerancePct: 5 },
      { key: "cylinders", label: "Cylinders", type: "number", tolerancePct: 0 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "bhp", label: "BHP", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Diesel Generator",
    slug: "diesel-generator",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "cylinders", label: "Cylinders", type: "number", tolerancePct: 0 },
      { key: "volt", label: "Volt", type: "number", tolerancePct: 5 },
      { key: "hz", label: "Hz", type: "number", tolerancePct: 0 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Turbine Generator",
    slug: "turbine-generator",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "volt", label: "Volt", type: "number", tolerancePct: 5 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Emergency Generator",
    slug: "emergency-generator",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "volt", label: "Volt", type: "number", tolerancePct: 5 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Turbocharger",
    slug: "turbocharger",
    criticalFields: [
      { key: "frame", label: "Frame/Type designation", type: "text" },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Governor",
    slug: "governor",
    criticalFields: [{ key: "rpm_range", label: "RPM range", type: "text" }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Oil Mist Detector",
    slug: "oil-mist-detector",
    criticalFields: [],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Oil Purifier",
    slug: "oil-purifier",
    criticalFields: [
      { key: "bowl_rpm", label: "Bowl RPM", type: "number", tolerancePct: 10 },
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "capacity_m3h", label: "Capacity", unit: "m3/h", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Air Compressor",
    slug: "air-compressor",
    criticalFields: [
      { key: "capacity_m3h", label: "Capacity", unit: "m3/h", type: "number", tolerancePct: 15 },
      { key: "pressure_bar", label: "Pressure", unit: "bar", type: "number", tolerancePct: 10 },
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Air Dryer",
    slug: "air-dryer",
    criticalFields: [
      { key: "pressure_psi", label: "Pressure", unit: "psi", type: "number", tolerancePct: 10 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Fresh Water Generator",
    slug: "fresh-water-generator",
    criticalFields: [
      { key: "capacity_m3_24h", label: "Capacity", unit: "m3/24h", type: "number", tolerancePct: 15 },
      { key: "pressure_bar", label: "Pressure", unit: "bar", type: "number", tolerancePct: 10 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Sewage Treatment Plant",
    slug: "sewage-treatment-plant",
    criticalFields: [],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Heat Exchanger",
    slug: "heat-exchanger",
    criticalFields: [
      { key: "pressure_psig", label: "Pressure", unit: "PSIG", type: "number", tolerancePct: 10 },
      { key: "temp_c", label: "Temp", unit: "C", type: "number", tolerancePct: 10 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Heat Pack / Electric Heater",
    slug: "heat-pack-electric-heater",
    criticalFields: [{ key: "capacity_kw", label: "Capacity", unit: "KW", type: "number", tolerancePct: 15 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Deck Winch",
    slug: "deck-winch",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Boll & Kirch Filter",
    slug: "boll-kirch-filter",
    criticalFields: [
      { key: "pressure_bar", label: "Pressure", unit: "bar", type: "number", tolerancePct: 10 },
      { key: "filtration_um", label: "Filtration", unit: "um", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Hydraulic Pump",
    slug: "hydraulic-pump",
    criticalFields: [{ key: "rpm", label: "RPM", type: "number", tolerancePct: 10 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Pump (General)",
    slug: "pump-general",
    criticalFields: [
      { key: "capacity_m3h", label: "Capacity", unit: "m3/h", type: "number", tolerancePct: 15 },
      { key: "head_m", label: "Head", unit: "m", type: "number", tolerancePct: 15 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Oily Water Separator",
    slug: "oily-water-separator",
    criticalFields: [
      { key: "capacity_lh", label: "Capacity", unit: "L/h", type: "number", tolerancePct: 15 },
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "R.O. Plant",
    slug: "ro-plant",
    criticalFields: [{ key: "capacity_m3h", label: "Capacity", unit: "m3/h", type: "number", tolerancePct: 15 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Calorifier / Water Heater",
    slug: "calorifier-water-heater",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "capacity_gallons", label: "Capacity", unit: "gallons", type: "number", tolerancePct: 15 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Motor / Alternator",
    slug: "motor-alternator",
    criticalFields: [
      { key: "kw", label: "KW", type: "number", tolerancePct: 15 },
      { key: "volt", label: "Volt", type: "number", tolerancePct: 5 },
      { key: "rpm", label: "RPM", type: "number", tolerancePct: 10 },
      { key: "hz", label: "Hz", type: "number", tolerancePct: 0 },
      { key: "phase", label: "Phase", type: "number", tolerancePct: 0 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Bow Thruster Motor",
    slug: "bow-thruster-motor",
    criticalFields: [
      { key: "hp", label: "HP", type: "number", tolerancePct: 15 },
      { key: "volt", label: "Volt", type: "number", tolerancePct: 5 },
    ],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Crane (Overhead / Provision)",
    slug: "crane",
    criticalFields: [{ key: "swl_tons", label: "SWL", unit: "tons", type: "number", tolerancePct: 10 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Anchor & Chain",
    slug: "anchor-chain",
    criticalFields: [{ key: "chain_dia_mm", label: "Chain Dia", unit: "mm", type: "number", tolerancePct: 5 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Life Boat",
    slug: "life-boat",
    criticalFields: [{ key: "capacity_persons", label: "Capacity", unit: "persons", type: "number", tolerancePct: 10 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Life Raft",
    slug: "life-raft",
    criticalFields: [{ key: "capacity_persons", label: "Capacity", unit: "persons", type: "number", tolerancePct: 10 }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Gangway",
    slug: "gangway",
    criticalFields: [],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Lathe / Workshop Machine",
    slug: "lathe-workshop-machine",
    criticalFields: [{ key: "bed_length", label: "Bed length", type: "text" }],
    referenceFields: NUMERIC_REFERENCE,
  },
  {
    name: "Other / Uncategorized",
    slug: "other",
    criticalFields: [],
    referenceFields: NUMERIC_REFERENCE,
  },
];

export const CATEGORY_SLUGS = MACHINERY_CATEGORIES.map((c) => c.slug);
