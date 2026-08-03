export type AdminRole="Super Admin"|"Moderator"|"Support";export type AdminSession={name:string;email:string;role:AdminRole;expiresAt:number};
export const ADMIN_SESSION_KEY="flirtschat:admin-session",ADMIN_2FA_CODE="";
export function authenticateAdmin(_email:string,_password:string){void _email;void _password;return null}
export function createAdminSession(admin:{name:string;email:string;role:AdminRole}){return{...admin,expiresAt:Date.now()+3600000}}
// Authorization is enforced by middleware with Supabase app_metadata. This object is display-only.
export function loadAdminSession():AdminSession{return{name:"Authorized Admin",email:"",role:"Super Admin",expiresAt:Date.now()+3600000}}
export function clearAdminSession(){void fetch("/auth/signout",{method:"POST"})}
