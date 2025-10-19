import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getToken } from './tokenStorage'; // Import your existing token utility
import Constants from 'expo-constants';

// Global state to track initialization
let initializationPromise: Promise<string | null> | null = null;
let cachedToken: string | null = null;
let cachedDeviceToken: string | null = null;

// Helper function to show alerts in production for debugging
const debugAlert = (title: string, message: string) => {
  console.log(`[${title}] ${message}`);
  Alert.alert(title, message);
};

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
  
  debugAlert('Starting Registration', `Device: ${Device.isDevice ? 'Physical' : 'Simulator'}\nPlatform: ${Platform.OS}`);

  // Check if we're on a physical device (push notifications don't work on simulator/emulator)
  if (!Device.isDevice) {
    console.warn('[Notifications] ⚠️ Push notifications only work on physical devices');
    debugAlert('Error', 'Push notifications only work on physical devices');
    return null;
  }

  try {
    console.log('[Notifications] 1️⃣ Checking existing permissions...');
    debugAlert('Step 1', 'Checking existing permissions...');
    
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Existing status:', existingStatus);
    debugAlert('Permission Status', `Current status: ${existingStatus}`);
    
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('[Notifications] 2️⃣ Requesting permissions...');
      debugAlert('Step 2', 'Requesting permissions from user...');
      
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[Notifications] Permission result:', status);
      debugAlert('Permission Result', `Status: ${status}`);
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.warn('[Notifications] ❌ Failed to get push token - permission denied:', finalStatus);
      debugAlert('Permission Denied', `Status: ${finalStatus}\nPlease enable notifications in Settings`);
      return null;
    }

    console.log('[Notifications] 3️⃣ Getting Device Push Token (APNs/FCM)...');
    debugAlert('Step 3', 'Getting native device push token (APNs for iOS)...');
    
    let devicePushToken: string | null = null;
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      devicePushToken = deviceTokenData.data;
      cachedDeviceToken = devicePushToken; // Cache it
      console.log('[Notifications] ✅ Device Push Token obtained:', devicePushToken);
      debugAlert('Device Token Success ✅', `Native token obtained:\n${devicePushToken}\n\nType: ${deviceTokenData.type || 'unknown'}`);
      
      // Store device token
      if (devicePushToken) {
        await SecureStore.setItemAsync('devicePushToken', devicePushToken);
        console.log('[Notifications] 💾 Device token saved to SecureStore');
      }
    } catch (deviceError) {
      console.error('[Notifications] ❌ Error getting device push token:', deviceError);
      if (deviceError instanceof Error) {
        debugAlert('Device Token Error ❌', `Failed to get native token:\n${deviceError.message}`);
      } else {
        debugAlert('Device Token Error ❌', `Unknown error: ${JSON.stringify(deviceError)}`);
      }
    }

    console.log('[Notifications] 4️⃣ Getting Expo Push Token...');
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    console.log('[Notifications] Project ID:', projectId);
    debugAlert('Step 4', `Getting Expo Push Token...\nProject ID: ${projectId || 'NOT FOUND'}`);
    
    if (!projectId) {
      debugAlert('Error', 'No Project ID found! Check app.json configuration');
      return null;
    }
    
    // Get the Expo Push Token
    debugAlert('Expo Token Request', 'Requesting Expo token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;
    
    console.log('[Notifications] ✅ Expo Token obtained successfully:', token);
    debugAlert('Expo Token Success! ✅', `Expo token obtained:\n${token}`);

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      console.log('[Notifications] 5️⃣ Setting up Android notification channel...');
      debugAlert('Step 5', 'Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('[Notifications] ✅ Android channel configured');
      debugAlert('Android Setup', 'Channel configured successfully');
    }

    // Show final summary with both tokens
    if (devicePushToken && token) {
      debugAlert('All Tokens Retrieved! 🎉', `Device Token (APNs):\n${devicePushToken}\n\n---\n\nExpo Token:\n${token}`);
    } else if (token) {
      debugAlert('Expo Token Only ⚠️', `Expo token obtained but device token failed.\n\nExpo Token:\n${token}`);
    } else if (devicePushToken) {
      debugAlert('Device Token Only ⚠️', `Device token obtained but Expo token failed.\n\nDevice Token:\n${devicePushToken}`);
    }

    return token;
  } catch (error) {
    console.error('[Notifications] ❌ Error getting push token:', error);
    if (error instanceof Error) {
      console.error('[Notifications] Error message:', error.message);
      console.error('[Notifications] Error stack:', error.stack);
      debugAlert('Error ❌', `Failed to get token:\n${error.message}\n\nStack: ${error.stack?.substring(0, 200)}`);
    } else {
      debugAlert('Error ❌', `Unknown error: ${JSON.stringify(error)}`);
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
    debugAlert('Init Info', 'Initialization already in progress...');
    return initializationPromise;
  }

  // If we have a cached token, return it immediately
  if (cachedToken) {
    console.log('[Init] 💾 Returning cached token:', cachedToken);
    debugAlert('Cached Token Found', `Token: ${cachedToken}`);
    return cachedToken;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log('[Init] 🚀 Starting push notification initialization...');
      debugAlert('Initialization Started', 'Beginning push notification setup...');
      
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        console.log('[Init] ✅ Expo Push Token obtained:', token);
        cachedToken = token;
        console.log('[Init] 💾 Saving token to SecureStore...');
        debugAlert('Saving Token', 'Storing token securely...');
        
        await SecureStore.setItemAsync('expoPushToken', token);
        await SecureStore.setItemAsync('expoPushTokenTimestamp', Date.now().toString());
        console.log('[Init] ✅ Token saved successfully');
        debugAlert('Success! 🎉', `Token saved successfully!\n\nToken: ${token}`);
        
        // Check if we've already sent this token
        //const alreadySent = await hasTokenBeenSent();
        
        //if (!alreadySent) {
          //await sendPushTokenToBackend(token);
        //} else {
          //console.log('Token already sent to backend');
        //}
      } else {
        console.warn('[Init] ⚠️ Failed to obtain push token - check logs above for details');
        debugAlert('Warning ⚠️', 'Failed to obtain push token. Check previous alerts for details.');
      }

      return token;
    } catch (error) {
      console.error('[Init] ❌ Error initializing push notifications:', error);
      if (error instanceof Error) {
        console.error('[Init] Error details:', error.message);
        debugAlert('Initialization Error ❌', `Error: ${error.message}\n\nStack: ${error.stack?.substring(0, 200)}`);
      } else {
        debugAlert('Initialization Error ❌', `Unknown error: ${JSON.stringify(error)}`);
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
  debugAlert('Getting Token', 'Checking for push token...');
  
  // If we have a cached token, return it
  if (cachedToken) {
    console.log('[GetToken] 💾 Returning cached token:', cachedToken);
    debugAlert('Cached Token', `Found: ${cachedToken}`);
    return cachedToken;
  }

  // Try to get from storage
  try {
    console.log('[GetToken] 📂 Checking SecureStore...');
    debugAlert('Checking Storage', 'Looking in SecureStore...');
    
    const storedToken = await SecureStore.getItemAsync('expoPushToken');
    if (storedToken) {
      console.log('[GetToken] ✅ Found token in SecureStore:', storedToken);
      cachedToken = storedToken;
      debugAlert('Token Found ✅', `Retrieved from storage:\n${storedToken}`);
      return storedToken;
    } else {
      console.log('[GetToken] ⚠️ No token found in SecureStore');
      debugAlert('No Stored Token', 'No token found in SecureStore, will initialize...');
    }
  } catch (error) {
    console.error('[GetToken] ❌ Error getting token from storage:', error);
    debugAlert('Storage Error', `Error reading from SecureStore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    console.log('[GetToken] ⏳ Waiting for ongoing initialization...');
    debugAlert('Waiting', 'Initialization in progress...');
    return initializationPromise;
  }

  // Otherwise, initialize now
  console.log('[GetToken] 🚀 Starting new initialization...');
  debugAlert('Starting Init', 'Beginning new initialization...');
  return initializePushNotifications();
}

/**
 * Force refresh the push token (useful for debugging)
 * Clears cache and re-initializes
 */
export async function forceRefreshToken(): Promise<string | null> {
  console.log('[ForceRefresh] 🔄 Force refreshing token...');
  debugAlert('Force Refresh', 'Clearing cache and re-initializing...');
  
  // Clear cached tokens
  cachedToken = null;
  cachedDeviceToken = null;
  
  // Clear initialization promise
  initializationPromise = null;
  
  // Remove from storage
  try {
    await SecureStore.deleteItemAsync('expoPushToken');
    await SecureStore.deleteItemAsync('expoPushTokenTimestamp');
    await SecureStore.deleteItemAsync('devicePushToken');
  } catch (error) {
    console.error('[ForceRefresh] Error clearing storage:', error);
  }
  
  // Re-initialize
  return initializePushNotifications();
}

/**
 * Get the device push token (native APNs/FCM token)
 * @returns The device push token or null if not available
 */
export async function getDevicePushToken(): Promise<string | null> {
  console.log('[GetDeviceToken] 🔍 Getting device push token...');
  
  // If we have a cached device token, return it
  if (cachedDeviceToken) {
    console.log('[GetDeviceToken] 💾 Returning cached device token:', cachedDeviceToken);
    return cachedDeviceToken;
  }

  // Try to get from storage
  try {
    console.log('[GetDeviceToken] 📂 Checking SecureStore...');
    const storedToken = await SecureStore.getItemAsync('devicePushToken');
    if (storedToken) {
      console.log('[GetDeviceToken] ✅ Found device token in SecureStore:', storedToken);
      cachedDeviceToken = storedToken;
      return storedToken;
    } else {
      console.log('[GetDeviceToken] ⚠️ No device token found in SecureStore');
    }
  } catch (error) {
    console.error('[GetDeviceToken] ❌ Error getting device token from storage:', error);
  }

  return null;
}

/**
 * Get both Expo and Device push tokens
 * @returns Object with both tokens
 */
export async function getAllPushTokens(): Promise<{ expoToken: string | null; deviceToken: string | null }> {
  const expoToken = await getExpoPushToken();
  const deviceToken = await getDevicePushToken();
  
  console.log('[GetAllTokens] Expo Token:', expoToken);
  console.log('[GetAllTokens] Device Token:', deviceToken);
  
  return { expoToken, deviceToken };
}
