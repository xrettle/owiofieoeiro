/**
 * Duolingo Streak Freeze Script
 *
 * Adds a custom number of streak freezes to your Duolingo account.
 */

const {
    getCredentials,
    getHeaders,
    getUserInventoryAndGems,
    purchaseShopItem
} = require('./helper.js');
const { sleep } = require('./xp.js');

/**
 * Equips or refills streak freezes for the user's Duolingo account
 *
 * @param {number|string} customCount Number of streak freezes to add (default: 2)
 * @returns {Promise<{ startingFreezes: number, endingFreezes: number, added: number }>}
 */
async function addStreakFreezes(customCount = 2) {
    const targetCount = Math.max(1, parseInt(customCount, 10) || 2);
    const { token, userId } = getCredentials();

    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required.');
    }

    console.log(`====================================================`);
    console.log(`Duolingo Streak Freezes`);
    console.log(`====================================================`);

    console.log(`Checking inventory and current freezes...`);
    const initial = await getUserInventoryAndGems(token, userId);
    const startingFreezes = initial.totalFreezes;

    console.log(`User: ${initial.username} (ID: ${initial.userId})`);
    console.log(`Current Streak: ${initial.streak} days`);
    console.log(`Equipped Freezes: ${startingFreezes} (${initial.regularFreezes} standard, ${initial.societyFreezes} society)`);
    console.log(`Requested Freezes to Add: ${targetCount}`);
    console.log(`====================================================\n`);

    const headers = getHeaders(token);
    const itemCandidates = [
        'streak_freeze',
        'society_streak_freeze',
        'society_streak_freeze_refill'
    ];

    let acquiredCount = 0;
    let hitCapacityLimit = false;

    for (let i = 0; i < targetCount; i++) {
        const itemNum = i + 1;
        let success = false;
        let lastError = null;

        console.log(`Adding streak freeze ${itemNum}/${targetCount}...`);

        for (const itemName of itemCandidates) {
            try {
                await purchaseShopItem(headers, userId, itemName, {
                    fromLanguage: initial.fromLanguage,
                    learningLanguage: initial.learningLanguage
                }, { isFree: true, fallbackPaid: true });

                success = true;
                acquiredCount++;
                console.log(`   Added freeze using '${itemName}'`);
                break;
            } catch (err) {
                lastError = err;
                const errMsg = err.message.toLowerCase();
                // Check if user already holds maximum allowed freezes for their account tier
                if (errMsg.includes('already') || errMsg.includes('max') || errMsg.includes('limit') || errMsg.includes('full')) {
                    hitCapacityLimit = true;
                    break;
                }
            }
        }

        if (hitCapacityLimit) {
            console.log(`\nNote: Account freeze limit reached.`);
            console.log(`   (Standard accounts hold up to 2 freezes; Streak Society holds up to 5.)`);
            break;
        }

        if (!success && lastError) {
            console.warn(`   Warning: Could not add freeze ${itemNum}: ${lastError.message}`);
        }

        if (i < targetCount - 1 && !hitCapacityLimit) {
            await sleep(1000);
        }
    }

    // Refresh inventory to verify confirmed equipped count
    console.log(`\nChecking updated inventory...`);
    await sleep(1200);

    let endingFreezes = startingFreezes + acquiredCount;
    let finalProfile = null;
    try {
        finalProfile = await getUserInventoryAndGems(token, userId);
        endingFreezes = finalProfile.totalFreezes;
    } catch {
        // Fallback to estimated
    }

    const actualGained = Math.max(0, endingFreezes - startingFreezes) || acquiredCount;

    console.log(`\n====================================================`);
    console.log(`Streak freeze run finished:`);
    console.log(`   Starting Freezes:  ${startingFreezes}`);
    console.log(`   Ending Freezes:    ${endingFreezes}`);
    console.log(`   Freezes Added:     +${actualGained}`);
    if (endingFreezes > 0) {
        console.log(`Your streak has ${endingFreezes} freeze(s) ready for missed days.`);
    }
    console.log(`====================================================\n`);

    return {
        startingFreezes,
        endingFreezes,
        added: actualGained
    };
}

const main = async () => {
    const rawCount = process.env.FREEZES || process.env.AMOUNT || process.env.COUNT || process.argv[2] || 2;
    await addStreakFreezes(rawCount);
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\nError adding streak freezes: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    addStreakFreezes,
    main
};
