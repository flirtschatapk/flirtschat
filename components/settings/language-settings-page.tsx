"use client";

import {ArrowLeft,Check,Languages,Search,X} from "lucide-react";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {APP_LANGUAGE_EVENT,APP_LANGUAGE_KEY,appLanguages,loadAppLanguage,saveAppLanguage,type AppLanguage} from "@/lib/language-settings";

export function LanguageSettingsPage(){
  const [selected,setSelected]=useState("en");
  const [query,setQuery]=useState("");
  const [notice,setNotice]=useState(false);
  useEffect(()=>{const sync=()=>setSelected(loadAppLanguage().code);sync();const storage=(event:StorageEvent)=>{if(event.key===APP_LANGUAGE_KEY)sync()};window.addEventListener(APP_LANGUAGE_EVENT,sync);window.addEventListener("storage",storage);return()=>{window.removeEventListener(APP_LANGUAGE_EVENT,sync);window.removeEventListener("storage",storage)}},[]);
  const filtered=useMemo(()=>{const value=query.trim().toLocaleLowerCase();return value?appLanguages.filter(item=>`${item.label} ${item.nativeName}`.toLocaleLowerCase().includes(value)):appLanguages},[query]);
  const choose=(language:AppLanguage)=>{setSelected(language.code);saveAppLanguage(language);setNotice(true);window.setTimeout(()=>setNotice(false),2200)};
  return <main className="language-page"><header className="language-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Language</h1><p>Choose your preferred app language</p></div><i><Languages/></i></header><div className="language-shell"><label className="language-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search languages" aria-label="Search languages"/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Clear search"><X/></button>}</label><section className="language-card" aria-label="Available languages">{filtered.map(language=><button type="button" className={selected===language.code?"selected":""} onClick={()=>choose(language)} key={language.code}><span className="language-code">{language.code.toUpperCase()}</span><span><strong>{language.label}</strong><small dir={language.direction}>{language.nativeName}</small></span>{selected===language.code&&<i><Check/></i>}</button>)}{filtered.length===0&&<p className="language-empty">No language found.</p>}</section><p className="language-note">Your selection is saved instantly on this device. Right-to-left layout is enabled automatically for Farsi, Arabic and Urdu.</p></div>{notice&&<div className="language-toast" role="status"><Check/>Language updated</div>}<AppBottomNav active="settings"/></main>
}
