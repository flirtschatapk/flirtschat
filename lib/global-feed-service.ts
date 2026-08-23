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
  heartCount:number;
  commentCount:number;
  shareCount:number;
  heartedByMe:boolean;
  savedByMe:boolean;
};

type PostRow={id:string;user_id:string;body:string|null;image_key:string|null;created_at:string};
type ProfileRow={id:string;display_name:string;username:string|null;verified:boolean};
type PhotoRow={user_id:string;object_key:string};
type InteractionRow={post_id:string;heart_count:number|string;comment_count:number|string;share_count:number|string;hearted_by_me:boolean;saved_by_me:boolean};
export type GlobalComment={id:string;postId:string;userId:string;body:string;createdAt:string;name:string;photoKey:string|null};
export type GlobalCursor={createdAt:string;id:string};

export function postImageUrl(imageKey:string){return `/api/media/post-image?key=${encodeURIComponent(imageKey)}`}

export async function loadGlobalPosts(cursor?:GlobalCursor){
  const supabase=createClient();
  let query=supabase.from("fc_posts").select("id,user_id,body,image_key,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(GLOBAL_PAGE_SIZE);
  if(cursor)query=query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const{data,error}=await query;
  if(error)throw error;
  return addInteractions(await hydratePosts((data??[]) as PostRow[]));
}

export async function loadGlobalPost(id:string){
  const supabase=createClient();
  const{data,error}=await supabase.from("fc_posts").select("id,user_id,body,image_key,created_at").eq("id",id).maybeSingle();
  if(error)throw error;
  return data? (await addInteractions(await hydratePosts([data as PostRow])))[0]??null:null;
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
  return rows.flatMap(row=>{const profile=profileMap.get(row.user_id);if(!profile)return [];return [{id:row.id,userId:row.user_id,body:row.body,imageKey:row.image_key,createdAt:row.created_at,name:profile.display_name||profile.username||"Flirtschat member",username:profile.username,verified:profile.verified,photoKey:photoMap.get(row.user_id)??null,heartCount:0,commentCount:0,shareCount:0,heartedByMe:false,savedByMe:false}]});
}

async function addInteractions(posts:GlobalPost[]){
  if(!posts.length)return posts;
  const{data,error}=await createClient().rpc("fc_get_post_interaction_summary",{requested_posts:posts.map(post=>post.id)});
  if(error)throw error;
  const rows=(data??[]) as unknown as InteractionRow[];
  const map=new Map(rows.map((row:InteractionRow)=>[row.post_id,row]));
  return posts.map(post=>{const row=map.get(post.id);return row?{...post,heartCount:Number(row.heart_count)||0,commentCount:Number(row.comment_count)||0,shareCount:Number(row.share_count)||0,heartedByMe:Boolean(row.hearted_by_me),savedByMe:Boolean(row.saved_by_me)}:post});
}

export async function loadPostInteractionSummary(postIds:string[]){
  if(!postIds.length)return {} as Record<string,Pick<GlobalPost,"heartCount"|"commentCount"|"shareCount"|"heartedByMe"|"savedByMe">>;
  const{data,error}=await createClient().rpc("fc_get_post_interaction_summary",{requested_posts:postIds});if(error)throw error;
  const rows=(data??[]) as unknown as InteractionRow[];
  return Object.fromEntries(rows.map((row:InteractionRow)=>[row.post_id,{heartCount:Number(row.heart_count)||0,commentCount:Number(row.comment_count)||0,shareCount:Number(row.share_count)||0,heartedByMe:Boolean(row.hearted_by_me),savedByMe:Boolean(row.saved_by_me)}]));
}

const rpcRow=<T,>(data:T|T[]|null)=>Array.isArray(data)?data[0]??null:data;
export async function togglePostHeart(postId:string){const{data,error}=await createClient().rpc("fc_toggle_post_like",{requested_post:postId});if(error)throw error;const row=rpcRow(data as {hearted:boolean;heart_count:number|string}|Array<{hearted:boolean;heart_count:number|string}>|null);if(!row)throw new Error("Heart update unavailable");return{hearted:Boolean(row.hearted),heartCount:Number(row.heart_count)||0}}
export async function togglePostSave(postId:string){const{data,error}=await createClient().rpc("fc_toggle_post_save",{requested_post:postId});if(error)throw error;return Boolean(data)}
export async function recordPostShare(postId:string){const{data,error}=await createClient().rpc("fc_record_post_share",{requested_post:postId});if(error)throw error;return Number(data)||0}

async function hydrateComments(rows:Array<{id:string;post_id:string;user_id:string;body:string;created_at:string}>):Promise<GlobalComment[]>{
  if(!rows.length)return [];
  const supabase=createClient(),ids=[...new Set(rows.map(row=>row.user_id))];
  const[{data:profiles,error:profileError},{data:photos,error:photoError}]=await Promise.all([
    supabase.from("fc_profiles").select("id,display_name,username").in("id",ids),
    supabase.from("fc_profile_photos").select("user_id,object_key").in("user_id",ids).eq("moderation_status","approved").order("position",{ascending:true}),
  ]);
  if(profileError)throw profileError;if(photoError)throw photoError;
  const profileMap=new Map((profiles??[]).map(row=>[row.id,row as {id:string;display_name:string;username:string|null}])),photoMap=new Map<string,string>();(photos??[] as PhotoRow[]).forEach(row=>{if(!photoMap.has(row.user_id))photoMap.set(row.user_id,row.object_key)});
  return rows.flatMap(row=>{const profile=profileMap.get(row.user_id);if(!profile)return [];return[{id:row.id,postId:row.post_id,userId:row.user_id,body:row.body,createdAt:row.created_at,name:profile.display_name||profile.username||"Flirtschat member",photoKey:photoMap.get(row.user_id)??null}]});
}

export async function loadPostComments(postId:string,limit=10,before?:{createdAt:string;id:string}){
  let query=createClient().from("fc_post_comments").select("id,post_id,user_id,body,created_at").eq("post_id",postId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(limit);
  if(before)query=query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
  const{data,error}=await query;if(error)throw error;const rows=(data??[]) as Array<{id:string;post_id:string;user_id:string;body:string;created_at:string}>;return{comments:await hydrateComments(rows),hasMore:rows.length===limit};
}

export async function loadPostComment(commentId:string){
  const{data,error}=await createClient().from("fc_post_comments").select("id,post_id,user_id,body,created_at").eq("id",commentId).maybeSingle();if(error)throw error;return data?(await hydrateComments([data as {id:string;post_id:string;user_id:string;body:string;created_at:string}]))[0]??null:null;
}
export async function createPostComment(postId:string,body:string){const{data,error}=await createClient().rpc("fc_create_post_comment",{requested_post:postId,comment_body:body.trim()});if(error)throw error;const id=String(data??"");if(!id)throw new Error("Comment unavailable");const comment=await loadPostComment(id);if(!comment)throw new Error("Comment unavailable");return comment}
export async function deletePostComment(commentId:string){const{error}=await createClient().from("fc_post_comments").delete().eq("id",commentId);if(error)throw error}

export async function deleteGlobalPost(id:string){
  const{error}=await createClient().from("fc_posts").delete().eq("id",id);
  if(error)throw error;
}
