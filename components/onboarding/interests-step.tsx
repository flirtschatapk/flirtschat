"use client";

import {Check} from "lucide-react";
import type {UseFormReturn} from "react-hook-form";
import {interests, relationshipGoals, type OnboardingValues} from "@/lib/onboarding-schema";
import {StepTitle} from "./photo-upload-step";

const interestEmoji:Record<string,string>={Music:"🎵",Travel:"✈️",Movies:"🎬",Fitness:"🔥",Gaming:"🎮",Food:"🍜",Photography:"📸",Fashion:"✨",Pets:"🐾",Technology:"💻"};
const goalEmoji:Record<string,string>={"Serious Relationship":"💍","Fun & Casual":"🍸","Make Friends":"🤝","Still Exploring":"🧭"};

export function InterestsStep({form}:{form:UseFormReturn<OnboardingValues>}) {
  const selected=form.watch("interests"), goal=form.watch("relationshipGoal");
  const toggle=(interest:string)=>form.setValue("interests",selected.includes(interest)?selected.filter(item=>item!==interest):[...selected,interest],{shouldValidate:true});
  return <section>
    <StepTitle n="03" title="Find your people" text="Shared interests make the first message easier."/>
    <fieldset className="onboarding-fieldset">
      <legend>Choose at least 3 interests <span>{selected.length} selected</span></legend>
      <div className="interest-chips">{interests.map(interest=><button aria-pressed={selected.includes(interest)} type="button" key={interest} onClick={()=>toggle(interest)}><i className="option-emoji">{interestEmoji[interest]}</i>{selected.includes(interest)&&<Check/>}{interest}</button>)}</div>
      {form.formState.errors.interests&&<p className="field-error">{form.formState.errors.interests.message}</p>}
    </fieldset>
    <fieldset className="onboarding-fieldset">
      <legend>What are you looking for?</legend>
      <div className="relationship-grid">{relationshipGoals.map(item=><button aria-pressed={goal===item} type="button" key={item} onClick={()=>form.setValue("relationshipGoal",item,{shouldValidate:true})}><span>{goalEmoji[item]}</span>{item}</button>)}</div>
      {form.formState.errors.relationshipGoal&&<p className="field-error">{form.formState.errors.relationshipGoal.message}</p>}
    </fieldset>
  </section>;
}
