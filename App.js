import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

// Import the service
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
} from "./src/services/notificationService";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [isWebviewLoading, setIsWebviewLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const notificationListener = useRef();
  const responseListener = useRef();
  const webViewRef = useRef(null);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // Generate the push token immediately when app opens so it's ready in state
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("User clicked notification:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // THE BRIDGE: This catches messages sent from your website's frontend javascript
  const handleMessageFromWebsite = (event) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      console.log("Message received from web:", messageData);

      // Check if the website is sending a login event
      if (messageData.type === "USER_LOGIN" && messageData.userId) {
        const loggedInUserId = messageData.userId;
        const jwtToken = messageData.token || null; // if your dev passes a JWT token

        console.log(
          `User logged in with ID: ${loggedInUserId}. Sending push token...`,
        );

        if (expoPushToken) {
          // Fire the API call with the real User ID and device token!
          sendTokenToBackend(loggedInUserId, expoPushToken, jwtToken);
        } else {
          console.log(
            "Delayed send: Token wasn't ready yet, fetching again...",
          );
          registerForPushNotificationsAsync().then((token) => {
            if (token) {
              sendTokenToBackend(loggedInUserId, token, jwtToken);
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse message from WebView", error);
    }
  };

  const handleWebViewLoadEnd = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setIsWebviewLoading(false);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

      <WebView
        ref={webViewRef}
        source={{ uri: "https://gradconnect.world/" }}
        style={{ flex: 1 }}
        onLoadEnd={handleWebViewLoadEnd}
        onMessage={handleMessageFromWebsite} // Attaching the bridge listener here
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {isWebviewLoading && (
        <Animated.View style={[styles.splashOverlay, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              Grad<Text style={styles.logoHighlight}>Connect</Text>
            </Text>
            <Text style={styles.subtitleText}>Connecting Futures</Text>
          </View>
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.spinner}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
    backgroundColor: "#ffffff",
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.5,
  },
  logoHighlight: {
    color: "#007AFF",
  },
  subtitleText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: 20,
  },
});
