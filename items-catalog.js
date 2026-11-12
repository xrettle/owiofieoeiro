/**
 * Duolingo Extra Items Catalog
 *
 * Detailed catalog of avatars, country suits, tournament banners,
 * badges, streak freezes, and special chests.
 */

const ITEMS_CATALOG = [
    // ----------------------------------------------------
    // 1. AVATAR SKINS & CHARACTERS
    // ----------------------------------------------------
    {
        id: 'avatar_skin_hot_dog',
        name: 'Hot Dog Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_FIRST-{seed}-avatar_skin_hot_dog',
        shopName: 'avatar_skin_hot_dog',
        icon: '🌭',
        tag: 'Legendary Skin',
        description: 'Duo dressed in a full hot dog bun with mustard drip. An iconic community favorite.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_cat',
        name: 'Feline Duo (Cat)',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_SECOND-{seed}-avatar_skin_cat',
        shopName: 'avatar_skin_cat',
        icon: '🐱',
        tag: 'Epic Skin',
        description: 'Duo equipped with cat ears and whiskers, purring as you complete lessons.',
        rarity: 'Epic'
    },
    {
        id: 'avatar_skin_dead_duo',
        name: 'Ghost Duo (Dead Duo)',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_THIRD-{seed}-avatar_skin_dead_duo',
        shopName: 'avatar_skin_dead_duo',
        icon: '👻',
        tag: 'Mythic Skin',
        description: 'Spooky ghostly Duo hovering with ethereal glow. Never let your streak die.',
        rarity: 'Mythic'
    },
    {
        id: 'avatar_skin_toy_hunt_grand_prize',
        name: 'Toy Hunt Grand Champion',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKIN_SHARD_COLLECTION-{seed}-avatar_skin_toy_hunt_grand_prize',
        shopName: 'avatar_skin_toy_hunt_grand_prize',
        icon: '🧸',
        tag: 'Grand Prize',
        description: 'Exclusive collectible skin awarded for assembling all 6 Toy Hunt puzzle shards.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_halloween_2026_grand_prize',
        name: 'Halloween Night Terror',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_RECURRING_SKIN_COLLECTION-{seed}-avatar_skin_halloween_2026_grand_prize',
        shopName: 'avatar_skin_halloween_2026_grand_prize',
        icon: '🎃',
        tag: 'Seasonal Special',
        description: 'Jack-o-lantern clad Duo with glowing pumpkin armor and sinister grin.',
        rarity: 'Epic'
    },
    {
        id: 'avatar_skin_winter_2026_grand_prize',
        name: 'Frost Owl (Winter Frost)',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_RECURRING_SKIN_COLLECTION-{seed}-avatar_skin_winter_2026_grand_prize',
        shopName: 'avatar_skin_winter_2026_grand_prize',
        icon: '❄️',
        tag: 'Seasonal Special',
        description: 'Crystalline ice feathers and frost crown forged from winter streak triumphs.',
        rarity: 'Epic'
    },

    // ----------------------------------------------------
    // 2. WORLD CUP COUNTRY SUITS
    // ----------------------------------------------------
    {
        id: 'avatar_skin_world_cup_br',
        name: 'Team Brazil Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_br',
        shopName: 'avatar_skin_world_cup_br',
        icon: '🇧🇷',
        tag: 'Country Jersey',
        description: 'Canarinho yellow & green national jersey with championship crest.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_ar',
        name: 'Team Argentina Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_ar',
        shopName: 'avatar_skin_world_cup_ar',
        icon: '🇦🇷',
        tag: 'Country Jersey',
        description: 'Albiceleste sky blue and white striped world champions kit.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_us',
        name: 'Team USA Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_us',
        shopName: 'avatar_skin_world_cup_us',
        icon: '🇺🇸',
        tag: 'Country Jersey',
        description: 'Stars & Stripes athletic jersey with bold navy and crimson trims.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_fr',
        name: 'Team France Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_fr',
        shopName: 'avatar_skin_world_cup_fr',
        icon: '🇫🇷',
        tag: 'Country Jersey',
        description: 'Les Bleus royal navy jersey with gold rooster emblem.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_de',
        name: 'Team Germany Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_de',
        shopName: 'avatar_skin_world_cup_de',
        icon: '🇩🇪',
        tag: 'Country Jersey',
        description: 'Classic monochrome Die Mannschaft home kit with eagle crest.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_es',
        name: 'Team Spain Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_es',
        shopName: 'avatar_skin_world_cup_es',
        icon: '🇪🇸',
        tag: 'Country Jersey',
        description: 'La Roja fiery red and gold jersey celebrating Spanish football.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_jp',
        name: 'Team Japan Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_jp',
        shopName: 'avatar_skin_world_cup_jp',
        icon: '🇯🇵',
        tag: 'Country Jersey',
        description: 'Samurai Blue kit with origami falcon graphics.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_kr',
        name: 'Team South Korea Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_kr',
        shopName: 'avatar_skin_world_cup_kr',
        icon: '🇰🇷',
        tag: 'Country Jersey',
        description: 'Taegeuk Warriors striking red and pink lightning jersey.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_gb_eng',
        name: 'Team England Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_gb_eng',
        shopName: 'avatar_skin_world_cup_gb_eng',
        icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        tag: 'Country Jersey',
        description: 'Three Lions pure white kit with sky blue shoulder accents.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_mx',
        name: 'Team Mexico Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_mx',
        shopName: 'avatar_skin_world_cup_mx',
        icon: '🇲🇽',
        tag: 'Country Jersey',
        description: 'El Tri deep emerald jersey featuring Mesoamerican eagle feather patterns.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_ca',
        name: 'Team Canada Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_ca',
        shopName: 'avatar_skin_world_cup_ca',
        icon: '🇨🇦',
        tag: 'Country Jersey',
        description: 'Maple Leaf red and crisp white kit for the Canadian northern squad.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_it',
        name: 'Team Italy Suit',
        category: 'suits',
        type: 'AVATAR_SKIN',
        rewardPattern: 'WORLD_CUP_SUITS-{seed}-avatar_skin_world_cup_it',
        shopName: 'avatar_skin_world_cup_it',
        icon: '🇮🇹',
        tag: 'Country Jersey',
        description: 'Gli Azzurri Mediterranean blue kit with Renaissance patterned filigree.',
        rarity: 'Rare'
    },

    // ----------------------------------------------------
    // 3. SPECIAL BANNERS, BADGES & TROPHIES
    // ----------------------------------------------------
    {
        id: 'diamond_tournament_winner',
        name: 'Diamond Tournament Champion Banner',
        category: 'banners',
        type: 'TOURNAMENT_BANNER',
        rewardPattern: 'DIAMOND_TOURNAMENT_WINNER_REWARD-{seed}-CURRENCY_BUNDLE-GEMS',
        shopName: 'diamond_tournament_winner',
        icon: '💎',
        tag: 'Diamond League',
        description: 'The premier competitive accolade in Duolingo. Crowned Diamond Tournament Winner.',
        rarity: 'Mythic'
    },
    {
        id: 'chess_grandmaster_king',
        name: 'Chess Grandmaster (King Rank)',
        category: 'banners',
        type: 'CHESS_BADGE',
        rewardPattern: 'CHESS_MATCH_SEASON_RANK_REWARD-{seed}-KING',
        shopName: 'chess_match_king',
        icon: '👑',
        tag: 'Chess Collaboration',
        description: 'Chess.com x Duolingo King rank badge. Marks supreme tactical mastery.',
        rarity: 'Legendary'
    },
    {
        id: 'chess_queen_rank',
        name: 'Chess Master (Queen Rank)',
        category: 'banners',
        type: 'CHESS_BADGE',
        rewardPattern: 'CHESS_MATCH_SEASON_RANK_REWARD-{seed}-QUEEN',
        shopName: 'chess_match_queen',
        icon: '👸',
        tag: 'Chess Collaboration',
        description: 'The most versatile piece on the board. Season Queen rank badge.',
        rarity: 'Epic'
    },
    {
        id: 'monthly_bonus_trophy',
        name: 'Monthly Challenge Grand Trophy',
        category: 'banners',
        type: 'CHALLENGE_TROPHY',
        rewardPattern: 'MONTHLY_BONUS_CHALLENGE-{seed}-CURRENCY_BUNDLE-GEMS',
        shopName: 'monthly_bonus_challenge',
        icon: '🏅',
        tag: 'Monthly Badge',
        description: 'Complete 30/30 monthly quest milestones and receive the golden challenge medal.',
        rarity: 'Epic'
    },
    {
        id: 'year_in_review_badge',
        name: 'Year in Review Elite Finisher',
        category: 'banners',
        type: 'ANNUAL_BADGE',
        rewardPattern: 'YEAR_IN_REVIEW_SHARING_REWARD-{seed}-CURRENCY_BUNDLE-GEMS',
        shopName: 'year_in_review_sharing',
        icon: '🎆',
        tag: 'Milestone Badge',
        description: 'Annual global learner recap badge showcasing annual learning dedication.',
        rarity: 'Rare'
    },

    // ----------------------------------------------------
    // 4. STREAK FREEZES & PROTECTION ITEMS
    // ----------------------------------------------------
    {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'streak_freeze',
        icon: '🧊',
        tag: 'Streak Defense',
        description: 'Protects your streak for one full day of inactivity. Holds up to 2 in inventory.',
        rarity: 'Essential'
    },
    {
        id: 'society_streak_freeze',
        name: 'Streak Society Freeze',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'society_streak_freeze',
        icon: '❄️',
        tag: 'Streak Society',
        description: 'VIP streak protection unlocked for members with a 365+ day streak. Holds up to 3.',
        rarity: 'Epic'
    },
    {
        id: 'unlimited_hearts',
        name: 'Unlimited Hearts (Super Health)',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'unlimited_hearts',
        icon: '❤️‍🔥',
        tag: 'Infinite Energy',
        description: 'Never lose hearts on mistakes during practice lessons. Study without interruption.',
        rarity: 'Legendary'
    },

    // ----------------------------------------------------
    // 5. CHESTS & REWARD BUNDLES
    // ----------------------------------------------------
    {
        id: 'early_bird_chest',
        name: 'Early Bird Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'early_bird_chest',
        icon: '🌅',
        tag: 'Time-Exclusive Chest',
        description: 'Openable from 6:00 PM to 11:00 PM after completing a morning lesson. Grants 15m 2x XP.',
        rarity: 'Rare'
    },
    {
        id: 'night_owl_chest',
        name: 'Night Owl Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'night_owl_chest',
        icon: '🌙',
        tag: 'Time-Exclusive Chest',
        description: 'Openable from 6:00 AM to 12:00 PM after completing an evening lesson. Grants 15m 2x XP.',
        rarity: 'Rare'
    },
    {
        id: 'free_chest',
        name: 'Daily Free Mystery Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'free_chest',
        icon: '🎁',
        tag: 'Daily Drop',
        description: 'Daily complimentary shop gift box with free gems and bonus items.',
        rarity: 'Common'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: '✨' },
    { id: 'avatars', label: 'Avatars & Skins', icon: '🎭' },
    { id: 'suits', label: 'Country Suits', icon: '🥋' },
    { id: 'banners', label: 'Banners & Badges', icon: '🏆' },
    { id: 'protection', label: 'Freezes & Hearts', icon: '❄️' },
    { id: 'chests', label: 'Chests & Drops', icon: '🎁' }
];

function getItemById(id) {
    if (!id) return null;
    return ITEMS_CATALOG.find(item => item.id === id) || null;
}

function getItemsByCategory(category) {
    if (!category || category === 'all') return ITEMS_CATALOG;
    return ITEMS_CATALOG.filter(item => item.category === category);
}

function searchItems(query) {
    if (!query || typeof query !== 'string') return ITEMS_CATALOG;
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS_CATALOG;
    return ITEMS_CATALOG.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tag && item.tag.toLowerCase().includes(q))
    );
}

module.exports = {
    ITEMS_CATALOG,
    CATEGORIES,
    getItemById,
    getItemsByCategory,
    searchItems
};
