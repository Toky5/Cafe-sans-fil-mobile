import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getToken } from './tokenStorage'; // Import your existing token utility
import Constants from 'expo-constants';

// Global state to track initialization
let initializationPromise: Promise<string | null> | null = null;
let cachedToken: string | null = null;

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

  console.log('[Notifications] 🚀 Starting registration...');
  console.log('[Notifications] 📱 Device.isDevice:', Device.isDevice);
  console.log('[Notifications] 📱 Platform:', Platform.OS);

  // Check if we're on a physical device (push notifications don't work on simulator/emulator)
  if (!Device.isDevice) {
    console.warn('[Notifications] ⚠️ Push notifications only work on physical devices');
    return null;
  }

  try {
    console.log('[Notifications] 1️⃣ Checking existing permissions...');
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Existing status:', existingStatus);
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('[Notifications] 2️⃣ Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[Notifications] Permission result:', status);
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.warn('[Notifications] ❌ Failed to get push token - permission denied:', finalStatus);
      return null;
    }

    console.log('[Notifications] 3️⃣ Getting Expo Push Token...');
    console.log('[Notifications] Project ID:', Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId);
    
    // Get the Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId,
    });
    token = tokenData.data;
    
    console.log('[Notifications] ✅ Token obtained successfully:', token);

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      console.log('[Notifications] 4️⃣ Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('[Notifications] ✅ Android channel configured');
    }

    return token;
  } catch (error) {
    console.error('[Notifications] ❌ Error getting push token:', error);
    if (error instanceof Error) {
      console.error('[Notifications] Error message:', error.message);
      console.error('[Notifications] Error stack:', error.stack);
    }
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
 * Returns a promise that resolves with the token
 */
export async function initializePushNotifications(): Promise<string | null> {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    console.log('[Init] ⏳ Initialization already in progress, returning existing promise');
    return initializationPromise;
  }

  // If we have a cached token, return it immediately
  if (cachedToken) {
    console.log('[Init] 💾 Returning cached token:', cachedToken);
    return cachedToken;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('[Init] 🚀 Starting push notification initialization...');
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        console.log('[Init] ✅ Expo Push Token obtained:', token);
        cachedToken = token;
        console.log('[Init] 💾 Saving token to SecureStore...');
        await SecureStore.setItemAsync('expoPushToken', token);
        await SecureStore.setItemAsync('expoPushTokenTimestamp', Date.now().toString());
        console.log('[Init] ✅ Token saved successfully');
        
        // Check if we've already sent this token
        //const alreadySent = await hasTokenBeenSent();
        
        //if (!alreadySent) {
          //await sendPushTokenToBackend(token);
        //} else {
          //console.log('Token already sent to backend');
        //}
      } else {
        console.warn('[Init] ⚠️ Failed to obtain push token - check logs above for details');
      }

      return token;
    } catch (error) {
      console.error('[Init] ❌ Error initializing push notifications:', error);
      if (error instanceof Error) {
        console.error('[Init] Error details:', error.message);
      }
      return null;
    } finally {
      // Clear the promise after completion so it can be retried if needed
      console.log('[Init] 🏁 Initialization complete');
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
  console.log('[GetToken] 🔍 Getting push token...');
  
  // If we have a cached token, return it
  if (cachedToken) {
    console.log('[GetToken] 💾 Returning cached token:', cachedToken);
    return cachedToken;
  }

  // Try to get from storage
  try {
    console.log('[GetToken] 📂 Checking SecureStore...');
    const storedToken = await SecureStore.getItemAsync('expoPushToken');
    if (storedToken) {
      console.log('[GetToken] ✅ Found token in SecureStore:', storedToken);
      cachedToken = storedToken;
      return storedToken;
    } else {
      console.log('[GetToken] ⚠️ No token found in SecureStore');
    }
  } catch (error) {
    console.error('[GetToken] ❌ Error getting token from storage:', error);
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('[GetToken] ⏳ Waiting for ongoing initialization...');
    return initializationPromise;
  }

  // Otherwise, initialize now
  console.log('[GetToken] 🚀 Starting new initialization...');
  return initializePushNotifications();
}
