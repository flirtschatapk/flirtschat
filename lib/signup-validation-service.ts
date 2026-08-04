export async function checkUsernameAvailability(username:string,excludeUserId?:string){
  const value=username.trim().toLowerCase();
  const response=await fetch("/api/auth/username",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:value,excludeUserId})});
  if(!response.ok)return{available:false};
  return await response.json() as {available:boolean};
}
