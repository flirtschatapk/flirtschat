"use client";
import {Camera,GripVertical,LoaderCircle,RefreshCw,Star,X} from "lucide-react";
import Image from "next/image";
import {useCallback,useEffect,useRef,useState} from "react";
import type {UseFormReturn} from "react-hook-form";
import {UploadToast,type UploadToastKind} from "@/components/upload-toast";
import type {OnboardingValues} from "@/lib/onboarding-schema";
import {uploadProfilePhoto} from "@/lib/r2/upload-profile-photo";

type PendingUpload={file:File;preview:string};
export function PhotoUploadStep({form}:{form:UseFormReturn<OnboardingValues>}){
  const input=useRef<HTMLInputElement>(null),dragged=useRef<number|null>(null),slowTimer=useRef<number|null>(null);
  const[progress,setProgress]=useState<Record<string,number>>({}),[toast,setToast]=useState<UploadToastKind|null>(null),[pending,setPending]=useState<PendingUpload|null>(null);
  const photos=form.watch("photos"),dismiss=useCallback(()=>setToast(null),[]);
  useEffect(()=>()=>{if(slowTimer.current)window.clearTimeout(slowTimer.current);if(pending)URL.revokeObjectURL(pending.preview)},[pending]);
  const runUpload=async(file:File,preview?:string)=>{
    if(!navigator.onLine){if(!preview)setPending({file,preview:URL.createObjectURL(file)});setToast("offline");return}
    setToast("uploading");setProgress(p=>({...p,[file.name]:1}));
    slowTimer.current=window.setTimeout(()=>setToast("slow"),4000);
    try{
      const uploaded=await uploadProfilePhoto(file,n=>setProgress(p=>({...p,[file.name]:n})));
      form.setValue("photos",[...form.getValues("photos"),uploaded],{shouldValidate:true,shouldDirty:true});
      if(preview)URL.revokeObjectURL(preview);setPending(null);setToast("success");
    }catch(error){console.error("Photo upload failed",error);if(!preview)setPending({file,preview:URL.createObjectURL(file)});setToast(navigator.onLine?"failed":"offline")}
    finally{if(slowTimer.current)window.clearTimeout(slowTimer.current);slowTimer.current=null;setProgress(p=>{const next={...p};delete next[file.name];return next})}
  };
  const add=async(files:FileList|null)=>{if(!files)return;for(const file of Array.from(files).slice(0,6-photos.length)){if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setToast("format");continue}if(file.size>5*1024*1024){setToast("large");continue}await runUpload(file)}if(input.current)input.current.value=""};
  const retry=()=>{if(pending)void runUpload(pending.file,pending.preview)},remove=(id:string)=>form.setValue("photos",photos.filter(p=>p.id!==id),{shouldValidate:true,shouldDirty:true});
  const reorder=(from:number,to:number)=>{if(from===to||to<0||to>=photos.length)return;const next=[...photos];const[photo]=next.splice(from,1);next.splice(to,0,photo);form.setValue("photos",next,{shouldValidate:true,shouldDirty:true})};
  return <section><StepTitle n="01" title="Show your best side" text="Add up to six photos. Your first photo is your main profile picture."/><div className="onboarding-photo-grid">{photos.map((photo,i)=><div className="onboarding-photo" key={photo.id} draggable onDragStart={()=>{dragged.current=i}} onDragOver={e=>e.preventDefault()} onDrop={()=>{if(dragged.current!==null)reorder(dragged.current,i);dragged.current=null}}><Image src={photo.preview} alt={`${photo.name}${i===0?", main photo":""}`} fill unoptimized sizes="180px"/><button className="photo-remove" type="button" onClick={()=>remove(photo.id)} aria-label={`Remove ${photo.name}`}><X/></button>{i===0&&<span className="main-photo"><Star/> Main</span>}<div className="photo-order"><button type="button" disabled={i===0} onClick={()=>reorder(i,i-1)} aria-label="Move photo earlier">←</button><GripVertical aria-label="Drag to reorder"/><button type="button" disabled={i===photos.length-1} onClick={()=>reorder(i,i+1)} aria-label="Move photo later">→</button></div><small>{(photo.size/1048576).toFixed(1)} MB</small></div>)}{pending&&<div className="onboarding-photo upload-pending"><Image src={pending.preview} alt="Selected photo waiting to retry" fill unoptimized sizes="180px"/><button type="button" onClick={retry}><RefreshCw/> Retry</button></div>}{photos.length<6&&!pending&&<button type="button" className="onboarding-photo-add" onClick={()=>input.current?.click()}><Camera/><strong>Add photos</strong><span>JPG, PNG or WEBP<br/>up to 5 MB</span></button>}</div><input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>void add(e.target.files)}/>{Object.entries(progress).map(([name,value])=><div className="upload-progress" key={name}><LoaderCircle className="spin"/><span>{name}</span><div><i style={{width:`${value}%`}}/></div><b>{value}%</b></div>)}{form.formState.errors.photos?.message&&!pending&&<p className="field-error" role="alert">{form.formState.errors.photos.message}</p>}{toast&&<UploadToast kind={toast} onDismiss={dismiss} onRetry={pending?retry:undefined}/>}</section>;
}
export function StepTitle({n,title,text}:{n:string;title:string;text:string}){return <div className="onboarding-title"><span>{n}</span><div><h1>{title}</h1><p>{text}</p></div></div>}
