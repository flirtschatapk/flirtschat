"use client";

import {UserRound} from "lucide-react";
import type {UseFormReturn} from "react-hook-form";
import {globalCountries} from "@/lib/global-countries";
import type {OnboardingValues} from "@/lib/onboarding-schema";
import {StepTitle} from "./photo-upload-step";

export function AboutMeStep({form}:{form:UseFormReturn<OnboardingValues>}) {
  const {register, formState:{errors}, watch} = form;
  const displayName = watch("displayName");
  return <section>
    <StepTitle n="02" title="A little about you" text="Help the right people recognize your energy."/>
    <div className="signup-name-carried"><UserRound/><span><small>From your signup</small><strong>{displayName}</strong></span></div>
    <div className="onboarding-fields">
      <Field label={`Short bio · ${watch("bio").length}/300`} error={errors.bio?.message} wide><textarea rows={4} maxLength={300} placeholder="A perfect Sunday looks like..." {...register("bio")}/></Field>
      <Field label="Gender" error={errors.gender?.message}><select {...register("gender")}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
      <Field label="Interested in" error={errors.interestedIn?.message}><select {...register("interestedIn")}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></Field>
      <Field label="Date of birth" error={errors.dateOfBirth?.message}><input type="date" {...register("dateOfBirth")}/></Field>
      <Field label="Country" error={errors.country?.message}><select {...register("country")}><option value="">Choose your country</option>{globalCountries.map(country => <option value={country} key={country}>{country}</option>)}</select></Field>
      <Field label="City" error={errors.city?.message}><input autoComplete="address-level2" {...register("city")}/></Field>
      <Field label="Languages" error={errors.languages?.message}><input placeholder="English, Spanish" {...register("languages")}/></Field>
    </div>
  </section>;
}

function Field({label,error,children,wide=false}:{label:string;error?:string;children:React.ReactNode;wide?:boolean}) {
  return <label className={`onboarding-field ${wide?"wide":""}`}><span>{label}</span>{children}{error&&<small role="alert">{error}</small>}</label>;
}
