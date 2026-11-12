/**
 * Duolingo Gems Script
 *
 * Adds a custom number of gems to your Duolingo account by claiming
 * skill completion rewards in sequence.
 */

const {
    getCredentials,
    getHeaders,
    getUserInventoryAndGems,
    claimGemReward
} = require('./helper.js');
const { completeLessons, sleep } = require('./xp.js');

/**
 * Adds a custom amount of gems to the user's Duolingo account
 *
 * @param {number|string} customAmount Number of gems to add (default: 300)
 * @returns {Promise<{ startingGems: number, endingGems: number, gemsAdded: number }>}
 */
async function addGems(customAmount = 300) {
    const targetGems = Math.max(30, parseInt(customAmount, 10) || 300);
    const { token, userId } = getCredentials();

    if (!token) {
        throw new Error('Duolingo auth token (TOKEN) is required.');
    }

    console.log(`====================================================`);
    console.log(`Duolingo Gems`);
    console.log(`====================================================`);

    console.log(`Fetching user profile and gem balance...`);
    const initialProfile = await getUserInventoryAndGems(token, userId);
    const startingGems = initialProfile.gems;

    console.log(`User: ${initialProfile.username} (ID: ${initialProfile.userId})`);
    console.log(`Current Balance: ${startingGems} Gems`);
    console.log(`Target Gems to Add: +${targetGems} Gems`);
    console.log(`====================================================\n`);

    const headers = getHeaders(token);
    let successfulClaims = 0;

    // STEP 1: Claim any unconsumed / pending rewards on the user's account
    if (initialProfile.pendingRewards && initialProfile.pendingRewards.length > 0) {
        console.log(`Found ${initialProfile.pendingRewards.length} pending reward(s) on your account. Claiming...`);
        for (const reward of initialProfile.pendingRewards) {
            try {
                await claimGemReward(headers, userId, reward.id, {
                    fromLanguage: initialProfile.fromLanguage,
                    learningLanguage: initialProfile.learningLanguage
                });
                successfulClaims++;
                console.log(`   Claimed pending reward: ${reward.id}`);
                await sleep(1000);
            } catch (err) {
                console.warn(`   Could not claim pending reward ${reward.id}: ${err.message}`);
            }
        }
    }

    // Refresh balance after claiming pending rewards
    let currentProfile = await getUserInventoryAndGems(token, userId);
    let gemsGainedSoFar = currentProfile.gems - startingGems;

    // STEP 2: Attempt direct balanced reward claims
    if (gemsGainedSoFar < targetGems) {
        const remainingNeeded = targetGems - gemsGainedSoFar;
        const GEMS_PER_REWARD = 30;
        const totalClaimsNeeded = Math.ceil(remainingNeeded / GEMS_PER_REWARD);

        console.log(`\nAttempting direct reward claims for remaining +${remainingNeeded} gems (${totalClaimsNeeded} claims)...`);

        for (let i = 0; i < totalClaimsNeeded; i++) {
            const claimNum = i + 1;
            const randomSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
            const rewardId = `SKILL_COMPLETION_BALANCED-${randomSeed}-2-GEMS`;

            try {
                await claimGemReward(headers, userId, rewardId, {
                    fromLanguage: initialProfile.fromLanguage,
                    learningLanguage: initialProfile.learningLanguage
                });

                successfulClaims++;
                gemsGainedSoFar += GEMS_PER_REWARD;
                console.log(`   Accepted claim ${claimNum}/${totalClaimsNeeded}: +${GEMS_PER_REWARD} gems`);

                if (i < totalClaimsNeeded - 1) {
                    await sleep(1200);
                }
            } catch (err) {
                console.warn(`   Direct reward claim not accepted by server (${err.message}).`);
                // Stop direct claim attempts early if server doesn't accept arbitrary seeds
                break;
            }
        }
    }

    // Refresh balance after direct claims
    currentProfile = await getUserInventoryAndGems(token, userId);
    gemsGainedSoFar = currentProfile.gems - startingGems;

    // STEP 3: If still below target, complete practice lessons to generate gems & reward chests
    if (gemsGainedSoFar < targetGems) {
        const remainingToEarn = targetGems - gemsGainedSoFar;
        const lessonsToRun = Math.min(8, Math.max(1, Math.ceil(remainingToEarn / 30)));
        console.log(`\nCompleting ${lessonsToRun} practice lesson(s) to earn gems and generate reward drops...`);

        try {
            await completeLessons(lessonsToRun);

            // Re-check inventory for newly unlocked rewards
            await sleep(1500);
            const afterPractice = await getUserInventoryAndGems(token, userId);
            if (afterPractice.pendingRewards && afterPractice.pendingRewards.length > 0) {
                console.log(`Claiming ${afterPractice.pendingRewards.length} new reward(s) unlocked from practice...`);
                for (const reward of afterPractice.pendingRewards) {
                    try {
                        await claimGemReward(headers, userId, reward.id, {
                            fromLanguage: initialProfile.fromLanguage,
                            learningLanguage: initialProfile.learningLanguage
                        });
                        successfulClaims++;
                        console.log(`   Claimed: ${reward.id}`);
                        await sleep(1000);
                    } catch {
                        // ignore individual claim errors
                    }
                }
            }
        } catch (practiceErr) {
            console.warn(`Practice lesson note: ${practiceErr.message}`);
        }
    }

    // Verify confirmed total
    console.log(`\nVerifying updated gem balance...`);
    await sleep(1500);

    let endingGems = startingGems;
    try {
        const finalProfile = await getUserInventoryAndGems(token, userId);
        endingGems = finalProfile.gems;
    } catch {
        endingGems = startingGems + gemsGainedSoFar;
    }

    const actualGemsGained = Math.max(0, endingGems - startingGems);

    console.log(`\n====================================================`);
    console.log(`Gem addition finished:`);
    console.log(`   Successful Claims: ${successfulClaims}`);
    console.log(`   Starting Balance:  ${startingGems} gems`);
    console.log(`   Ending Balance:    ${endingGems} gems`);
    console.log(`   Total Gems Gained: +${actualGemsGained} gems`);
    console.log(`====================================================\n`);

    return {
        startingGems,
        endingGems,
        gemsAdded: actualGemsGained
    };
}

const main = async () => {
    const rawAmount = process.env.GEMS || process.env.AMOUNT || process.env.GEMS_TO_ADD || process.argv[2] || 300;
    await addGems(rawAmount);
};

if (require.main === module) {
    main().catch(err => {
        console.error(`\nError adding gems: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    addGems,
    main
};
