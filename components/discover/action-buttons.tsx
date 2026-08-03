"use client";

import {useState} from "react";
import type {DailyDiscoverQuota} from "@/lib/discover-entitlements";
import {SVGRewindIcon} from "./svg-rewind-icon";
import {SVGMetallicActionIcon} from "./svg-metallic-action-icon";

export type DiscoverAction = "dislike" | "rewind" | "superlike" | "like" | "boost";

type Props = {
  onAction: (action: DiscoverAction) => void;
  disabled: boolean;
  premium?: boolean;
  quota?: DailyDiscoverQuota;
};

export function ActionButtons({onAction, disabled, premium = false, quota}: Props) {
  const [active, setActive] = useState<DiscoverAction | null>(null);
  const trigger = (action: DiscoverAction) => {
    if (disabled) return;
    setActive(action);
    onAction(action);
    setTimeout(() => setActive(null), 320);
  };
  const allowance = (action: "rewind" | "superlike") => premium ? "∞" : String(quota?.[action] ?? 1);

  return <div className="discover-actions">
    <button className="dislike metallic-action" disabled={disabled} onClick={() => trigger("dislike")} aria-label="Dislike" title="Dislike"><SVGMetallicActionIcon variant="dislike" size={53} active={active === "dislike"} disabled={disabled}/></button>
    <button className="rewind metallic-rewind limited-action" disabled={disabled} onClick={() => trigger("rewind")} aria-label={premium ? "Rewind, unlimited" : `Rewind, ${allowance("rewind")} remaining today`} title="Rewind"><SVGRewindIcon size={44} active={active === "rewind"} disabled={disabled}/><span>{allowance("rewind")}</span></button>
    <button className="superlike metallic-action limited-action" disabled={disabled} onClick={() => trigger("superlike")} aria-label={premium ? "Super Like, unlimited" : `Super Like, ${allowance("superlike")} remaining today`} title="Super Like"><SVGMetallicActionIcon variant="superlike" size={53} active={active === "superlike"} disabled={disabled}/><span>{allowance("superlike")}</span></button>
    <button className="like metallic-action" disabled={disabled} onClick={() => trigger("like")} aria-label="Like" title="Like"><SVGMetallicActionIcon variant="like" size={61} active={active === "like"} disabled={disabled}/></button>
    <button className="boost metallic-action" disabled={disabled} onClick={() => trigger("boost")} aria-label="Boost" title="Boost"><SVGMetallicActionIcon variant="boost" size={44} active={active === "boost"} disabled={disabled}/></button>
  </div>;
}
