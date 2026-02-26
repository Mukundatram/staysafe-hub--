/**
 * Roommate Matching Algorithm
 * Implements student-focused matching with hard filters and soft scoring
 */

/**
 * Hard Filters - Profiles must pass ALL of these
 */
function passesHardFilters(userProfile, targetProfile) {
    // 1. City Match
    if (userProfile.city !== targetProfile.city) {
        return { passes: false, reason: 'Different city' };
    }

    // 2. Budget Overlap
    const budgetOverlaps = (
        userProfile.budgetMin <= targetProfile.budgetMax &&
        userProfile.budgetMax >= targetProfile.budgetMin
    );
    if (!budgetOverlaps) {
        return { passes: false, reason: 'Budget mismatch' };
    }

    // 3. Move-in Date Tolerance (within 30 days)
    const daysDiff = Math.abs(
        (new Date(userProfile.expectedMoveInDate) - new Date(targetProfile.expectedMoveInDate))
        / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 30) {
        return { passes: false, reason: 'Move-in dates too far apart' };
    }

    // 4. Gender Preference (if set)
    if (userProfile.genderPreference && userProfile.genderPreference !== 'any') {
        const targetUser = targetProfile.user;
        if (targetUser && targetUser.gender && targetUser.gender !== userProfile.genderPreference) {
            return { passes: false, reason: 'Gender preference mismatch' };
        }
    }

    return { passes: true };
}

/**
 * Lifestyle Compatibility Score (40 points max)
 */
function calculateLifestyleScore(userLifestyle, targetLifestyle) {
    let score = 0;

    // Sleep Schedule (10 pts)
    if (userLifestyle.sleepSchedule === targetLifestyle.sleepSchedule) {
        score += 10;
    } else if (userLifestyle.sleepSchedule === 'flexible' || targetLifestyle.sleepSchedule === 'flexible') {
        score += 7;
    } else {
        score += 0;
    }

    // Food Preference (10 pts)
    if (userLifestyle.foodPreference === targetLifestyle.foodPreference) {
        score += 10;
    } else if (userLifestyle.foodPreference === 'both' || targetLifestyle.foodPreference === 'both') {
        score += 8;
    } else {
        score += 3; // can coexist but not ideal
    }

    // Smoking (10 pts)
    if (userLifestyle.smoking === targetLifestyle.smoking) {
        score += 10;
    } else if ((userLifestyle.smoking === 'no' && targetLifestyle.smoking === 'occasional') ||
        (userLifestyle.smoking === 'occasional' && targetLifestyle.smoking === 'no')) {
        score += 5;
    } else if (userLifestyle.smoking === 'no' || targetLifestyle.smoking === 'no') {
        score += 2; // non-smoker with smoker is problematic
    }

    // Guest Frequency (5 pts)
    const guestLevels = { 'rare': 0, 'sometimes': 1, 'frequent': 2 };
    const guestDiff = Math.abs(guestLevels[userLifestyle.guests] - guestLevels[targetLifestyle.guests]);
    if (guestDiff === 0) {
        score += 5;
    } else if (guestDiff === 1) {
        score += 3;
    } else {
        score += 1;
    }

    // Cleanliness Level (5 pts)
    const cleanLevels = { 'low': 0, 'medium': 1, 'high': 2 };
    const cleanDiff = Math.abs(cleanLevels[userLifestyle.cleanlinessLevel] - cleanLevels[targetLifestyle.cleanlinessLevel]);
    if (cleanDiff === 0) {
        score += 5;
    } else if (cleanDiff === 1) {
        score += 3;
    } else {
        score += 1;
    }

    return Math.min(score, 40); // Cap at 40
}

/**
 * Academic & Schedule Compatibility Score (25 points max)
 */
function calculateAcademicScore(userProfile, targetProfile) {
    let score = 0;

    // Same College (15 pts)
    if (userProfile.college && targetProfile.college) {
        if (userProfile.college.toLowerCase() === targetProfile.college.toLowerCase()) {
            score += 15;
        } else if (userProfile.studentStatus === 'student' && targetProfile.studentStatus === 'student') {
            score += 5; // different colleges but both students in same city
        }
    }

    // Similar Year/Batch (5 pts)
    if (userProfile.year && targetProfile.year) {
        const yearDiff = Math.abs(userProfile.year - targetProfile.year);
        if (yearDiff === 0) {
            score += 5;
        } else if (yearDiff === 1) {
            score += 3;
        } else if (yearDiff === 2) {
            score += 1;
        }
    }

    // Student Status Match (5 pts)
    if (userProfile.studentStatus === targetProfile.studentStatus) {
        score += 5;
    } else {
        score += 2; // different but can work
    }

    return Math.min(score, 25); // Cap at 25
}

