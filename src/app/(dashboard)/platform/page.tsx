import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Code2,
  Database,
  FileSearch,
  KeyRound,
  LockKeyhole,
  Network,
  Rocket,
  ServerCog,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const flow = [
  {
    icon: Cloud,
    title: "1. Upload",
    detail: "PDF, image, Excel or CSV (up to 4 MB) is saved privately in Vercel Blob.",
  },
  {
    icon: Bot,
    title: "2. AI extraction",
    detail: "Claude reads the document and returns validated, taxonomy-based machinery fields.",
  },
  {
    icon: FileSearch,
    title: "3. Human review",
    detail: "The operator corrects uncertain values before accepting anything into inventory.",
  },
  {
    icon: Network,
    title: "4. Match",
    detail: "Postgres compares recycled equipment with Main Fleet and Offshore requirements.",
  },
];

const stack = [
  ["Web application", "Next.js 16, React 19, TypeScript", "Server-rendered App Router UI and Server Functions"],
  ["Interface", "Tailwind CSS 4 + shadcn", "Responsive components and a consistent design system"],
  ["Database", "Neon PostgreSQL", "Managed relational data, JSON specifications and pg_trgm search"],
  ["Data access", "Drizzle ORM", "Typed schema, SQL migrations and database queries"],
  ["Document AI", "Anthropic Claude", "PDF vision, image reading and structured tool output"],
  ["File storage", "Vercel Blob", "Private source-document storage"],
  ["Authentication", "Auth.js + bcrypt", "Credential login, hashed passwords and JWT sessions"],
  ["Validation", "Zod", "Validates AI output and user-submitted records at runtime"],
];

const environment = [
  ["DATABASE_URL", "Neon → Project → Connect", "PostgreSQL connection used by Drizzle"],
  ["AUTH_SECRET", "Generate with `npx auth secret`", "Signs and protects login sessions"],
  ["ANTHROPIC_API_KEY", "Anthropic Console", "Authorizes document extraction requests"],
  ["ANTHROPIC_EXTRACTION_MODEL", "Optional; defaults in code", "Selects the Claude extraction model"],
  ["BLOB_READ_WRITE_TOKEN", "Vercel → Storage → Blob", "Uploads and retrieves private documents"],
];

const roadmap = [
  {
    phase: "Before launch",
    tone: "border-amber-300 bg-amber-50/70 dark:bg-amber-950/20",
    items: [
      "Provision production Neon, Blob and Anthropic accounts",
      "Set environment secrets in the hosting platform—not in source control",
      "Run database migrations, enable pg_trgm/vector extensions and seed the taxonomy",
      "Create named users and replace shared credentials with a password reset/invite flow",
    ],
  },
  {
    phase: "Production hardening",
    tone: "border-blue-300 bg-blue-50/70 dark:bg-blue-950/20",
    items: [
      "Add role-based access, audit history and retention/deletion policies",
      "Move extraction and rematching to background jobs with progress and retry handling",
      "Add monitoring, error reporting, database backups and spend alerts",
      "Test with representative vessel documents and measure extraction accuracy by field",
    ],
  },
  {
    phase: "Operational rollout",
    tone: "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/20",
    items: [
      "Define reviewers, ownership and the process for resolving uncertain records",
      "Import and clean the existing fleet baseline before evaluating recycled inventory",
      "Run security, recovery and user-acceptance tests; document support procedures",
      "Pilot with a small user group, then expand after accuracy and cost targets are met",
    ],
  },
];

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {children ? <p className="text-sm leading-6 text-muted-foreground sm:text-base">{children}</p> : null}
    </div>
  );
}

