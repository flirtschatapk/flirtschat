import nextEnv from "@next/env";
import {DeleteObjectCommand,GetBucketCorsCommand,GetObjectCommand,HeadBucketCommand,PutObjectCommand,S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

nextEnv.loadEnvConfig(process.cwd());
const names=["CLOUDFLARE_ACCOUNT_ID","CLOUDFLARE_R2_ACCESS_KEY_ID","CLOUDFLARE_R2_SECRET_ACCESS_KEY","CLOUDFLARE_R2_PUBLIC_BUCKET","CLOUDFLARE_R2_PRIVATE_BUCKET","CLOUDFLARE_R2_PUBLIC_URL"];
const missing=names.filter(name=>!process.env[name]?.trim());
if(missing.length){console.error(`Missing R2 configuration: ${missing.join(", ")}`);process.exitCode=1}else{
  const client=new S3Client({region:"auto",endpoint:`https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,secretAccessKey:process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}});
  for(const kind of ["PUBLIC","PRIVATE"]){
    const Bucket=process.env[`CLOUDFLARE_R2_${kind}_BUCKET`];
    try{
      await client.send(new HeadBucketCommand({Bucket}));
      let cors=[];
      try{const result=await client.send(new GetBucketCorsCommand({Bucket}));cors=(result.CORSRules??[]).map(({AllowedOrigins,AllowedMethods,AllowedHeaders})=>({origins:AllowedOrigins,methods:AllowedMethods,headers:AllowedHeaders}))}catch(error){cors=[{status:`unavailable (${error.name})`}]}
      console.log(`${kind} bucket reachable`);console.log(`CORS ${JSON.stringify(cors)}`);
    }catch(error){console.error(`${kind} bucket unavailable (${error.name})`);process.exitCode=1}
  }
  try{new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL);console.log("Public URL is syntactically valid")}catch{console.error("Public URL is invalid");process.exitCode=1}
  if(process.argv.includes("--upload-test")){
    const Bucket=process.env.CLOUDFLARE_R2_PRIVATE_BUCKET,Key=`diagnostics/${crypto.randomUUID()}.txt`,body=new TextEncoder().encode("flirtschat-r2-check"),origin="http://localhost:3000";
    try{
      const put=await getSignedUrl(client,new PutObjectCommand({Bucket,Key,ContentType:"text/plain",ContentLength:body.byteLength}),{expiresIn:60});
      const preflight=await fetch(put,{method:"OPTIONS",headers:{Origin:origin,"Access-Control-Request-Method":"PUT","Access-Control-Request-Headers":"content-type"}});
      console.log(`Private PUT preflight: ${preflight.status}; allow-origin: ${preflight.headers.get("access-control-allow-origin")??"missing"}`);
      const uploaded=await fetch(put,{method:"PUT",headers:{"content-type":"text/plain",Origin:origin},body});console.log(`Private signed PUT: ${uploaded.ok?"passed":"failed"}`);
      if(uploaded.ok){const get=await getSignedUrl(client,new GetObjectCommand({Bucket,Key}),{expiresIn:60}),downloaded=await fetch(get);console.log(`Private signed GET: ${downloaded.ok?"passed":"failed"}`)}
    }catch(error){console.error(`Upload diagnostic failed (${error.name})`);process.exitCode=1}finally{try{await client.send(new DeleteObjectCommand({Bucket,Key}))}catch{/* best-effort cleanup */}}
  }
}
