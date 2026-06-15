import { PermissionsAndroid, Platform } from "react-native";

export function useWebViewPermissions() {
  const handleAndroidPermissionRequest = async (event) => {
    // iOS handles this automatically via the Info.plist strings in app.json
    if (Platform.OS !== "android") return;

    const request = event.nativeEvent || event;
    const resources = request.resources || [];

    try {
      const permissionsToAsk = [];

      // Check if the website is asking for the Microphone (Voice Notes)
      if (resources.includes("android.webkit.resource.AUDIO_CAPTURE")) {
        permissionsToAsk.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }

      // Check if the website is asking for the Camera (Taking Photos)
      if (resources.includes("android.webkit.resource.VIDEO_CAPTURE")) {
        permissionsToAsk.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      if (permissionsToAsk.length > 0) {
        // Trigger the native Android popup!
        const granted =
          await PermissionsAndroid.requestMultiple(permissionsToAsk);

        // Verify user clicked "Allow" for all requested items
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (allGranted) {
          request.grant(resources); // Tell the website to proceed!
        } else {
          request.deny(); // Block the website from recording
        }
      } else {
        // If it's a different generic request, allow it by default
        request.grant(resources);
      }
    } catch (error) {
      console.warn("Failed to handle Android WebView permissions:", error);
      request.deny();
    }
  };

  return { handleAndroidPermissionRequest };
}
