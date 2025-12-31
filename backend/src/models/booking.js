import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        parkingSpot: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ParkingSpot",
        },
        type: {
            type: String,
            required: true,
            enum: ["bike", "car"],
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "ParkingLocation",
        },
        status: {
            type: String,
            required: true,
            enum: ["active", "expired", "completed", "cancelled"],
            default: "active",
        },
        fine: {
            type: Number,
            required: false,
            default: 0,
        },
        // Entry tracking
        actualEntryTime: {
            type: Date,
            required: false,
            default: null,
        },
        isCheckedIn: {
            type: Boolean,
            required: false,
            default: false,
        },
        // Exit tracking
        actualExitTime: {
            type: Date,
            required: false,
            default: null,
        },
        isCheckedOut: {
            type: Boolean,
            required: false,
            default: false,
        },
        // Original booking times (for reference if times are adjusted)
        originalStartTime: {
            type: Date,
            required: false,
            default: null,
        },
        originalEndTime: {
            type: Date,
            required: false,
            default: null,
        },
        // Grace period tracking
        graceApplied: {
            type: Boolean,
            required: false,
            default: false,
        },
        // Cost tracking
        totalCost: {
            type: Number,
            required: false,
            default: 0,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    },
);

// Virtual to calculate if booking is late
bookingSchema.virtual("isLate").get(function () {
    if (!this.actualExitTime) return false;
    return this.actualExitTime > this.endTime;
});

// Virtual to calculate overstay duration in minutes
bookingSchema.virtual("overstayMinutes").get(function () {
    if (!this.isLate) return 0;
    return Math.floor((this.actualExitTime - this.endTime) / (1000 * 60));
});

// Method to calculate fine based on overstay
bookingSchema.methods.calculateFine = function (finePerHour = 100) {
    if (!this.isLate) return 0;
    const hoursLate = Math.ceil(this.overstayMinutes / 60);
    return hoursLate * finePerHour;
};

// Ensure virtuals are included when converting to JSON
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
