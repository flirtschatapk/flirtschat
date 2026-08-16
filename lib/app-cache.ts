type CacheEntry<T>={value:T;updatedAt:number};

const cache=new Map<string,CacheEntry<unknown>>();

export function userCacheKey(userId:string,scope:string){return `user:${userId}:${scope}`}

export function getUserCache<T>(userId:string|undefined,scope:string,maxAgeMs?:number):T|undefined{
  if(!userId)return undefined;
  const entry=cache.get(userCacheKey(userId,scope)) as CacheEntry<T>|undefined;
  if(!entry)return undefined;
  if(maxAgeMs!==undefined&&Date.now()-entry.updatedAt>maxAgeMs)return undefined;
  return entry.value;
}

export function getUserCacheStale<T>(userId:string|undefined,scope:string):T|undefined{
  if(!userId)return undefined;
  return (cache.get(userCacheKey(userId,scope)) as CacheEntry<T>|undefined)?.value;
}

export function setUserCache<T>(userId:string|undefined,scope:string,value:T){
  if(userId)cache.set(userCacheKey(userId,scope),{value,updatedAt:Date.now()});
  return value;
}

export function deleteUserCache(userId:string|undefined,scope:string){
  if(userId)cache.delete(userCacheKey(userId,scope));
}

export function clearUserCache(userId?:string){
  if(!userId){cache.clear();return}
  const prefix=`user:${userId}:`;
  for(const key of cache.keys())if(key.startsWith(prefix))cache.delete(key);
}

export function clearAllAppCache(){cache.clear()}
