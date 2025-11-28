import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '../Text';
import { COLORS, FONTFAMILY } from '../../constants/colors';

export interface CountdownTimerProps {
    createdAt: string;
    expiredTime: string;
    style?: any;
    textStyle?: any;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
    createdAt,
    expiredTime,
    style,
    textStyle,
}) => {
    const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');

    useEffect(() => {
        const calculateTimeRemaining = () => {
            try {
                const now = new Date();
                const expiryDate = new Date(expiredTime);
                const createdDate = new Date(createdAt);

                // Validate dates
                if (isNaN(expiryDate.getTime()) || isNaN(createdDate.getTime())) {
                    setTimeRemaining('00:00:00');
                    return;
                }

                // Calculate the difference in milliseconds
                const diff = expiryDate.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeRemaining('00:00:00');
                    return;
                }

                // Convert to hours, minutes, and seconds
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                // Format as HH:MM:SS
                const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                setTimeRemaining(formattedTime);
            } catch (error) {
                console.error('Error calculating countdown:', error);
                setTimeRemaining('00:00:00');
            }
        };

        // Calculate immediately
        calculateTimeRemaining();

        // Update every second
        const interval = setInterval(calculateTimeRemaining, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [createdAt, expiredTime]);

    return (
        <View style={[styles.container, style]}>
            <CustomText style={[styles.timerText, textStyle]}>{timeRemaining}</CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.LOGIN_SUBTITLE,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timerText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: '500',
        fontFamily: FONTFAMILY.INTER_MEDIUM,
    },
});

export default CountdownTimer;

