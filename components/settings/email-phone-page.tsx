"use client";

import {ArrowLeft,Check,ChevronRight,Clock3,LoaderCircle,LockKeyhole,Mail,MailCheck,Phone,ShieldCheck,Smartphone,Trash2} from "lucide-react";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {loadAccountProfile,saveAccountProfile} from "@/lib/account-profile-storage";
import {confirmEmailVerification,confirmPhoneVerification,MOCK_PHONE_CODE,sendEmailVerification,sendPhoneVerification} from "@/lib/contact-verification-service";

type Stage="idle"|"sending"|"pending"|"verifying";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern=/^\+?[0-9 ()-]{7,20}$/;

export function EmailPhonePage(){
  const [ready,setReady]=useState(false),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[emailVerified,setEmailVerified]=useState(true),[phoneVerified,setPhoneVerified]=useState(false);
  const [emailStage,setEmailStage]=useState<Stage>("idle"),[phoneStage,setPhoneStage]=useState<Stage>("idle"),[code,setCode]=useState(""),[notice,setNotice]=useState(""),[error,setError]=useState(""),[countdown,setCountdown]=useState(0);
  const originalEmail=useRef(""),originalPhone=useRef("");
  const emailValid=emailPattern.test(email),phoneValid=!phone||phonePattern.test(phone);

  useEffect(()=>{const account=loadAccountProfile();setEmail(account.email);setPhone(account.phone);originalEmail.current=account.email;originalPhone.current=account.phone;try{const status=JSON.parse(localStorage.getItem("flirtschat:contact-verification")??"{}") as {email?:string;phone?:string};setEmailVerified(status.email===account.email||!status.email);setPhoneVerified(Boolean(account.phone&&status.phone===account.phone))}catch{}setReady(true)},[]);
  useEffect(()=>{if(countdown<=0)return;const timer=setInterval(()=>setCountdown(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer)},[countdown]);
  useEffect(()=>{if(!ready)return;if(email!==originalEmail.current){setEmailVerified(false);setEmailStage("idle")}if(phone!==originalPhone.current){setPhoneVerified(false);setPhoneStage("idle");setCode("")}},[email,phone,ready]);

  const persist=(nextEmail=email,nextPhone=phone)=>{const account=loadAccountProfile();saveAccountProfile({...account,email:nextEmail,phone:nextPhone})};
  const saveStatus=(next:{email?:string;phone?:string})=>{let current:Record<string,string>={};try{current=JSON.parse(localStorage.getItem("flirtschat:contact-verification")??"{}") as Record<string,string>}catch{}localStorage.setItem("flirtschat:contact-verification",JSON.stringify({...current,...next}))};
  const showNotice=(message:string)=>{setError("");setNotice(message);setTimeout(()=>setNotice(""),3000)};

  const sendEmail=async()=>{if(!emailValid||emailStage==="sending")return;setError("");setEmailStage("sending");try{await sendEmailVerification(email);setEmailStage("pending");setCountdown(30);showNotice(`Verification email sent to ${email}`)}catch(reason){setError(reason instanceof Error?reason.message:"Could not send verification");setEmailStage("idle")}};
  const verifyEmail=async()=>{if(emailStage==="verifying")return;setEmailStage("verifying");try{await confirmEmailVerification(email);persist(email,phone);saveStatus({email});originalEmail.current=email;setEmailVerified(true);setEmailStage("idle");showNotice("Email address verified and saved") }catch{setError("Email verification failed");setEmailStage("pending")}};
  const sendPhone=async()=>{if(!phoneValid||!phone||phoneStage==="sending")return;setError("");setPhoneStage("sending");try{await sendPhoneVerification(phone);setPhoneStage("pending");setCountdown(30);showNotice("Verification code sent") }catch(reason){setError(reason instanceof Error?reason.message:"Could not send code");setPhoneStage("idle")}};
  const verifyPhone=async()=>{if(phoneStage==="verifying"||code.length!==6)return;setPhoneStage("verifying");try{await confirmPhoneVerification(phone,code);persist(email,phone);saveStatus({phone});originalPhone.current=phone;setPhoneVerified(true);setPhoneStage("idle");showNotice("Phone number verified and saved") }catch(reason){setError(reason instanceof Error?reason.message:"Verification failed");setPhoneStage("pending")}};
  const removePhone=()=>{setPhone("");setCode("");setPhoneVerified(false);setPhoneStage("idle");originalPhone.current="";persist(email,"");saveStatus({phone:""});showNotice("Phone number removed")};
  const maskedPhone=useMemo(()=>phone?`${phone.slice(0,Math.max(0,phone.length-4)).replace(/\d/g,"•")}${phone.slice(-4)}`:"No phone added",[phone]);

  if(!ready)return <main className="contact-loading"><LoaderCircle className="spin"/>Loading contact settings…</main>;
  return <main className="contact-page">
    <header className="contact-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Email & Phone</h1><p>Manage verification and account recovery</p></div><span><ShieldCheck/></span></header>
    <div className="contact-shell">
      <section className="contact-summary"><i><LockKeyhole/></i><div><strong>Your contact details stay private</strong><small>They are used for login, security alerts and account recovery.</small></div></section>

      <section className="contact-card"><header><i className="contact-metal pink"><Mail/></i><div><h2>Email address</h2><p>Primary login and recovery email</p></div>{emailVerified&&<em><MailCheck/>Verified</em>}</header><label><span>Email address</span><div className={email&&!emailValid?"invalid":""}><Mail/><input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" aria-label="Email address"/></div>{email&&!emailValid&&<small>Enter a valid email address</small>}</label><div className="contact-actions">{emailStage==="pending"||emailStage==="verifying"?<button onClick={()=>void verifyEmail()} disabled={emailStage==="verifying"}>{emailStage==="verifying"?<LoaderCircle className="spin"/>:<Check/>}I&apos;ve verified</button>:<button onClick={()=>void sendEmail()} disabled={!emailValid||emailVerified||emailStage==="sending"}>{emailStage==="sending"?<LoaderCircle className="spin"/>:<MailCheck/>}{emailVerified?"Email verified":"Send verification"}</button>}{emailStage==="pending"&&<button className="secondary" onClick={()=>void sendEmail()} disabled={countdown>0}>{countdown>0?<><Clock3/>{countdown}s</>:"Resend"}</button>}</div></section>

      <section className="contact-card"><header><i className="contact-metal violet"><Smartphone/></i><div><h2>Phone number</h2><p>Secure recovery and login alerts</p></div>{phoneVerified&&<em><Check/>Verified</em>}</header><label><span>Mobile number</span><div className={phone&&!phoneValid?"invalid":""}><Phone/><input type="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="+1 555 000 0000" autoComplete="tel" aria-label="Phone number"/></div>{phone&&!phoneValid&&<small>Enter a valid phone number</small>}</label>{phoneStage==="pending"||phoneStage==="verifying"?<div className="contact-code"><label><span>6-digit verification code</span><input inputMode="numeric" maxLength={6} value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,"").slice(0,6))} aria-label="Verification code"/></label><small>Demo code: <b>{MOCK_PHONE_CODE}</b></small></div>:null}<div className="contact-actions"><button onClick={()=>void(phoneStage==="pending"||phoneStage==="verifying"?verifyPhone():sendPhone())} disabled={!phone||!phoneValid||phoneVerified||phoneStage==="sending"||phoneStage==="verifying"||(phoneStage==="pending"&&code.length!==6)}>{phoneStage==="sending"||phoneStage==="verifying"?<LoaderCircle className="spin"/>:phoneStage==="pending"?<Check/>:<Phone/>}{phoneVerified?"Phone verified":phoneStage==="pending"?"Verify code":"Send code"}</button>{phone&&<button className="danger" onClick={removePhone}><Trash2/>Remove</button>}</div>{phoneVerified&&<p className="contact-current"><Check/>{maskedPhone} is verified</p>}</section>

      <Link className="contact-security-link" href="/forgot-password"><i className="contact-metal blue"><LockKeyhole/></i><span><strong>Password & account recovery</strong><small>Change your password or recover account access</small></span><ChevronRight/></Link>
    </div>
    {error&&<div className="contact-toast error" role="alert">{error}<button onClick={()=>setError("")}>×</button></div>}{notice&&<div className="contact-toast" role="status"><Check/>{notice}</div>}
    <AppBottomNav active="settings"/>
  </main>
}
