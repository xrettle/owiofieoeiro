/**
 * Duolingo Streak Freeze Equipper & Refill
 *
 * Equips custom amounts of Streak Freezes onto your Duolingo account
 * so your streak stays protected if you miss days.
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
    console.log(`❄️ Duolingo Streak Freeze Equipper`);
    console.log(`====================================================`);

    console.log(`🔄 Inspecting user inventory and active freeze protection...`);
    const initial = await getUserInventoryAndGems(token, userId);
    const startingFreezes = initial.totalFreezes;

    console.log(`👤 User: ${initial.username} (ID: ${initial.userId})`);
    console.log(`🔥 Current Streak: ${initial.streak} days`);
    console.log(`❄️ Current Equipped Freezes: ${startingFreezes} (${initial.regularFreezes} standard, ${initial.societyFreezes} society)`);
    console.log(`🎯 Requested Freezes to Add: ${targetCount}`);
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

        console.log(`▶️ Equipping streak freeze ${itemNum}/${targetCount}...`);

        for (const itemName of itemCandidates) {
            try {
                await purchaseShopItem(headers, userId, itemName, {
                    fromLanguage: initial.fromLanguage,
                    learningLanguage: initial.learningLanguage
                }, { isFree: true, fallbackPaid: true });

                success = true;
                acquiredCount++;
                console.log(`   ✓ Successfully equipped freeze via '${itemName}'!`);
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
            console.log(`\nℹ️ Maximum freeze capacity reached for this account tier.`);
            console.log(`   (Standard accounts can hold up to 2 freezes; Streak Society holds up to 5).`);
            break;
        }

        if (!success && lastError) {
            console.warn(`   ⚠️ Could not acquire freeze ${itemNum}: ${lastError.message}`);
        }

        if (i < targetCount - 1 && !hitCapacityLimit) {
            await sleep(1000);
        }
    }

    // Refresh inventory to verify confirmed equipped count
    console.log(`\n🔄 Verifying updated inventory from Duolingo...`);
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
    console.log(`🏁 Streak Freeze Operation Completed:`);
    console.log(`   Starting Freezes:  ${startingFreezes} ❄️`);
    console.log(`   Ending Freezes:    ${endingFreezes} ❄️`);
    console.log(`   Freezes Acquired:  +${actualGained} ❄️`);
    if (endingFreezes > 0) {
        console.log(`🛡️ Your streak is now safely protected for up to ${endingFreezes} missed day(s)!`);
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
        console.error(`\n❌ Error during streak freeze addition: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    addStreakFreezes,
    main
};
