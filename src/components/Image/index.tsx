
import React from 'react';
import { Image, ImageProps } from 'react-native';

/**
 * A custom image component that wraps the React Native Image component.
 * It can be used to enforce consistent styling and behavior for images across the app.
 *
 * @param {ImageProps} props - The props for the Image component.
 */
const CustomImage: React.FC<ImageProps> = (props) => {
  return <Image resizeMode="contain" {...props} />;
};

export default CustomImage;
