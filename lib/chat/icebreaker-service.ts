const suggestions={Flirty:["Be honest—what made you smile today? 😉","What's your ideal spontaneous date?"],Funny:["What's your most controversial food opinion?","Choose one: bad karaoke or terrible dancing?"],Romantic:["What little gesture makes you feel special?","Describe your perfect sunset moment."],Casual:["What song is on repeat right now?","What's your weekend vibe?"]}as const;
export type IcebreakerCategory=keyof typeof suggestions;
export async function getIcebreakers(category:IcebreakerCategory,premium=false){void premium;return[...suggestions[category]]}
