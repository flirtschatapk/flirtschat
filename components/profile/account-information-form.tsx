"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeft,AtSign,BadgeCheck,Baby,BookOpen,CalendarDays,Check,Cigarette,Dumbbell,Globe2,Languages,LoaderCircle,Mail,MapPin,Moon,Phone,Ruler,Save,ShieldCheck,Sparkles,UserRound,Wine,X} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {useForm} from "react-hook-form";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {ProfilePhotoManager} from "@/components/profile/profile-photo-manager";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {accountProfileDefaults,accountProfileSchema,type AccountProfileValues} from "@/lib/account-profile-schema";
import {globalCountries} from "@/lib/global-countries";
import {updateCurrentProfile} from "@/lib/profile-service";
import type {CurrentProfile,CurrentProfileUpdate} from "@/lib/profile-types";
import {checkUsernameAvailability} from "@/lib/signup-validation-service";

type UsernameState="idle"|"checking"|"available"|"taken"|"current";
const zodiacSigns=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

export function AccountInformationForm(){
  const router=useRouter();
  const shared=useCurrentProfile();
  const [ready,setReady]=useState(false),[saved,setSaved]=useState(false),[usernameState,setUsernameState]=useState<UsernameState>("current");
  const [profile,setProfile]=useState<CurrentProfile|null>(null),[loadError,setLoadError]=useState("");
  const originalUsername=useRef(accountProfileDefaults.username);
  const originalValues=useRef<AccountProfileValues>(accountProfileDefaults);
  const successTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const {register,handleSubmit,watch,reset,formState:{errors,isSubmitting,isDirty,dirtyFields}}=useForm<AccountProfileValues>({resolver:zodResolver(accountProfileSchema),mode:"onChange",defaultValues:accountProfileDefaults});
  const username=watch("username")??"",bio=watch("bio")??"";

  useEffect(()=>{
    if(shared.loading)return;
    const value=shared.profile;
    if(!value){setLoadError("We're having trouble loading your account.");setReady(true);return}
    setProfile(value);const merged={...accountProfileDefaults,fullName:value.displayName,username:value.username,bio:value.bio,gender:value.gender as AccountProfileValues["gender"],dateOfBirth:value.dateOfBirth,country:value.country,city:value.city,languages:value.languages.join(", "),occupation:value.occupation,education:value.education,relationshipGoal:value.relationshipGoal,heightCm:value.heightCm?String(value.heightCm):"",zodiac:value.zodiac,exercise:value.exercise,drinking:value.drinking,smoking:value.smoking,pronouns:value.pronouns,children:value.children,beliefs:value.beliefs};originalUsername.current=value.username;originalValues.current=merged;reset(merged);setReady(true);
  },[reset,shared.loading,shared.profile]);

  useEffect(()=>()=>{if(successTimer.current)clearTimeout(successTimer.current)},[]);

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
    setLoadError("");setSaved(false);
    try{const changes:CurrentProfileUpdate={};if(dirtyFields.fullName)changes.displayName=values.fullName;if(dirtyFields.username)changes.username=values.username;if(dirtyFields.bio)changes.bio=values.bio;if(dirtyFields.gender)changes.gender=values.gender;if(dirtyFields.dateOfBirth)changes.dateOfBirth=values.dateOfBirth;if(dirtyFields.country)changes.country=values.country;if(dirtyFields.city)changes.city=values.city;if(dirtyFields.languages)changes.languages=values.languages.split(",").map(x=>x.trim()).filter(Boolean);if(dirtyFields.occupation)changes.occupation=values.occupation;if(dirtyFields.education)changes.education=values.education;if(dirtyFields.relationshipGoal)changes.relationshipGoal=values.relationshipGoal;if(dirtyFields.heightCm)changes.heightCm=values.heightCm?Number(values.heightCm):null;if(dirtyFields.zodiac)changes.zodiac=values.zodiac;if(dirtyFields.exercise)changes.exercise=values.exercise;if(dirtyFields.drinking)changes.drinking=values.drinking;if(dirtyFields.smoking)changes.smoking=values.smoking;if(dirtyFields.pronouns)changes.pronouns=values.pronouns;if(dirtyFields.children)changes.children=values.children;if(dirtyFields.beliefs)changes.beliefs=values.beliefs;const updated=await updateCurrentProfile(changes);setProfile(updated);shared.setCurrentProfile(updated);originalUsername.current=updated.username;originalValues.current=values;setUsernameState("current");reset(values);router.refresh();setSaved(true);if(successTimer.current)clearTimeout(successTimer.current);successTimer.current=setTimeout(()=>setSaved(false),4500)}catch{setLoadError("We couldn't save your profile. Please try again.")}
  });
  const cancel=()=>{if(isDirty){reset(originalValues.current);setUsernameState("current");setLoadError("");return}router.push("/settings")};

  if(!ready)return <main className="account-info-loading"><LoaderCircle className="spin"/><span>Loading account information…</span></main>;

  return <main className="account-info-page">
    <header className="account-info-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Account Information</h1><p>Keep your identity and profile details up to date.</p></div><span className="account-security"><ShieldCheck/></span></header>
    <form className="account-info-shell" onSubmit={submit} noValidate>
      {loadError&&<p className="field-error account-dismissible-message" role="alert"><span>{loadError}</span><button type="button" onClick={()=>setLoadError("")} aria-label="Dismiss message"><X/></button></p>}<ProfilePhotoManager/>
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
        <Field label="Looking for" icon={<Sparkles/>} error={errors.relationshipGoal?.message}><select {...register("relationshipGoal")}><option value="">Not added</option>{["Serious Relationship","Fun & Casual","Make Friends","Still Exploring"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Work" icon={<UserRound/>} error={errors.occupation?.message}><input placeholder="Software Engineer" {...register("occupation")}/></Field>
        <Field label="Education" icon={<BookOpen/>} error={errors.education?.message}><input placeholder="University of Malaya" {...register("education")}/></Field>
        <Field label="Height (cm)" icon={<Ruler/>} error={errors.heightCm?.message}><input type="number" min="100" max="250" placeholder="170" {...register("heightCm")}/></Field>
        <Field label="Zodiac" icon={<Sparkles/>} error={errors.zodiac?.message}><select {...register("zodiac")}><option value="">Not added</option>{zodiacSigns.map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Exercise" icon={<Dumbbell/>} error={errors.exercise?.message}><select {...register("exercise")}><option value="">Not added</option>{["Never","Sometimes","Often","Daily"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Drinking" icon={<Wine/>} error={errors.drinking?.message}><select {...register("drinking")}><option value="">Not added</option>{["Never","Socially","Occasionally","Often"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Smoking" icon={<Cigarette/>} error={errors.smoking?.message}><select {...register("smoking")}><option value="">Not added</option>{["Never","Occasionally","Regularly","Trying to quit"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Pronouns" icon={<UserRound/>} error={errors.pronouns?.message}><select {...register("pronouns")}><option value="">Not added</option>{["He/Him","She/Her","They/Them","Other","Prefer not to say"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Children" icon={<Baby/>} error={errors.children?.message}><select {...register("children")}><option value="">Not added</option>{["Don’t have children","Have children","Want children","Don’t want children","Not sure"].map(value=><option key={value}>{value}</option>)}</select></Field>
        <Field label="Beliefs" icon={<Moon/>} error={errors.beliefs?.message}><input placeholder="Prefer not to say" {...register("beliefs")}/></Field>
      </div></section>
      <div className="account-form-actions"><button type="button" className="account-cancel" onClick={cancel}>Cancel</button><button type="submit" disabled={isSubmitting||usernameState==="checking"||usernameState==="taken"||!isDirty}>{isSubmitting?<><LoaderCircle className="spin"/>Saving…</>:<><Save/>Save Changes</>}</button></div>
    </form>
    {saved&&<div className="account-save-toast" role="status"><Check/>Account information updated<button type="button" onClick={()=>setSaved(false)} aria-label="Dismiss message"><X/></button></div>}
    <AppBottomNav active="settings"/>
  </main>
}

function Field({label,icon,error,status,wide,children}:{label:string;icon:React.ReactNode;error?:string;status?:string;wide?:boolean;children:React.ReactNode}){return <label className={`account-field ${wide?"wide":""} ${error?"error":""}`}><span>{icon}{label}</span><div>{children}</div>{error?<small>{error}</small>:status?<small className="status">{status}</small>:null}</label>}
