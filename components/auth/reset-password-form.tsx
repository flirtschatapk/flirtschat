"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowRight,KeyRound,LoaderCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {resetPasswordSchema,type ResetPasswordValues} from "@/lib/auth-schema";
import {updatePassword} from "@/lib/auth-service";
import {PasswordField} from "./password-field";
import {PasswordStrength} from "./password-strength";
export function ResetPasswordForm(){const router=useRouter();const[notice,setNotice]=useState<{type:"success"|"error",text:string}|null>(null);const{register,handleSubmit,watch,formState:{errors,isSubmitting}}=useForm<ResetPasswordValues>({resolver:zodResolver(resetPasswordSchema),defaultValues:{password:"",confirmPassword:""}});const submit=async({password}:ResetPasswordValues)=>{setNotice(null);try{await updatePassword(password);setNotice({type:"success",text:"Password updated. Redirecting you to login…"});setTimeout(()=>router.push("/login"),1400)}catch(error){setNotice({type:"error",text:error instanceof Error?error.message:"We couldn’t update your password."})}};return <div className="auth-card glass auth-simple-card"><div className="auth-illustration"><KeyRound/></div><div className="auth-card-heading"><span className="kicker">Choose something secure</span><h2>Create a new password</h2><p>Use a unique password you haven&apos;t used before.</p></div>{notice&&<div className={`auth-toast ${notice.type}`} role="status">{notice.text}</div>}<form onSubmit={handleSubmit(submit)} noValidate><PasswordField registration={register("password")} error={errors.password?.message} label="New password" placeholder="New password" autoComplete="new-password"/><PasswordStrength password={watch("password")}/><PasswordField registration={register("confirmPassword")} error={errors.confirmPassword?.message} label="Confirm password" placeholder="Repeat password" autoComplete="new-password"/><button type="submit" className="auth-submit btn-gradient" disabled={isSubmitting}>{isSubmitting?<><LoaderCircle className="spin"/> Updating…</>:<>Reset password <ArrowRight/></>}</button></form></div>}
