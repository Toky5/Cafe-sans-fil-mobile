import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getToken } from './tokenStorage'; // Import your existing token utility
import Constants from 'expo-constants';

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
    console.warn('Push notifications only work on physical devices');
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
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Get the Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId,
    });
    token = tokenData.data;

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
    console.error('Error getting push token:', error);
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
    
    // TODO: Replace with your actual backend endpoint
    const response = await fetch('https://cafesansfil-api-r0kj.onrender.com/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add authentication token if available
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      body: JSON.stringify({
        expoPushToken: token,
        platform: Platform.OS,
        deviceId: Device.deviceName || 'unknown',
        deviceModel: Device.modelName,
        osVersion: Device.osVersion,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send token to backend:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Store token locally to avoid sending it multiple times
    await SecureStore.setItemAsync('expoPushToken', token);
    await SecureStore.setItemAsync('expoPushTokenTimestamp', Date.now().toString());
    console.log('Push token sent to backend successfully');
    return true;
  } catch (error) {
    console.error('Error sending push token to backend:', error);
    return false;
  }
}

/**
 * Check if the token has already been sent to backend
 * Tokens are resent after 7 days to ensure they're up to date
 */
export async function hasTokenBeenSent(): Promise<boolean> {
  try {
    const storedToken = await SecureStore.getItemAsync('expoPushToken');
    const timestamp = await SecureStore.getItemAsync('expoPushTokenTimestamp');
    
    if (!storedToken || !timestamp) {
      return false;
    }
    
    // Resend token if it's older than 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const tokenAge = Date.now() - parseInt(timestamp);
    
    if (tokenAge > sevenDaysInMs) {
      console.log('Token is older than 7 days, will resend');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking stored token:', error);
    return false;
  }
}

/**
 * Initialize push notifications
 * This should be called when the app starts
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      
      console.log('Expo Push Token:', token);
      await SecureStore.setItemAsync('expoPushToken', token);
      
      // Check if we've already sent this token
      //const alreadySent = await hasTokenBeenSent();
      
      //if (!alreadySent) {
        //await sendPushTokenToBackend(token);
      //} else {
        //console.log('Token already sent to backend');
      //}
    }
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}
