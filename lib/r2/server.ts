import {S3Client} from "@aws-sdk/client-s3";

function required(name:string){
  const value=process.env[name];
  if(!value)throw new Error(`${name} is not configured`);
  return value;
}

let client:S3Client|undefined;

export function getR2Client(){
  if(client)return client;
  const accountId=required("CLOUDFLARE_ACCOUNT_ID");
  client=new S3Client({
    region:"auto",
    endpoint:`https://${accountId}.r2.cloudflarestorage.com`,
    credentials:{
      accessKeyId:required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey:required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

export function getPublicBucket(){return "flirtschat-storage"}
export function getPrivateBucket(){return required("CLOUDFLARE_R2_PRIVATE_BUCKET")}
export function getPublicR2Url(objectKey:string){
  return `${required("CLOUDFLARE_R2_PUBLIC_URL").replace(/\/$/,"")}/${objectKey}`;
}
