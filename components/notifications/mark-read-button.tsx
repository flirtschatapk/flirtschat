import{CheckCheck}from"lucide-react";
export function MarkReadButton({onClick,disabled}:{onClick:()=>void;disabled:boolean}){return <button className="fc-notif-mark" type="button" onClick={onClick} disabled={disabled}><CheckCheck/><span>Mark all as read</span></button>}
