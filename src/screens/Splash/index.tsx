import React, { useEffect } from "react";
import { View, ActivityIndicator, ImageBackground } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { STRINGS } from "../../constants/strings";
import { COLORS } from "../../constants/colors";
import { useAuthStore } from "../../state/zustand/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./styles";
import BackgroundGradient from "../../components/backgroundGradient";
import OtterLogoIcon from "../../assets/auto-generated-svg-icons/OtterLogoIcon";

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashNavProp>();
  const { initAuth } = useAuthStore();

  useEffect(() => {

    const checkAuthAndNavigate = async () => {
      try {

        // Wait for 2 seconds

        await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));


        // Initialize auth store from storage
        await initAuth();


        // Check AsyncStorage for isLogin and auth_token
        const isLogin = await AsyncStorage.getItem(STRINGS.IS_LOGIN);
        const authToken = await AsyncStorage.getItem(STRINGS.AUTH_TOKEN);

        const isProfileAddressInit = await AsyncStorage.getItem(STRINGS.IS_INIT_PROFILE_ADDRESS_UPDATED);



        if (isProfileAddressInit === 'false') {

          navigation.reset({
            index: 0,
            routes: [{ name: "ProfileDataScreen", params: { fromOtp: true } }]
          });
        }
        else if (isLogin === 'true' && authToken && authToken !== '') {

          navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
        } else {
          // Check if onboarding has been completed
          const onboardingCompleted = await AsyncStorage.getItem(STRINGS.ONBOARDING_COMPLETED);

          if (onboardingCompleted === 'true') {
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: "OnBoarding" }] });
          }
        }
      } catch (error) {

        navigation.navigate("OnBoarding");
      }
    };

    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <View
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <OtterLogoIcon />
      </View>
    </View>
  );
};

export default SplashScreen;
