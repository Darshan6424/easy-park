# API Reference - MQTT Gate Control Endpoints

## Check-in/Check-out with Automatic MQTT

### 1. Check-In (User Scans QR at Entry)

**Endpoint:** `POST /api/book/checkin/:bookingId`

**Request:**
```json
{
  "locationId": "location_id_string"  // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Checked in on time. Enjoy your parking!",
  "data": {
    "booking": { /* booking object */ },
    "graceApplied": false,
    "minutesLate": 0,
    "mqttPublished": true  // ✓ MQTT message sent to open Gate 1
  }
}
```

**What Happens:**
- Validates booking within grace period (±15 min)
- Updates booking: `status = "active"`, `isCheckedIn = true`
- **Publishes MQTT:** `action: "gate_open_1"`
- **ESP32 Action:** GPIO12 activates for 3 seconds
- **LCD Shows:** "Gate 1 Opened - Welcome!"

---

### 2. Check-Out (User Scans QR at Exit)

**Endpoint:** `POST /api/book/checkout/:bookingId`

**Request:**
```json
{
  "locationId": "location_id_string"  // optional
}
```

**Response - Scenario A (On-time, No Fine):**
```json
{
  "success": true,
  "message": "Checked out successfully. Thank you!",
  "data": {
    "booking": { /* booking object */ },
    "fine": 0,
    "minutesLate": 0,
    "hoursLate": 0,
    "mqttPublished": true  // ✓ MQTT message sent to open Gate 2
  }
}
```

**What Happens:**
- No overstay detected
- Updates booking: `status = "completed"`, `isCheckedOut = true`
- **Publishes MQTT:** `action: "gate_open_2"`
- **ESP32 Action:** GPIO13 activates for 3 seconds
- **LCD Shows:** "Gate 2 Opened - Thank you!"

**Response - Scenario B (Late, Fine Required):**
```json
{
  "success": false,
  "message": "Cannot checkout - Fine pending. Please pay रु 250 (1 hour late) before checkout.",
  "data": {
    "booking": { /* booking object */ },
    "fine": 250,
    "minutesLate": 45,
    "hoursLate": 1,
    "mqttPublished": true  // ✓ MQTT message sent (fine_pending)
  }
}
```

**What Happens:**
- Overstay detected: 45 minutes late
- Fine calculated: `ceil(1 hr × 50₹/hr × 1.5) = 75₹`
- Updates booking: `status = "expired"`, `fine = 75`, `finePaid = false`, `isCheckedOut = false`
- **Publishes MQTT:** `action: "fine_pending"` with `fine: 75`
- **ESP32 Action:** No relay activation (gates stay closed)
- **LCD Shows:** "PAYMENT REQUIRED - Pay fine to exit!"

---

## Owner Testing Endpoints

### 3. Test Gate 1 (Entry Gate)

**Endpoint:** `POST /api/owner/test/gate1`

**Authentication:** Required (Owner role only)

**Request:**
```json
{}  // Empty body
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Gate 1 test command sent",
  "mqttConnected": true,
  "data": {
    "success": true,
    "message": "Gate 1 test command sent",
    "published": true
  }
}
```

**What Happens:**
- Owner clicks "Test Gate 1 (Entry)" button
- Backend publishes MQTT: `action: "gate_open_1"` with `manual: true`
- **ESP32 Action:** GPIO12 activates for 3 seconds
- **LCD Shows:** Gate 1 opens and displays test message
- Frontend shows: "✓ Gate 1 command sent!"

**Response (Failure):**
```json
{
  "success": false,
  "message": "Failed to send test command: MQTT not connected",
  "mqttConnected": false,
  "data": null
}
```

---

### 4. Test Gate 2 (Exit Gate)

**Endpoint:** `POST /api/owner/test/gate2`

**Authentication:** Required (Owner role only)

**Request:**
```json
{}  // Empty body
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Gate 2 test command sent",
  "mqttConnected": true,
  "data": {
    "success": true,
    "message": "Gate 2 test command sent",
    "published": true
  }
}
```

**What Happens:**
- Owner clicks "Test Gate 2 (Exit)" button
- Backend publishes MQTT: `action: "gate_open_2"` with `manual: true`
- **ESP32 Action:** GPIO13 activates for 3 seconds
- **LCD Shows:** Gate 2 opens and displays test message
- Frontend shows: "✓ Gate 2 command sent!"

**Response (Failure):**
```json
{
  "success": false,
  "message": "Failed to send test command: MQTT not connected",
  "mqttConnected": false
}
```

---

## MQTT Message Payloads

### Payload Format - Gate Open (Check-in)

**Topic:** `parkmein/esp32/action`

```json
{
  "action": "gate_open_1",
  "bookingId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "message": "Entry gate opened",
  "timestamp": "2026-01-27T10:30:00.000Z"
}
```

### Payload Format - Gate Open (Check-out)

**Topic:** `parkmein/esp32/action`

