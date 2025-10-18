import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

/**
 * Custom hook for managing notifications in components
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Get the push token
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    return () => {
      notificationListener.remove();
    };
  }, []);

  /**
   * Schedule a local notification
   */
  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>,
    seconds: number = 0
  ) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: seconds > 0 ? { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL } : null,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  /**
   * Cancel a scheduled notification
   */
  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  /**
   * Cancel all scheduled notifications
   */
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  };

  /**
   * Get all scheduled notifications
   */
  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    notification,
    scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
  };
}
