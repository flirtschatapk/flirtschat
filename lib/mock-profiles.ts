import type {DiscoverProfile} from "./discover-types";

export const mockProfiles:DiscoverProfile[]=[
  {id:"maya",name:"Maya",age:25,gender:"Woman",city:"Los Angeles",country:"USA",online:true,isNew:true,premium:true,verified:true,bio:"Sunset chaser, ramen enthusiast, and always planning the next little adventure.",interests:["Travel","Photography","Food"],photos:["0% 0%","50% 0%","100% 0%"],relationshipGoal:"Serious Relationship",languages:["English","Spanish"],distance:4,match:true},
  {id:"aria",name:"Aria",age:27,gender:"Woman",city:"Santa Monica",country:"USA",online:true,isNew:false,premium:false,verified:true,bio:"Designer by day, live-music regular by night. Tell me your favorite hidden gem.",interests:["Music","Fashion","Pets"],photos:["50% 0%","100% 0%","0% 100%"],relationshipGoal:"Still Exploring",languages:["English","French"],distance:8},
  {id:"noah",name:"Noah",age:29,gender:"Man",city:"Pasadena",country:"USA",online:false,isNew:true,premium:true,verified:false,bio:"Making good coffee, questionable playlists, and memories worth keeping.",interests:["Fitness","Technology","Gaming"],photos:["100% 0%","0% 100%","50% 100%"],relationshipGoal:"Fun & Casual",languages:["English"],distance:13},
  {id:"zoe",name:"Zoe",age:24,gender:"Woman",city:"Long Beach",country:"USA",online:true,isNew:false,premium:false,verified:true,bio:"Ocean air, old movies, and dogs with big personalities.",interests:["Movies","Pets","Food"],photos:["0% 100%","50% 100%","100% 100%"],relationshipGoal:"Make Friends",languages:["English","Mandarin"],distance:19},
];
