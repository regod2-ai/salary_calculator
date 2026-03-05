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
    let totalDailyOTHours = 0;
    let totalWeeklyOTHours = 0;
    let totalWeeklyOTPay = 0;
    let totalPay = 0;

    let weeklyHoursRemainingForRegular = 40;
    let weeklyHoursRemainingTotal = 50;

    // Track breakdown by (mode + rate)
    const breakdownMap = {};

    // Sort entries by date to ensure sequential attribution
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Group entries by date for daily OT calculation
    const entriesByDate = {};
    sortedEntries.forEach(entry => {
        if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
        entriesByDate[entry.date].push(entry);
    });

    // Process dates in order
    Object.keys(entriesByDate).sort().forEach(date => {
        const dayEntries = entriesByDate[date];
        let dailyHoursAcc = 0;
        const dailyLimit = 12; // Daily cap for non-DD/sick modes

        dayEntries.forEach(entry => {
            const mode = entry.mode;
            const rate = entry.hourlyRate || getHourlyRate(mode, entry.clients, baseRate);
            const key = `${mode}_${rate}`;

            if (!breakdownMap[key]) {
                breakdownMap[key] = {
                    mode,
                    rate,
                    regularHours: 0,
                    regularPay: 0,
                    dailyOTHours: 0,
                    dailyOTPay: 0,
                    weeklyOTHours: 0,
                    weeklyOTPay: 0,
                    totalPay: 0,
                    miles: 0,
                    cellPhone: 0
                };
            }

            let entryHours = entry.hours;

            // 1. Apply Daily Cap (except DD and sick)
            if (mode !== 'DD' && mode !== 'sick') {
                const availableInDay = Math.max(0, dailyLimit - dailyHoursAcc);
                entryHours = Math.min(entryHours, availableInDay);
            }

            // 2. Apply Weekly Total Cap (50 hours)
            const availableInWeek = Math.max(0, weeklyHoursRemainingTotal);
            entryHours = Math.min(entryHours, availableInWeek);

            if (entryHours <= 0) return;

            weeklyHoursRemainingTotal -= entryHours;
            breakdownMap[key].miles += (entry.miles || 0);
            breakdownMap[key].cellPhone += (entry.cellPhone || 0);

            // 3. Calculate Daily OT (if applicable)
            let dailyOTPart = 0;
            let nonDailyOTPart = entryHours;

            if (mode !== 'DD' && mode !== 'sick') {
                const hoursBeforeInDay = dailyHoursAcc;
                const hoursAfterInDay = dailyHoursAcc + entryHours;

                if (hoursBeforeInDay >= 9) {
                    dailyOTPart = entryHours;
                    nonDailyOTPart = 0;
                } else if (hoursAfterInDay > 9) {
                    dailyOTPart = hoursAfterInDay - 9;
                    nonDailyOTPart = 9 - hoursBeforeInDay;
                }
            }

            // Attribute Daily OT
            if (dailyOTPart > 0) {
                const otPay = dailyOTPart * (rate * 1.5);
                totalDailyOTPay += otPay;
                totalDailyOTHours += dailyOTPart;
                breakdownMap[key].dailyOTPay += otPay;
                breakdownMap[key].dailyOTHours += dailyOTPart;
            }

            // 4. Attribute Remaining (Non-Daily OT) hours to Regular vs Weekly OT
            if (nonDailyOTPart > 0) {
                const regularPart = Math.min(nonDailyOTPart, weeklyHoursRemainingForRegular);
                const weeklyOTPart = nonDailyOTPart - regularPart;

                if (regularPart > 0) {
                    totalRegularHours += regularPart;
                    weeklyHoursRemainingForRegular -= regularPart;
                    breakdownMap[key].regularHours += regularPart;
                    breakdownMap[key].regularPay += regularPart * rate;
                }

                if (weeklyOTPart > 0) {
                    const wotPay = weeklyOTPart * (rate * 1.5);
                    totalWeeklyOTHours += weeklyOTPart;
                    totalWeeklyOTPay += wotPay;
                    breakdownMap[key].weeklyOTHours += weeklyOTPart;
                    breakdownMap[key].weeklyOTPay += wotPay;
                }
            }

            dailyHoursAcc += entryHours;
        });
    });

    // Finalize totals for each breakdown item
    Object.values(breakdownMap).forEach(item => {
        item.totalPay = item.regularPay + item.dailyOTPay + item.weeklyOTPay;
    });

    const finalRegularPay = Object.values(breakdownMap).reduce((sum, item) => sum + item.regularPay, 0);

    return {
        regularHours: totalRegularHours,
        regularPay: finalRegularPay,
        dailyOTPay: totalDailyOTPay,
        dailyOTHours: totalDailyOTHours,
        weeklyOTPay: totalWeeklyOTPay,
        weeklyOTHours: totalWeeklyOTHours,
        totalPay: finalRegularPay + totalDailyOTPay + totalWeeklyOTPay,
        breakdown: Object.values(breakdownMap)
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
