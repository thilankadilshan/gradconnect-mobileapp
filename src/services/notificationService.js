import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 1. Tell the app how to behave if a notification arrives while the user is actively using the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. The main function to get permissions and the token
export async function registerForPushNotificationsAsync() {
  let token;

  // Android requires a "channel" to be set up first
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Push notifications only work on physical devices, not computer simulators
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission yet, ask the user with the native OS popup
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If they click "Deny", stop here
    if (finalStatus !== "granted") {
      console.log("User denied push notification permissions!");
      return null;
    }

    // If they click "Allow", generate the unique Expo Push Token for this specific phone
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("SUCCESS! EXPO PUSH TOKEN:", token);
  } else {
    console.log("Must use a physical device for Push Notifications");
  }

  return token;
}

// 3. The bridge to your Node.js backend (You will update this tomorrow)
export async function sendTokenToBackend(userId, pushToken) {
  try {
    console.log(
      `Pretending to send token ${pushToken} to backend for user ${userId}...`,
    );
    /* TOMORROW: Uncomment and use this fetch call when the backend dev gives you the endpoint.
    
    await fetch('https://api.gradconnect.world/v1/users/push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your standard auth headers here (e.g., Bearer token)
      },
      body: JSON.stringify({ pushToken: pushToken }),
    });
    */
  } catch (error) {
    console.error("Failed to send token to backend", error);
  }
}
