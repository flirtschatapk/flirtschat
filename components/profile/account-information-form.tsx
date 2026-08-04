"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeft,AtSign,BadgeCheck,BookOpen,Briefcase,CalendarDays,Check,Globe2,Languages,LoaderCircle,Mail,MapPin,Phone,Save,ShieldCheck,UserRound} from "lucide-react";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useForm} from "react-hook-form";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {ProfileImage} from "@/components/profile-image";
import {accountProfileDefaults,accountProfileSchema,type AccountProfileValues} from "@/lib/account-profile-schema";
import {globalCountries} from "@/lib/global-countries";
import {getCurrentProfile,updateCurrentProfile} from "@/lib/profile-service";
import type {CurrentProfile} from "@/lib/profile-types";
import {checkUsernameAvailability} from "@/lib/signup-validation-service";

type UsernameState="idle"|"checking"|"available"|"taken"|"current";

export function AccountInformationForm(){
  const [ready,setReady]=useState(false),[saved,setSaved]=useState(false),[usernameState,setUsernameState]=useState<UsernameState>("current");
  const [profile,setProfile]=useState<CurrentProfile|null>(null),[loadError,setLoadError]=useState("");
  const originalUsername=useRef(accountProfileDefaults.username);
  const {register,handleSubmit,watch,reset,formState:{errors,isSubmitting,isDirty}}=useForm<AccountProfileValues>({resolver:zodResolver(accountProfileSchema),mode:"onChange",defaultValues:accountProfileDefaults});
  const username=watch("username")??"",bio=watch("bio")??"";

  useEffect(()=>{
    getCurrentProfile().then(value=>{setProfile(value);const merged={...accountProfileDefaults,fullName:value.displayName,username:value.username,bio:value.bio,gender:value.gender as AccountProfileValues["gender"],dateOfBirth:value.dateOfBirth,country:value.country,city:value.city,languages:value.languages.join(", "),occupation:value.occupation,education:value.education};originalUsername.current=value.username;reset(merged);setReady(true)}).catch(()=>{setLoadError("We're having trouble loading your account.");setReady(true)});
  },[reset]);

  useEffect(()=>{
    if(!ready)return;
    const clean=username.trim();
    if(clean===originalUsername.current){setUsernameState("current");return}
    if(clean.length<3||!/^[a-zA-Z0-9_]+$/.test(clean)){setUsernameState("idle");return}
    let active=true;setUsernameState("checking");
    const timer=setTimeout(()=>void checkUsernameAvailability(clean,profile?.id).then(result=>{if(active)setUsernameState(result.available?"available":"taken")}),500);
    return()=>{active=false;clearTimeout(timer)};
  },[profile?.id,ready,username]);

  const submit=handleSubmit(async values=>{
    if(usernameState==="taken"||usernameState==="checking")return;
    try{const updated=await updateCurrentProfile({displayName:values.fullName,username:values.username,bio:values.bio,gender:values.gender,dateOfBirth:values.dateOfBirth,country:values.country,city:values.city,languages:values.languages.split(",").map(x=>x.trim()).filter(Boolean),occupation:values.occupation,education:values.education});setProfile(updated);originalUsername.current=updated.username;setUsernameState("current");reset(values);setSaved(true);setTimeout(()=>setSaved(false),3000)}catch{setLoadError("We couldn't save your profile. Please try again.")}
  });

  if(!ready)return <main className="account-info-loading"><LoaderCircle className="spin"/><span>Loading account information…</span></main>;

  return <main className="account-info-page">
    <header className="account-info-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Account Information</h1><p>Keep your identity and profile details up to date.</p></div><span className="account-security"><ShieldCheck/></span></header>
    <form className="account-info-shell" onSubmit={submit} noValidate>
      {loadError&&<p className="field-error" role="alert">{loadError}</p>}<section className="account-photo-card"><span><ProfileImage src={profile?.primaryPhotoUrl||null} alt={profile?.displayName||"Your profile"}/><i/></span><div><strong>Profile photo</strong><small>Your current Flirtschat profile image</small></div><Link href="/onboarding">Manage photos</Link></section>
      <section className="account-form-card"><header><UserRound/><div><h2>Basic information</h2><p>Details created during signup</p></div></header><div className="account-fields">
        <Field label="Full name" icon={<UserRound/>} error={errors.fullName?.message}><input autoComplete="name" {...register("fullName")}/></Field>
        <Field label="Username" icon={<AtSign/>} error={errors.username?.message||(usernameState==="taken"?"This username is already taken":undefined)} status={usernameState==="checking"?"Checking…":usernameState==="available"?"Username is available":usernameState==="current"?"Current username":undefined}><input autoComplete="username" {...register("username")}/></Field>
        <Field label="Email address" icon={<Mail/>} error={errors.email?.message}><input type="email" autoComplete="email" disabled placeholder="Managed through Email & Phone" {...register("email")}/></Field>
        <Field label="Phone number" icon={<Phone/>} error={errors.phone?.message}><input type="tel" autoComplete="tel" placeholder="+1 555 000 0000" {...register("phone")}/></Field>
      </div></section>
      <section className="account-form-card"><header><BadgeCheck/><div><h2>Profile details</h2><p>Help people get to know you</p></div></header><div className="account-fields">
        <Field label={`Bio · ${bio.length}/300`} icon={<BookOpen/>} error={errors.bio?.message} wide><textarea rows={4} maxLength={300} placeholder="Tell people a little about you…" {...register("bio")}/></Field>
        <Field label="Gender" icon={<UserRound/>} error={errors.gender?.message}><select {...register("gender")}><option value="Female">Female</option><option value="Male">Male</option></select></Field>
        <Field label="Date of birth" icon={<CalendarDays/>} error={errors.dateOfBirth?.message}><input type="date" {...register("dateOfBirth")}/></Field>
        <Field label="Country" icon={<Globe2/>} error={errors.country?.message}><select {...register("country")}><option value="">Choose country</option>{globalCountries.map(country=><option key={country}>{country}</option>)}</select></Field>
        <Field label="City" icon={<MapPin/>} error={errors.city?.message}><input autoComplete="address-level2" {...register("city")}/></Field>
        <Field label="Languages" icon={<Languages/>} error={errors.languages?.message}><input placeholder="English, Spanish" {...register("languages")}/></Field>
        <Field label="Occupation" icon={<Briefcase/>} error={errors.occupation?.message}><input placeholder="Product designer" {...register("occupation")}/></Field>
        <Field label="Education" icon={<BookOpen/>} error={errors.education?.message}><input placeholder="University or qualification" {...register("education")}/></Field>
      </div></section>
      <div className="account-form-actions"><Link href="/settings">Cancel</Link><button type="submit" disabled={isSubmitting||usernameState==="checking"||usernameState==="taken"||!isDirty}>{isSubmitting?<><LoaderCircle className="spin"/>Saving…</>:<><Save/>Save Changes</>}</button></div>
    </form>
    {saved&&<div className="account-save-toast" role="status"><Check/>Account information updated</div>}
    <AppBottomNav active="settings"/>
  </main>
}

function Field({label,icon,error,status,wide,children}:{label:string;icon:React.ReactNode;error?:string;status?:string;wide?:boolean;children:React.ReactNode}){return <label className={`account-field ${wide?"wide":""} ${error?"error":""}`}><span>{icon}{label}</span><div>{children}</div>{error?<small>{error}</small>:status?<small className="status">{status}</small>:null}</label>}
