import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS } from '../../constants/strings';
import CustomText from '../../components/Text';
import styles from './style';
import { LinearGradient } from 'react-native-linear-gradient';
import SvgS1 from '../../assets/auto-generated-svg-icons/S1';
import SvgS2 from '../../assets/auto-generated-svg-icons/S2';
import SvgS3 from '../../assets/auto-generated-svg-icons/S3';
import { COLORS } from '../../constants';
import CustomImage from '../../components/Image';
import { Text } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: any;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const slides: Slide[] = [
  {
    id: 1,
    title: 'Got a Pile Waiting?',
    subtitle: `That mountain of "I\'ll do it later" clothes?\nTap what you need - Wash, Iron, or Dry clean.`,
    image: require('../../assets/bg/slide1.png'),
  },
  {
    id: 2,
    title: 'Find your Perfect Spot',
    subtitle: 'Pick your go-to shop by rating, time and quality. We\'ll swing by for a quick pickup.',
    image: require('../../assets/bg/slide2.png'),
  },
  {
    id: 3,
    title: 'From Chaos to Closet',
    subtitle: 'Track everything live - pickup, clean, delivery watch your clothes go from wrinkled to ready-to-wear.',
    image: require('../../assets/bg/slide3.png'),
  },
];

const OnBoardingScreen: React.FC = () => {

  const insets = useSafeAreaInsets();

  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(STRINGS.ONBOARDING_COMPLETED, 'true');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      navigation.navigate('Login');
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      // Last slide - navigate to Login
      try {
        await AsyncStorage.setItem(STRINGS.ONBOARDING_COMPLETED, 'true');
        navigation.navigate('Login');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
        navigation.navigate('Login');
      }
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // With disableIntervalMomentum + pagingEnabled, snaps to the nearest page without skipping.
    const contentOffsetX =
      event.nativeEvent.targetContentOffset?.x ?? event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
    lastIndexRef.current = index;
  };

  const renderIllustration = (slideId: number) => {
    switch (slideId) {
      case 1:
        return <CustomImage style={{ width: '80%', height: '80%' }} source={slides[0].image} />;
      case 2:
        return <CustomImage style={{ width: '80%', height: '80%' }} source={slides[1].image} />;
      case 3:
        return <CustomImage style={{ width: '80%', height: '80%' }} source={slides[2].image} />;
      default:
        return null;
    }
  };

  const renderSlide = (slide: Slide) => (
    <View key={slide.id} style={styles.slide}>
      <View style={styles.illustrationContainer}>
        {renderIllustration(slide.id)}
      </View>

      <View style={styles.textContainer}>
        <CustomText style={styles.title}  >
          {slide.title}
        </CustomText>

        <CustomText style={styles.subtitle}  >
          {slide.subtitle}
        </CustomText>

      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Skip Button */}
      <TouchableOpacity style={[styles.skipButton, { paddingTop: insets.top }]} onPress={handleSkip}>

        <CustomText style={styles.skipText} >
          Skip
        </CustomText>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
      >
        {slides.map(renderSlide)}
      </ScrollView>

      {/* Pagination and Next Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 25 }]}>
        <View style={styles.bottomContent}>
          {/* Pagination Dots - Centered */}
          <View style={styles.paginationContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Next Button - Right aligned */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <CustomText style={styles.nextButtonText} fontWeight="SemiBold">
                {currentIndex === 2 ? 'Continue' : 'Next'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

};

export default OnBoardingScreen;

//  {/* Skip Button */}
//       <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
//         <CustomText style={styles.skipText} >
//           Skip
//         </CustomText>
//       </TouchableOpacity>

//       {/* Slides */}
//       <ScrollView
//         ref={scrollViewRef}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onMomentumScrollEnd={handleScroll}
//         decelerationRate="fast"
//         snapToInterval={width}
//         snapToAlignment="center"
//       >
//         {slides.map(renderSlide)}
//       </ScrollView>

//       {/* Pagination and Next Button */}
//       <View style={styles.bottomContainer}>
//         {/* Pagination Dots - Centered */}
//         <View style={styles.paginationContainer}>
//           {slides.map((_, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.dot,
//                 currentIndex === index ? styles.dotActive : styles.dotInactive,
//               ]}
//             />
//           ))}
//         </View>

//         {/* Next Button - Right aligned */}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.nextButton}
//             onPress={handleNext}
//             activeOpacity={0.8}
//           >
//             <CustomText style={styles.nextButtonText} fontWeight="SemiBold">
//               Next
//             </CustomText>
//           </TouchableOpacity>
//         </View>
//       </View>

