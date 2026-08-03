import {useId} from "react";

export function AnimatedChatIcon(){
  const gradientId=`${useId().replace(/:/g,"")}-chat-gradient`;

  return <svg className="matches-reference-chat-icon" viewBox="0 0 48 48" role="img" aria-label="Chat">
    <defs>
      <linearGradient id={gradientId} x1="8" y1="10" x2="39" y2="39" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ff4fa3"/>
        <stop offset=".52" stopColor="#b44cff"/>
        <stop offset="1" stopColor="#5b7cff"/>
      </linearGradient>
    </defs>
    <path className="matches-icon-rear" d="M22 8.5h11.5a8 8 0 0 1 8 8v7a8 8 0 0 1-8 8h-1l3.1 4.5-7-4.5H22a8 8 0 0 1-8-8v-7a8 8 0 0 1 8-8Z" fill="#171324" stroke="#8b72ff" strokeWidth="1.6"/>
    <path className="matches-icon-front" d="M14.5 13h12a9 9 0 0 1 9 9v5.5a9 9 0 0 1-9 9h-7.8L12 41l1.7-5.8a9 9 0 0 1-8.2-9V22a9 9 0 0 1 9-9Z" fill={`url(#${gradientId})`}/>
    <path d="M14.5 14.5h12a7.5 7.5 0 0 1 7.5 7.5v5.5a7.5 7.5 0 0 1-7.5 7.5h-8.3l-3.6 2.4.9-3.5A7.5 7.5 0 0 1 7 26.2V22a7.5 7.5 0 0 1 7.5-7.5Z" fill="none" stroke="#fff" strokeOpacity=".2"/>
    <g className="matches-icon-dots" fill="#fff">
      <circle className="matches-icon-dot" cx="16" cy="25" r="1.8"/>
      <circle className="matches-icon-dot" cx="21" cy="25" r="1.8"/>
      <circle className="matches-icon-dot" cx="26" cy="25" r="1.8"/>
    </g>
  </svg>;
}
