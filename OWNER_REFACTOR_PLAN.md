# Owner Role Refactor - Implementation Plan

## Current Status Analysis

### ✅ Already Implemented:
1. **Role System**: ADMIN, OWNER, USER roles exist in User model
2. **Location Ownership**: ParkingLocation has owner field
3. **QR Scanner**: Already filters locations by owner
4. **Mega Admin**: admin@test.com has global access
5. **Auto-refresh**: Ticket page and My Bookings have auto-refresh

### ❌ Issues Found:
1. **CRITICAL**: Owners CAN book parking spots (needs blocking)
2. **Missing**: Owner dashboard with analytics
3. **Missing**: Location management UI for owners
4. **Bug**: Ticket page still has flicker issues despite fixes
5. **Security**: No strict owner-only validation on location edits

## Implementation Tasks

### PHASE 1: Block Owner Bookings (CRITICAL)

**Backend Changes:**
- Add `blockOwnerBooking` middleware in `auth.middleware.js`
- Apply to `/api/booking/new` route
- Return error: "Owners cannot book parking spots. This feature is for users only."

**Frontend Changes:**
- Hide booking UI from owners in:
  - `searchMap.jsx`
  - `locationDetails.jsx`
  - `booking.jsx`
- Show message: "As an owner, you manage parking locations. Booking is for users only."

### PHASE 2: Owner Dashboard

**Backend API** (`/api/owner/dashboard`):
```javascript
GET /api/owner/dashboard
Response: {
  totalLocations: 5,
  totalSpots: 120,
  currentOccupied: 45,
  peakOccupancy: 98,
  todayRevenue: 15000,
  totalRevenue: 450000,
  activeBookings: 45,
  expiredBookings: 12,
  finesPending: 8,
  revenueByLocation: [{name, revenue}]
}
```

**Frontend Component:**
- New page: `ownerDashboard.jsx`
- Cards for key metrics
- Simple charts (bar chart for revenue by location)
- Real-time updates every 30 seconds

### PHASE 3: Location Management

**Backend APIs:**
- `GET /api/owner/locations` - Get only owner's locations
- `POST /api/owner/locations` - Create new location with spots
- `PUT /api/owner/locations/:id` - Edit location (validate ownership)
- `DELETE /api/owner/locations/:id` - Delete (only if no active bookings)

**Frontend Components:**
- `ownerLocations.jsx` - List all owner's locations
- `addLocation.jsx` - Enhanced with auto-spot creation
- `editLocation.jsx` - Edit location details

### PHASE 4: Fix Ticket Flicker

**Root Cause**: React re-renders when booking object changes (every 10s)

**Solution**:
1. Use `useMemo` to memoize booking calculations
2. Only update state if critical fields changed (status, fine, endTime)
3. Remove auto-refresh, use WebSocket or only refresh on user action
4. Time updates should NOT trigger booking fetch

### PHASE 5: Security Hardening

**Ownership Validation:**
- All location operations must verify `location.owner === req.user.id`
- Guards can only scan for their assigned location
- No global location access except mega admin

**Implementation:**
- Create `validateLocationOwnership` middleware
- Add to all location edit/delete routes
- Add to booking operations that reference locations

## Files to Create:

### Backend:
1. `backend/src/middleware/ownerValidation.js` - Owner blocking & validation
2. `backend/src/controllers/owner.controllers.js` - Owner dashboard logic
3. `backend/src/services/owner.services.js` - Analytics aggregation
4. `backend/src/routes/owner.routes.js` - Owner-specific routes

### Frontend:
1. `frontend/src/pages/ownerDashboard.jsx` - Main owner dashboard
2. `frontend/src/pages/ownerLocations.jsx` - Manage locations
3. `frontend/src/pages/editLocation.jsx` - Edit location form
4. `frontend/src/components/ui/StatCard.jsx` - Dashboard stat card
5. `frontend/src/components/ui/RevenueChart.jsx` - Revenue visualization

## Priority Order:

1. **URGENT**: Block owner bookings (prevent data corruption)
2. **HIGH**: Fix ticket flicker (UX critical)
3. **HIGH**: Owner dashboard (core feature)
4. **MEDIUM**: Location management UI
5. **MEDIUM**: Security hardening

## Testing Checklist:

- [ ] Owner cannot create bookings (API returns 403)
- [ ] Owner cannot see booking UI in frontend
- [ ] Owner dashboard shows accurate stats
- [ ] Owner can only see their own locations
- [ ] Owner can create/edit/delete locations
- [ ] Ticket page doesn't flicker
- [ ] Guards can only scan their location
- [ ] Mega admin still has global access

## Next Steps:

Run these commands to implement:
1. Create middleware files
2. Create owner routes
3. Update booking routes with middleware
4. Create frontend components
5. Test thoroughly
