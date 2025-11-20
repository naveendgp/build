import React from 'react';
import { StyleSheet, View } from 'react-native';
import CustomImage from '../Image';
const bgGradient = require('../../assets/bg/bg_gradient.png');

const BackgroundGradient = () => {
    return (
        <View style={styles.container}>
            <CustomImage style={StyleSheet.absoluteFill} source={bgGradient} />

        </View>

        //DON"T REMOVE THIS CODE       
        // <LinearGradient
        //     // colors={['#74C38D', '#9cd4ae', '#aedcbc', '#c6e6d0', '#E6F4EA', '#daeedfff', '#FFFFFF']}
        //     colors={['#6cbf86', '#78c591', '#8ccea1', '#91cfa5',
        //         '#abdaba', '#c2e4cd', '#d4ecdc', '#e6f4ea',
        //         '#f3faf5', '#fbfdfc', '#fbfdfc', '#ffffff']}

        //     start={{ x: 0, y: 0 }}
        //     end={{ x: 0.9, y: 0.9 }}

        //     locations={[0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.75, 1]}
        //     style={styles.container}
        // />
    );
};

export default BackgroundGradient;

const styles = StyleSheet.create({
    container: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%"
    },
});


