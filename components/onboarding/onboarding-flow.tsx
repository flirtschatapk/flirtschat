"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {ArrowLeft,ArrowRight,Check,LoaderCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {useForm} from "react-hook-form";
import {Logo} from "@/components/logo";
import {onboardingDefaults,onboardingSchema,type OnboardingValues} from "@/lib/onboarding-schema";
import {getCurrentProfile} from "@/lib/profile-service";
import {AboutMeStep} from "./about-me-step";
import {InterestsStep} from "./interests-step";
import {OnboardingProgress} from "./onboarding-progress";
import {PhotoUploadStep} from "./photo-upload-step";
import {PreferencesStep} from "./preferences-step";
import {FlirtschatLoader} from "@/components/ui/flirtschat-loader";

const fields:{[key:number]:(keyof OnboardingValues)[]}={1:["photos"],2:["bio","gender","interestedIn","dateOfBirth","country","city","languages"],3:["interests","relationshipGoal"],4:["minAge","maxAge","maxDistance","showMe","acceptedTerms"]};

export function OnboardingFlow(){
  const router=useRouter(),reduce=useReducedMotion();
  const[ready,setReady]=useState(false),[loadTrouble,setLoadTrouble]=useState(false),[step,setStep]=useState(1),[direction,setDirection]=useState(1),[toast,setToast]=useState(false),[submitError,setSubmitError]=useState("");
  const submitting=useRef(false);
  const form=useForm<OnboardingValues>({resolver:zodResolver(onboardingSchema),defaultValues:onboardingDefaults,mode:"onTouched"});
  useEffect(()=>{const timeout=window.setTimeout(()=>setLoadTrouble(true),8000);void(async()=>{
    try{const p=await getCurrentProfile();if(p.onboardingCompleted){router.replace("/dashboard");return}form.reset({...onboardingDefaults,photos:p.primaryPhotoKey&&p.primaryPhotoUrl?[{id:p.primaryPhotoKey,name:"Profile photo",size:0,preview:p.primaryPhotoUrl,objectKey:p.primaryPhotoKey}]:[],displayName:p.displayName,bio:p.bio,gender:p.gender,interestedIn:p.interestedIn,dateOfBirth:p.dateOfBirth,country:p.country,city:p.city,languages:p.languages.join(", "),interests:p.interests,relationshipGoal:p.relationshipGoal,minAge:p.minAge,maxAge:p.maxAge,maxDistance:p.maxDistance,showMe:p.showMe,notifications:p.notificationsEnabled,locationPermission:p.locationPermission,profileVisible:p.profileVisible});window.clearTimeout(timeout);setReady(true)}catch{setLoadTrouble(true)}
  })();return()=>window.clearTimeout(timeout)},[form,router]);
  const next=async()=>{if(!(await form.trigger(fields[step],{shouldFocus:true})))return;const nextStep=Math.min(4,step+1);setDirection(1);setStep(nextStep);scrollTo({top:0,behavior:reduce?"auto":"smooth"})};
  const back=()=>{setDirection(-1);setStep(s=>Math.max(1,s-1))},skip=()=>{setDirection(1);setStep(s=>Math.min(4,s+1))};
  const finish=form.handleSubmit(async data=>{if(submitting.current)return;submitting.current=true;setSubmitError("");
    try{const response=await fetch("/api/profile/onboarding",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});if(!response.ok)throw new Error("save_failed");setToast(true);router.refresh();setTimeout(()=>router.replace("/dashboard"),650)}catch{setSubmitError("We couldn't save your profile. Please try again.");submitting.current=false}
  });
  if(!ready)return loadTrouble?<main className="route-loading"><span>We&apos;re having trouble loading your account.</span><button className="onboarding-next" type="button" onClick={()=>window.location.reload()}>Retry</button></main>:<FlirtschatLoader message="Getting your profile ready..." variant="page"/>;
  return <main className="onboarding-page"><div className="onboarding-hearts" aria-hidden="true"><i>♥</i><i>♥</i><i>✦</i></div><header className="onboarding-header"><Logo/><span>Make it unmistakably you.</span></header><div className="onboarding-layout"><aside><p className="kicker">Your profile, your vibe</p><h2>Great connections start with a great profile.</h2><p>Take a minute to show people what makes you, you. Everything can be edited later.</p><div className="profile-tip glass"><b>Profile tip</b><span>Profiles with 3+ photos get more meaningful conversations.</span></div></aside><div className="onboarding-main"><OnboardingProgress step={step}/><form onSubmit={finish} noValidate><AnimatePresence mode="wait" custom={direction}><motion.div className="onboarding-card glass" key={step} custom={direction} initial={reduce?false:{opacity:0,x:direction*24}} animate={{opacity:1,x:0}} exit={reduce?{opacity:0}:{opacity:0,x:direction*-24}} transition={{duration:.22}}>{step===1&&<PhotoUploadStep form={form}/>} {step===2&&<AboutMeStep form={form}/>} {step===3&&<InterestsStep form={form}/>} {step===4&&<PreferencesStep form={form}/>}</motion.div></AnimatePresence>{submitError&&<p className="field-error" role="alert">{submitError}</p>}<div className="onboarding-actions">{step>1?<button className="onboarding-secondary" type="button" onClick={back}><ArrowLeft/> Back</button>:<span/>}{(step===2||step===3)&&<button className="onboarding-skip" type="button" onClick={skip}>Skip for now</button>}{step<4?<button className="onboarding-next" type="button" onClick={next}>Continue <ArrowRight/></button>:<button className="onboarding-next" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting?<><LoaderCircle className="spin"/> Saving…</>:<>Finish setup <Check/></>}</button>}</div></form></div></div>{toast&&<div className="success-toast" role="status"><Check/> Profile complete! Taking you to your dashboard…</div>}</main>;
}
