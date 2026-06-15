import { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";

export function useWebViewBackHandler(webViewRef) {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const onAndroidBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    let backHandlerSubscription;

    if (Platform.OS === "android") {
      // Modern React Native returns a subscription object
      backHandlerSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onAndroidBackPress,
      );
    }

    return () => {
      // MODERN SDK 54 CLEANUP FIX (.remove() instead of removeEventListener)
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
      }
    };
  }, [canGoBack, webViewRef]);

  return { setCanGoBack };
}
