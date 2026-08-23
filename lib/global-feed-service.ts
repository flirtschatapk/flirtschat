import {createClient} from "@/lib/supabase/client";

export const GLOBAL_PAGE_SIZE=30;
export const GLOBAL_IMAGE_MAX_BYTES=10*1024*1024;
export const GLOBAL_IMAGE_TYPES=["image/jpeg","image/png","image/webp"] as const;

export type GlobalPost={
  id:string;
  userId:string;
  body:string|null;
  imageKey:string|null;
  createdAt:string;
  name:string;
  username:string|null;
  verified:boolean;
  photoKey:string|null;
};

type PostRow={id:string;user_id:string;body:string|null;image_key:string|null;created_at:string};
type ProfileRow={id:string;display_name:string;username:string|null;verified:boolean};
type PhotoRow={user_id:string;object_key:string};
export type GlobalCursor={createdAt:string;id:string};

export function postImageUrl(imageKey:string){return `/api/media/post-image?key=${encodeURIComponent(imageKey)}`}

export async function loadGlobalPosts(cursor?:GlobalCursor){
  const supabase=createClient();
  let query=supabase.from("fc_posts").select("id,user_id,body,image_key,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(GLOBAL_PAGE_SIZE);
  if(cursor)query=query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const{data,error}=await query;
  if(error)throw error;
  return hydratePosts((data??[]) as PostRow[]);
}

export async function loadGlobalPost(id:string){
  const supabase=createClient();
  const{data,error}=await supabase.from("fc_posts").select("id,user_id,body,image_key,created_at").eq("id",id).maybeSingle();
  if(error)throw error;
  return data? (await hydratePosts([data as PostRow]))[0]??null:null;
}

async function hydratePosts(rows:PostRow[]):Promise<GlobalPost[]>{
  if(!rows.length)return [];
  const supabase=createClient(),ids=[...new Set(rows.map(row=>row.user_id))];
  const[{data:profiles,error:profileError},{data:photos,error:photoError}]=await Promise.all([
    supabase.from("fc_profiles").select("id,display_name,username,verified").in("id",ids),
    supabase.from("fc_profile_photos").select("user_id,object_key").in("user_id",ids).eq("moderation_status","approved").order("position",{ascending:true}),
  ]);
  if(profileError)throw profileError;
  if(photoError)throw photoError;
  const profileMap=new Map((profiles??[]).map(row=>[row.id,row as ProfileRow]));
  const photoMap=new Map<string,string>();
  (photos??[] as PhotoRow[]).forEach(row=>{if(!photoMap.has(row.user_id))photoMap.set(row.user_id,row.object_key)});
  return rows.flatMap(row=>{const profile=profileMap.get(row.user_id);if(!profile)return [];return [{id:row.id,userId:row.user_id,body:row.body,imageKey:row.image_key,createdAt:row.created_at,name:profile.display_name||profile.username||"Flirtschat member",username:profile.username,verified:profile.verified,photoKey:photoMap.get(row.user_id)??null}]});
}

export async function deleteGlobalPost(id:string){
  const{error}=await createClient().from("fc_posts").delete().eq("id",id);
  if(error)throw error;
}
