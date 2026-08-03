export const MOCK_PHONE_CODE="246810";

const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

export async function sendEmailVerification(email:string){
  await wait(650);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Enter a valid email address");
  return{sent:true,sentAt:Date.now()};
}

export async function confirmEmailVerification(email:string){
  await wait(500);
  return{verified:true,email,verifiedAt:new Date().toISOString()};
}

export async function sendPhoneVerification(phone:string){
  await wait(650);
  if(!/^\+?[0-9 ()-]{7,20}$/.test(phone))throw new Error("Enter a valid phone number");
  return{sent:true,sentAt:Date.now()};
}

export async function confirmPhoneVerification(phone:string,code:string){
  await wait(500);
  if(code!==MOCK_PHONE_CODE)throw new Error("The verification code is incorrect");
  return{verified:true,phone,verifiedAt:new Date().toISOString()};
}
