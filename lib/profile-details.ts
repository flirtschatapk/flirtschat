export type ProfileDetails={occupation:string;education:string;height:string;zodiac:string;exercise:string;drinking:string;smoking:string;children:string;religion:string;pronouns:string};
const emptyDetails:ProfileDetails={occupation:"Not added",education:"Not added",height:"Not added",zodiac:"Not added",exercise:"Not added",drinking:"Not added",smoking:"Not added",children:"Not added",religion:"Not added",pronouns:"Not added"};
export const profileDetails:Record<string,ProfileDetails>=new Proxy({}, {get:()=>emptyDetails});