export default function PlatformPage() {
  return (
    <div className="flex flex-col gap-12 pb-12">
      <section className="relative overflow-hidden rounded-3xl border bg-slate-950 px-6 py-10 text-white shadow-sm sm:px-10 sm:py-14">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative max-w-4xl space-y-6">
          <Badge className="border-blue-300/25 bg-blue-400/10 text-blue-100">Platform briefing</Badge>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              From vessel documents to reusable inventory intelligence
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A concise view of how Marine Spares Inventory is built, configured and operated—and the work required to turn today’s prototype into dependable production software.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-200">
            {["Private document storage", "AI-assisted, human-approved", "Rules-based matching", "Managed PostgreSQL"].map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="The workflow" title="One controlled path from upload to match">
          AI accelerates data entry, but it does not silently publish results. A review checkpoint keeps operators in control.
        </SectionHeading>
        <div className="grid gap-3 lg:grid-cols-4">
          {flow.map((step, index) => (
            <div key={step.title} className="relative">
              <Card className="h-full border-slate-200 bg-gradient-to-b from-white to-slate-50 dark:from-card dark:to-card">
                <CardHeader className="pb-2">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <step.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{step.detail}</CardContent>
              </Card>
              {index < flow.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 text-slate-300 lg:block" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Technology" title="What the platform is made of">
          The application is a TypeScript web stack using managed services for the database, source files and document extraction.
        </SectionHeading>
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="hidden grid-cols-[1fr_1.25fr_2fr] bg-muted/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
              <span>Layer</span><span>Technology</span><span>Purpose</span>
            </div>
            {stack.map(([layer, technology, purpose], index) => (
              <div key={layer} className={`grid gap-1 px-5 py-4 sm:grid-cols-[1fr_1.25fr_2fr] sm:gap-5 ${index ? "border-t" : ""}`}>
                <span className="text-sm font-medium">{layer}</span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{technology}</span>
                <span className="text-sm leading-5 text-muted-foreground">{purpose}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionHeading eyebrow="Database & configuration" title="Where everything is configured">
            No credentials are embedded in the page or repository. Local values live in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>; deployed values belong in the host’s encrypted environment settings.
          </SectionHeading>
          <Card className="overflow-hidden py-0">
            <CardContent className="divide-y p-0">
              {environment.map(([key, location, use]) => (
                <div key={key} className="grid gap-1 px-5 py-4 md:grid-cols-[1.1fr_1.25fr_1.6fr] md:gap-4">
                  <code className="text-xs font-semibold text-blue-700 dark:text-blue-300">{key}</code>
                  <span className="text-sm font-medium">{location}</span>
                  <span className="text-sm text-muted-foreground">{use}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="size-5 text-blue-700 dark:text-blue-300" />
              <CardTitle>Data model</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p><strong className="text-foreground">Neon PostgreSQL</strong> is configured through <code>DATABASE_URL</code>. The schema and migrations remain versioned with the application.</p>
            <div className="flex flex-wrap gap-2">
              {["Users", "Vessels", "Categories", "Uploads", "Machinery items", "Matches"].map((table) => <Badge key={table} variant="outline" className="bg-background">{table}</Badge>)}
            </div>
            <Separator />
            <p>Relational keys preserve ownership and traceability; JSON fields support category-specific specifications. <code>pg_trgm</code> supplies maker/model similarity. Matching itself is deterministic—not another AI call.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Operating cost" title="What one extraction costs—approximately">
          Extraction is usage-based, not a fixed per-file fee. Document size, page density and item count determine the tokens consumed.
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="size-5 text-emerald-700" />Typical planning range</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">$0.06–$0.30</p><p className="mt-2 text-sm text-muted-foreground">per document extraction for a small-to-medium inventory sheet</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Example assumption</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>8k–30k input tokens + 2k–10k output tokens</p>
              <p>Illustrated at $3 / million input and $15 / million output tokens.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Simple formula</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><code>(input tokens × input rate) + (output tokens × output rate)</code></p>
              <p>Large, scanned or item-heavy files can exceed the range.</p>
            </CardContent>
          </Card>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          <strong>Budget note:</strong> this is a planning estimate, not a quote. The active model can be changed with <code>ANTHROPIC_EXTRACTION_MODEL</code>; verify its live rate in the Anthropic Console. Blob storage, Neon and hosting are separate, usually low at pilot volume, and should be budgeted from measured usage plus provider plans.
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-blue-600" />What is already working</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Authenticated vessel and machinery inventory", "PDF, image, Excel and CSV extraction", "Schema-validated review-before-save workflow", "Three-tier recycled-to-owned matching", "Manual correction and match approval"].map((item) => (
              <div key={item} className="flex gap-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span>{item}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-blue-600" />Current security shape</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex gap-3"><LockKeyhole className="mt-0.5 size-4 shrink-0" />All application routes require login, and mutating server functions re-check the session.</p>
            <p className="flex gap-3"><KeyRound className="mt-0.5 size-4 shrink-0" />Passwords are bcrypt-hashed; sessions use signed JWTs.</p>
            <p className="flex gap-3"><Cloud className="mt-0.5 size-4 shrink-0" />Uploaded source files use private Blob storage.</p>
            <p className="flex gap-3"><Wrench className="mt-0.5 size-4 shrink-0" />A formal authorization model, audit log and security review remain launch work.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Path to production" title="What it takes to make this working software">
          The core workflow exists. Production readiness is mainly infrastructure, resilience, governance and measured validation—not a complete rebuild.
        </SectionHeading>
        <div className="grid gap-4 lg:grid-cols-3">
          {roadmap.map((group, index) => (
            <Card key={group.phase} className={group.tone}>
              <CardHeader>
                <div className="mb-1 flex size-8 items-center justify-center rounded-full bg-background text-sm font-semibold shadow-sm">{index + 1}</div>
                <CardTitle className="text-lg">{group.phase}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.map((item) => <p key={item} className="flex gap-2 text-sm leading-5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 opacity-60" />{item}</p>)}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-950 text-white"><Rocket className="size-7" /></div>
          <div>
            <h2 className="text-xl font-semibold">Recommended next decision</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Choose a representative pilot set, define the acceptable field-accuracy target and measure cost, review time and match usefulness. Those results will turn the planning ranges above into a credible launch budget and delivery plan.</p>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><ShipWheel className="size-4" />Marine Spares Inventory · Technical overview</span>
        <span className="flex items-center gap-2"><Code2 className="size-4" /><ServerCog className="size-4" />Figures are indicative and should be validated before procurement.</span>
      </footer>
    </div>
  );
}
