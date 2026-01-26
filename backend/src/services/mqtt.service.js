/**
 * MQTT Integration Module for Easy Park
 * Handles publishing gate control messages to ESP32
 * 
 * Installation:
 * npm install mqtt
 * 
 * Environment Variables Required (in .env):
 * MQTT_BROKER=your-broker-url
 * MQTT_PORT=8883
 * MQTT_USERNAME=your-username
 * MQTT_PASSWORD=your-password
 * MQTT_TOPIC=your/topic/path
 */

import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// MQTT Configuration from Environment Variables
const MQTT_CONFIG = {
    broker: process.env.MQTT_BROKER || '6f9aa7d0fff646d7a9513a3970ca84f5.s1.eu.hivemq.cloud',
    port: parseInt(process.env.MQTT_PORT) || 8883,
    username: process.env.MQTT_USERNAME || 'parkmein',
    password: process.env.MQTT_PASSWORD || 'Darshan123',
    clientId: `easypark-server-${Date.now()}`,
    protocol: 'mqtts',
    rejectUnauthorized: false, // For testing only; use proper certs in production
};

const MQTT_TOPIC = process.env.MQTT_TOPIC || 'parkmein/esp32/action';

// Global MQTT client instance
let mqttClient = null;
let isConnected = false;

/**
 * Initialize MQTT Connection
 * Call this once at server startup
 */
export function initializeMQTT() {
    if (mqttClient) {
        console.log('[MQTT] Client already initialized');
        return;
    }

    const brokerURL = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.broker}:${MQTT_CONFIG.port}`;
    
    console.log('[MQTT] Connecting to broker:', MQTT_CONFIG.broker);

    mqttClient = mqtt.connect(brokerURL, {
        clientId: MQTT_CONFIG.clientId,
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        rejectUnauthorized: MQTT_CONFIG.rejectUnauthorized,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
    });

    // Connection success
    mqttClient.on('connect', () => {
        isConnected = true;
        console.log('[MQTT] ✓ Connected to HiveMQ broker');
    });

    // Connection error
    mqttClient.on('error', (error) => {
        isConnected = false;
        console.error('[MQTT] ✗ Connection error:', error.message);
    });

    // Reconnection attempt
    mqttClient.on('reconnect', () => {
        console.log('[MQTT] ⟳ Attempting to reconnect...');
    });

    // Disconnection
    mqttClient.on('offline', () => {
        isConnected = false;
        console.warn('[MQTT] ⚠ Offline - will reconnect automatically');
    });

    return mqttClient;
}

/**
 * Publish Gate Open Action for Entry (Gate 1)
 * Called after successful check-in
 */
export async function publishGateOpen1(bookingId, booking) {
    return publishGateAction('gate_open_1', bookingId, booking, 'Entry gate opened');
}

/**
 * Publish Gate Open Action for Exit (Gate 2)
 * Called after successful check-out with no fine
 */
export async function publishGateAction(action, bookingId, booking, message, extras = {}) {
    if (!mqttClient) {
        console.log('[MQTT] MQTT not initialized. Skipping publish:', action);
        return {
            success: false,
            message: 'MQTT not initialized',
            published: false,
        };
    }

    if (!isConnected) {
        console.warn('[MQTT] Not connected to broker. Skipping publish:', action);
        return {
            success: false,
            message: 'MQTT client not connected',
            published: false,
        };
    }

    try {
        const payload = {
            action: action,
            bookingId: bookingId,
            locationId: booking?.location?._id || booking?.parkingSpot?.parkingLocation?._id,
            userId: booking?.user?._id,
            message: message,
            timestamp: new Date().toISOString(),
            ...extras,
        };

        console.log(`[MQTT] Publishing ${action}:`, payload);

        return new Promise((resolve) => {
            mqttClient.publish(MQTT_TOPIC, JSON.stringify(payload), { qos: 1 }, (error) => {
                if (error) {
                    console.error('[MQTT] Publish error:', error.message);
                    resolve({
                        success: false,
                        message: error.message,
                        published: false,
                    });
                } else {
                    console.log(`[MQTT] ✓ Action published: ${action}`);
                    resolve({
                        success: true,
                        message: 'Action published to ESP32',
                        published: true,
                    });
                }
            });
        });
    } catch (error) {
        console.error('[MQTT] Error publishing action:', error.message);
        return {
            success: false,
            message: error.message,
            published: false,
        };
    }
}

/**
 * Publish Gate Open Action for Exit (Gate 2)
 * Called after successful check-out with no fine
 */
export async function publishGateOpen2(bookingId, booking) {
    return publishGateAction('gate_open_2', bookingId, booking, 'Exit gate opened');
}

/**
 * Publish Fine Pending Action
 * Called when user needs to pay fine before exit
 */
export async function publishFinePending(bookingId, fine, booking) {
    return publishGateAction('fine_pending', bookingId, booking, `Fine pending: रु${fine}`, {
        fine: fine,
        requiresPayment: true,
    });
}

/**
 * Publish manual gate action (for testing)
 */
export async function publishManualGateAction(gateNumber) {
    const action = gateNumber === 1 ? 'gate_open_1' : 'gate_open_2';
    const message = `Manual gate ${gateNumber} control (Testing)`;
    
    try {
        const payload = {
            action: action,
            message: message,
            timestamp: new Date().toISOString(),
            manual: true,
        };

        console.log(`[MQTT] Publishing manual ${action}:`, payload);

        return new Promise((resolve) => {
            if (!mqttClient || !isConnected) {
                resolve({
                    success: false,
                    message: 'MQTT not connected',
                    published: false,
                });
                return;
            }

            mqttClient.publish(MQTT_TOPIC, JSON.stringify(payload), { qos: 1 }, (error) => {
                if (error) {
                    console.error('[MQTT] Publish error:', error.message);
                    resolve({
                        success: false,
                        message: error.message,
                        published: false,
                    });
                } else {
                    console.log(`[MQTT] ✓ Manual action published: ${action}`);
                    resolve({
                        success: true,
                        message: `Gate ${gateNumber} test command sent`,
                        published: true,
                    });
                }
            });
        });
    } catch (error) {
        console.error('[MQTT] Error publishing manual action:', error.message);
        return {
            success: false,
            message: error.message,
            published: false,
        };
    }
}

/**
 * Gracefully close MQTT connection
 * Call this on server shutdown
 */
export function closeMQTT() {
    if (mqttClient) {
        console.log('[MQTT] Closing connection...');
        mqttClient.end();
        mqttClient = null;
        isConnected = false;
    }
}

/**
 * Check if MQTT client is connected
 */
export function isMQTTConnected() {
    return isConnected;
}

export default {
    initializeMQTT,
    publishGateOpen1,
    publishGateOpen2,
    publishFinePending,
    publishManualGateAction,
    publishGateAction,
    closeMQTT,
    isMQTTConnected,
};
