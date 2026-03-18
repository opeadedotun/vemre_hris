import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const PERMISSION_FLAG = 'vemre_notification_permission_requested';

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const ensureNotificationPermission = async () => {
    if (isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    if (localStorage.getItem(PERMISSION_FLAG)) return false;
    localStorage.setItem(PERMISSION_FLAG, '1');
    const result = await Notification.requestPermission();
    return result === 'granted';
};

export const shouldNotifyUser = () => {
    if (typeof document === 'undefined') return true;
    return document.hidden || !document.hasFocus();
};

export const notifyNewMessage = async (title: string, body: string, tag?: string) => {
    if (isNativePlatform()) {
        const status = await LocalNotifications.requestPermissions();
        if (status.display !== 'granted') return;

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: Math.floor(Date.now() % 1000000),
                    title,
                    body,
                    extra: tag ? { tag } : undefined
                }
            ]
        });
        return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification(title, { body, tag });
};
