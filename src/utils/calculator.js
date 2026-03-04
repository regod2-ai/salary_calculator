// src/utils/calculator.js

/**
 * Calculate the hourly rate based on mode and client count
 */
export const getHourlyRate = (mode, clients) => {
    if (mode === 'DD') {
        // 1 client = 20, extra clients add $1
        return 20 + Math.max(0, clients - 1);
    } else if (mode === 'CARI/FFH' || mode === 'AAA') {
        if (clients <= 3) return 20;
        if (clients <= 6) return 21;
        // > 6 clients
        return 21 + (clients - 6) * 0.75;
    }
    return 0;
};

/**
 * Process a week's worth of time entries for a SINGLE employee.
 * Entries must be within the same Sun-Sat week boundary.
 * 
 * @param {Array} entries - Array of time entry objects for a single employee in one week.
 * @returns {Object} - Breakdown of regular pay, daily OT, weekly OT, and total.
 */
export const calculateWeeklyPayroll = (entries) => {
    let totalRegularHours = 0;
    let totalDailyOTPay = 0;
    let regularPayAcc = 0; // Accumulated regular pay before weekly OT is considered

    // Group entries by date to calculate daily overtime (only applies to Mode 2/3)
    const entriesByDate = {};
    entries.forEach(entry => {
        if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
        entriesByDate[entry.date].push(entry);
    });

    // Calculate daily totals
    Object.keys(entriesByDate).forEach(date => {
        const dayEntries = entriesByDate[date];
        // Sort entries or assume they are chronological. We just need total hours per day.
        // However, rate might differ per entry if clients/mode differ within same day.
        // For simplicity, we process entries sequentially to allocate to the 8-hour bucket.

        let dailyHoursAcc = 0;

        dayEntries.forEach(entry => {
            const mode = entry.mode;
            const rate = getHourlyRate(mode, entry.clients);

            if (mode === 'DD') {
                // Mode 1: No daily OT, all goes to regular hours for weekly OT consideration
                totalRegularHours += entry.hours;
                regularPayAcc += entry.hours * rate;
            } else {
                // Mode 2 & 3: Daily OT applies after 8 hours
                const hoursBeforeThisEntry = dailyHoursAcc;
                const hoursAfterThisEntry = dailyHoursAcc + entry.hours;

                if (hoursBeforeThisEntry >= 8) {
                    // Entire entry is daily OT
                    totalDailyOTPay += entry.hours * (rate * 1.5);
                } else if (hoursAfterThisEntry > 8) {
                    // Splits across the 8-hour boundary
                    const regularPart = 8 - hoursBeforeThisEntry;
                    const otPart = entry.hours - regularPart;

                    totalRegularHours += regularPart;
                    regularPayAcc += regularPart * rate;
                    totalDailyOTPay += otPart * (rate * 1.5);
                } else {
                    // Entire entry is regular
                    totalRegularHours += entry.hours;
                    regularPayAcc += entry.hours * rate;
                }

                dailyHoursAcc += entry.hours;
            }
        });
    });

    // Calculate Weekly OT
    // Average regular rate might be needed if multiple rates exist in the 40 regular hours.
    // Standard FLSA approach: Weighted average regular rate = Total Regular Pay / Total Regular Hours
    let weeklyOTPay = 0;
    let regularPayFinal = regularPayAcc;

    if (totalRegularHours > 40) {
        const weeklyOTHours = totalRegularHours - 40;
        const averageRegularRate = regularPayAcc / totalRegularHours;

        // The regularPayAcc already paid for these hours at 1.0x. We need to add the 0.5x premium.
        // Or we can recalculate: 40 hours at avg rate + OT hours at 1.5x avg rate
        regularPayFinal = 40 * averageRegularRate;
        weeklyOTPay = weeklyOTHours * (averageRegularRate * 1.5);
    }

    return {
        regularHours: Math.min(totalRegularHours, 40),
        regularPay: regularPayFinal,
        dailyOTPay: totalDailyOTPay,
        weeklyOTPay: weeklyOTPay,
        totalPay: regularPayFinal + totalDailyOTPay + weeklyOTPay
    };
};

/**
 * Helper to get the Sunday of the week for a given date string (YYYY-MM-DD)
 */
export const getWeekBoundary = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 is Sunday
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    return sunday.toISOString().split('T')[0];
};