```json
{
  "action": "gate_open_2",
  "bookingId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "message": "Exit gate opened",
  "timestamp": "2026-01-27T10:45:00.000Z"
}
```

### Payload Format - Fine Pending

**Topic:** `parkmein/esp32/action`

```json
{
  "action": "fine_pending",
  "bookingId": "507f1f77bcf86cd799439011",
  "locationId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "message": "Fine pending: रु250",
  "timestamp": "2026-01-27T10:45:00.000Z",
  "fine": 250,
  "requiresPayment": true
}
```

### Payload Format - Manual Test

**Topic:** `parkmein/esp32/action`

```json
{
  "action": "gate_open_1",
  "message": "Manual gate 1 control (Testing)",
  "timestamp": "2026-01-27T10:50:00.000Z",
  "manual": true
}
```

---

## Frontend Integration

### How Owner Dashboard Calls Test Endpoints

```javascript
// In ownerDashboard.jsx

const testGate = async (gateNumber) => {
    setTestLoading(true);
    try {
        const endpoint = gateNumber === 1 ? "gate1" : "gate2";
        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/owner/test/${endpoint}`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            }
        );

        const data = await response.json();
        
        if (data.success || data.data?.published) {
            setTestMessage(`✓ Gate ${gateNumber} command sent!`);
        } else {
            setTestMessage(`✗ Failed: ${data.message}`);
        }
    } catch (error) {
        setTestMessage(`✗ Error: ${error.message}`);
    } finally {
        setTestLoading(false);
    }
};
```

---

## Error Handling

### Common Error Responses

**MQTT Not Connected:**
```json
{
  "success": false,
  "message": "MQTT client not connected",
  "mqttConnected": false
}
```

**Booking Not Found:**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

**Already Checked In:**
```json
{
  "success": false,
  "message": "Already checked in"
}
```

**Grace Period Expired:**
```json
{
  "success": false,
  "message": "Grace period expired. You must check in within 15 minutes of booking start time."
}
```

**Not Authorized (Owner Check):**
```json
{
  "success": false,
  "message": "You are not authorized to manage this location"
}
```

---

## HTTP Status Codes

| Code | Scenario | Response |
|------|----------|----------|
| 200 | Check-in/out success | Full booking data + mqttPublished |
| 200 | Gate test success | Test result with mqttConnected |
| 400 | Booking error (late, already checked in) | Error message |
| 400 | MQTT publish failed | Error message + mqttConnected: false |
| 401 | Not authenticated | Redirect to login |
| 403 | Not owner role | Forbidden |
| 404 | Booking not found | Not found error |

---

## Testing with curl

### Test Check-in
```bash
curl -X POST http://localhost:5000/api/book/checkin/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locationId":"LOCATION_ID"}' \
  --cookie "auth_token=YOUR_TOKEN"
```

### Test Check-out
```bash
curl -X POST http://localhost:5000/api/book/checkout/BOOKING_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locationId":"LOCATION_ID"}' \
  --cookie "auth_token=YOUR_TOKEN"
```

### Test Gate 1 (Owner)
```bash
curl -X POST http://localhost:5000/api/owner/test/gate1 \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  --cookie "auth_token=OWNER_TOKEN"
```

### Test Gate 2 (Owner)
```bash
curl -X POST http://localhost:5000/api/owner/test/gate2 \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  --cookie "auth_token=OWNER_TOKEN"
```

---

## Testing with MQTT Explorer

### Monitor Messages

1. Go to https://mqtt-explorer.com/
2. Connect with:
   - Broker: `6f9aa7d0fff646d7a9513a3970ca84f5.s1.eu.hivemq.cloud`
   - Port: `8883`
   - Username: `parkmein`
   - Password: `Darshan123`
   - Protocol: `mqtts`

3. Subscribe to: `parkmein/esp32/action`

4. Trigger check-in/out or test gates from website

5. Watch messages appear in MQTT Explorer

---

## Debugging Tips

### Check Backend Logs

```
[MQTT] ✓ Connected to HiveMQ broker
[CheckIn] MQTT Gate 1 published: { success: true, published: true }
[MQTT] Publishing gate_open_1: { action: "gate_open_1", ... }
```

### Check Frontend Logs

Open browser console:
```javascript
// Successful publish
// GET /api/owner/test/gate1 200 OK
// Response: { success: true, message: "Gate 1 test command sent" }

// Failed publish
// Response: { success: false, message: "MQTT not connected" }
```

### Check ESP32 Serial Monitor

```
[MQTT] ✓ Connected to HiveMQ broker
Message arrived on topic: parkmein/esp32/action
Message: {"action":"gate_open_1"}
Opening Gate 1
GPIO12 LOW for 3000ms
GPIO12 HIGH
```

---

## Performance Notes

- **MQTT Latency:** Typically 50-200ms per message
- **Relay Activation:** Instantaneous (< 10ms)
- **LCD Update:** ~100ms
- **Backend Response Time:** < 500ms
- **Concurrent Users:** Broker handles 1000+ connections

---

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Status:** Production Ready
