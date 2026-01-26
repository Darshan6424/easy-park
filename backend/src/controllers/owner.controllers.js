import { getOwnerDashboardStats, getOwnerLocations } from "../services/owner.services.js";
import { publishManualGateAction, isMQTTConnected } from "../services/mqtt.service.js";

/**
 * Get dashboard statistics for the logged-in owner
 */
export async function getDashboardStats(req, res) {
    try {
        const ownerId = req.user._id;
        const stats = await getOwnerDashboardStats(ownerId);
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
}

/**
 * Get all locations owned by the logged-in owner
 */
export async function getMyLocations(req, res) {
    try {
        const ownerId = req.user._id;
        const locations = await getOwnerLocations(ownerId);
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error in getMyLocations:", error);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
}

/**
 * Test MQTT - Open Gate 1 (Entry Gate)
 */
export async function testGateOpen1(req, res) {
    try {
        console.log('[TestGate1] Owner:', req.user._id, 'testing Gate 1');
        
        const result = await publishManualGateAction(1);

        return res.status(200).json({
            success: result.published,
            message: result.message,
            mqttConnected: isMQTTConnected(),
            data: result,
        });
    } catch (error) {
        console.error("Error in testGateOpen1:", error);
        return res.status(400).json({
            success: false,
            message: "Failed to send test command: " + error.message,
            mqttConnected: isMQTTConnected(),
        });
    }
}

/**
 * Test MQTT - Open Gate 2 (Exit Gate)
 */
export async function testGateOpen2(req, res) {
    try {
        console.log('[TestGate2] Owner:', req.user._id, 'testing Gate 2');
        
        const result = await publishManualGateAction(2);

        return res.status(200).json({
            success: result.published,
            message: result.message,
            mqttConnected: isMQTTConnected(),
            data: result,
        });
    } catch (error) {
        console.error("Error in testGateOpen2:", error);
        return res.status(400).json({
            success: false,
            message: "Failed to send test command: " + error.message,
            mqttConnected: isMQTTConnected(),
        });
    }
}
