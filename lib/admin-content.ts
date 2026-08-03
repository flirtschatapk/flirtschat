export type ContentKind="Announcement"|"Push"|"Article"|"Safety"|"FAQ"|"Email";
export type ContentItem={id:string;kind:ContentKind;title:string;body:string;status:"Draft"|"Published"|"Scheduled"|"Archived";updated:string;author:string;audience?:string;category?:string;sendAt?:string;subject?:string};
const KEY="flirtschat:admin-content-v1";
export const initialContent:ContentItem[]=[
 {id:"ANN-104",kind:"Announcement",title:"Meet safely this summer",body:"Explore our refreshed Safety Center before meeting someone new.",status:"Published",updated:"Aug 2, 2026 · 8:30 AM",author:"Maya Chen",audience:"All members"},
 {id:"ANN-103",kind:"Announcement",title:"Scheduled maintenance",body:"Chat may be briefly unavailable while we improve message delivery.",status:"Scheduled",updated:"Aug 1, 2026",author:"Avery Morgan",audience:"All members",sendAt:"Aug 5, 2026 · 2:00 AM"},
 {id:"PSH-441",kind:"Push",title:"Your weekend matches are waiting",body:"Come back and meet someone who matches your energy ✨",status:"Scheduled",updated:"18 min ago",author:"Growth Team",audience:"Inactive 7+ days",sendAt:"Aug 2, 2026 · 6:00 PM"},
 {id:"PSH-438",kind:"Push",title:"New match alert",body:"You have a new match. Say hello while the spark is fresh.",status:"Published",updated:"Jul 31, 2026",author:"Growth Team",audience:"Matched members"},
 {id:"BLG-209",kind:"Article",title:"How to build a profile that feels like you",body:"Authentic photos and a specific bio make it easier to start meaningful conversations.",status:"Published",updated:"Aug 1, 2026",author:"Lena Ortiz",category:"Dating advice"},
 {id:"BLG-207",kind:"Article",title:"The new language of modern dating",body:"A guide to communicating intentions clearly and kindly.",status:"Draft",updated:"Jul 30, 2026",author:"Editorial Team",category:"Culture"},
 {id:"SAF-82",kind:"Safety",title:"Meet in a public place",body:"Choose a busy, well-lit location and tell a trusted person where you are going.",status:"Published",updated:"Jul 29, 2026",author:"Trust & Safety",category:"Meeting safely"},
 {id:"SAF-79",kind:"Safety",title:"Never send money",body:"Do not send funds or financial details to someone you met through the app.",status:"Published",updated:"Jul 22, 2026",author:"Trust & Safety",category:"Scam prevention"},
 {id:"FAQ-61",kind:"FAQ",title:"How does profile verification work?",body:"We compare a live selfie with your profile or identity document and remove the capture after review.",status:"Published",updated:"Jul 28, 2026",author:"Support",category:"Verification"},
 {id:"FAQ-58",kind:"FAQ",title:"How do I cancel Premium?",body:"Open Premium & Billing in Settings and choose Manage subscription.",status:"Published",updated:"Jul 24, 2026",author:"Support",category:"Premium & billing"},
 {id:"EML-31",kind:"Email",title:"Welcome to FLIRTSCHAT",subject:"Your next great connection starts here 💜",body:"Hi {{first_name}}, welcome to FLIRTSCHAT. Complete your profile to start meeting people who match your vibe.",status:"Published",updated:"Jul 30, 2026",author:"Lifecycle Team",audience:"New members"},
 {id:"EML-28",kind:"Email",title:"Premium renewal reminder",subject:"Your Premium plan renews soon",body:"Hi {{first_name}}, your {{plan_name}} subscription renews on {{renewal_date}}.",status:"Draft",updated:"Jul 26, 2026",author:"Lifecycle Team",audience:"Premium members"}
];
export function loadAdminContent(){try{const value=localStorage.getItem(KEY);return value?JSON.parse(value) as ContentItem[]:initialContent}catch{return initialContent}}
export function saveAdminContent(items:ContentItem[]){localStorage.setItem(KEY,JSON.stringify(items))}
