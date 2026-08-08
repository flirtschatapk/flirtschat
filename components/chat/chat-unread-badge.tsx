"use client";
import {useChatUnread} from "./chat-unread-provider";
export function ChatUnreadBadge(){const{unreadChatCount}=useChatUnread();return unreadChatCount>0?<i className="fc-chat-unread-badge" aria-label={`${unreadChatCount} unread chat messages`}>{unreadChatCount>99?"99+":unreadChatCount}</i>:null}
