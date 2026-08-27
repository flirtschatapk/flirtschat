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
export type CommentReaction="heart"|"haha"|"fire"|"love";
export type GlobalComment={id:string;postId:string;userId:string;body:string;createdAt:string;updatedAt?:string;editedAt?:string|null;parentCommentId:string|null;name:string;username?:string|null;photoKey:string|null;replyCount:number;reactionCounts:Partial<Record<CommentReaction,number>>;myReaction:CommentReaction|null};
export type GlobalCursor={createdAt:string;id:string};

export function postImageUrl(imageKey:string){return `/api/media/post-image?key=${encodeURIComponent(imageKey)}`}

export async function loadGlobalPosts(cursor?:GlobalCursor){
  const{data,error}=await createClient().rpc("fc_get_global_posts",{requested_limit:GLOBAL_PAGE_SIZE,cursor_created_at:cursor?.createdAt??null,cursor_id:cursor?.id??null});
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

type CommentRow={id:string;post_id:string;user_id:string;body:string;created_at:string;updated_at?:string;edited_at?:string|null;parent_comment_id?:string|null;reply_count?:number|string;reaction_counts?:Record<string,number>;my_reaction?:CommentReaction|null};
async function hydrateComments(rows:CommentRow[]):Promise<GlobalComment[]>{
  if(!rows.length)return [];
  const supabase=createClient(),ids=[...new Set(rows.map(row=>row.user_id))],{data:{user}}=await supabase.auth.getUser();
  const commentIds=rows.map(row=>row.id);
  const[{data:profiles,error:profileError},{data:photos,error:photoError},{data:replyRows,error:replyError},{data:reactionRows,error:reactionError}]=await Promise.all([
    supabase.from("fc_profiles").select("id,display_name,username").in("id",ids),
    supabase.from("fc_profile_photos").select("user_id,object_key").in("user_id",ids).eq("moderation_status","approved").order("position",{ascending:true}),
    supabase.from("fc_post_comments").select("parent_comment_id").in("parent_comment_id",commentIds),
    supabase.from("fc_comment_reactions").select("comment_id,reaction,user_id").in("comment_id",commentIds),
  ]);
  if(profileError)throw profileError;if(photoError)throw photoError;if(replyError)throw replyError;if(reactionError)throw reactionError;
  const profileMap=new Map((profiles??[]).map(row=>[row.id,row as {id:string;display_name:string;username:string|null}])),photoMap=new Map<string,string>();(photos??[] as PhotoRow[]).forEach(row=>{if(!photoMap.has(row.user_id))photoMap.set(row.user_id,row.object_key)});
  const replyCounts=new Map<string,number>();(replyRows??[] as Array<{parent_comment_id:string}>).forEach(row=>replyCounts.set(row.parent_comment_id,(replyCounts.get(row.parent_comment_id)??0)+1));const reactionCounts=new Map<string,Partial<Record<CommentReaction,number>>>(),myReactions=new Map<string,CommentReaction>();(reactionRows??[] as Array<{comment_id:string;reaction:CommentReaction;user_id:string}>).forEach(row=>{const counts=reactionCounts.get(row.comment_id)??{};const reaction=row.reaction as CommentReaction;counts[reaction]=(counts[reaction]??0)+1;reactionCounts.set(row.comment_id,counts);if(row.user_id===user?.id)myReactions.set(row.comment_id,reaction)});
  return rows.flatMap(row=>{const profile=profileMap.get(row.user_id);if(!profile)return [];return[{id:row.id,postId:row.post_id,userId:row.user_id,body:row.body,createdAt:row.created_at,updatedAt:row.updated_at,editedAt:row.edited_at??null,parentCommentId:row.parent_comment_id??null,name:profile.display_name||profile.username||"Flirtschat member",username:profile.username,photoKey:photoMap.get(row.user_id)??null,replyCount:replyCounts.get(row.id)??0,reactionCounts:reactionCounts.get(row.id)??{},myReaction:myReactions.get(row.id)??null}]});
}

export async function loadPostComments(postId:string,limit=10,before?:{createdAt:string;id:string}){
  let query=createClient().from("fc_post_comments").select("id,post_id,user_id,body,created_at,updated_at,edited_at,parent_comment_id").eq("post_id",postId).is("parent_comment_id",null).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(limit+1);
  if(before)query=query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
  const{data,error}=await query;if(error)throw error;const rows=(data??[]) as CommentRow[];return{comments:await hydrateComments(rows.slice(0,limit)),hasMore:rows.length>limit};
}

export async function loadCommentReplies(rootCommentId:string,limit=10,before?:{createdAt:string;id:string}){
  let query=createClient().from("fc_post_comments").select("id,post_id,user_id,body,created_at,updated_at,edited_at,parent_comment_id").eq("parent_comment_id",rootCommentId).order("created_at",{ascending:true}).order("id",{ascending:true}).limit(limit+1);
  if(before)query=query.or(`created_at.gt.${before.createdAt},and(created_at.eq.${before.createdAt},id.gt.${before.id})`);
  const{data,error}=await query;if(error)throw error;const rows=(data??[]) as CommentRow[];return{comments:await hydrateComments(rows.slice(0,limit)),hasMore:rows.length>limit};
}

export async function loadPostComment(commentId:string){
  const{data,error}=await createClient().from("fc_post_comments").select("id,post_id,user_id,body,created_at,updated_at,edited_at,parent_comment_id").eq("id",commentId).maybeSingle();if(error)throw error;return data?(await hydrateComments([data as CommentRow]))[0]??null:null;
}
export async function createPostComment(postId:string,body:string,parentCommentId?:string|null){const{data,error}=await createClient().rpc("fc_create_post_comment",{requested_post:postId,comment_body:body.trim(),requested_parent:parentCommentId??null});if(error)throw error;const id=String(data??"");if(!id)throw new Error("Comment unavailable");const comment=await loadPostComment(id);if(!comment)throw new Error("Comment unavailable");return comment}
export async function deletePostComment(commentId:string){const{error}=await createClient().from("fc_post_comments").delete().eq("id",commentId);if(error)throw error}
export async function editPostComment(commentId:string,body:string){const{data,error}=await createClient().rpc("fc_edit_post_comment",{requested_comment:commentId,requested_body:body.trim()});if(error)throw error;const comment=await loadPostComment(String(data??""));if(!comment)throw new Error("Comment unavailable");return comment}
type CommentReactionResult={reaction:CommentReaction|null;reaction_counts:Record<string,number>};
export async function toggleCommentReaction(commentId:string,reaction:CommentReaction){const{data,error}=await createClient().rpc("fc_toggle_comment_reaction",{requested_comment:commentId,requested_reaction:reaction});if(error)throw error;const row=rpcRow(data as CommentReactionResult|CommentReactionResult[]|null);if(!row)throw new Error("Reaction unavailable");return{myReaction:row.reaction,reactionCounts:row.reaction_counts as Partial<Record<CommentReaction,number>>}}
export async function reportPostComment(commentId:string,category:string,details:string){const{error}=await createClient().rpc("fc_report_post_comment",{requested_comment:commentId,report_category:category,report_details:details});if(error)throw error}

export async function deleteGlobalPost(id:string){
  const{error}=await createClient().from("fc_posts").delete().eq("id",id);
  if(error)throw error;
}

export async function updateGlobalPost(id:string,body:string|null){
  const{data,error}=await createClient().from("fc_posts").update({body}).eq("id",id).select("id,user_id,body,image_key,created_at").single();
  if(error)throw error;
  return data as PostRow;
}

export async function hideGlobalPost(id:string){
  const{error}=await createClient().rpc("fc_hide_global_post",{requested_post:id});
  if(error)throw error;
}
