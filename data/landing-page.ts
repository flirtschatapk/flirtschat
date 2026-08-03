import { Bolt, Globe2, HeartHandshake, LockKeyhole, MapPin, MessageCircle, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, UserCheck, Zap } from "lucide-react";

export const navItems = ["Home", "Features", "Premium", "Safety", "Stories", "FAQ"];
export const stats = [["500K+","Active users"],["1M+","Matches made"],["100+","Countries"],["24/7","Safety support"]];
export const features = [
  {title:"Smart Matching",description:"Intent-aware recommendations that get better with every genuine connection.",icon:Sparkles,color:"violet"},
  {title:"Instant Chat",description:"Move from a shared vibe to a real conversation in seconds.",icon:MessageCircle,color:"pink"},
  {title:"Safe & Secure",description:"Verification and privacy controls are built into every interaction.",icon:ShieldCheck,color:"blue"},
  {title:"Gen Z Vibes",description:"Profiles with prompts, music, moments and more ways to be yourself.",icon:Bolt,color:"orange"},
  {title:"Nearby & Global",description:"Meet someone around the corner or discover a world away.",icon:MapPin,color:"rose"},
];
export const premiumFeatures = [
  ["Unlimited Likes",HeartHandshake],["See Who Likes You",Sparkles],["Boost Profile",Zap],
  ["Premium Chat",MessageCircle],["Rewind Profiles",RotateCcw],["Advanced Filters",SlidersHorizontal],
] as const;
export const safetyItems = [
  {title:"Profile verification",text:"Photo and identity checks help keep every profile real.",icon:UserCheck},
  {title:"Report & block",text:"Fast, clear controls put you in charge of every interaction.",icon:ShieldCheck},
  {title:"Private chats",text:"Your messages use secure transport and stay yours.",icon:LockKeyhole},
  {title:"Location privacy",text:"Share only the distance and detail you choose.",icon:Globe2},
];
export const steps = [
  {n:"01",title:"Create your profile",text:"Add photos, prompts and the things that make you, you."},
  {n:"02",title:"Discover your vibe",text:"Tune your preferences and explore people with shared energy."},
  {n:"03",title:"Match & start chatting",text:"Like each other? Say hello and see where it goes."},
];
export const stories = [
  {name:"Maya",age:23,country:"United States",quote:"We matched over the same tiny music venue. Three dates later, it already felt easy.",pos:"0% 0%"},
  {name:"Theo",age:25,country:"United Kingdom",quote:"The prompts actually gave us something real to talk about. No awkward opener required.",pos:"50% 0%"},
  {name:"Imani",age:22,country:"Canada",quote:"I loved having control over my location. It made meeting someone new feel comfortable.",pos:"100% 0%"},
  {name:"Luca",age:24,country:"Spain",quote:"Flirtschat feels less like swiping and more like discovering people I'd want to know.",pos:"0% 100%"},
];
export const faqs = [
  ["Is Flirtschat free to use?","Yes. Create a profile, discover people, match and chat for free. Optional plans add more discovery controls."],
  ["How does matching work?","Recommendations use your preferences, interests and in-app signals. A chat opens only after mutual interest."],
  ["Is my data safe?","We minimize the data we collect, use secure transport, and give you clear privacy and deletion controls."],
  ["Can I use Flirtschat on desktop?","Yes. The responsive web experience works across desktop, tablet and mobile browsers."],
  ["How do I report or block someone?","Open their profile or conversation menu, choose Report or Block, and follow the short guided flow."],
  ["What is Flirtschat Premium?","Premium adds unlimited likes, advanced filters, profile boosts, rewind and visibility into who likes you."],
];
