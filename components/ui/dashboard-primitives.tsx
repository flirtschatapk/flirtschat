import type {ButtonHTMLAttributes, ReactNode} from "react";

const join=(...values:(string|false|undefined)[])=>values.filter(Boolean).join(" ");

export function DashboardCard({className,children}:{className?:string;children:ReactNode}) {
  return <section className={join("dashboard-card",className)}>{children}</section>;
}

export function SectionHeader({eyebrow,title,action}:{eyebrow?:string;title:string;action?:ReactNode}) {
  return <header className="dashboard-section-header"><div>{eyebrow&&<span>{eyebrow}</span>}<h2>{title}</h2></div>{action}</header>;
}

export function TabButton({active=false,className,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{active?:boolean}) {
  return <button {...props} className={join("dashboard-tab-button",active&&"active",className)}>{children}</button>;
}

export function IconButton({className,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={join("dashboard-icon-button",className)}>{children}</button>;
}
