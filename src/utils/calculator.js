// src/utils/calculator.js

/**
 * Calculate the hourly rate based on mode, client count, and base rate
 */
export const getHourlyRate = (mode, clients, baseRate = 20) => {
    if (mode === 'DD') {
        if (clients <= 1) return baseRate;
        if (clients === 2) return baseRate + 1;
        // 3 or more clients
        return baseRate + 1.5;
    } else if (mode === 'CARI/FFH' || mode === 'AAA' || mode === 'KSSP') {
        if (clients <= 3) return baseRate;
        if (clients <= 6) return baseRate + 1;
        // > 6 clients
        return baseRate + 1 + (clients - 6) * 0.25;
    } else if (mode === 'sick') {
        return 20;
    }
    return 0;
};

/**
 * Process a week's worth of time entries for a SINGLE employee.
 * Entries must be within the same Sun-Sat week boundary.
 * 
 * @param {Array} entries - Array of time entry objects for a single employee in one week.
 * @param {number} baseRate - The employee's custom base hourly rate.
 * @returns {Object} - Breakdown of regular pay, daily OT, weekly OT, and total.
 */
export const calculateWeeklyPayroll = (entries, baseRate = 20) => {
    let totalRegularHours = 0;
    let totalDailyOTPay = 0;
    let regularPayAcc = 0; // Accumulated regular pay before weekly OT is considered
    let weeklyHoursRemaining = 50; // Weekly cap (all modes)

    // Group entries by date
    const entriesByDate = {};
    entries.forEach(entry => {
        if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
        entriesByDate[entry.date].push(entry);
    });

    // Calculate daily totals
    Object.keys(entriesByDate).sort().forEach(date => {
        const dayEntries = entriesByDate[date];
        let dailyHoursAcc = 0;
        const dailyLimit = 12; // Daily cap for non-DD modes

        dayEntries.forEach(entry => {
            const mode = entry.mode;
            const rate = entry.hourlyRate || getHourlyRate(mode, entry.clients, baseRate);

            let effectiveHours = entry.hours;

            // Apply Daily Cap (except DD and sick)
            if (mode !== 'DD' && mode !== 'sick') {
                const availableInDay = Math.max(0, dailyLimit - dailyHoursAcc);
                effectiveHours = Math.min(effectiveHours, availableInDay);
            }

            // Apply Weekly Cap (All modes)
            effectiveHours = Math.min(effectiveHours, weeklyHoursRemaining);

            if (effectiveHours <= 0) return;

            weeklyHoursRemaining -= effectiveHours;

            if (mode === 'DD' || mode === 'sick') {
                // Mode 1: No daily OT
                totalRegularHours += effectiveHours;
                regularPayAcc += effectiveHours * rate;
            } else {
                // Mode 2, 3, 4: Daily OT applies after 9 hours
                const hoursBeforeInDay = dailyHoursAcc;
                const hoursAfterInDay = dailyHoursAcc + effectiveHours;

                if (hoursBeforeInDay >= 9) {
                    // Entire effective entry is daily OT
                    totalDailyOTPay += effectiveHours * (rate * 1.5);
                } else if (hoursAfterInDay > 9) {
                    // Splits across the 9-hour boundary
                    const regularPart = 9 - hoursBeforeInDay;
                    const otPart = effectiveHours - regularPart;

                    totalRegularHours += regularPart;
                    regularPayAcc += regularPart * rate;
                    totalDailyOTPay += otPart * (rate * 1.5);
                } else {
                    // Entire effective entry is regular
                    totalRegularHours += effectiveHours;
                    regularPayAcc += effectiveHours * rate;
                }
            }
            dailyHoursAcc += effectiveHours;
        });
    });

    // Calculate Weekly OT
    let weeklyOTPay = 0;
    let regularPayFinal = regularPayAcc;

    if (totalRegularHours > 40) {
        const weeklyOTHours = totalRegularHours - 40;
        const averageRegularRate = regularPayAcc / totalRegularHours;

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
