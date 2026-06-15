import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("User denied push notification permissions!");
      return null;
    }

    try {
      // THE FIX: Grabbing the raw Firebase/APNs token instead of the Expo wrapper
      token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log("SUCCESS! NATIVE DEVICE PUSH TOKEN:", token);
    } catch (e) {
      console.error("Error generating Native push token:", e);
    }
  } else {
    console.log("Must use a physical device for Push Notifications");
  }

  return token;
}

// THE LIVE API CALL TO YOUR BACKEND
export async function sendTokenToBackend(userId, pushToken, jwtToken) {
  try {
    console.log(`Sending live token to backend API for user: ${userId}...`);

    const API_URL = "https://gradconnect.world/api/notifications/token";

    const headers = {
      "Content-Type": "application/json",
    };

    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        userId: userId,
        token: pushToken,
        deviceType: Platform.OS === "ios" ? "ios" : "android",
      }),
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(
        `Backend rejected the token (Status: ${response.status}):`,
        data,
      );
    } else {
      console.log("Token successfully saved to database!", data);
    }
  } catch (error) {
    console.error("Failed to send token to backend", error);
  }
}
