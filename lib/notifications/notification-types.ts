export type NotificationType="likes"|"super_like"|"messages"|"gift"|"visitor"|"match"|"system"|"security"|"premium"|"mentions"|"connection_accepted"|"post_comment"|"post_comment_reply"|"comment_reaction";
export type NotificationFilter="all"|"likes"|"messages"|"system"|"mentions";

export type FlirtschatNotification={
  id:string;
  type:NotificationType;
  title:string;
  description:string;
  time:string;
  read:boolean;
  href:string;
  actorId?:string|null;
  referenceId?:string|null;
  actorName?:string|null;
  avatarUrl?:string|null;
  avatarPosition?:string;
  previewPosition?:string;
};
