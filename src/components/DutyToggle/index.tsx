import React, { useState } from 'react';
import { View, Switch, StyleSheet } from 'react-native';

interface DutyToggleProps {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onColor?: string;
    offColor?: string;
}

const DutyToggle: React.FC<DutyToggleProps> = ({
    value: controlledValue,
    onValueChange,
    onColor = '#4CAF50',
    offColor = '#CCCCCC',
}) => {
    const [internalValue, setInternalValue] = useState(false);

    // Use controlled value if provided, otherwise use internal state
    const toggleValue = controlledValue !== undefined ? controlledValue : internalValue;
    const isControlled = controlledValue !== undefined;

    // Handle toggle
    const handleToggle = (value: boolean) => {
        if (isControlled && onValueChange) {
            // If controlled, just call the callback
            onValueChange(value);
        } else {
            // Otherwise, update internal state
            setInternalValue(value);
        }
    };

    const backgroundColor = toggleValue ? onColor : offColor;

    return (
        <View style={styles.container}>
            <View style={[styles.toggleBackground, { backgroundColor }]}>
                <Switch
                    value={toggleValue}
                    onValueChange={handleToggle}
                    thumbColor="#fff"
                    trackColor={{ false: 'transparent', true: 'transparent' }}
                    style={styles.switch}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    toggleBackground: {
        height: 24,
        width: 44,
        borderRadius: 25,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    switch: {
        transform: [{ scale: 0.8 }],
    },
});

export default DutyToggle;
