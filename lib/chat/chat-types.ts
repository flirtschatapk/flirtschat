export type MessageType="text"|"photo"|"voice"|"system"|"gift";
export type MessageStatus="sending"|"sent"|"delivered"|"seen"|"failed";
export type ChatMessage={id:string;conversationId:string;sender:"me"|"them"|"system";type:MessageType;text:string;createdAt:string;status?:MessageStatus;reaction?:string;replyTo?:string;progress?:number;pinned?:boolean;duration?:number;mediaUrl?:string};
export type Conversation={id:string;profileId:string;name:string;username:string;position:string;avatarUrl?:string|null;online:boolean;verified:boolean;favorite:boolean;muted:boolean;pinned:boolean;unread:number;typing:boolean;lastActive:string;lastMessage:string;updatedAt:string;match:boolean;messages:ChatMessage[]};
