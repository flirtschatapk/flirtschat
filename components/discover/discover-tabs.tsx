import {HorizontalTabList} from "@/components/ui/horizontal-tab-list";
import type {DiscoverTab} from "@/lib/discover-types";

const tabs: [DiscoverTab, string][] = [["all", "All"], ["new", "New"], ["nearby", "Nearby"], ["verified", "Verified"], ["premium", "Premium"]];

export function DiscoverTabs({value, onChange}: {value: DiscoverTab; onChange: (value: DiscoverTab) => void}) {
  return <HorizontalTabList className="discover-tabs discover-tabs-five" ariaLabel="Discovery category">
    {tabs.map(([tab, label]) => {
      const active = value === tab || (value === "discover" && tab === "all");
      return <button role="tab" aria-selected={active} className={active ? "active" : ""} onClick={() => onChange(tab)} key={tab}>{label}</button>;
    })}
  </HorizontalTabList>;
}
