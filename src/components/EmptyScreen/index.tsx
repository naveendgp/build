import React from 'react';
import { View } from 'react-native';
import CustomText from '../Text';
import EmptyIcon from '../../assets/auto-generated-svg-icons/EmptyIcon';
import { COLORS, FONTFAMILY } from '../../constants/colors';
import styles from './style';

interface EmptyScreenProps {
    title?: string;
    subtitle?: string;
    iconSize?: number;
}

const EmptyScreen: React.FC<EmptyScreenProps> = ({
    title = 'No Data Available',
    subtitle,
    iconSize = 150,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <EmptyIcon width={iconSize} height={iconSize} />
            </View>
            <CustomText style={styles.title}>{title}</CustomText>
            {subtitle && <CustomText style={styles.subtitle}>{subtitle}</CustomText>}
        </View>
    );
};

export default EmptyScreen;

