export type UploadResult={id:string;name:string;size:number;preview:string;objectKey:string};

export async function uploadProfilePhoto(file:File,onProgress:(value:number)=>void):Promise<UploadResult>{
  const response=await fetch("/api/uploads/profile-photo",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contentType:file.type,size:file.size})});
  const signed=await response.json() as {uploadUrl?:string;objectKey?:string;publicUrl?:string;error?:string};
  if(!response.ok||!signed.uploadUrl||!signed.objectKey||!signed.publicUrl)throw new Error(signed.error||"Could not prepare upload");
  await new Promise<void>((resolve,reject)=>{
    const request=new XMLHttpRequest();
    request.open("PUT",signed.uploadUrl!);
    request.setRequestHeader("Content-Type",file.type);
    request.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100))};
    request.onload=()=>request.status>=200&&request.status<300?resolve():reject(new Error("R2 upload failed"));
    request.onerror=()=>reject(new Error("R2 upload failed"));
    request.send(file);
  });
  const complete=await fetch("/api/uploads/profile-photo/complete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({objectKey:signed.objectKey})});
  const saved=await complete.json() as {id?:string;error?:string};if(!complete.ok||!saved.id)throw new Error(saved.error||"Could not save photo metadata");
  return{id:saved.id,name:file.name,size:file.size,preview:signed.publicUrl,objectKey:signed.objectKey};
}
