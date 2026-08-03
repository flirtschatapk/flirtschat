import {defaultDiscoverFilters,type DiscoverFilters} from "./discover-types";

export const DISCOVER_PREFERENCES_KEY="flirtschat:discover-preferences";
export const DISCOVER_PREFERENCES_EVENT="flirtschat:discover-preferences-change";
export function loadDiscoverPreferences():DiscoverFilters{if(typeof window==="undefined")return defaultDiscoverFilters;try{return{...defaultDiscoverFilters,...JSON.parse(localStorage.getItem(DISCOVER_PREFERENCES_KEY)??"{}") as Partial<DiscoverFilters>}}catch{return defaultDiscoverFilters}}
export function saveDiscoverPreferences(value:DiscoverFilters){localStorage.setItem(DISCOVER_PREFERENCES_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent(DISCOVER_PREFERENCES_EVENT,{detail:value}));return value}
export function resetDiscoverPreferences(){return saveDiscoverPreferences(defaultDiscoverFilters)}
