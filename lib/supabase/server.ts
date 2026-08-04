import {createServerClient,type CookieOptions} from "@supabase/ssr";
import {cookies} from "next/headers";
import {getSupabaseConfig} from "./config";

export type CookieToSet={name:string;value:string;options:CookieOptions};

export async function createClient(onCookies?: (values:CookieToSet[])=>void){
  const cookieStore=await cookies();
  const{url,key}=getSupabaseConfig();
  return createServerClient(url,key,{cookies:{
    getAll:()=>cookieStore.getAll(),
    setAll(values){
      onCookies?.(values as CookieToSet[]);
      try{values.forEach(({name,value,options})=>cookieStore.set(name,value,options))}catch{
        // Server Components cannot write cookies; the auth callback can.
      }
    },
  }});
}
