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

    // Request permission to access the location
    let { status } = await Location.requestForegroundPermissionsAsync();

    // If permission is denied, log a message and set the flag
    if (status !== "granted") {
      console.info("Permission to access location was denied");
      setLocationPermissionDenied(true);
      // Set a mock location object so the app can still function
      // This prevents the app from being stuck in loading state
      setLocation({
        coords: {
          latitude: 0,
          longitude: 0,
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

    // Get the current location of the device
    let position = await Location.getCurrentPositionAsync({});
    setLocation(position);

    // FIXME: Remove this log after testing.
    console.log(
      "Current Location: ",
      position.coords.longitude,
      position.coords.latitude
    );

    // Return the location object if `returnLocation` is true
    if (returnLocation) return position;
  }

  useEffect(() => {
    console.log("FIRST USE EFFECT");
    getCurrentLocation();
  }, []);

  return [location, getCurrentLocation, locationPermissionDenied] as const;
}
