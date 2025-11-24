import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

interface LoadingScreenProps {
    size?: 'small' | 'large';
    color?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    size = 'large',
    color = COLORS.THEME_GREEN,
}) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

export default LoadingScreen;

