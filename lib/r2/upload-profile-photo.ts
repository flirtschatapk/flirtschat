export type UploadResult={id:string;name:string;size:number;preview:string;objectKey:string};
export class PhotoUploadError extends Error{constructor(message:string,public readonly objectKey?:string,public readonly stage:"signing"|"transfer"|"database"="transfer"){super(message);this.name="PhotoUploadError"}}

export async function uploadProfilePhoto(file:File,onProgress:(value:number)=>void,replacePhotoId?:string):Promise<UploadResult>{
  const response=await fetch("/api/uploads/profile-photo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contentType:file.type,size:file.size})});
  const signed=await response.json() as {uploadUrl?:string;objectKey?:string;publicUrl?:string;fallbackUrl?:string};
  if(!response.ok||!signed.uploadUrl||!signed.objectKey||!signed.publicUrl||!signed.fallbackUrl)throw new PhotoUploadError("Photo upload preparation failed",undefined,"signing");
  try{await new Promise<void>((resolve,reject)=>{
    const request=new XMLHttpRequest();
    request.open("PUT",signed.uploadUrl!);
    request.setRequestHeader("Content-Type",file.type);
    request.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100))};
    request.onload=()=>request.status>=200&&request.status<300?resolve():reject(new Error("Photo transfer failed"));
    request.onerror=()=>reject(new Error("Photo transfer failed"));
    request.send(file);
  })}catch(error){
    console.warn("Direct media upload unavailable; using secure application fallback",error);
    const fallback=await fetch(signed.fallbackUrl,{method:"PUT",headers:{"content-type":file.type},body:file});if(!fallback.ok)throw new PhotoUploadError("Photo transfer failed",signed.objectKey,"transfer");onProgress(100);
  }
  const complete=await fetch("/api/uploads/profile-photo/complete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({objectKey:signed.objectKey,replacePhotoId})});
  const saved=await complete.json() as {id?:string;objectKey?:string};if(!complete.ok||!saved.id)throw new PhotoUploadError("Photo record save failed",saved.objectKey||signed.objectKey,"database");
  if(process.env.NODE_ENV==="development")console.info("[profile] avatar upload completed",{objectKeyPrefix:signed.objectKey.split("/").slice(0,2).join("/")});
  return{id:saved.id,name:file.name,size:file.size,preview:signed.publicUrl,objectKey:signed.objectKey};
}
