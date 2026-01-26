import { useEffect, useRef } from "react";
import {
  notifyCheckInAvailable,
  notifyGracePeriodStart,
  notifyGracePeriodEnding,
  notifyParkingEnding,
  requestNotificationPermission,
} from "../utils/notifications";

/**
 * Custom hook to manage booking notifications
 * Schedules and triggers notifications at appropriate times
 * @param {object} booking - The booking object
 */
export function useBookingNotifications(booking) {
  const timersRef = useRef([]);

  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    if (!booking || booking.status === "completed" || booking.status === "invalid") {
      return;
    }

    // Request notification permission
    requestNotificationPermission();

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

    // Calculate notification times
    const checkInAvailableTime = new Date(startTime.getTime() - GRACE_PERIOD_MS); // 15 min before start
    const gracePeriodStartTime = startTime; // At start time
    const gracePeriodEndingTime = new Date(startTime.getTime() + 10 * 60 * 1000); // 10 min after start (5 min before grace ends)
    const gracePeriodExpiry = new Date(startTime.getTime() + GRACE_PERIOD_MS); // 15 min after start

    // For active bookings, set parking ending notifications
    if (booking.status === "active") {
      const parkingEnd15Min = new Date(endTime.getTime() - 15 * 60 * 1000);
      const parkingEnd5Min = new Date(endTime.getTime() - 5 * 60 * 1000);

      // 15 minutes before end
      if (now < parkingEnd15Min) {
        const delay = parkingEnd15Min - now;
        const timer = setTimeout(() => {
          notifyParkingEnding(booking, 15);
        }, delay);
        timersRef.current.push(timer);
      }

      // 5 minutes before end
      if (now < parkingEnd5Min) {
        const delay = parkingEnd5Min - now;
        const timer = setTimeout(() => {
          notifyParkingEnding(booking, 5);
        }, delay);
        timersRef.current.push(timer);
      }
    }

    // For pending bookings, set check-in notifications
    if (booking.status === "pending") {
      // Notification 1: Check-in available (15 min before start)
      if (now < checkInAvailableTime) {
        const delay = checkInAvailableTime - now;
        const timer = setTimeout(() => {
          notifyCheckInAvailable(booking);
        }, delay);
        timersRef.current.push(timer);
      }

      // Notification 2: Grace period started (at start time)
      if (now < gracePeriodStartTime) {
        const delay = gracePeriodStartTime - now;
        const timer = setTimeout(() => {
          notifyGracePeriodStart(booking);
        }, delay);
        timersRef.current.push(timer);
      }

      // Notification 3: Grace period ending soon (10 min after start = 5 min before expiry)
      if (now < gracePeriodEndingTime) {
        const delay = gracePeriodEndingTime - now;
        const timer = setTimeout(() => {
          notifyGracePeriodEnding(booking);
        }, delay);
        timersRef.current.push(timer);
      }
    }

    // Cleanup function
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [booking]);

  return null;
}

/**
 * Hook to manage multiple bookings notifications
 * @param {Array} bookings - Array of booking objects
 */
export function useMultipleBookingsNotifications(bookings) {
  useEffect(() => {
    if (!bookings || !Array.isArray(bookings)) {
      return;
    }

    // Request permission once
    requestNotificationPermission();

    // Process pending and active bookings only
    const activeBookings = bookings.filter(
      b => b.status === "pending" || b.status === "active"
    );

    // Use the hook for each booking (this is a simplified version)
    // In practice, you'd want to manage timers more carefully
    activeBookings.forEach(booking => {
      // The actual timer setup would happen here
      // This is placeholder - the real implementation is in useBookingNotifications
    });
  }, [bookings]);
}
