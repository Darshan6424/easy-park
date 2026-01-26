// Notification utility for Easy Park

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show a browser notification
 * @param {string} title - Notification title
 * @param {object} options - Notification options
 * @returns {Notification|null} - The notification object or null
 */
export function showNotification(title, options = {}) {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  const defaultOptions = {
    icon: "/parking-icon.png",
    badge: "/parking-badge.png",
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // Auto-close after 10 seconds if not interactive
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

/**
 * Show booking confirmation notification
 * @param {object} booking - Booking details
 */
export function notifyBookingCreated(booking) {
  const startTime = new Date(booking.startTime).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const location = booking.parkingSpot?.parkingLocation?.name || 
                   booking.location?.name || 
                   "Parking Location";

  showNotification("🎫 Booking Confirmed!", {
    body: `${location}\nSpot: ${booking.parkingSpot?.spotNumber || "N/A"}\nStart: ${startTime}`,
    tag: `booking-${booking._id}`,
    data: { bookingId: booking._id, type: "booking-created" },
  });
}

/**
 * Show check-in reminder notification
 * @param {object} booking - Booking details
 */
export function notifyCheckInAvailable(booking) {
  const location = booking.parkingSpot?.parkingLocation?.name || 
                   booking.location?.name || 
                   "Parking Location";

  showNotification("🔔 Check-In Available", {
    body: `You can now check in at ${location}. Check-in window: 15 minutes before to 15 minutes after start time.`,
    tag: `checkin-${booking._id}`,
    requireInteraction: true,
    data: { bookingId: booking._id, type: "checkin-available" },
  });
}

/**
 * Show grace period start notification
 * @param {object} booking - Booking details
 */
export function notifyGracePeriodStart(booking) {
  const location = booking.parkingSpot?.parkingLocation?.name || 
                   booking.location?.name || 
                   "Parking Location";

  showNotification("⏰ Booking Started!", {
    body: `Your parking at ${location} has started. Please check in within 15 minutes to activate your booking.`,
    tag: `grace-start-${booking._id}`,
    requireInteraction: true,
    data: { bookingId: booking._id, type: "grace-start" },
  });
}

/**
 * Show grace period ending soon notification
 * @param {object} booking - Booking details
 */
export function notifyGracePeriodEnding(booking) {
  const location = booking.parkingSpot?.parkingLocation?.name || 
                   booking.location?.name || 
                   "Parking Location";

  showNotification("⚠️ Check-In Urgently Required!", {
    body: `Only 5 minutes left to check in at ${location}! Your booking will be cancelled if you don't check in.`,
    tag: `grace-ending-${booking._id}`,
    requireInteraction: true,
    data: { bookingId: booking._id, type: "grace-ending" },
    vibrate: [300, 100, 300, 100, 300],
  });
}

/**
 * Show parking ending soon notification
 * @param {object} booking - Booking details
 * @param {number} minutesLeft - Minutes remaining
 */
export function notifyParkingEnding(booking, minutesLeft) {
  const location = booking.parkingSpot?.parkingLocation?.name || 
                   booking.location?.name || 
                   "Parking Location";

  showNotification("⏱️ Parking Ending Soon", {
    body: `Your parking at ${location} ends in ${minutesLeft} minutes. Please return to avoid overstay charges.`,
    tag: `parking-ending-${booking._id}`,
    requireInteraction: true,
    data: { bookingId: booking._id, type: "parking-ending" },
  });
}

/**
 * Check if notifications are supported and enabled
 * @returns {boolean}
 */
export function areNotificationsSupported() {
  return "Notification" in window;
}

/**
 * Check if notifications are granted
 * @returns {boolean}
 */
export function areNotificationsEnabled() {
  return "Notification" in window && Notification.permission === "granted";
}
