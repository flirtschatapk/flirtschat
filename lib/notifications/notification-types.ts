export type NotificationType="likes"|"messages"|"gift"|"visitor"|"match"|"system"|"security"|"premium"|"mentions";
export type NotificationFilter="all"|"likes"|"messages"|"system"|"mentions";

export type FlirtschatNotification={
  id:string;
  type:NotificationType;
  title:string;
  description:string;
  time:string;
  read:boolean;
  href:string;
  avatarPosition?:string;
  previewPosition?:string;
};
