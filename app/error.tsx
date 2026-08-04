"use client";

import {useEffect} from "react";

export default function AppError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("[app/error] rendering failed",{name:error.name,digest:error.digest??"none"})},[error]);
  return <main className="route-loading" role="alert"><span>Something interrupted this page.</span><button type="button" onClick={reset}>Retry</button></main>;
}
