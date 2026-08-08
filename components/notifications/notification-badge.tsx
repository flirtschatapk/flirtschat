"use client";

import {useNotifications} from "./notification-provider";

export function NotificationBadge(){const{unreadCount}=useNotifications();return unreadCount>0?<i className="fc-notification-badge">{unreadCount>99?"99+":unreadCount}</i>:null}
