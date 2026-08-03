export type ContentCheck={safe:boolean;reason?:string};
const phone=/\b(?:\+?\d[\d\s().-]{7,}\d)\b/;
const link=/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|me)\b)/i;
export function checkChatContent(text:string):ContentCheck{if(phone.test(text))return{safe:false,reason:"Phone numbers can expose private information."};if(link.test(text))return{safe:false,reason:"External links are blocked for your safety."};return{safe:true}}
