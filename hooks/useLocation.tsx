import { useState, useEffect } from "react";
import * as Location from "expo-location";

type LocationType = Location.LocationObject | null;

/**
 * Hook to get the current location of the device when the 
 * user first opens the app after it has been closed.
 *
 * Note: This hook runs only once when the component first mounts.
 * It does not run again when the user comes back to the app after
 * it has been in the background. For that, you should use the
 * `useOnForegroundBack` hook.
 *
 * #### Usage
 * ```tsx
 * const [location, getCurrentLocation, locationPermissionDenied] = useLocation();
 * ```
 *
 * @returns [`location`, `getCurrentLocation`, `locationPermissionDenied`]
 *
 * `location`: The current location of the device.
 *
 * `getCurrentLocation`: Function to get the current location of the device.
 * You can pass `true` to get the location object as a return value.
 *
 * `locationPermissionDenied`: Boolean indicating if location permission was denied.
 *
 */
export default function useLocation() {
  // State to store the current location
  const [location, setLocation] = useState<LocationType>(null);
  // State to track if permission was denied
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  /**
   * Function to get the current location of the device.
   *
   * @param returnLocation - Pass `true` to get the location object as a return value.
   *
   * @returns The current location object.
   */
  async function getCurrentLocation(returnLocation: boolean = false) {

    try {
      // First, CHECK if we already have permission (don't request again)
      let { status } = await Location.getForegroundPermissionsAsync();

      // Only request permission if we don't have it yet
      if (status !== "granted") {
        console.log("Location permission not granted, requesting...");
        const permissionResponse = await Location.requestForegroundPermissionsAsync();
        status = permissionResponse.status;
      } else {
        console.log("Location permission already granted, skipping request");
      }

      // If permission is denied, log a message and set the flag
      if (status !== "granted") {
        console.info("Permission to access location was denied");
        setLocationPermissionDenied(true);
        // Set a mock location object so the app can still function
        // This prevents the app from being stuck in loading state
        setLocation({
          coords: {
            latitude: 45.5017, // Montreal default
            longitude: -73.5673,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as Location.LocationObject);
        return;
      }

      // Permission granted, reset the denied flag
      setLocationPermissionDenied(false);

      // Try to get last known position first (instant)
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 30000, // 30 seconds
        requiredAccuracy: 5000, // 5km - very loose
      });

      if (lastKnown) {
        console.log("Using last known position:", lastKnown.coords);
        setLocation(lastKnown);
      }

      // Get fresh location with timeout
      const locationPromise = Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Low,
      });

      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Location timeout')), 8000)
      );

      // Race between location fetch and timeout
      try {
        const position = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
        
        if (position) {
          console.log("Got fresh location:", position.coords);
          setLocation(position);
          if (returnLocation) return position;
        }
      } catch (timeoutError) {
        console.warn("Location fetch timed out, using last known or default");
        
        // If we already have lastKnown, we're good
        if (lastKnown) {
          if (returnLocation) return lastKnown;
        } else {
          // Set default location
          const defaultLocation = {
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as Location.LocationObject;
          setLocation(defaultLocation);
          if (returnLocation) return defaultLocation;
        }
      }
    } catch (error) {
      console.error("Error in getCurrentLocation:", error);
      // Always set a location to prevent app from being stuck
      setLocation({
        coords: {
          latitude: 45.5017,
          longitude: -73.5673,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as Location.LocationObject);
    }
  }

  useEffect(() => {
    console.log("FIRST USE EFFECT");
    getCurrentLocation();
  }, []);

  return [location, getCurrentLocation, locationPermissionDenied] as const;
}
