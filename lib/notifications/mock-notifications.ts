import type{FlirtschatNotification}from"./notification-types";

export const mockNotifications:FlirtschatNotification[]=[
  {id:"like-sophia",type:"likes",title:"Sophia liked you",description:"She liked your profile.",time:"2m ago",read:false,href:"/profile/maya-global",avatarPosition:"0% 0%",previewPosition:"50% 0%"},
  {id:"message-maya",type:"messages",title:"Maya sent you a message",description:"Hey! How's your day going? 😊",time:"5m ago",read:false,href:"/chats/maya",avatarPosition:"50% 0%"},
  {id:"premium-boost",type:"premium",title:"You're a top profile today!",description:"More people are seeing your profile.",time:"1h ago",read:false,href:"/premium"},
  {id:"like-charlotte",type:"likes",title:"Charlotte liked your profile",description:"She liked your profile.",time:"2h ago",read:false,href:"/profile/zoe-global",avatarPosition:"0% 100%",previewPosition:"100% 0%"},
  {id:"gift-luna",type:"gift",title:"You received a gift",description:"Luna sent you a Rose 🌹",time:"3h ago",read:false,href:"/chats/luna"},
  {id:"visitor-new",type:"visitor",title:"New profile visitor",description:"2 people visited your profile.",time:"4h ago",read:false,href:"/onboarding",previewPosition:"50% 100%"},
  {id:"match-isabella",type:"match",title:"You have a new match!",description:"It's a match with Isabella 🎉",time:"6h ago",read:true,href:"/matches",previewPosition:"0% 100%"},
  {id:"security-login",type:"security",title:"Account security alert",description:"New login detected on Windows.",time:"1d ago",read:true,href:"/settings"},
];