/**
 * Interests Overlap Score (20 points max)
 */
function calculateInterestsScore(userInterests = [], targetInterests = []) {
    if (userInterests.length === 0 && targetInterests.length === 0) {
        return 10; // neutral
    }

    if (userInterests.length === 0 || targetInterests.length === 0) {
        return 5; // one person didn't specify
    }

    const commonInterests = userInterests.filter(interest =>
        targetInterests.some(tInt => tInt.toLowerCase() === interest.toLowerCase())
    );

    const maxInterests = Math.max(userInterests.length, targetInterests.length);
    const overlapRatio = commonInterests.length / maxInterests;

    return Math.round(overlapRatio * 20);
}

/**
 * Calculate Student Bonuses (max 13 points total)
 */
function calculateBonuses(userProfile, targetProfile, targetUser) {
    let bonus = 0;

    // Same College Bonus
    if (userProfile.college && targetProfile.college &&
        userProfile.college.toLowerCase() === targetProfile.college.toLowerCase()) {
        bonus += 5;
    }

    // Same Academic Year Bonus
    if (userProfile.year && targetProfile.year && userProfile.year === targetProfile.year) {
        bonus += 3;
    }

    // Both Verified Students Bonus
    if (targetUser && targetUser.isVerified) {
        bonus += 5;
    }

    return bonus;
}

/**
 * Generate match explanation based on scores and data
 */
function generateMatchExplanation(matchData) {
    const reasons = [];

    if (matchData.sameCollege) {
        reasons.push("Same college");
    }

    if (matchData.lifestyleScore >= 30) {
        reasons.push("Similar lifestyle");
    }

    if (matchData.academicScore >= 20) {
        reasons.push("Similar routine");
    }

    if (matchData.commonInterestsCount >= 3) {
        reasons.push(`${matchData.commonInterestsCount} shared interests`);
    }

    if (matchData.budgetAligned) {
        reasons.push("Budget aligned");
    }

    if (matchData.sameMoveInMonth) {
        reasons.push("Same move-in timeframe");
    }

    // Return top 2 reasons
    return reasons.slice(0, 2).join(", ") || "Compatible preferences";
}

/**
 * Main matching function
 * @param {Object} userProfile - Current user's roommate profile
 * @param {Object} targetProfile - Target user's roommate profile (with populated user)
 * @returns {Object} Match result with score and explanation
 */
function calculateMatch(userProfile, targetProfile) {
    // Check hard filters first
    const filterResult = passesHardFilters(userProfile, targetProfile);
    if (!filterResult.passes) {
        return {
            matches: false,
            reason: filterResult.reason,
            score: 0
        };
    }

    // Calculate soft scores
    const lifestyleScore = calculateLifestyleScore(
        userProfile.lifestyle,
        targetProfile.lifestyle
    );

    const academicScore = calculateAcademicScore(userProfile, targetProfile);

    const interestsScore = calculateInterestsScore(
        userProfile.interests,
        targetProfile.interests
    );

    // Calculate bonuses
    const bonusScore = calculateBonuses(
        userProfile,
        targetProfile,
        targetProfile.user
    );

    // Total score (capped at 100)
    const totalScore = Math.min(
        lifestyleScore + academicScore + interestsScore + bonusScore,
        100
    );

    // Build match data for explanation
    const commonInterests = (userProfile.interests || []).filter(interest =>
        (targetProfile.interests || []).some(tInt => tInt.toLowerCase() === interest.toLowerCase())
    );

    const matchData = {
        sameCollege: userProfile.college && targetProfile.college &&
            userProfile.college.toLowerCase() === targetProfile.college.toLowerCase(),
        lifestyleScore,
        academicScore,
        commonInterestsCount: commonInterests.length,
        budgetAligned: true, // passed hard filter
        sameMoveInMonth: Math.abs(
            new Date(userProfile.expectedMoveInDate).getMonth() -
            new Date(targetProfile.expectedMoveInDate).getMonth()
        ) === 0
    };

    const explanation = generateMatchExplanation(matchData);

    return {
        matches: true,
        score: Math.round(totalScore),
        breakdown: {
            lifestyle: lifestyleScore,
            academic: academicScore,
            interests: interestsScore,
            bonus: bonusScore
        },
        explanation,
        commonInterests
    };
}

module.exports = {
    calculateMatch,
    passesHardFilters,
    calculateLifestyleScore,
    calculateAcademicScore,
    calculateInterestsScore,
    calculateBonuses,
    generateMatchExplanation
};
