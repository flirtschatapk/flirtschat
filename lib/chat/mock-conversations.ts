import type{Conversation}from"./chat-types";
const now=new Date().toISOString();
export const mockConversations:Conversation[]=[
{id:"maya",profileId:"maya-global",name:"Maya",username:"@maya.sun",position:"0% 0%",online:true,verified:true,favorite:true,muted:false,pinned:true,unread:2,typing:false,lastActive:"Online now",lastMessage:"That would be awesome! 😍",updatedAt:"Now",match:true,messages:[
{id:"m1",conversationId:"maya",sender:"system",type:"system",text:"You matched on July 30",createdAt:now},
{id:"m2",conversationId:"maya",sender:"them",type:"text",text:"Nice! 💪 I’m having a coffee and enjoying the sunshine ☀️",createdAt:"10:34 AM",status:"seen"},
{id:"m3",conversationId:"maya",sender:"me",type:"text",text:"Sounds perfect! Would love to join you sometime ☕😉",createdAt:"10:36 AM",status:"seen"},
{id:"m4",conversationId:"maya",sender:"them",type:"text",text:"That would be awesome! 😍\nLet’s plan it soon ❤️",createdAt:"10:38 AM",status:"delivered"}]},
{id:"aria",profileId:"aria-global",name:"Aria",username:"@aria.vibes",position:"50% 0%",online:true,verified:true,favorite:false,muted:false,pinned:false,unread:1,typing:true,lastActive:"Typing…",lastMessage:"Typing…",updatedAt:"2m",match:true,messages:[{id:"a1",conversationId:"aria",sender:"them",type:"photo",text:"Sent a photo",createdAt:"2m",status:"delivered"}]},
{id:"zoe",profileId:"zoe-global",name:"Zoe",username:"@zoe.ocean",position:"0% 100%",online:false,verified:true,favorite:true,muted:true,pinned:false,unread:0,typing:false,lastActive:"Active 8m ago",lastMessage:"Let’s go this weekend",updatedAt:"8m",match:true,messages:[{id:"z1",conversationId:"zoe",sender:"them",type:"voice",text:"Voice message",duration:18,createdAt:"8m",status:"seen"}]},
{id:"noah",profileId:"noah-global",name:"Noah",username:"@noah.codes",position:"100% 0%",online:false,verified:false,favorite:false,muted:false,pinned:false,unread:0,typing:false,lastActive:"Active 32m ago",lastMessage:"You sent a gift",updatedAt:"32m",match:true,messages:[{id:"n1",conversationId:"noah",sender:"me",type:"gift",text:"Rose bouquet 🌹",createdAt:"32m",status:"seen"}]},
{id:"luna",profileId:"luna-global",name:"Luna",username:"@luna.afterdark",position:"50% 100%",online:true,verified:true,favorite:false,muted:false,pinned:false,unread:0,typing:false,lastActive:"Online now",lastMessage:"New match",updatedAt:"1h",match:true,messages:[]}];
