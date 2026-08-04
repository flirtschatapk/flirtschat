"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {ArrowLeft,ArrowRight,Check,LoaderCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {useForm} from "react-hook-form";
import {Logo} from "@/components/logo";
import {onboardingDefaults,onboardingSchema,type OnboardingValues} from "@/lib/onboarding-schema";
import {createClient} from "@/lib/supabase/client";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {AboutMeStep} from "./about-me-step";
import {InterestsStep} from "./interests-step";
import {OnboardingProgress} from "./onboarding-progress";
import {PhotoUploadStep} from "./photo-upload-step";
import {PreferencesStep} from "./preferences-step";

const fields:{[key:number]:(keyof OnboardingValues)[]}={1:["photos"],2:["bio","gender","interestedIn","dateOfBirth","country","city","languages"],3:["interests","relationshipGoal"],4:["minAge","maxAge","maxDistance","showMe","acceptedTerms"]};

export function OnboardingFlow(){
  const router=useRouter(),reduce=useReducedMotion();
  const[ready,setReady]=useState(false),[step,setStep]=useState(1),[direction,setDirection]=useState(1),[toast,setToast]=useState(false),[submitError,setSubmitError]=useState("");
  const submitting=useRef(false);
  const form=useForm<OnboardingValues>({resolver:zodResolver(onboardingSchema),defaultValues:onboardingDefaults,mode:"onTouched"});
  useEffect(()=>{void(async()=>{
    if(isSupabaseConfigured()){
      const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();
      if(!user){router.replace("/login");return}
      const{data:p,error}=await supabase.from("fc_profiles").select("display_name,bio,gender,interested_in,date_of_birth,country,city,languages,interests,relationship_goal,min_age,max_age,max_distance,show_me,notifications_enabled,location_permission,profile_visible,onboarding_completed").eq("id",user.id).maybeSingle();
      if(error||!p){router.replace("/login?error=profile_load_failed");return}
      if(p.onboarding_completed){router.replace("/dashboard");return}
      form.reset({...onboardingDefaults,displayName:p.display_name||"",bio:p.bio||"",gender:p.gender||"",interestedIn:p.interested_in||"",dateOfBirth:p.date_of_birth||"",country:p.country||"",city:p.city||"",languages:(p.languages||[]).join(", "),interests:p.interests||[],relationshipGoal:p.relationship_goal||"",minAge:p.min_age,maxAge:p.max_age,maxDistance:p.max_distance,showMe:p.show_me,notifications:p.notifications_enabled,locationPermission:p.location_permission,profileVisible:p.profile_visible});
      setReady(true);return;
    }
    router.replace("/login?error=auth_unavailable");
  })()},[form,router]);
  const next=async()=>{if(!(await form.trigger(fields[step],{shouldFocus:true})))return;const nextStep=Math.min(4,step+1);setDirection(1);setStep(nextStep);scrollTo({top:0,behavior:reduce?"auto":"smooth"})};
  const back=()=>{setDirection(-1);setStep(s=>Math.max(1,s-1))},skip=()=>{setDirection(1);setStep(s=>Math.min(4,s+1))};
  const finish=form.handleSubmit(async data=>{if(submitting.current)return;submitting.current=true;setSubmitError("");
    if(isSupabaseConfigured()){
      const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/login");return}
      const{error}=await supabase.from("fc_profiles").update({display_name:data.displayName,bio:data.bio,gender:data.gender,interested_in:data.interestedIn,date_of_birth:data.dateOfBirth,country:data.country,city:data.city,languages:data.languages.split(",").map(x=>x.trim()).filter(Boolean),interests:data.interests,relationship_goal:data.relationshipGoal,min_age:data.minAge,max_age:data.maxAge,max_distance:data.maxDistance,show_me:data.showMe,notifications_enabled:data.notifications,location_permission:data.locationPermission,profile_visible:data.profileVisible,onboarding_completed:true}).eq("id",user.id);
      if(error){console.error("Onboarding profile update failed",{code:error.code});setSubmitError("We couldn't save your profile. Please try again.");submitting.current=false;return}
    }else{setSubmitError("We couldn't save your profile. Please try again.");submitting.current=false;return}
    setToast(true);setTimeout(()=>router.replace("/dashboard"),650);
  });
  if(!ready)return <main className="route-loading"><LoaderCircle className="spin"/><span>Loading your profile…</span></main>;
  return <main className="onboarding-page"><div className="onboarding-hearts" aria-hidden="true"><i>♥</i><i>♥</i><i>✦</i></div><header className="onboarding-header"><Logo/><span>Make it unmistakably you.</span></header><div className="onboarding-layout"><aside><p className="kicker">Your profile, your vibe</p><h2>Great connections start with a great profile.</h2><p>Take a minute to show people what makes you, you. Everything can be edited later.</p><div className="profile-tip glass"><b>Profile tip</b><span>Profiles with 3+ photos get more meaningful conversations.</span></div></aside><div className="onboarding-main"><OnboardingProgress step={step}/><form onSubmit={finish} noValidate><AnimatePresence mode="wait" custom={direction}><motion.div className="onboarding-card glass" key={step} custom={direction} initial={reduce?false:{opacity:0,x:direction*24}} animate={{opacity:1,x:0}} exit={reduce?{opacity:0}:{opacity:0,x:direction*-24}} transition={{duration:.22}}>{step===1&&<PhotoUploadStep form={form}/>} {step===2&&<AboutMeStep form={form}/>} {step===3&&<InterestsStep form={form}/>} {step===4&&<PreferencesStep form={form}/>}</motion.div></AnimatePresence>{submitError&&<p className="field-error" role="alert">{submitError}</p>}<div className="onboarding-actions">{step>1?<button className="onboarding-secondary" type="button" onClick={back}><ArrowLeft/> Back</button>:<span/>}{(step===2||step===3)&&<button className="onboarding-skip" type="button" onClick={skip}>Skip for now</button>}{step<4?<button className="onboarding-next" type="button" onClick={next}>Continue <ArrowRight/></button>:<button className="onboarding-next" disabled={form.formState.isSubmitting} type="submit">{form.formState.isSubmitting?<><LoaderCircle className="spin"/> Saving…</>:<>Finish setup <Check/></>}</button>}</div></form></div></div>{toast&&<div className="success-toast" role="status"><Check/> Profile complete! Taking you to your dashboard…</div>}</main>;
}
