"use client";

import {ArrowDown,ArrowUp,Camera,Check,Crown,ImagePlus,LoaderCircle,RefreshCw,Trash2,X} from "lucide-react";
import {useRef,useState} from "react";
import {ProfileImage} from "@/components/profile-image";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {uploadProfilePhoto} from "@/lib/r2/upload-profile-photo";

const MAX_PHOTOS=5;

export function ProfilePhotoManager(){
  const shared=useCurrentProfile(),input=useRef<HTMLInputElement>(null);
  const [replaceId,setReplaceId]=useState<string>(),[progress,setProgress]=useState<number|null>(null),[busyId,setBusyId]=useState<string>(),[message,setMessage]=useState<{tone:"success"|"error";text:string}|null>(null);
  const photos=shared.profile?.photos??[],primary=photos[0]??null;
  const openPicker=(photoId?:string)=>{setReplaceId(photoId);input.current?.click()};
  const choose=async(file?:File)=>{
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setMessage({tone:"error",text:"Choose a JPG, PNG or WEBP image."});return}
    if(file.size>5*1024*1024){setMessage({tone:"error",text:"Choose an image smaller than 5 MB."});return}
    if(!replaceId&&photos.length>=MAX_PHOTOS){setMessage({tone:"error",text:"You can add up to 5 profile photos."});return}
    setMessage(null);setProgress(0);
    try{await uploadProfilePhoto(file,setProgress,replaceId);await shared.refresh();setMessage({tone:"success",text:replaceId?"Your photo was replaced ✨":"Your profile photo is ready ✨"})}
    catch{setMessage({tone:"error",text:"We couldn't upload your photo. Try again."})}
    finally{setProgress(null);setReplaceId(undefined);if(input.current)input.current.value=""}
  };
  const action=async(photoId:string,action:"primary"|"move"|"delete",direction?:"up"|"down")=>{
    setBusyId(photoId);setMessage(null);
    try{const response=await fetch("/api/profile/photos",{method:action==="delete"?"DELETE":"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(action==="delete"?{photoId}:{action,photoId,direction})});if(!response.ok)throw new Error();await shared.refresh();setMessage({tone:"success",text:action==="delete"?"Photo deleted.":action==="primary"?"Primary photo updated.":"Photo order updated."})}
    catch{setMessage({tone:"error",text:"We couldn't update your photos. Try again."})}finally{setBusyId(undefined)}
  };
  return <section className="profile-photo-manager" aria-labelledby="profile-photos-title">
    <header><div><h2 id="profile-photos-title">Profile photos</h2><p>Your primary photo appears throughout Flirtschat.</p></div><strong>{photos.length}/{MAX_PHOTOS}</strong></header>
    {message&&<div className={`profile-photo-message ${message.tone}`} role={message.tone==="error"?"alert":"status"}>{message.tone==="success"?<Check/>:<Camera/>}<span>{message.text}</span><button type="button" onClick={()=>setMessage(null)} aria-label="Dismiss message"><X/></button></div>}
    <div className="profile-photo-layout">
      <div className="profile-primary-photo"><ProfileImage src={primary?.url??null} alt="Primary profile photo"/>{primary?<><span><Crown/>Primary</span><button type="button" onClick={()=>openPicker(primary.id)} aria-label="Replace primary photo"><RefreshCw/>Replace</button></>:<button type="button" onClick={()=>openPicker()}><ImagePlus/>Add primary photo</button>}</div>
      <div className="profile-photo-grid">
        {photos.map((photo,index)=><article key={photo.id} className={index===0?"primary":""}><ProfileImage src={photo.url} alt={`Profile photo ${index+1}`}/><div className="profile-photo-actions"><button type="button" onClick={()=>openPicker(photo.id)} aria-label={`Replace photo ${index+1}`}><RefreshCw/></button>{index>0&&<button type="button" onClick={()=>void action(photo.id,"primary")} aria-label={`Make photo ${index+1} primary`}><Crown/></button>}<button type="button" disabled={index===0||busyId===photo.id} onClick={()=>void action(photo.id,"move","up")} aria-label={`Move photo ${index+1} earlier`}><ArrowUp/></button><button type="button" disabled={index===photos.length-1||busyId===photo.id} onClick={()=>void action(photo.id,"move","down")} aria-label={`Move photo ${index+1} later`}><ArrowDown/></button><button className="delete" type="button" disabled={busyId===photo.id} onClick={()=>void action(photo.id,"delete")} aria-label={`Delete photo ${index+1}`}>{busyId===photo.id?<LoaderCircle className="spin"/>:<Trash2/>}</button></div></article>)}
        {Array.from({length:Math.max(0,MAX_PHOTOS-photos.length)},(_,index)=><button type="button" className="profile-photo-empty" onClick={()=>openPicker()} key={`empty-${index}`} aria-label="Add profile photo"><ImagePlus/><span>Add photo</span></button>)}
      </div>
    </div>
    {progress!==null&&<div className="profile-upload-progress" role="status"><span><LoaderCircle className="spin"/>Uploading your photo…</span><strong>{progress}%</strong><i><b style={{width:`${progress}%`}}/></i></div>}
    <input ref={input} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>void choose(event.target.files?.[0])}/>
  </section>;
}
