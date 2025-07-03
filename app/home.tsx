import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#121212" translucent={false} />
            <Text style={styles.title}>Montanini Academy</Text>
            <Text style={styles.subtitle}>Bem-vindo à sua academia!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFD700',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#CCCCCC',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
