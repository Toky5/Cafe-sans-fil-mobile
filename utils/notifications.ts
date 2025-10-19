import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getToken } from './tokenStorage'; // Import your existing token utility
import Constants from 'expo-constants';

// Global state to track initialization
let initializationPromise: Promise<string | null> | null = null;
let cachedToken: string | null = null;
let cachedDeviceToken: string | null = null;

// Clear any stored tokens at startup
(async () => {
  try {
    await SecureStore.deleteItemAsync('expoPushToken');
    await SecureStore.deleteItemAsync('expoPushTokenTimestamp');
    await SecureStore.deleteItemAsync('devicePushToken');
    console.log('[Notifications] 🧹 Cleared stored tokens at startup');
  } catch (error) {
    console.log('[Notifications] No stored tokens to clear');
  }
})();

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the Expo Push Token
 * @returns The Expo Push Token or null if registration failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Check if we're on a physical device (push notifications don't work on simulator/emulator)
  if (!Device.isDevice) {
    console.warn('Aucune notification: Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.warn('Aucune notification: Permission denied');
      return null;
    }

    // Get device push token (native APNs/FCM token)
    let devicePushToken: string | null = null;
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      devicePushToken = deviceTokenData.data;
      cachedDeviceToken = devicePushToken; // Cache it in memory only
    } catch (deviceError) {
      console.error('Error getting device push token:', deviceError);
    }

    // Get the Expo Push Token
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.error('Aucune notification: No Project ID found');
      return null;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;
    
    console.log('Expo Push Token:', token);

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Aucune notification:', error);
    return null;
  }
}

/**
 * Send the push token to your backend
 * @param token The Expo Push Token
 * @returns True if successful, false otherwise
 */
export async function sendPushTokenToBackend(token: string): Promise<boolean> {
  try {
    // Get the user's auth token
    const authToken = await getToken();
    
    // The token already includes the format ExponentPushToken[...]
    // We need to include it in the URL path
    const response = await fetch(`https://cafesansfil-api-r0kj.onrender.com/api/notifications/register/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    });

    if (!response.ok) {
      console.error('Failed to send token to backend:', response.status);
      return false;
    }

    console.log('Push token sent to backend successfully');
    return true;
  } catch (error) {
    console.error('Error sending push token to backend:', error);
    return false;
  }
}

/**
 * Fetch notifications from backend
 * @returns Array of notifications or empty array
 */
export async function fetchNotificationsFromBackend(): Promise<Array<{id: string, title: string, body: string}>> {
  try {
    const authToken = await getToken();
    
    const response = await fetch('https://cafesansfil-api-r0kj.onrender.com/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch notifications:', response.status);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}



/**
 * Initialize push notifications
 * This should be called when the app starts
 * Returns a promise that resolves with the token
 */
export async function initializePushNotifications(): Promise<string | null> {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // If we have a cached token, return it immediately
  if (cachedToken) {
    return cachedToken;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        cachedToken = token; // Cache in memory only
        
        // Send token to backend
        await sendPushTokenToBackend(token);
      }

      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    } finally {
      // Clear the promise after completion so it can be retried if needed
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Get the current Expo push token
 * Waits for initialization if in progress
 */
export async function getExpoPushToken(): Promise<string | null> {
  // If we have a cached token, return it
  if (cachedToken) {
    return cachedToken;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Otherwise, initialize now
  return initializePushNotifications();
}

/**
 * Force refresh the push token (useful for debugging)
 * Clears cache and re-initializes
 */
export async function forceRefreshToken(): Promise<string | null> {
  // Clear cached tokens
  cachedToken = null;
  cachedDeviceToken = null;
  
  // Clear initialization promise
  initializationPromise = null;
  
  // Re-initialize
  return initializePushNotifications();
}

/**
 * Get the device push token (native APNs/FCM token)
 * @returns The device push token or null if not available
 */
export async function getDevicePushToken(): Promise<string | null> {
  // Return cached device token if available
  return cachedDeviceToken;
}

/**
 * Get both Expo and Device push tokens
 * @returns Object with both tokens
 */
export async function getAllPushTokens(): Promise<{ expoToken: string | null; deviceToken: string | null }> {
  const expoToken = await getExpoPushToken();
  const deviceToken = await getDevicePushToken();
  
  return { expoToken, deviceToken };
}
