"use client";

import {useEffect} from "react";
import {APP_LANGUAGE_EVENT,APP_LANGUAGE_KEY,applyAppLanguage,loadAppLanguage} from "@/lib/language-settings";
import {getAppDictionary} from "@/lib/app-translations";

type TextState={source:string;rendered:string};
const textStates=new WeakMap<Text,TextState>();
const attributeStates=new WeakMap<Element,Map<string,TextState>>();
const attributes=["placeholder","title","aria-label"];

function translateDocument(code:string){const dictionary=getAppDictionary(code);let writing=false;const translate=()=>{if(writing)return;writing=true;document.querySelectorAll("body *").forEach(element=>{if(element.closest("script,style,code,pre")||element.hasAttribute("data-no-translate"))return;element.childNodes.forEach(node=>{if(node.nodeType!==Node.TEXT_NODE)return;const text=node as Text;const current=text.data;const trimmed=current.trim();if(!trimmed)return;let state=textStates.get(text);if(!state||current!==state.rendered)state={source:trimmed,rendered:current};const translated=dictionary[state.source]??state.source;const next=current.replace(trimmed,translated);if(next!==current)text.data=next;textStates.set(text,{source:state.source,rendered:next})});const states=attributeStates.get(element)??new Map<string,TextState>();attributes.forEach(name=>{const current=element.getAttribute(name);if(!current)return;let state=states.get(name);if(!state||current!==state.rendered)state={source:current,rendered:current};const next=dictionary[state.source]??state.source;if(next!==current)element.setAttribute(name,next);states.set(name,{source:state.source,rendered:next})});attributeStates.set(element,states)});writing=false};translate();return new MutationObserver(()=>queueMicrotask(translate))}

export function LanguageInitializer(){useEffect(()=>{let observer:MutationObserver|null=null;const sync=()=>{const language=loadAppLanguage();applyAppLanguage(language);observer?.disconnect();observer=translateDocument(language.code);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes})};sync();const storage=(event:StorageEvent)=>{if(event.key===APP_LANGUAGE_KEY)sync()};window.addEventListener(APP_LANGUAGE_EVENT,sync);window.addEventListener("storage",storage);return()=>{observer?.disconnect();window.removeEventListener(APP_LANGUAGE_EVENT,sync);window.removeEventListener("storage",storage)}},[]);return null}
