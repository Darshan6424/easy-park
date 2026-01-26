# Easy Park - Parking Management System

A complete IoT-enabled parking management system with automated gate control using ESP32, MQTT, and mobile app integration.

## Features

✅ **User Booking System** - Real-time parking spot booking with QR codes  
✅ **Check-in/Check-out** - Grace period (±15 min) with automatic time adjustments  
✅ **Fine System** - Automatic fine calculation (1.5x hourly rate) for overstay  
✅ **IoT Gate Control** - ESP32-based automatic gate opening via MQTT  
✅ **Owner Dashboard** - Real-time statistics and gate testing  
✅ **Payment System** - Fine payment before checkout  
✅ **Admin Panel** - Revenue tracking and booking management  

---

## Technology Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **IoT:** ESP32 + MQTT (HiveMQ Cloud) + I2C LCD
- **Real-time:** MQTT Pub/Sub for gate control

---

## Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm install mqtt  # MQTT for gate control
npm run dev
```

#### Configure MQTT (.env file)

Copy `.env.example` to `.env` and add your MQTT credentials:
```env
PORT=8000
MONGO_DB_URL=mongodb://...
JWT_SECRET_KEY=your_secret

# MQTT Configuration for Gate Control
MQTT_BROKER=6f9aa7d0fff646d7a9513a3970ca84f5.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=parkmein
MQTT_PASSWORD=Darshan123
MQTT_TOPIC=parkmein/esp32/action
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. ESP32 Setup

