"use client";
import { useEffect, useState } from "react";
import { navItems } from "@/data/landing-page";
import { Logo } from "./logo";

export function Navbar(){
 const [active,setActive]=useState("Home");
 useEffect(()=>{const fn=()=>{for(const item of [...navItems].reverse()){const el=document.getElementById(item.toLowerCase());if(el&&el.getBoundingClientRect().top<180){setActive(item);break}}};fn();addEventListener("scroll",fn,{passive:true});return()=>removeEventListener("scroll",fn)},[]);
 return <header className="nav-shell"><div className="nav container"><Logo/><nav aria-label="Primary navigation" className="desktop-nav">{navItems.map(x=><a key={x} className={active===x?"active":""} href={`#${x.toLowerCase()}`}>{x}</a>)}</nav><div className="nav-actions"><a className="btn btn-ghost login" href="/login">Log in</a><a className="btn btn-small btn-gradient" href="/signup">Sign up</a></div></div></header>
}
