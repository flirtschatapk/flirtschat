export function DiscoverToolbar({onBoost, onFilter, disabled}: {onBoost: () => void; onFilter: () => void; disabled: boolean}) {
  return <div className="discover-quick-toolbar">
    <button className="discover-boost-quick" type="button" onClick={onBoost} disabled={disabled}>Boost</button>
    <button className="discover-filter-quick" type="button" onClick={onFilter}>Filters</button>
  </div>;
}
