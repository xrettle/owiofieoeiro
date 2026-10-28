/**
 * Duolingo Unlimited Hearts Script
 */

const { getUserLanguages, getCredentials, getHeaders, fetch } = require('./helper.js');

(async () => {
    try {
        const { token } = getCredentials();
        if (!token) {
            console.error('❌ Error: Duolingo auth token (TOKEN) is required.');
            process.exit(1);
        }

        console.log('🔄 Fetching user account information...');
        const userInfo = await getUserLanguages();
        console.log(`👤 User: ${userInfo.username} (ID: ${userInfo.userId})`);
        console.log(`🔥 Current Streak: ${userInfo.streak} days`);
        console.log(`📚 Active Course: ${userInfo.learningLanguage} (from ${userInfo.fromLanguage})`);

        const parsedLearningLanguage = (userInfo.learningLanguage === userInfo.fromLanguage)
            ? (userInfo.learningLanguage === 'fr' ? 'en' : 'fr')
            : userInfo.learningLanguage;

        console.log('\n🔄 Contacting Duolingo Schools API to create classroom...');
        const headers = getHeaders(token);
        const res = await fetch("https://schools.duolingo.com/api/2/classrooms", {
            headers,
            method: "POST",
            body: JSON.stringify({
                classrooms: [{
                    from_language: userInfo.fromLanguage,
                    learning_language: parsedLearningLanguage,
                    name: "Unlimited Hearts (Do not delete)"
                }]
            })
        });

        const text = await res.text();
        let json = null;
        try {
            json = JSON.parse(text);
        } catch {
            // Not JSON
        }

        if (res.ok) {
            console.log("🎉 Success! Classroom created successfully.");
            console.log("👉 To enable unlimited hearts: Open the Duolingo app/website, click on your hearts icon, and toggle on 'Unlimited Hearts'!");
            return;
        }

        const errorMsg = json?.error || json?.message || text;
        if (errorMsg.includes('Classroom already exists') || errorMsg.includes('already exists')) {
            console.log("ℹ️ Note: A classroom already exists for your account. This benefit is already active!");
            console.log("👉 Go to Duolingo, click on your hearts icon, and make sure 'Unlimited Hearts' is turned on.");
        } else if (res.status === 403 || res.status === 410 || errorMsg.includes('discontinued') || errorMsg.includes('sunset')) {
            console.log(`⚠️ Notice: Duolingo Schools API returned status ${res.status}: ${errorMsg}`);
            console.log("Duolingo has restricted new classroom creation for certain accounts in recent updates.");
        } else {
            console.error(`❌ Duolingo Schools API returned error (HTTP ${res.status}): ${errorMsg}`);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
})();
