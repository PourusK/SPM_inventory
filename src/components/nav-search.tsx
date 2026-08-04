"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchVessels } from "@/actions/vessels";

type Result = { id: number; imoNo: string; name: string; sourceType: string };

const SOURCE_ROUTE: Record<string, string> = {
  main_fleet: "fleet",
  offshore: "offshore",
  recycled: "recycled",
};

export function NavSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function onChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const rows = await searchVessels(value);
      setResults(rows);
      setOpen(true);
    });
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search vessel name or IMO..."
        className="pl-8"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {results.map((r) => (
            <button
              key={r.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={() => {
                setOpen(false);
                setQuery("");
                router.push(`/vessels/${r.id}`);
              }}
            >
              <span className="font-medium">{r.name}</span>{" "}
              <span className="text-muted-foreground">
                IMO {r.imoNo} · {SOURCE_ROUTE[r.sourceType] ?? r.sourceType}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
