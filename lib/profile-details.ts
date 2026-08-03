export type ProfileDetails={occupation:string;education:string;height:string;zodiac:string;exercise:string;drinking:string;smoking:string;children:string;religion:string;pronouns:string};
const defaults:ProfileDetails={occupation:"Creative professional",education:"Bachelor’s degree",height:"5′ 6″",zodiac:"Libra",exercise:"Sometimes",drinking:"Socially",smoking:"Never",children:"Not sure yet",religion:"Open minded",pronouns:"She / her"};
const knownProfileDetails:Record<string,ProfileDetails>={
  "maya-global":{...defaults,occupation:"Travel photographer",education:"UCLA",height:"5′ 5″",zodiac:"Gemini",exercise:"Often"},
  "aria-global":{...defaults,occupation:"Product designer",education:"ArtCenter",height:"5′ 7″",zodiac:"Libra",drinking:"Socially"},
  "noah-global":{...defaults,occupation:"Software engineer",education:"Caltech",height:"6′ 0″",zodiac:"Capricorn",pronouns:"He / him",exercise:"Often"},
  "zoe-global":{...defaults,occupation:"Marine researcher",education:"CSULB",height:"5′ 4″",zodiac:"Pisces",drinking:"Never"},
  "luna-global":{...defaults,occupation:"Fashion stylist",education:"FIDM",height:"5′ 6″",zodiac:"Scorpio"},
  "liam-global":{...defaults,occupation:"Fitness coach",education:"USC",height:"6′ 1″",zodiac:"Aries",pronouns:"He / him",exercise:"Daily"},
  "ivy-global":{...defaults,occupation:"Illustrator",education:"Otis College",height:"5′ 3″",zodiac:"Aquarius",drinking:"Never"},
  "leo-global":{...defaults,occupation:"Music producer",education:"Berklee",height:"5′ 11″",zodiac:"Leo",pronouns:"He / him"},
};
export const profileDetails=new Proxy(knownProfileDetails,{get(target,key:string){return target[key]??defaults}});
