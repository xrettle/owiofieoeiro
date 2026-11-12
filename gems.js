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
const { sleep } = require('./xp.js');

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

    // Each balanced reward claim awards ~30 gems
    const GEMS_PER_REWARD = 30;
    const totalClaimsNeeded = Math.ceil(targetGems / GEMS_PER_REWARD);
    const headers = getHeaders(token);

    let successfulClaims = 0;
    let estimatedGemsGained = 0;

    for (let i = 0; i < totalClaimsNeeded; i++) {
        const claimNum = i + 1;
        const randomSeed = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        const rewardId = `SKILL_COMPLETION_BALANCED-${randomSeed}-2-GEMS`;

        console.log(`Claiming reward ${claimNum}/${totalClaimsNeeded}...`);

        try {
            await claimGemReward(headers, userId, rewardId, {
                fromLanguage: initialProfile.fromLanguage,
                learningLanguage: initialProfile.learningLanguage
            });

            successfulClaims++;
            estimatedGemsGained += GEMS_PER_REWARD;
            console.log(`   Accepted: +${GEMS_PER_REWARD} gems (${estimatedGemsGained}/${targetGems})`);

            // Pause between claims to avoid rate limits
            if (i < totalClaimsNeeded - 1) {
                await sleep(1200);
            }
        } catch (err) {
            console.warn(`   Warning: Claim ${claimNum} failed: ${err.message}`);
            // Brief backoff before next attempt
            await sleep(2000);
        }
    }

    // Refresh balance to check confirmed total
    console.log(`\nChecking updated gem balance...`);
    await sleep(1500);

    let endingGems = startingGems + estimatedGemsGained;
    try {
        const finalProfile = await getUserInventoryAndGems(token, userId);
        endingGems = finalProfile.gems;
    } catch {
        // Fallback to estimated
    }

    const actualGemsGained = Math.max(0, endingGems - startingGems) || estimatedGemsGained;

    console.log(`\n====================================================`);
    console.log(`Gem addition finished:`);
    console.log(`   Successful Claims: ${successfulClaims}/${totalClaimsNeeded}`);
    console.log(`   Starting Balance:  ${startingGems} gems`);
    console.log(`   Ending Balance:    ${endingGems} gems`);
    console.log(`   Total Gems Gained: +${actualGemsGained} gems`);
    console.log(`====================================================\n`);

    if (successfulClaims === 0) {
        throw new Error('All attempted gem claims failed. Please check your token and account status.');
    }

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
