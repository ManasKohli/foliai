"use client"

import { useState } from "react"
import { OvernightBriefing } from "@/components/markets/overnight-briefing"
import { MacroOutlook } from "@/components/markets/macro-outlook"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "overnight", label: "Pre-Market Briefing" },
  { key: "macro", label: "Macro Outlook" },
] as const

type Tab = (typeof TABS)[number]["key"]

export default function MarketsPage() {
  const [tab, setTab] = useState<Tab>("overnight")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Market Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Your daily market briefing -- what happened overnight and what to watch today.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overnight" && <OvernightBriefing />}
      {tab === "macro" && <MacroOutlook />}
    </div>
  )
}
