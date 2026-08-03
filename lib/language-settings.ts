export type AppLanguage={code:string;label:string;nativeName:string;direction:"ltr"|"rtl"};
export const APP_LANGUAGE_KEY="flirtschat-language";
export const APP_LANGUAGE_EVENT="flirtschat:language-change";
export const appLanguages:AppLanguage[]=[
  {code:"en",label:"English",nativeName:"English",direction:"ltr"},
  {code:"es",label:"Spanish",nativeName:"Español",direction:"ltr"},
  {code:"fa",label:"Farsi",nativeName:"فارسی",direction:"rtl"},
  {code:"pt",label:"Portuguese",nativeName:"Português",direction:"ltr"},
  {code:"fr",label:"French",nativeName:"Français",direction:"ltr"},
  {code:"de",label:"German",nativeName:"Deutsch",direction:"ltr"},
  {code:"it",label:"Italian",nativeName:"Italiano",direction:"ltr"},
  {code:"ar",label:"Arabic",nativeName:"العربية",direction:"rtl"},
  {code:"bn",label:"Bengali",nativeName:"বাংলা",direction:"ltr"},
  {code:"hi",label:"Hindi",nativeName:"हिन्दी",direction:"ltr"},
  {code:"tr",label:"Turkish",nativeName:"Türkçe",direction:"ltr"},
  {code:"ru",label:"Russian",nativeName:"Русский",direction:"ltr"},
  {code:"id",label:"Indonesian",nativeName:"Bahasa Indonesia",direction:"ltr"},
  {code:"ur",label:"Urdu",nativeName:"اردو",direction:"rtl"},
  {code:"ja",label:"Japanese",nativeName:"日本語",direction:"ltr"},
  {code:"ko",label:"Korean",nativeName:"한국어",direction:"ltr"},
  {code:"zh",label:"Chinese",nativeName:"中文",direction:"ltr"},
];
export const defaultAppLanguage=appLanguages[0];
export function loadAppLanguage():AppLanguage{if(typeof window==="undefined")return defaultAppLanguage;try{const saved=JSON.parse(localStorage.getItem(APP_LANGUAGE_KEY)??"null") as Partial<AppLanguage>|null;return appLanguages.find(item=>item.code===saved?.code)??defaultAppLanguage}catch{return defaultAppLanguage}}
export function applyAppLanguage(language:AppLanguage){document.documentElement.lang=language.code;document.documentElement.dir=language.direction;document.documentElement.dataset.appLanguage=language.code}
export function saveAppLanguage(language:AppLanguage){localStorage.setItem(APP_LANGUAGE_KEY,JSON.stringify(language));applyAppLanguage(language);window.dispatchEvent(new CustomEvent(APP_LANGUAGE_EVENT,{detail:language}));return language}
