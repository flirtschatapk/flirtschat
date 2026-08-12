"use client";

import {useNotifications} from "./notification-provider";

export function NotificationBadge(){const{unreadNotificationCount}=useNotifications();if(unreadNotificationCount<=0)return null;const label=unreadNotificationCount>99?"99+":String(unreadNotificationCount);return <i key={label} className="fc-count-badge fc-notification-badge" role="status" aria-label={`${label} unread notifications`}>{label}</i>}
