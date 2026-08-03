"use client";

import {useRef, type ReactNode, type PointerEvent, type WheelEvent, type MouseEvent} from "react";

export function HorizontalTabList({children, ariaLabel, className = ""}: {children: ReactNode; ariaLabel: string; className?: string}) {
  const dragging = useRef(false);
  const captured = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const suppressClick = useRef(false);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType === "touch") return;
    dragging.current = true;
    captured.current = false;
    startX.current = event.clientX;
    startScroll.current = event.currentTarget.scrollLeft;
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const distance = event.clientX - startX.current;
    if (!captured.current && Math.abs(distance) > 5) {
      captured.current = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!captured.current) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = startScroll.current - distance;
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    captured.current = false;
    if(suppressClick.current)window.setTimeout(()=>{suppressClick.current=false},0);
  };
  const clickCapture=(event:MouseEvent<HTMLDivElement>)=>{if(!suppressClick.current)return;event.preventDefault();event.stopPropagation();suppressClick.current=false};
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
    const distance = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    event.preventDefault();
    event.currentTarget.scrollLeft += distance;
  };

  return <div
    className={`horizontal-tab-list ${className}`.trim()}
    role="tablist"
    aria-label={ariaLabel}
    onPointerDown={pointerDown}
    onPointerMove={pointerMove}
    onPointerUp={pointerEnd}
    onPointerCancel={pointerEnd}
    onWheel={wheel}
    onClickCapture={clickCapture}
    onDragStart={event=>event.preventDefault()}
  >{children}</div>;
}
