const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

export async function verifyCurrentPassword(password:string){
  await wait(550);
  if(password.toLowerCase()==="wrongpassword")throw new Error("Current password is incorrect");
  if(password.length<8)throw new Error("Current password is incorrect");
  return{valid:true};
}

export async function changeAccountPassword(currentPassword:string,newPassword:string,signOutOtherDevices:boolean){
  await verifyCurrentPassword(currentPassword);
  await wait(650);
  if(currentPassword===newPassword)throw new Error("Your new password must be different");
  localStorage.setItem("flirtschat:password-updated-at",new Date().toISOString());
  if(signOutOtherDevices)localStorage.setItem("flirtschat:other-sessions-revoked-at",new Date().toISOString());
  return{updated:true,sessionsRevoked:signOutOtherDevices};
}
