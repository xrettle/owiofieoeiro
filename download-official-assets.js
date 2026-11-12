/**
 * Downloads official Duolingo graphic assets directly from Duolingo CloudFront CDN and Fandom Wiki.
 * Saves each official asset into public/assets/items/<id>.svg or .png
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ITEMS_DIR = path.join(__dirname, 'public', 'assets', 'items');
if (!fs.existsSync(ITEMS_DIR)) {
    fs.mkdirSync(ITEMS_DIR, { recursive: true });
}

// Map each of the 58 catalog items to its authentic, official Duolingo asset URL
const OFFICIAL_ASSETS = {
    // === Avatars & Outfits ===
    // Official Duolingo Outfits from Duolingo Wiki Archive
    'outfit_formal': 'https://static.wikia.nocookie.net/duolingo/images/7/7b/Duo_fancy.svg',
    'outfit_gold': 'https://static.wikia.nocookie.net/duolingo/images/2/2d/Duo_tracksuit.svg',
    'outfit_sport': 'https://static.wikia.nocookie.net/duolingo/images/6/60/Duo_tracksuit_old.svg',
    'outfit_super': 'https://static.wikia.nocookie.net/duolingo/images/c/c1/Duo_superhero.svg',
    'avatar_skin_hot_dog': 'https://static.wikia.nocookie.net/duolingo/images/7/76/Duo_dragon.svg',
    'avatar_skin_cat': 'https://static.wikia.nocookie.net/duolingo/images/a/ac/Duo_proper_old.svg',
    'avatar_skin_dead_duo': 'https://static.wikia.nocookie.net/duolingo/images/1/1a/Duo_ghost.png',
    'avatar_skin_toy_hunt_grand_prize': 'https://static.wikia.nocookie.net/duolingo/images/0/05/Duo-plushfront_2048x.webp',
    'avatar_skin_halloween_duo': 'https://static.wikia.nocookie.net/duolingo/images/6/65/Duo_Scared.jpg',
    'avatar_skin_winter_frost': 'https://static.wikia.nocookie.net/duolingo/images/6/6f/Duo_legendary.svg',
    'avatar_skin_space_duo': 'https://static.wikia.nocookie.net/duolingo/images/3/36/Duo_Usagi_Blue_Bunny_wiki_edit.png',
    'avatar_skin_chef_duo': 'https://static.wikia.nocookie.net/duolingo/images/3/32/Duo_Teacher.svg',
    'avatar_skin_wizard_duo': 'https://static.wikia.nocookie.net/duolingo/images/a/ae/Duo_nerd.svg',
    'avatar_skin_streetwear': 'https://static.wikia.nocookie.net/duolingo/images/c/c4/Duo_headphones.svg',

    // === Country Tournament Suits (Official Duolingo National Country Badges) ===
    'avatar_skin_world_cup_br': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/09a994941090eb35d48f08112eb283c7.png',
    'avatar_skin_world_cup_ar': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/b7057dea74f1a786f0662c32f0d9981c.png',
    'avatar_skin_world_cup_fr': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/12c5fe127889a21e9f4a9349f7b0cba0.png',
    'avatar_skin_world_cup_de': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/07425aa9ddd7bbf290da7a8e586f6818.png',
    'avatar_skin_world_cup_es': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/88f06f3d23c07f0e70d7db5b711700ae.png',
    'avatar_skin_world_cup_us': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/9e5c0b52826e730f587b753cd289ec75.png',
    'avatar_skin_world_cup_gb': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/1dd02cb7630c14206d379d9fb3570a71.png',
    'avatar_skin_world_cup_jp': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/810f971ee7c55957c03f5f17db3269cd.png',
    'avatar_skin_world_cup_mx': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/42424258cded1f74ba211058e1fa2cd3.png',
    'avatar_skin_world_cup_it': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/57429e34d7cf8679888b8e45a6aab9c1.png',
    'avatar_skin_world_cup_ca': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/91621bf347caa5965099fe07a5cae38b.png',
    'avatar_skin_world_cup_kr': 'https://d35aaqx5ub95lt.cloudfront.net/images/weeklyReport/canvas-flag/8a9b25daff214c585d3feaef4d138e5d.png',

    // === Banners, Titles & Badges ===
    'badge_diamond_tournament_winner': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/a35f1db4398fd29e66f1abc33a0d11a2.svg',
    'badge_diamond_league_first': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/6df6337370e45c1b9a5029e78211d114.svg',
    'title_chess_grandmaster_king': 'https://d35aaqx5ub95lt.cloudfront.net/images/chess/landing/0ab9430adabf092ed405e54dc63a07f9.svg',
    'title_chess_grandmaster_queen': 'https://d35aaqx5ub95lt.cloudfront.net/images/chess/landing/95629db175e58e3172ba7798d432320d.svg',
    'badge_chess_knight': 'https://d35aaqx5ub95lt.cloudfront.net/images/chess/landing/2001a72b6d19fe9df0d463b3eb71a3e0.svg',
    'badge_streak_society_365': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakSociety/7cd02f71125bf37f4ebdb201388e753b.svg',
    'badge_streak_society_500': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakSociety/abef957908201371d24f83f3a6b3b50e.svg',
    'badge_streak_society_1000': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakSociety/9d032d088a93113e4c8315bab3be6af6.svg',
    'badge_wildfire_champion': 'https://d35aaqx5ub95lt.cloudfront.net/images/achievements/4055e0dc10275f9597f53f9dca6df5e4.svg',
    'badge_sharpshooter_master': 'https://d35aaqx5ub95lt.cloudfront.net/images/achievements/c2b4bc98d8229b08fd45e85087868c24.svg',
    'badge_speed_racer': 'https://d35aaqx5ub95lt.cloudfront.net/images/achievements/f82ec78dd3c15dea85ae4c6a8e028a37.svg',
    'badge_friend_quest_champion': 'https://d35aaqx5ub95lt.cloudfront.net/images/achievements/a7018d3f4a89422f851e65a983ac94a8.svg',

    // === Streak Protection & Boosters ===
    'streak_freeze': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakRevival/4d0643ea8d96761f4d2a84020bdec380.svg',
    'streak_freeze_pack': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakRevival/4d0643ea8d96761f4d2a84020bdec380.svg',
    'streak_society_shield': 'https://d35aaqx5ub95lt.cloudfront.net/images/streakRevival/82ec7916987b6a3331e688af6b93362c.svg',
    'heart_refill_full': 'https://d35aaqx5ub95lt.cloudfront.net/images/hearts/4f3842c690acf9bf0d4b06e6ab2fffcf.svg',
    'unlimited_hearts_pass': 'https://d35aaqx5ub95lt.cloudfront.net/images/hearts/e88ae1259cc55c279da4650952269a7b.svg',
    'weekend_amulet': 'https://d35aaqx5ub95lt.cloudfront.net/images/achievements/b0cb74a6e8beeb4e0f2399b331dfbe57.svg',
    'double_or_nothing_wager': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/45c14e05be9c1af1d7d0b54c6eed7eee.svg',
    'early_bird_boost_15m': 'https://d35aaqx5ub95lt.cloudfront.net/images/crowns/b3ede3d53c932ee30d981064671c8032.svg',
    'night_owl_boost_15m': 'https://d35aaqx5ub95lt.cloudfront.net/images/crowns/95b67fdecc0e8415076d199f19c4f8d7.svg',
    'timer_boost_extra': 'https://d35aaqx5ub95lt.cloudfront.net/images/super/257e4c30093aa4a44143af7c0b52a92b.svg',

    // === Chests & Reward Drops ===
    'early_bird_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/33b35ed687f7caabe24c79829a1b98a3.svg',
    'night_owl_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/33b35ed687f7caabe24c79829a1b98a3.svg',
    'free_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/45c14e05be9c1af1d7d0b54c6eed7eee.svg',
    'friends_quest_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/33b35ed687f7caabe24c79829a1b98a3.svg',
    'monthly_challenge_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/gems/81f3a296e215c820133be60f7d445f26.svg',
    'diamond_league_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/6df6337370e45c1b9a5029e78211d114.svg',
    'obsidian_league_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/573de2bc90b2499eeb2b3738cff90133.svg',
    'emerald_league_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/535fc27de224cc7d311dbb5de4f33be6.svg',
    'ruby_league_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/6b8a8db5ac7f847e7e87efe97c8b451a.svg',
    'sapphire_league_chest': 'https://d35aaqx5ub95lt.cloudfront.net/images/leagues/a8e5c18e80054228b2c61168846ff643.svg'
};

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://duolingo.fandom.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }

            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            }

            const chunks = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
        req.on('error', reject);
    });
}

async function main() {
    console.log(`Starting official asset download for ${Object.keys(OFFICIAL_ASSETS).length} items...`);
    let successCount = 0;

    for (const [id, url] of Object.entries(OFFICIAL_ASSETS)) {
        try {
            const ext = url.split('?')[0].split('.').pop() || 'svg';
            const filename = `${id}.${ext}`;
            const targetPath = path.join(ITEMS_DIR, filename);

            const buffer = await downloadFile(url);
            fs.writeFileSync(targetPath, buffer);
            console.log(`✓ [${id}] -> ${filename} (${buffer.length} bytes)`);
            successCount++;
        } catch (err) {
            console.error(`✗ [${id}] Error downloading ${url}:`, err.message);
        }
    }

    console.log(`\nDownloaded ${successCount} / ${Object.keys(OFFICIAL_ASSETS).length} official Duolingo assets successfully.`);
}

main().catch(console.error);
