export type FriendStatus="online"|"recent"|"offline";
export type MockFriend={id:string;name:string;username:string;position:string;status:FriendStatus;lastSeen:string;lastMessage:string;time:string;unread:number;streak?:number;favorite?:boolean};
export const mockFriends:MockFriend[]=[
  {id:"maya",name:"Maya",username:"@maya.sun",position:"0% 0%",status:"online",lastSeen:"Active now",lastMessage:"That sounds perfect! ✨",time:"Now",unread:2,streak:12,favorite:true},
  {id:"aria",name:"Aria",username:"@aria.vibes",position:"50% 0%",status:"online",lastSeen:"Active now",lastMessage:"Sent you a Snap",time:"2m",unread:1,streak:7},
  {id:"zoe",name:"Zoe",username:"@zoe.ocean",position:"0% 100%",status:"recent",lastSeen:"Active 8m ago",lastMessage:"Let’s go this weekend",time:"8m",unread:0,streak:24,favorite:true},
  {id:"noah",name:"Noah",username:"@noah.codes",position:"100% 0%",status:"recent",lastSeen:"Active 32m ago",lastMessage:"You: I’ll send the place",time:"32m",unread:0},
  {id:"luna",name:"Luna",username:"@luna.afterdark",position:"50% 100%",status:"offline",lastSeen:"Active yesterday",lastMessage:"Reacted ❤️ to your photo",time:"1d",unread:0,streak:4},
  {id:"liam",name:"Liam",username:"@liam.moves",position:"100% 100%",status:"offline",lastSeen:"Active 2 days ago",lastMessage:"You’re hilarious 😂",time:"2d",unread:0},
];
