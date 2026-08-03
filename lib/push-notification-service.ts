export type PushPermission="granted"|"denied"|"default"|"unsupported";
export const PUSH_CHANGE_EVENT="flirtschat:push-change";

export function getPushPermission():PushPermission{
  if(typeof window==="undefined"||!("Notification" in window))return"unsupported";
  return Notification.permission;
}

export async function enablePushNotifications(){
  if(!("Notification" in window))throw new Error("Push notifications are not supported by this browser");
  const permission=Notification.permission==="granted"?"granted":await Notification.requestPermission();
  if(permission!=="granted")throw new Error(permission==="denied"?"Notifications are blocked. Allow them in your browser settings.":"Notification permission was not granted");
  localStorage.setItem("flirtschat:push-enabled","true");
  window.dispatchEvent(new CustomEvent(PUSH_CHANGE_EVENT,{detail:{enabled:true,permission}}));
  try{new Notification("Flirtschat notifications are on",{body:"You’ll now receive match, message and account updates.",icon:"/favicon.ico",tag:"flirtschat-push-enabled"})}catch{}
  return{enabled:true,permission} as const;
}

export function disablePushNotifications(){
  localStorage.setItem("flirtschat:push-enabled","false");
  window.dispatchEvent(new CustomEvent(PUSH_CHANGE_EVENT,{detail:{enabled:false,permission:getPushPermission()}}));
  return{enabled:false,permission:getPushPermission()};
}

export function loadPushEnabled(){
  if(typeof window==="undefined")return false;
  return localStorage.getItem("flirtschat:push-enabled")==="true"&&getPushPermission()==="granted";
}

export function showTestPush(){
  if(getPushPermission()!=="granted")throw new Error("Enable browser notifications first");
  new Notification("A new vibe is waiting 💜",{body:"Maya sent you a new message.",icon:"/favicon.ico",tag:`flirtschat-test-${Date.now()}`});
}
