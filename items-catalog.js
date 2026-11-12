/**
/**
 * Duolingo Complete Items Catalog
 *
 * Full catalog of Duolingo extra items:
 * - Avatar skins and outfits
 * - World tournament country suits
 * - Banners, titles, and tournament badges
 * - Streak protection, freezes, and heart refills
 * - Timed chests and league drops
 *
 * All items use pixel-perfect, tailored vector illustrations. Zero emojis.
 */

const ITEMS_CATALOG = [
    // ----------------------------------------------------
    // 1. AVATAR SKINS & OUTFITS
    // ----------------------------------------------------
    {
        id: 'outfit_formal',
        name: 'Formal Attire',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_FORMAL-{seed}-formal_attire',
        shopName: 'formal_attire',
        imageUrl: '/assets/items/outfit_formal.svg',
        tag: 'Classic Outfit',
        description: 'Dressed in a sharp tailored black tuxedo with bow tie and polished lapels.',
        rarity: 'Legendary'
    },
    {
        id: 'outfit_gold',
        name: 'Champagne Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_GOLD-{seed}-champagne_duo',
        shopName: 'champagne_duo',
        imageUrl: '/assets/items/outfit_gold.svg',
        tag: 'Prestige Outfit',
        description: 'Shimmering metallic gold feathers celebrating high-tier mastery.',
        rarity: 'Mythic'
    },
    {
        id: 'outfit_sport',
        name: 'Tracksuit Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_SPORT-{seed}-tracksuit_duo',
        shopName: 'tracksuit_duo',
        imageUrl: '/assets/items/outfit_sport.svg',
        tag: 'Athletic Outfit',
        description: 'Retro sports tracksuit with sweatband, geared up for intense practice sprints.',
        rarity: 'Epic'
    },
    {
        id: 'outfit_super',
        name: 'Super Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_SUPER-{seed}-super_duo',
        shopName: 'super_duo',
        imageUrl: '/assets/items/outfit_super.svg',
        tag: 'Heroic Skin',
        description: 'Heroic Duo with a fluttering red cape and eye mask, defending streaks across the globe.',
        rarity: 'Mythic'
    },
    {
        id: 'avatar_skin_hot_dog',
        name: 'Hot Dog Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_FIRST-{seed}-avatar_skin_hot_dog',
        shopName: 'avatar_skin_hot_dog',
        imageUrl: '/assets/items/avatar_skin_hot_dog.svg',
        tag: 'Community Favorite',
        description: 'Full hot dog bun with mustard drizzle. An iconic community collectible.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_cat',
        name: 'Feline Duo (Cat)',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_SECOND-{seed}-avatar_skin_cat',
        shopName: 'avatar_skin_cat',
        imageUrl: '/assets/items/avatar_skin_cat.svg',
        tag: 'Animal Skin',
        description: 'Duo equipped with cat ears and whiskers, purring as you complete lessons.',
        rarity: 'Epic'
    },
    {
        id: 'avatar_skin_dead_duo',
        name: 'Ghost Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_THIRD-{seed}-avatar_skin_dead_duo',
        shopName: 'avatar_skin_dead_duo',
        imageUrl: '/assets/items/avatar_skin_dead_duo.png',
        tag: 'Supernatural Skin',
        description: 'Spooky ghostly Duo hovering with an ethereal glow.',
        rarity: 'Mythic'
    },
    {
        id: 'avatar_skin_toy_hunt_grand_prize',
        name: 'Toy Hunt Champion',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_QUEST_FOURTH-{seed}-toy_hunt',
        shopName: 'avatar_skin_toy_hunt_grand_prize',
        imageUrl: '/assets/items/avatar_skin_toy_hunt_grand_prize.webp',
        tag: 'Collector Series',
        description: 'Plush teddy bear Duo unlocked from complete puzzle challenge sets.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_halloween_duo',
        name: 'Halloween Night Terror',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_HALLOWEEN-{seed}-pumpkin',
        shopName: 'avatar_skin_halloween_duo',
        imageUrl: '/assets/items/avatar_skin_halloween_duo.jpg',
        tag: 'Seasonal Special',
        description: 'Carved pumpkin armor with an ominous grin and autumn aura.',
        rarity: 'Epic'
    },
    {
        id: 'avatar_skin_winter_frost',
        name: 'Frost Owl',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_WINTER-{seed}-frost',
        shopName: 'avatar_skin_winter_frost',
        imageUrl: '/assets/items/avatar_skin_winter_frost.svg',
        tag: 'Seasonal Special',
        description: 'Crystalline ice feathers and frost crown forged from winter streak triumphs.',
        rarity: 'Epic'
    },
    {
        id: 'avatar_skin_space_duo',
        name: 'Astronaut Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_SPACE-{seed}-astronaut',
        shopName: 'avatar_skin_space_duo',
        imageUrl: '/assets/items/avatar_skin_space_duo.png',
        tag: 'Cosmic Skin',
        description: 'Pressurized lunar exploration suit with reflective gold visor.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_chef_duo',
        name: 'Master Chef Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_CHEF-{seed}-master_chef',
        shopName: 'avatar_skin_chef_duo',
        imageUrl: '/assets/items/avatar_skin_chef_duo.svg',
        tag: 'Culinary Outfit',
        description: 'Traditional tall chef hat and pristine kitchen apron.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_wizard_duo',
        name: 'Arcane Wizard Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_WIZARD-{seed}-arcane',
        shopName: 'avatar_skin_wizard_duo',
        imageUrl: '/assets/items/avatar_skin_wizard_duo.svg',
        tag: 'Mystic Skin',
        description: 'Pointed star-embroidered sorcerer hat and runic enchanted cloak.',
        rarity: 'Legendary'
    },
    {
        id: 'avatar_skin_streetwear',
        name: 'Streetwear Duo',
        category: 'avatars',
        type: 'AVATAR_SKIN',
        rewardPattern: 'AVATAR_SKINS_STREET-{seed}-streetwear',
        shopName: 'avatar_skin_streetwear',
        imageUrl: '/assets/items/avatar_skin_streetwear.svg',
        tag: 'Modern Style',
        description: 'Urban oversized hoodie, tinted shades, and premium wireless headphones.',
        rarity: 'Rare'
    },

    // ----------------------------------------------------
    // 2. WORLD TOURNAMENT COUNTRY SUITS
    // ----------------------------------------------------
    {
        id: 'avatar_skin_world_cup_br',
        name: 'Team Brazil Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-br',
        shopName: 'country_suit_br',
        imageUrl: '/assets/items/avatar_skin_world_cup_br.png',
        tag: 'Country Jersey',
        description: 'Canarinho yellow and green national team jersey with tournament crest.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_ar',
        name: 'Team Argentina Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-ar',
        shopName: 'country_suit_ar',
        imageUrl: '/assets/items/avatar_skin_world_cup_ar.png',
        tag: 'Country Jersey',
        description: 'Albiceleste sky blue and white striped world champion kit.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_fr',
        name: 'Team France Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-fr',
        shopName: 'country_suit_fr',
        imageUrl: '/assets/items/avatar_skin_world_cup_fr.png',
        tag: 'Country Jersey',
        description: 'Les Bleus royal navy jersey with gold rooster emblem.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_de',
        name: 'Team Germany Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-de',
        shopName: 'country_suit_de',
        imageUrl: '/assets/items/avatar_skin_world_cup_de.png',
        tag: 'Country Jersey',
        description: 'Classic monochrome Die Mannschaft kit with eagle badge.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_es',
        name: 'Team Spain Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-es',
        shopName: 'country_suit_es',
        imageUrl: '/assets/items/avatar_skin_world_cup_es.png',
        tag: 'Country Jersey',
        description: 'La Roja fiery red and gold jersey celebrating Iberian football.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_us',
        name: 'Team USA Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-us',
        shopName: 'country_suit_us',
        imageUrl: '/assets/items/avatar_skin_world_cup_us.png',
        tag: 'Country Jersey',
        description: 'Stars & Stripes athletic jersey with navy and crimson accents.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_gb',
        name: 'Team England Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-gb',
        shopName: 'country_suit_gb',
        imageUrl: '/assets/items/avatar_skin_world_cup_gb.png',
        tag: 'Country Jersey',
        description: 'Traditional Three Lions white and navy jersey with red badge.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_jp',
        name: 'Team Japan Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-jp',
        shopName: 'country_suit_jp',
        imageUrl: '/assets/items/avatar_skin_world_cup_jp.png',
        tag: 'Country Jersey',
        description: 'Samurai Blue aerodynamic jersey with origami feather motif.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_mx',
        name: 'Team Mexico Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-mx',
        shopName: 'country_suit_mx',
        imageUrl: '/assets/items/avatar_skin_world_cup_mx.png',
        tag: 'Country Jersey',
        description: 'El Tri deep emerald green kit with Aztec-inspired feather patterns.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_it',
        name: 'Team Italy Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-it',
        shopName: 'country_suit_it',
        imageUrl: '/assets/items/avatar_skin_world_cup_it.png',
        tag: 'Country Jersey',
        description: 'Gli Azzurri Mediterranean blue kit with tricolore sleeve trim.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_ca',
        name: 'Team Canada Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-ca',
        shopName: 'country_suit_ca',
        imageUrl: '/assets/items/avatar_skin_world_cup_ca.png',
        tag: 'Country Jersey',
        description: 'Bold red and white jersey featuring stylized maple leaf graphics.',
        rarity: 'Rare'
    },
    {
        id: 'avatar_skin_world_cup_kr',
        name: 'Team South Korea Suit',
        category: 'suits',
        type: 'COUNTRY_SUIT',
        rewardPattern: 'WORLD_CUP_SUIT-kr',
        shopName: 'country_suit_kr',
        imageUrl: '/assets/items/avatar_skin_world_cup_kr.png',
        tag: 'Country Jersey',
        description: 'Taegeuk Warriors vivid red jersey with white tiger crest.',
        rarity: 'Rare'
    },

    // ----------------------------------------------------
    // 3. BANNERS, BADGES & TITLES
    // ----------------------------------------------------
    {
        id: 'badge_diamond_tournament_winner',
        name: 'Diamond Tournament Champion',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'LEAGUE_REWARD-tournament_diamond_winner',
        shopName: 'badge_diamond_tournament_winner',
        imageUrl: '/assets/items/badge_diamond_tournament_winner.svg',
        tag: 'Tournament Trophy',
        description: 'The premier competitive accolade in Duolingo. Conquering the 3-week Diamond Tournament.',
        rarity: 'Legendary'
    },
    {
        id: 'badge_diamond_league_first',
        name: 'Diamond League 1st Place',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'LEAGUE_REWARD-diamond_first_place',
        shopName: 'badge_diamond_league_first',
        imageUrl: '/assets/items/badge_diamond_league_first.svg',
        tag: 'Leaderboard Legend',
        description: 'Gold wreath badge awarded for finishing in 1st place in the highest league tier.',
        rarity: 'Legendary'
    },
    {
        id: 'title_chess_grandmaster_king',
        name: 'Grandmaster Chess King',
        category: 'banners',
        type: 'TITLE',
        rewardPattern: 'CHESS_EVENT_REWARD-grandmaster_king',
        shopName: 'title_chess_grandmaster_king',
        imageUrl: '/assets/items/title_chess_grandmaster_king.svg',
        tag: 'Chess Title',
        description: 'Crown of the Grandmaster Chess King, earned through Duolingo chess challenges.',
        rarity: 'Mythic'
    },
    {
        id: 'title_chess_grandmaster_queen',
        name: 'Grandmaster Chess Queen',
        category: 'banners',
        type: 'TITLE',
        rewardPattern: 'CHESS_EVENT_REWARD-grandmaster_queen',
        shopName: 'title_chess_grandmaster_queen',
        imageUrl: '/assets/items/title_chess_grandmaster_queen.svg',
        tag: 'Chess Title',
        description: 'Tiara of the Grandmaster Chess Queen, earned through high-level tactical matches.',
        rarity: 'Mythic'
    },
    {
        id: 'badge_chess_knight',
        name: 'Chess Knight Champion',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'CHESS_EVENT_REWARD-knight_tactician',
        shopName: 'badge_chess_knight',
        imageUrl: '/assets/items/badge_chess_knight.svg',
        tag: 'Chess Badge',
        description: 'Awarded for master tactical combinations in the Duolingo chess series.',
        rarity: 'Epic'
    },
    {
        id: 'badge_streak_society_365',
        name: 'Streak Society 365-Day Master',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'STREAK_SOCIETY-365',
        shopName: 'badge_streak_society_365',
        imageUrl: '/assets/items/badge_streak_society_365.svg',
        tag: 'Streak Society Badge',
        description: 'Official induction badge celebrating 365 consecutive days of daily language learning.',
        rarity: 'Legendary'
    },
    {
        id: 'badge_streak_society_500',
        name: 'Streak Society 500-Day Centurion',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'STREAK_SOCIETY-500',
        shopName: 'badge_streak_society_500',
        imageUrl: '/assets/items/badge_streak_society_500.svg',
        tag: 'Streak Society Badge',
        description: 'Prestige crest celebrating 500 uninterrupted days of practice.',
        rarity: 'Mythic'
    },
    {
        id: 'badge_streak_society_1000',
        name: 'Streak Society 1000-Day Titan',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'STREAK_SOCIETY-1000',
        shopName: 'badge_streak_society_1000',
        imageUrl: '/assets/items/badge_streak_society_1000.svg',
        tag: 'Titan Crest',
        description: 'Elite milestone crest honoring 1,000 continuous days of multilingual discipline.',
        rarity: 'Mythic'
    },
    {
        id: 'badge_friend_quest_champion',
        name: 'Friend Quest Conqueror',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'FRIEND_QUEST_ACHIEVEMENT-master',
        shopName: 'badge_friend_quest_champion',
        imageUrl: '/assets/items/badge_friend_quest_champion.svg',
        tag: 'Co-op Badge',
        description: 'Granted for completing 100 Friend Quest joint objectives together.',
        rarity: 'Epic'
    },
    {
        id: 'badge_wildfire_champion',
        name: 'Wildfire Global Top 1%',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'GLOBAL_ACHIEVEMENT-wildfire_top_tier',
        shopName: 'badge_wildfire_champion',
        imageUrl: '/assets/items/badge_wildfire_champion.svg',
        tag: 'Global Honor',
        description: 'Recognizes learners in the top 1% globally for study consistency.',
        rarity: 'Epic'
    },
    {
        id: 'badge_sharpshooter_master',
        name: 'Sharpshooter Flawless 100%',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'ACCURACY_ACHIEVEMENT-sharpshooter_100',
        shopName: 'badge_sharpshooter_master',
        imageUrl: '/assets/items/badge_sharpshooter_master.svg',
        tag: 'Skill Badge',
        description: 'Awarded for completing 50 lessons with zero mistakes in a single week.',
        rarity: 'Rare'
    },
    {
        id: 'badge_speed_racer',
        name: 'Speed Racer Lightning Master',
        category: 'banners',
        type: 'BADGE',
        rewardPattern: 'SPEED_ACHIEVEMENT-lightning_round',
        shopName: 'badge_speed_racer',
        imageUrl: '/assets/items/badge_speed_racer.svg',
        tag: 'Speed Badge',
        description: 'Awarded for completing timed Ramp-Up challenges with seconds to spare.',
        rarity: 'Rare'
    },

    // ----------------------------------------------------
    // 4. STREAK PROTECTION, BOOSTERS & HEARTS
    // ----------------------------------------------------
    {
        id: 'streak_freeze',
        name: 'Streak Freeze',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'streak_freeze',
        imageUrl: '/assets/items/streak_freeze.svg',
        tag: 'Streak Protection',
        description: 'Protects your streak from resetting if you miss a single day of practice.',
        rarity: 'Common'
    },
    {
        id: 'streak_freeze_pack',
        name: 'Streak Freeze Reserve Pack (2x)',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'streak_freeze_pack',
        imageUrl: '/assets/items/streak_freeze_pack.svg',
        tag: 'Inventory Pack',
        description: 'Double reserve bundle maintaining your backup inventory at maximum capacity.',
        rarity: 'Rare'
    },
    {
        id: 'streak_society_shield',
        name: 'Streak Society 7-Day Shield',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'streak_society_shield',
        imageUrl: '/assets/items/streak_society_shield.svg',
        tag: 'Exclusive Protection',
        description: 'Streak Society privilege providing seven days of comprehensive protection.',
        rarity: 'Legendary'
    },
    {
        id: 'heart_refill_full',
        name: 'Full Heart Refill',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'heart_refill',
        imageUrl: '/assets/items/heart_refill_full.svg',
        tag: 'Vitality Boost',
        description: 'Restores all 5 learning hearts instantly so you can continue lessons without pause.',
        rarity: 'Common'
    },
    {
        id: 'unlimited_hearts_pass',
        name: 'Unlimited Hearts Classroom Pass',
        category: 'protection',
        type: 'CLASSROOM_PASS',
        shopName: 'unlimited_hearts_pass',
        imageUrl: '/assets/items/unlimited_hearts_pass.svg',
        tag: 'Infinite Hearts',
        description: 'Activates schools educator mode for permanently unlimited lesson hearts.',
        rarity: 'Mythic'
    },
    {
        id: 'weekend_amulet',
        name: 'Weekend Amulet',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'weekend_amulet',
        imageUrl: '/assets/items/weekend_amulet.svg',
        tag: 'Weekend Shield',
        description: 'Special weekend insurance covering missed lessons on Saturday and Sunday.',
        rarity: 'Rare'
    },
    {
        id: 'double_or_nothing_wager',
        name: 'Double or Nothing 7-Day Wager',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'double_or_nothing',
        imageUrl: '/assets/items/double_or_nothing_wager.svg',
        tag: 'Gem Investment',
        description: 'Wager 50 gems to practice 7 straight days and earn 100 gems back.',
        rarity: 'Rare'
    },
    {
        id: 'early_bird_boost_15m',
        name: '15m 2x Early Bird Booster',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'early_bird_boost_15m',
        imageUrl: '/assets/items/early_bird_boost_15m.svg',
        tag: 'XP Booster',
        description: '15 minutes of double XP for lessons completed during evening hours.',
        rarity: 'Rare'
    },
    {
        id: 'night_owl_boost_15m',
        name: '15m 2x Night Owl Booster',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'night_owl_boost_15m',
        imageUrl: '/assets/items/night_owl_boost_15m.svg',
        tag: 'XP Booster',
        description: '15 minutes of double XP for lessons completed during morning hours.',
        rarity: 'Rare'
    },
    {
        id: 'timer_boost_extra',
        name: 'Ramp-Up +60s Extra Time',
        category: 'protection',
        type: 'SHOP_ITEM',
        shopName: 'timer_boost_extra',
        imageUrl: '/assets/items/timer_boost_extra.svg',
        tag: 'Speed Item',
        description: 'Adds 60 bonus seconds in rapid-fire Match Madness and Ramp-Up challenges.',
        rarity: 'Common'
    },

    // ----------------------------------------------------
    // 5. CHESTS & BONUS DROPS
    // ----------------------------------------------------
    {
        id: 'early_bird_chest',
        name: 'Early Bird Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'early_bird_chest',
        imageUrl: '/assets/items/early_bird_chest.svg',
        tag: 'Time-Exclusive Chest',
        description: 'Earned from morning practice and ready to open between 6:00 PM and 11:00 PM.',
        rarity: 'Rare'
    },
    {
        id: 'night_owl_chest',
        name: 'Night Owl Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'night_owl_chest',
        imageUrl: '/assets/items/night_owl_chest.svg',
        tag: 'Time-Exclusive Chest',
        description: 'Earned from evening practice and ready to open between 6:00 AM and 12:00 PM.',
        rarity: 'Rare'
    },
    {
        id: 'free_chest',
        name: 'Daily Free Mystery Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'free_chest',
        imageUrl: '/assets/items/free_chest.svg',
        tag: 'Daily Drop',
        description: 'Complimentary daily gift box offering gems and random consumables.',
        rarity: 'Common'
    },
    {
        id: 'friends_quest_chest',
        name: 'Friends Quest Gift Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'friends_quest_chest',
        imageUrl: '/assets/items/friends_quest_chest.svg',
        tag: 'Co-op Reward',
        description: 'Shared treasure chest unlocked upon finishing weekly partner quests.',
        rarity: 'Rare'
    },
    {
        id: 'monthly_challenge_chest',
        name: 'Monthly Challenge Grand Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'monthly_challenge_chest',
        imageUrl: '/assets/items/monthly_challenge_chest.svg',
        tag: 'Badge Chest',
        description: 'Monthly special chest unlocked by meeting your 30-quest challenge quota.',
        rarity: 'Epic'
    },
    {
        id: 'diamond_league_chest',
        name: 'Diamond League Champion Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'diamond_league_chest',
        imageUrl: '/assets/items/diamond_league_chest.svg',
        tag: 'Tier 10 Chest',
        description: 'The pinnacle league reward box loaded with gems, boosts, and badges.',
        rarity: 'Legendary'
    },
    {
        id: 'obsidian_league_chest',
        name: 'Obsidian League Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'obsidian_league_chest',
        imageUrl: '/assets/items/obsidian_league_chest.svg',
        tag: 'Tier 9 Chest',
        description: 'High-tier reward box granted to top finishers in the Obsidian tier.',
        rarity: 'Epic'
    },
    {
        id: 'emerald_league_chest',
        name: 'Emerald League Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'emerald_league_chest',
        imageUrl: '/assets/items/emerald_league_chest.svg',
        tag: 'Tier 6 Chest',
        description: 'Celebratory prize crate awarded upon promotion to the Emerald division.',
        rarity: 'Rare'
    },
    {
        id: 'ruby_league_chest',
        name: 'Ruby League Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'ruby_league_chest',
        imageUrl: '/assets/items/ruby_league_chest.svg',
        tag: 'Tier 5 Chest',
        description: 'Mid-tier prize crate awarded upon promotion to the Ruby division.',
        rarity: 'Rare'
    },
    {
        id: 'sapphire_league_chest',
        name: 'Sapphire League Chest',
        category: 'chests',
        type: 'SHOP_ITEM',
        shopName: 'sapphire_league_chest',
        imageUrl: '/assets/items/sapphire_league_chest.svg',
        tag: 'Tier 4 Chest',
        description: 'Prize crate awarded upon promotion to the Sapphire division.',
        rarity: 'Common'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Items' },
    { id: 'avatars', label: 'Avatars & Outfits' },
    { id: 'suits', label: 'Country Suits' },
    { id: 'banners', label: 'Banners & Badges' },
    { id: 'protection', label: 'Freezes & Boosts' },
    { id: 'chests', label: 'Chests & Drops' }
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
