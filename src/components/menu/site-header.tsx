import { OpenSign } from "@/components/menu/open-sign"
import type { Store } from "@/lib/menu/types"
import { summarizeHours } from "@/lib/store-hours"

export function SiteHeader({ store }: { store: Store }) {
  return (
    <header className="flex flex-col gap-4 pt-8 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">{store.name}</h1>
          {store.tagline && <p className="text-lg text-muted-foreground">{store.tagline}</p>}
        </div>
        <OpenSign store={store} />
      </div>
      <div className="flex flex-col text-sm">
        <span>{store.address}</span>
        <span className="text-muted-foreground">{summarizeHours(store.hours)}</span>
      </div>
    </header>
  )
}
