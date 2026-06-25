import { PermissionsAndroid, Platform } from "react-native";

export function useWebViewPermissions() {
  // 1. Added async so we can chain this sequentially
  const requestHardwarePermissions = async () => {
    if (Platform.OS !== "android") return;

    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
    } catch (error) {
      console.warn("Permission error:", error);
    }
  };

  // 2. Instantly grant the internal WebView request to prevent WebRTC timeouts
  const handleAndroidPermissionRequest = (event) => {
    if (Platform.OS !== "android") return;

    try {
      const request = event.nativeEvent || event;
      if (request.grant) {
        request.grant(request.resources);
      }
    } catch (error) {
      console.warn("Failed to auto-grant WebView permissions:", error);
    }
  };

  return { requestHardwarePermissions, handleAndroidPermissionRequest };
}
