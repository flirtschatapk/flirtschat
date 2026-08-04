import {z} from "zod";

export const accountProfileSchema=z.object({
  fullName:z.string().trim().min(2,"Enter your full name").max(60,"Keep your name under 60 characters"),
  username:z.string().trim().min(3,"Use at least 3 characters").max(30,"Use no more than 30 characters").regex(/^[a-zA-Z0-9_]+$/,"Use letters, numbers and _ only"),
  email:z.union([z.literal(""),z.string().trim().email("Enter a valid email address")]),
  phone:z.string().trim().refine(value=>!value||/^\+?[0-9 ()-]{7,20}$/.test(value),"Enter a valid phone number"),
  bio:z.string().trim().max(300,"Bio must be 300 characters or less"),
  gender:z.union([z.literal(""),z.enum(["Male","Female"])]),
  dateOfBirth:z.string().refine(value=>!value||new Date(value)<=new Date(new Date().setFullYear(new Date().getFullYear()-18)),"You must be at least 18"),
  country:z.string(),
  city:z.string().trim().max(60),
  languages:z.string().trim().max(100),
  occupation:z.string().trim().max(80),
  education:z.string().trim().max(100),
});

export type AccountProfileValues=z.infer<typeof accountProfileSchema>;
export const accountProfileDefaults:AccountProfileValues={fullName:"",username:"",email:"",phone:"",bio:"",gender:"",dateOfBirth:"",country:"",city:"",languages:"",occupation:"",education:""};
