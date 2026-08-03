import { z } from "zod";

export const interests = ["Music","Travel","Movies","Fitness","Gaming","Food","Photography","Fashion","Pets","Technology"] as const;
export const relationshipGoals = ["Serious Relationship","Fun & Casual","Make Friends","Still Exploring"] as const;

export const onboardingSchema = z.object({
  photos: z.array(z.object({ id:z.string(), name:z.string(), size:z.number(), preview:z.string(), objectKey:z.string().optional() })).min(1,"Add at least one profile photo").max(6),
  displayName: z.string().trim().min(2,"Enter at least 2 characters").max(40),
  bio: z.string().trim().min(10,"Tell people a little more about you").max(300),
  gender: z.string().refine((value:string):boolean=>value==="Male"||value==="Female","Choose Male or Female"), interestedIn:z.string().min(1,"Choose who you are interested in"),
  dateOfBirth:z.string().refine(v=>v && new Date(v)<=new Date(new Date().setFullYear(new Date().getFullYear()-18)),"You must be at least 18"),
  country:z.string().min(1,"Choose a country"), city:z.string().trim().min(2,"Enter your city"), languages:z.string().trim().min(2,"Add at least one language"),
  interests:z.array(z.string()).min(3,"Select at least 3 interests"), relationshipGoal:z.string().min(1,"Choose a dating goal"),
  minAge:z.number().min(18).max(80), maxAge:z.number().min(18).max(80), maxDistance:z.number().min(1).max(200),
  showMe:z.enum(["Women","Men","Everyone"]), notifications:z.boolean(), locationPermission:z.boolean(), profileVisible:z.boolean(),
  acceptedTerms:z.boolean().refine(Boolean,"You must accept the terms to continue"),
}).refine(v=>v.minAge<=v.maxAge,{path:["maxAge"],message:"Maximum age must be above minimum age"});

export type OnboardingValues=z.infer<typeof onboardingSchema>;
export const onboardingDefaults:OnboardingValues={photos:[],displayName:"",bio:"",gender:"",interestedIn:"",dateOfBirth:"",country:"",city:"",languages:"",interests:[],relationshipGoal:"",minAge:22,maxAge:35,maxDistance:50,showMe:"Everyone",notifications:true,locationPermission:false,profileVisible:true,acceptedTerms:false};
