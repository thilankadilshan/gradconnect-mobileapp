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
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

// --- NEW PROFESSIONAL SAFE AREA IMPORTS ---
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// --- CUSTOM SERVICES & HOOKS ---
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
} from "./src/services/notificationService";
import { useWebViewBackHandler } from "./src/hooks/useWebViewBackHandler";
import { useWebViewPermissions } from "./src/hooks/useWebViewPermissions";

SplashScreen.preventAutoHideAsync().catch(() => {});

// --- GOOGLE LOGIN FIX: User-Agent Spoofing ---
const customUserAgent =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1";

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [isWebviewLoading, setIsWebviewLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const notificationListener = useRef();
  const responseListener = useRef();
  const webViewRef = useRef(null);

  // 1. NATIVE HOOKS
  const { setCanGoBack } = useWebViewBackHandler(webViewRef);
  const { handleAndroidPermissionRequest } = useWebViewPermissions();

  // 2. PUSH NOTIFICATION SETUP
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

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
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  // 3. THE BRIDGE: Listens for the website's login success
  const handleMessageFromWebsite = (event) => {
    try {
      const messageData = JSON.parse(event.nativeEvent.data);
      console.log("Message received from web:", messageData);

      if (messageData.type === "USER_LOGIN" && messageData.userId) {
        const loggedInUserId = messageData.userId;
        const jwtToken = messageData.token || null;

        if (expoPushToken) {
          sendTokenToBackend(loggedInUserId, expoPushToken, jwtToken);
        } else {
          registerForPushNotificationsAsync().then((token) => {
            if (token) {
              setExpoPushToken(token);
              sendTokenToBackend(loggedInUserId, token, jwtToken);
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse message from WebView", error);
    }
  };

  // 4. SPLASH SCREEN ANIMATION
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
    <SafeAreaProvider>
      {/* THE FIX: Added "bottom" to edges so it calculates the button bar height */}
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />

        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{ uri: "https://gradconnect.world/" }}
            style={{ flex: 1 }}
            onLoadEnd={handleWebViewLoadEnd}
            onMessage={handleMessageFromWebsite}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            allowsBackForwardNavigationGestures={true}
            // --- NATIVE CAPABILITIES ---
            onPermissionRequest={handleAndroidPermissionRequest}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            // --- NEW GOOGLE LOGIN FIX ---
            userAgent={customUserAgent}
          />

          {isWebviewLoading && (
            <Animated.View
              style={[styles.splashOverlay, { opacity: fadeAnim }]}
            >
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
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