1. Install Arduino IDE
2. Add ESP32 board support (Board Manager URL: https://dl.espressif.com/dl/package_esp32_index.json)
3. Install libraries:
   - PubSubClient (Nick O'Leary)
   - LiquidCrystal_I2C (Frank de Brabander)
4. Upload `esp32_gate_controller.ino`

**Hardware Wiring:**
```
ESP32 GPIO21 (SDA) ──> LCD I2C SDA
ESP32 GPIO22 (SCL) ──> LCD I2C SCL
ESP32 GPIO12 ───────> Relay Module IN1 (Gate 1)
ESP32 GPIO13 ───────> Relay Module IN2 (Gate 2)
```

---

## MQTT Integration

### Configuration

**HiveMQ Broker:**
- Broker: `6f9aa7d0fff646d7a9513a3970ca84f5.s1.eu.hivemq.cloud`
- Port: `8883` (MQTT over TLS)
- Username: `parkmein`
- Password: `Darshan123`
- Topic: `parkmein/esp32/action`

### Message Format

**Entry Gate Open (After Check-in):**
```json
{
  "action": "gate_open_1",
  "bookingId": "xxx",
  "message": "Entry gate opened"
}
```

**Exit Gate Open (After Check-out, No Fine):**
```json
{
  "action": "gate_open_2",
  "bookingId": "xxx",
  "message": "Exit gate opened"
}
```

**Fine Payment Required (Overstay):**
```json
{
  "action": "fine_pending",
  "bookingId": "xxx",
  "fine": 250,
  "message": "Pay fine to exit"
}
```

---

## Check-in/Check-out Flow

### Check-in Process
```
User scans QR code
    ↓
Backend validates (grace period: ±15 minutes)
    ↓
Adjusts end time (early = reduce, late = extend)
    ↓
Publishes MQTT: action:gate_open_1
    ↓
ESP32 opens Gate 1
    ↓
LCD displays "Gate 1 Opened - Welcome!"
```

### Check-out Process

**Scenario 1: On-time (No Fine)**
```
User scans QR code
    ↓
No overstay detected
    ↓
Publishes MQTT: action:gate_open_2
    ↓
ESP32 opens Gate 2
    ↓
LCD displays "Gate 2 Opened - Thank you!"
```

**Scenario 2: Late (With Fine)**
```
User scans QR code
    ↓
Overstay detected: 45 min late
    ↓
Fine calculated: ceil(1 hour × 50 ₹/hr × 1.5) = 75 ₹
    ↓
Publishes MQTT: action:fine_pending
    ↓
ESP32 does NOT open gate
    ↓
LCD displays "PAYMENT REQUIRED - Pay fine to exit!"
    ↓
User pays fine online
    ↓
User re-scans QR
    ↓
ESP32 opens Gate 2
```

---

## Owner Dashboard Testing

### Test MQTT Gate Buttons

The owner dashboard includes buttons to test gate control without waiting for actual bookings:

**Endpoints:**
```
POST /api/owner/test/gate1  →  Test Entry Gate (Gate 1)
POST /api/owner/test/gate2  →  Test Exit Gate (Gate 2)
```

**What Happens:**
1. Owner clicks "Open Gate 1" or "Open Gate 2" button
2. Backend publishes MQTT message: `{"action": "gate_test_1"}` or `{"action": "gate_test_2"}`
3. ESP32 receives message and activates corresponding relay
4. Gate opens for 3 seconds
5. LCD displays gate status

**Use Cases:**
- Verify MQTT connectivity
- Test hardware before users arrive
- Troubleshoot gate mechanisms
- Demonstrate system to stakeholders

**Response:**
```json
{
  "success": true,
  "message": "Gate 1 test command sent",
  "mqttConnected": true,
  "data": { "published": true }
}
```

---
### Gate Control Testing

The Owner Dashboard includes test buttons to manually trigger gate opening:

1. Navigate to **Owner Dashboard** (only for owners)
2. Scroll to **"Gate Control Testing"** section
3. Click:
   - **"Test Gate 1 (Entry)"** - Sends MQTT command to open entry gate
   - **"Test Gate 2 (Exit)"** - Sends MQTT command to open exit gate

**Requirements:**
- Logged in as Owner role
- ESP32 must be powered and connected to WiFi/MQTT
- MQTT service must be initialized on backend

---

## User Roles

### User
- Book parking spots
- Check-in via QR code
- Pay fines online
- View booking history

### Owner
- Add/manage parking locations
- View revenue statistics
- **Test gate controls (MQTT)** ← Open Gate 1 & Gate 2 buttons
- Manage parking spots

### Admin
- View all bookings
- View all locations
- Revenue tracking
- User management

---

## Database Models

### User
```javascript
{
  email, password, phone, name, role
}
```

### Booking
```javascript
{
  user, location, parkingSpot, hourlyRate,
  startTime, endTime, actualEntryTime, actualExitTime,
  isCheckedIn, isCheckedOut, qrCodeUsed,
  status, fine, finePaid, graceApplied, graceType
}
```

### ParkingLocation
```javascript
{
  owner, name, address, coordinates,
  hourlyRate, totalSpots, parkingSpots
}
```

---

## API Endpoints

### Booking
- `POST /api/booking/create` - Create booking
- `GET /api/booking/available-spots/:locationId` - Get available spots
- `POST /api/book/checkin/:bookingId` - Check-in (publishes MQTT)
- `POST /api/book/checkout/:bookingId` - Check-out (publishes MQTT)
- `GET /api/book/status/:bookingId` - Get booking status
- `POST /api/book/pay-fine/:bookingId` - Pay fine

### Owner
- `GET /api/owner/dashboard/stats` - Dashboard stats
- `GET /api/owner/locations` - Owner's locations
- `POST /api/owner/test/gate1` - Test Gate 1 (MQTT)
- `POST /api/owner/test/gate2` - Test Gate 2 (MQTT)

### Admin
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/users` - All users
- `GET /api/admin/revenue` - Revenue stats

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/easypark
JWT_SECRET=your_secret_key
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Fine Calculation Formula

```javascript
minutesLate = (now - booking.endTime) / 60000
hoursLate = Math.ceil(minutesLate / 60)
fine = Math.ceil(hoursLate × hourlyRate × 1.5)

Example: 45 min late @ 50 ₹/hr
= ceil(1 × 50 × 1.5) = 75 rupees
```

---

## MQTT Flow Diagram

```
Check-in Success        Check-out Success (No Fine)   Check-out Overstay
       ↓                            ↓                          ↓
Backend validates         Backend validates           Backend calculates fine
       ↓                            ↓                          ↓
Publish: gate_open_1   Publish: gate_open_2       Publish: fine_pending
       ↓                            ↓                          ↓
ESP32 receives              ESP32 receives             ESP32 receives
       ↓                            ↓                          ↓
GPIO12 LOW (3s)            GPIO13 LOW (3s)            No GPIO activation
       ↓                            ↓                          ↓
LCD: "Welcome!"            LCD: "Thank you!"          LCD: "PAYMENT REQUIRED"
```

---

## Testing

### Test Check-in/Check-out
1. Create a booking
2. Scan QR code to check-in
3. Wait past booking end time
4. Scan QR code to check-out:
   - **On-time:** Gate 2 opens
   - **Late:** Shows fine message, gate locked

### Test Fine Payment
1. Create booking with short duration
2. Check-in
3. Wait past end time and check-out
4. Fine is calculated and shown
5. Pay fine in app
6. Re-scan to open gate

### Test MQTT Gates (Owner Only)
1. Go to Owner Dashboard
2. Scroll to "Gate Control Testing"
3. Click "Test Gate 1" or "Test Gate 2"
4. Check ESP32 LCD for response

---

## Troubleshooting

### MQTT Not Publishing
- Check if backend MQTT service initialized
- Verify HiveMQ broker connectivity
- Check `npm install mqtt` completed
- Review server logs for [MQTT] messages

### Gates Not Opening
- Verify ESP32 is powered on
- Check WiFi connection status
- Verify relay module power and GPIO pins
- Use MQTT Explorer to test manually

### Fine Calculation Wrong
- Check booking hourlyRate in database
- Verify FINE_MULTIPLIER = 1.5
- Check time calculation (minutes → hours)

### Frontend/Backend Connection
- Verify backend running on PORT 5000
- Check VITE_API_BASE_URL in frontend .env
- Check CORS settings in backend

---

## Production Checklist

- [ ] Update MQTT credentials (don't use test credentials)
- [ ] Configure proper TLS certificates
- [ ] Set secure JWT secret
- [ ] Enable database authentication
- [ ] Configure production CORS
- [ ] Set up error logging
- [ ] Enable HTTPS on frontend
- [ ] Test all edge cases
- [ ] Load test MQTT messages
- [ ] Backup database regularly

---

## Future Enhancements

- [ ] Mobile app notifications
- [ ] SMS alerts for overstay
- [ ] Camera integration at gates
- [ ] License plate recognition
- [ ] Seasonal pricing
- [ ] Subscription plans
- [ ] Peak hour surcharges
- [ ] Loyalty rewards program

---

## Support

For issues or questions:
1. Check ESP32 logs via Serial Monitor
2. Monitor MQTT with MQTT Explorer
3. Review backend server logs
4. Check browser console for frontend errors

---

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Status:** Production Ready
