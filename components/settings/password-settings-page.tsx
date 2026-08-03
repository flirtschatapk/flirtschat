"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeft,Check,CheckCircle2,Eye,EyeOff,KeyRound,LoaderCircle,LockKeyhole,ShieldCheck,ShieldOff,Smartphone} from "lucide-react";
import Link from "next/link";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {changeAccountPassword} from "@/lib/password-settings-service";
import {passwordSettingsSchema,type PasswordSettingsValues} from "@/lib/password-settings-schema";

export function PasswordSettingsPage(){
  const [showCurrent,setShowCurrent]=useState(false),[showNew,setShowNew]=useState(false),[showConfirm,setShowConfirm]=useState(false),[notice,setNotice]=useState(""),[failure,setFailure]=useState("");
  const {register,handleSubmit,watch,reset,formState:{errors,isSubmitting}}=useForm<PasswordSettingsValues>({resolver:zodResolver(passwordSettingsSchema),mode:"onChange",defaultValues:{currentPassword:"",newPassword:"",confirmPassword:"",signOutOtherDevices:true}});
  const password=watch("newPassword")??"",confirm=watch("confirmPassword")??"";
  const rules=[{label:"8+ characters",valid:password.length>=8},{label:"Uppercase",valid:/[A-Z]/.test(password)},{label:"Lowercase",valid:/[a-z]/.test(password)},{label:"Number",valid:/[0-9]/.test(password)},{label:"Symbol",valid:/[^A-Za-z0-9]/.test(password)}];
  const score=rules.filter(rule=>rule.valid).length;
  const submit=handleSubmit(async values=>{setFailure("");setNotice("");try{const result=await changeAccountPassword(values.currentPassword,values.newPassword,values.signOutOtherDevices);reset({currentPassword:"",newPassword:"",confirmPassword:"",signOutOtherDevices:values.signOutOtherDevices});setNotice(result.sessionsRevoked?"Password changed. Other devices were signed out.":"Password changed successfully.");setTimeout(()=>setNotice(""),4000)}catch(reason){setFailure(reason instanceof Error?reason.message:"Could not change password")}});

  return <main className="password-settings-page">
    <header className="password-settings-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Password</h1><p>Protect your Flirtschat account</p></div><span><ShieldCheck/></span></header>
    <form className="password-settings-shell" onSubmit={submit} noValidate>
      <section className="password-security-banner"><i><LockKeyhole/></i><div><strong>Choose a strong, unique password</strong><small>Never reuse a password from another website or share it with anyone.</small></div></section>
      <section className="password-settings-card"><header><i className="password-metal red"><KeyRound/></i><div><h2>Change password</h2><p>Verify your current password first</p></div></header>
        <PasswordInput label="Current password" autoComplete="current-password" visible={showCurrent} toggle={()=>setShowCurrent(value=>!value)} error={errors.currentPassword?.message} registration={register("currentPassword")}/>
        <PasswordInput label="New password" autoComplete="new-password" visible={showNew} toggle={()=>setShowNew(value=>!value)} error={errors.newPassword?.message} registration={register("newPassword")}/>
        <div className="password-strength"><div><span style={{width:`${score*20}%`}} data-score={score}/></div><small>{score===0?"Start typing":score<=2?"Weak":score<=4?"Good":"Strong"}</small></div>
        <div className="password-rules">{rules.map(rule=><span className={rule.valid?"valid":""} key={rule.label}><CheckCircle2/>{rule.label}</span>)}</div>
        <PasswordInput label="Confirm new password" autoComplete="new-password" visible={showConfirm} toggle={()=>setShowConfirm(value=>!value)} error={errors.confirmPassword?.message||(confirm&&confirm===password?undefined:confirm?"Passwords do not match":undefined)} registration={register("confirmPassword")}/>
      </section>
      <section className="password-session-card"><i className="password-metal violet"><Smartphone/></i><span><strong>Sign out other devices</strong><small>End every other active Flirtschat session after changing your password.</small></span><label><input type="checkbox" {...register("signOutOtherDevices")}/><b/></label></section>
      <section className="password-tips"><h2><ShieldOff/>Security tips</h2><ul><li>Use a password you have not used before.</li><li>Never send your password in a chat or email.</li><li>Enable device security and keep your recovery details verified.</li></ul></section>
      <div className="password-actions"><Link href="/settings">Cancel</Link><button type="submit" disabled={isSubmitting||score<5||!confirm}>{isSubmitting?<><LoaderCircle className="spin"/>Updating…</>:<><Check/>Change Password</>}</button></div>
    </form>
    {failure&&<div className="password-toast error" role="alert">{failure}<button onClick={()=>setFailure("")}>×</button></div>}{notice&&<div className="password-toast" role="status"><Check/>{notice}</div>}
    <AppBottomNav active="settings"/>
  </main>
}

function PasswordInput({label,visible,toggle,error,registration,autoComplete}:{label:string;visible:boolean;toggle:()=>void;error?:string;registration:ReturnType<ReturnType<typeof useForm<PasswordSettingsValues>>["register"]>;autoComplete:string}){return <label className={`password-setting-field ${error?"error":""}`}><span>{label}</span><div><LockKeyhole/><input type={visible?"text":"password"} autoComplete={autoComplete} {...registration}/><button type="button" onClick={toggle} aria-label={`${visible?"Hide":"Show"} ${label}`}>{visible?<EyeOff/>:<Eye/>}</button></div>{error&&<small>{error}</small>}</label>}
