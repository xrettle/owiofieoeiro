/**
 * Generates pixel-perfect, tailored SVG preview vector graphics
 * for all 58 Duolingo Locker Room items.
 *
 * Each illustration is designed to match the item title and theme with 100% precision.
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'public', 'assets', 'items');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// SVG Builders
const SVGS = {
    // ----------------------------------------------------
    // 1. AVATARS & OUTFITS
    // ----------------------------------------------------
    'outfit_formal': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Duo Base -->
        <rect x="22" y="14" width="36" height="42" rx="18" fill="#58CC02"/>
        <circle x="30" y="24" cx="30" cy="24" r="7" fill="#FFFFFF"/>
        <circle x="50" y="24" cx="50" cy="24" r="7" fill="#FFFFFF"/>
        <circle x="32" y="24" cx="32" cy="24" r="3.5" fill="#3C3C3C"/>
        <circle x="48" y="24" cx="48" cy="24" r="3.5" fill="#3C3C3C"/>
        <polygon points="40,28 34,34 46,34" fill="#F49000"/>
        <!-- Tuxedo Suit & Lapels -->
        <path d="M22 36 L40 56 L58 36 L58 56 L22 56 Z" fill="#1A1A1A"/>
        <polygon points="40,36 34,48 46,48" fill="#FFFFFF"/>
        <!-- Bow Tie -->
        <polygon points="34,37 40,40 34,43" fill="#E53935"/>
        <polygon points="46,37 40,40 46,43" fill="#E53935"/>
        <circle cx="40" cy="40" r="2" fill="#B71C1C"/>
        <!-- Polish Rose -->
        <circle cx="28" cy="42" r="2" fill="#E53935"/>
    </svg>`,

    'outfit_gold': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFE082"/>
                <stop offset="40%" stop-color="#FFD54F"/>
                <stop offset="70%" stop-color="#FFB300"/>
                <stop offset="100%" stop-color="#FF8F00"/>
            </linearGradient>
        </defs>
        <!-- Golden Duo -->
        <rect x="22" y="14" width="36" height="48" rx="18" fill="url(#goldGrad)" stroke="#FFA000" stroke-width="1.5"/>
        <circle cx="30" cy="26" r="7" fill="#FFFFFF"/>
        <circle cx="50" cy="26" r="7" fill="#FFFFFF"/>
        <circle cx="32" cy="26" r="3.5" fill="#422E00"/>
        <circle cx="48" cy="26" r="3.5" fill="#422E00"/>
        <polygon points="40,30 34,36 46,36" fill="#E65100"/>
        <!-- Sparkle Stars -->
        <polygon points="18,16 20,12 22,16 26,18 22,20 20,24 18,20 14,18" fill="#FFF9C4"/>
        <polygon points="62,28 63.5,25 65,28 68,29.5 65,31 63.5,34 62,31 59,29.5" fill="#FFF9C4"/>
        <polygon points="56,8 57.5,5 59,8 62,9.5 59,11 57.5,14 56,11 53,9.5" fill="#FFF9C4"/>
    </svg>`,

    'outfit_sport': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="16" width="36" height="46" rx="18" fill="#58CC02"/>
        <circle cx="30" cy="28" r="7" fill="#FFFFFF"/>
        <circle cx="50" cy="28" r="7" fill="#FFFFFF"/>
        <circle cx="32" cy="28" r="3.5" fill="#3C3C3C"/>
        <circle cx="48" cy="28" r="3.5" fill="#3C3C3C"/>
        <polygon points="40,32 34,38 46,38" fill="#F49000"/>
        <!-- Headband -->
        <rect x="20" y="18" width="40" height="7" rx="3.5" fill="#FF4B4B"/>
        <line x1="22" y1="21.5" x2="58" y2="21.5" stroke="#FFFFFF" stroke-width="1.5"/>
        <!-- Tracksuit Athletic Jacket -->
        <path d="M22 42 L58 42 L58 60 L22 60 Z" fill="#1CB0F6"/>
        <line x1="40" y1="42" x2="40" y2="60" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="28" y1="42" x2="28" y2="60" stroke="#FFFFFF" stroke-width="1.5"/>
        <line x1="52" y1="42" x2="52" y2="60" stroke="#FFFFFF" stroke-width="1.5"/>
    </svg>`,

    'outfit_super': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Cape -->
        <path d="M16 28 L24 22 L56 22 L64 28 L68 62 L40 56 L12 62 Z" fill="#E53935"/>
        <!-- Duo Body -->
        <rect x="22" y="14" width="36" height="46" rx="18" fill="#58CC02"/>
        <!-- Hero Eye Mask -->
        <rect x="20" y="22" width="40" height="11" rx="5" fill="#1E293B"/>
        <circle cx="30" cy="27" r="5" fill="#FFFFFF"/>
        <circle cx="50" cy="27" r="5" fill="#FFFFFF"/>
        <circle cx="32" cy="27" r="2.5" fill="#0F172A"/>
        <circle cx="48" cy="27" r="2.5" fill="#0F172A"/>
        <polygon points="40,33 35,39 45,39" fill="#F49000"/>
        <!-- Chest Emblem Shield -->
        <polygon points="40,43 46,47 44,54 40,57 36,54 34,47" fill="#FFC800"/>
        <text x="40" y="53" font-size="8" font-weight="900" text-anchor="middle" fill="#B45309" font-family="sans-serif">D</text>
    </svg>`,

    'avatar_skin_hot_dog': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Hot Dog Bun Back -->
        <ellipse cx="40" cy="46" rx="28" ry="18" fill="#C67D34"/>
        <ellipse cx="40" cy="44" rx="26" ry="16" fill="#E5984A"/>
        <!-- Duo Body inside Bun -->
        <rect x="26" y="12" width="28" height="42" rx="14" fill="#58CC02"/>
        <circle cx="33" cy="22" r="5.5" fill="#FFFFFF"/>
        <circle cx="47" cy="22" r="5.5" fill="#FFFFFF"/>
        <circle cx="34" cy="22" r="3" fill="#3C3C3C"/>
        <circle cx="46" cy="22" r="3" fill="#3C3C3C"/>
        <polygon points="40,26 35,31 45,31" fill="#F49000"/>
        <!-- Bun Front Lower Lip -->
        <path d="M14 42 C16 58 64 58 66 42 C64 50 16 50 14 42 Z" fill="#C67D34"/>
        <!-- Mustard Drizzle -->
        <path d="M22 38 Q26 44 32 38 T42 38 T52 38 T58 38" fill="none" stroke="#FFC800" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,

    'avatar_skin_cat': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Cat Ears -->
        <polygon points="23,20 18,6 32,15" fill="#58CC02" stroke="#46A302" stroke-width="1.5"/>
        <polygon points="24,18 20,9 30,15" fill="#FF80AB"/>
        <polygon points="57,20 62,6 48,15" fill="#58CC02" stroke="#46A302" stroke-width="1.5"/>
        <polygon points="56,18 60,9 50,15" fill="#FF80AB"/>
        <!-- Duo Body -->
        <rect x="22" y="14" width="36" height="46" rx="18" fill="#58CC02"/>
        <circle cx="30" cy="26" r="7" fill="#FFFFFF"/>
        <circle cx="50" cy="26" r="7" fill="#FFFFFF"/>
        <!-- Cat Slit Pupils -->
        <ellipse cx="32" cy="26" rx="2" ry="4.5" fill="#2E7D32"/>
        <ellipse cx="48" cy="26" rx="2" ry="4.5" fill="#2E7D32"/>
        <!-- Nose & Whiskers -->
        <polygon points="40,30 37,33 43,33" fill="#FF4081"/>
        <line x1="20" y1="31" x2="33" y2="33" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="20" y1="36" x2="33" y2="35" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="60" y1="31" x2="47" y2="33" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="60" y1="36" x2="47" y2="35" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    'avatar_skin_dead_duo': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Ghost Glow -->
        <ellipse cx="40" cy="38" rx="26" ry="30" fill="oklch(0.7 0.1 220 / 20%)"/>
        <!-- Ghost Duo Body -->
        <path d="M22 34 C22 18 58 18 58 34 L58 54 Q52 50 46 54 Q40 50 34 54 Q28 50 22 54 Z" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
        <!-- Spooky Eyes -->
        <circle cx="31" cy="28" r="6" fill="#1E293B"/>
        <circle cx="49" cy="28" r="6" fill="#1E293B"/>
        <circle cx="33" cy="26" r="2" fill="#38BDF8"/>
        <circle cx="51" cy="26" r="2" fill="#38BDF8"/>
        <!-- Ghost Mouth -->
        <ellipse cx="40" cy="38" rx="4" ry="6" fill="#1E293B"/>
    </svg>`,

    'avatar_skin_toy_hunt_grand_prize': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Bear Ears -->
        <circle cx="24" cy="18" r="8" fill="#8D5B28"/>
        <circle cx="24" cy="18" r="4.5" fill="#D79E67"/>
        <circle cx="56" cy="18" r="8" fill="#8D5B28"/>
        <circle cx="56" cy="18" r="4.5" fill="#D79E67"/>
        <!-- Teddy Bear Duo Body -->
        <rect x="22" y="16" width="36" height="46" rx="18" fill="#8D5B28"/>
        <!-- Belly Patch with Stitches -->
        <ellipse cx="40" cy="45" rx="12" ry="13" fill="#D79E67"/>
        <line x1="40" y1="36" x2="40" y2="54" stroke="#8D5B28" stroke-width="1" stroke-dasharray="2,2"/>
        <!-- Button Eyes -->
        <circle cx="31" cy="28" r="5" fill="#27180B"/>
        <circle cx="49" cy="28" r="5" fill="#27180B"/>
        <circle cx="32" cy="27" r="1.5" fill="#FFFFFF"/>
        <circle cx="50" cy="27" r="1.5" fill="#FFFFFF"/>
        <!-- Muzzle -->
        <ellipse cx="40" cy="34" rx="7" ry="5" fill="#D79E67"/>
        <polygon points="40,32 37,34 43,34" fill="#27180B"/>
    </svg>`,

    'avatar_skin_halloween_duo': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Pumpkin Body -->
        <ellipse cx="40" cy="40" rx="26" ry="24" fill="#F97316"/>
        <ellipse cx="40" cy="40" rx="18" ry="23" fill="#EA580C"/>
        <ellipse cx="40" cy="40" rx="10" ry="22" fill="#C2410C"/>
        <!-- Pumpkin Stem -->
        <rect x="37" y="12" width="6" height="8" rx="2" fill="#58CC02"/>
        <!-- Carved Glowing Jack-o-Lantern Face -->
        <polygon points="28,32 23,40 33,40" fill="#FEF08A"/>
        <polygon points="52,32 47,40 57,40" fill="#FEF08A"/>
        <polygon points="40,38 37,43 43,43" fill="#FEF08A"/>
        <!-- Spooky Grin -->
        <path d="M26 48 L30 52 L34 49 L38 53 L42 49 L46 53 L50 49 L54 48 Q40 58 26 48 Z" fill="#FEF08A"/>
    </svg>`,

    'avatar_skin_winter_frost': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Frost Aura -->
        <circle cx="40" cy="38" r="28" fill="oklch(0.8 0.1 220 / 25%)"/>
        <!-- Ice Duo Body -->
        <rect x="22" y="16" width="36" height="46" rx="18" fill="#7DD3FC" stroke="#38BDF8" stroke-width="1.5"/>
        <!-- Frost Eyes -->
        <circle cx="30" cy="28" r="7" fill="#F0F9FF"/>
        <circle cx="50" cy="28" r="7" fill="#F0F9FF"/>
        <circle cx="32" cy="28" r="3.5" fill="#0369A1"/>
        <circle cx="48" cy="28" r="3.5" fill="#0369A1"/>
        <polygon points="40,32 35,37 45,37" fill="#38BDF8"/>
        <!-- Ice Crown -->
        <polygon points="24,18 28,8 34,16 40,6 46,16 52,8 56,18" fill="#E0F2FE" stroke="#0284C7" stroke-width="1"/>
        <!-- Snowflake Icon -->
        <circle cx="40" cy="50" r="3" fill="#E0F2FE"/>
    </svg>`,

    'avatar_skin_space_duo': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Spacesuit Helmet Rim -->
        <circle cx="40" cy="34" r="24" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
        <!-- Gold Visor -->
        <ellipse cx="40" cy="34" rx="18" ry="14" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
        <path d="M28 26 Q40 22 52 26" stroke="#FEF3C7" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Spacesuit Collar & Chestpack -->
        <path d="M24 54 L56 54 L52 68 L28 68 Z" fill="#CBD5E1"/>
        <rect x="34" y="58" width="12" height="7" rx="2" fill="#3B82F6"/>
        <circle cx="37" cy="61.5" r="1.5" fill="#EF4444"/>
        <circle cx="43" cy="61.5" r="1.5" fill="#10B981"/>
    </svg>`,

    'avatar_skin_chef_duo': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Tall Chef Toque -->
        <path d="M26 22 C22 14 30 6 36 10 C40 4 46 4 48 10 C54 6 60 14 56 22 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1"/>
        <rect x="27" y="19" width="28" height="6" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <!-- Duo Body -->
        <rect x="22" y="24" width="36" height="42" rx="18" fill="#58CC02"/>
        <circle cx="30" cy="34" r="6" fill="#FFFFFF"/>
        <circle cx="50" cy="34" r="6" fill="#FFFFFF"/>
        <circle cx="32" cy="34" r="3" fill="#3C3C3C"/>
        <circle cx="48" cy="34" r="3" fill="#3C3C3C"/>
        <polygon points="40,38 35,43 45,43" fill="#F49000"/>
        <!-- Red Scarf / Neckerchief -->
        <polygon points="34,48 40,54 46,48 40,46" fill="#EF4444"/>
        <!-- Apron -->
        <path d="M28 52 L52 52 L50 64 L30 64 Z" fill="#FFFFFF"/>
    </svg>`,

    'avatar_skin_wizard_duo': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Wizard Hat -->
        <polygon points="40,6 20,28 60,28" fill="#6B21A8"/>
        <ellipse cx="40" cy="28" rx="24" ry="5" fill="#7E22CE"/>
        <polygon points="40,16 41,13 43,15 45,12 44,17" fill="#FACC15"/>
        <!-- Duo Body -->
        <rect x="22" y="24" width="36" height="44" rx="18" fill="#58CC02"/>
        <circle cx="30" cy="34" r="6" fill="#FFFFFF"/>
        <circle cx="50" cy="34" r="6" fill="#FFFFFF"/>
        <circle cx="32" cy="34" r="3" fill="#3C3C3C"/>
        <circle cx="48" cy="34" r="3" fill="#3C3C3C"/>
        <polygon points="40,38 35,43 45,43" fill="#F49000"/>
        <!-- Magic Wand -->
        <line x1="56" y1="36" x2="68" y2="24" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="68,24 67,20 70,22 72,19 71,24" fill="#FACC15"/>
    </svg>`,

    'avatar_skin_streetwear': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Duo Body -->
        <rect x="22" y="16" width="36" height="46" rx="18" fill="#58CC02"/>
        <!-- Cool Sunglasses -->
        <rect x="23" y="24" width="15" height="10" rx="3" fill="#0F172A"/>
        <rect x="43" y="24" width="15" height="10" rx="3" fill="#0F172A"/>
        <line x1="38" y1="28" x2="43" y2="28" stroke="#0F172A" stroke-width="2"/>
        <polygon points="40,34 35,39 45,39" fill="#F49000"/>
        <!-- Headphones -->
        <path d="M16 32 C16 14 64 14 64 32" stroke="#F97316" stroke-width="3.5" fill="none"/>
        <rect x="14" y="28" width="6" height="12" rx="3" fill="#EA580C"/>
        <rect x="60" y="28" width="6" height="12" rx="3" fill="#EA580C"/>
        <!-- Oversized Hoodie Base -->
        <path d="M22 46 L58 46 L56 64 L24 64 Z" fill="#334155"/>
    </svg>`,

    // ----------------------------------------------------
    // 2. WORLD CUP COUNTRY SUITS
    // ----------------------------------------------------
    'avatar_skin_world_cup_br': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Brazil Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <!-- Green Collar & Trim -->
        <polygon points="34,20 40,28 46,20" fill="#15803D"/>
        <rect x="14" y="32" width="6" height="4" fill="#15803D"/>
        <rect x="60" y="32" width="6" height="4" fill="#15803D"/>
        <!-- Crest Rhombus & Circle -->
        <polygon points="40,36 46,42 40,48 34,42" fill="#15803D"/>
        <circle cx="40" cy="42" r="3.5" fill="#1D4ED8"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#15803D" font-family="sans-serif">BRA</text>
    </svg>`,

    'avatar_skin_world_cup_ar': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Argentina Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
        <!-- Sky Blue Stripes -->
        <rect x="30" y="20" width="6" height="42" fill="#38BDF8"/>
        <rect x="44" y="20" width="6" height="42" fill="#38BDF8"/>
        <!-- Sun of May Gold Crest -->
        <circle cx="40" cy="40" r="4.5" fill="#F59E0B"/>
        <circle cx="40" cy="40" r="2.5" fill="#D97706"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#0284C7" font-family="sans-serif">ARG</text>
    </svg>`,

    'avatar_skin_world_cup_fr': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- France Navy Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#1E3A8A" stroke="#172554" stroke-width="1.5"/>
        <!-- Tricolore Collar & Rooster Badge -->
        <polygon points="34,20 40,27 46,20" fill="#EF4444"/>
        <circle cx="40" cy="38" r="6" fill="#FACC15"/>
        <text x="40" y="41" font-size="7" font-weight="900" text-anchor="middle" fill="#1E3A8A" font-family="sans-serif">★</text>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">FRA</text>
    </svg>`,

    'avatar_skin_world_cup_de': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Germany White & Black Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
        <!-- Chest Bands (Black, Red, Gold) -->
        <rect x="25" y="32" width="30" height="3" fill="#0F172A"/>
        <rect x="25" y="35" width="30" height="3" fill="#EF4444"/>
        <rect x="25" y="38" width="30" height="3" fill="#FACC15"/>
        <circle cx="40" cy="46" r="4.5" fill="#0F172A"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#0F172A" font-family="sans-serif">GER</text>
    </svg>`,

    'avatar_skin_world_cup_es': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Spain Red Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <!-- Gold Trim -->
        <polygon points="34,20 40,27 46,20" fill="#FACC15"/>
        <circle cx="40" cy="38" r="5.5" fill="#FACC15"/>
        <circle cx="40" cy="38" r="3.5" fill="#B91C1C"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FACC15" font-family="sans-serif">ESP</text>
    </svg>`,

    'avatar_skin_world_cup_us': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- USA Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#F8FAFC" stroke="#1E293B" stroke-width="1.5"/>
        <rect x="24" y="20" width="32" height="10" fill="#1D4ED8"/>
        <!-- Red Stripes below -->
        <line x1="30" y1="34" x2="30" y2="60" stroke="#EF4444" stroke-width="3"/>
        <line x1="40" y1="34" x2="40" y2="60" stroke="#EF4444" stroke-width="3"/>
        <line x1="50" y1="34" x2="50" y2="60" stroke="#EF4444" stroke-width="3"/>
        <text x="40" y="28" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">USA</text>
    </svg>`,

    'avatar_skin_world_cup_gb': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- England White Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
        <polygon points="34,20 40,27 46,20" fill="#1E3A8A"/>
        <!-- Red St George Shield -->
        <rect x="35" y="32" width="10" height="12" rx="2" fill="#FFFFFF" stroke="#EF4444" stroke-width="1.5"/>
        <line x1="40" y1="32" x2="40" y2="44" stroke="#EF4444" stroke-width="2"/>
        <line x1="35" y1="38" x2="45" y2="38" stroke="#EF4444" stroke-width="2"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#1E3A8A" font-family="sans-serif">ENG</text>
    </svg>`,

    'avatar_skin_world_cup_jp': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Japan Samurai Blue Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#1E40AF" stroke="#172554" stroke-width="1.5"/>
        <!-- Red Sun Badge -->
        <circle cx="40" cy="38" r="6" fill="#FFFFFF"/>
        <circle cx="40" cy="38" r="4.5" fill="#DC2626"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">JPN</text>
    </svg>`,

    'avatar_skin_world_cup_mx': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Mexico Green Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#15803D" stroke="#166534" stroke-width="1.5"/>
        <!-- Red & White Collar -->
        <polygon points="34,20 40,27 46,20" fill="#EF4444"/>
        <circle cx="40" cy="38" r="6" fill="#FACC15"/>
        <circle cx="40" cy="38" r="3" fill="#B45309"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">MEX</text>
    </svg>`,

    'avatar_skin_world_cup_it': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Italy Azzurri Blue Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#0284C7" stroke="#0369A1" stroke-width="1.5"/>
        <!-- Gold Crest -->
        <polygon points="35,32 45,32 44,43 40,46 36,43" fill="#FACC15"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">ITA</text>
    </svg>`,

    'avatar_skin_world_cup_ca': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Canada Red Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <!-- White Chest Band -->
        <rect x="25" y="32" width="30" height="14" fill="#FFFFFF"/>
        <!-- Maple Leaf -->
        <polygon points="40,34 42,38 46,36 43,40 45,43 40,42 35,43 37,40 34,36 38,38" fill="#DC2626"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">CAN</text>
    </svg>`,

    'avatar_skin_world_cup_kr': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- South Korea Red Jersey -->
        <path d="M24 20 L56 20 L66 34 L56 38 L54 62 L26 62 L24 38 L14 34 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
        <!-- Taegeuk Yin-Yang Circle -->
        <circle cx="40" cy="38" r="6" fill="#1D4ED8"/>
        <path d="M40 32 A3 3 0 0 1 40 38 A3 3 0 0 0 40 44 A6 6 0 0 0 40 32" fill="#EF4444"/>
        <text x="40" y="58" font-size="7" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">KOR</text>
    </svg>`,

    // ----------------------------------------------------
    // 3. BANNERS, BADGES & TITLES
    // ----------------------------------------------------
    'badge_diamond_tournament_winner': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Diamond Trophy Cup -->
        <polygon points="40,12 56,22 40,36 24,22" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
        <path d="M28 26 L52 26 L48 48 L40 54 L32 48 Z" fill="#0284C7"/>
        <!-- Trophy Handles -->
        <path d="M28 28 C18 28 18 42 29 44" stroke="#F59E0B" stroke-width="3" fill="none"/>
        <path d="M52 28 C62 28 62 42 51 44" stroke="#F59E0B" stroke-width="3" fill="none"/>
        <!-- Trophy Base -->
        <rect x="36" y="54" width="8" height="8" fill="#D97706"/>
        <rect x="28" y="62" width="24" height="6" rx="2" fill="#F59E0B"/>
    </svg>`,

    'badge_diamond_league_first': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Laurel Wreath -->
        <circle cx="40" cy="40" r="24" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="8,4"/>
        <!-- Diamond Jewel Center -->
        <polygon points="40,24 52,36 40,54 28,36" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
        <polygon points="40,28 48,36 40,48 32,36" fill="#E0F2FE"/>
        <!-- #1 Text -->
        <text x="40" y="42" font-size="12" font-weight="900" text-anchor="middle" fill="#0369A1" font-family="sans-serif">1</text>
    </svg>`,

    'title_chess_grandmaster_king': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Royal Crown -->
        <path d="M18 52 L22 30 L32 40 L40 24 L48 40 L58 30 L62 52 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <!-- Cross on Top -->
        <line x1="40" y1="16" x2="40" y2="24" stroke="#FACC15" stroke-width="2.5"/>
        <line x1="36" y1="20" x2="44" y2="20" stroke="#FACC15" stroke-width="2.5"/>
        <!-- Crown Base & Jewels -->
        <rect x="18" y="52" width="44" height="8" rx="2" fill="#CA8A04"/>
        <circle cx="28" cy="56" r="2.5" fill="#EF4444"/>
        <circle cx="40" cy="56" r="2.5" fill="#3B82F6"/>
        <circle cx="52" cy="56" r="2.5" fill="#10B981"/>
    </svg>`,

    'title_chess_grandmaster_queen': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Queen Tiara -->
        <path d="M20 54 L24 34 L32 44 L40 28 L48 44 L56 34 L60 54 Z" fill="#F472B6" stroke="#DB2777" stroke-width="1.5"/>
        <circle cx="24" cy="32" r="2.5" fill="#FDF2F8"/>
        <circle cx="40" cy="26" r="3" fill="#FDF2F8"/>
        <circle cx="56" cy="32" r="2.5" fill="#FDF2F8"/>
        <rect x="20" y="54" width="40" height="6" rx="2" fill="#BE185D"/>
    </svg>`,

    'badge_chess_knight': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Chess Knight Piece Silhouette -->
        <path d="M30 64 L52 64 L50 56 C50 48 54 44 52 36 C50 30 46 22 38 18 C32 20 28 26 28 32 C32 30 36 32 34 36 C28 38 24 44 26 48 L32 48 L30 56 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
        <circle cx="36" cy="28" r="2" fill="#0F172A"/>
    </svg>`,

    'badge_streak_society_365': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Medal Ribbon -->
        <polygon points="30,12 36,28 30,34 24,12" fill="#EF4444"/>
        <polygon points="50,12 44,28 50,34 56,12" fill="#DC2626"/>
        <!-- Gold Medallion -->
        <circle cx="40" cy="44" r="20" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <circle cx="40" cy="44" r="16" fill="#FBBF24"/>
        <!-- Flame Icon & 365 -->
        <path d="M40 32 C43 36 44 38 44 41 C44 44 42 46 40 46 C38 46 36 44 36 41 C36 38 37 36 40 32 Z" fill="#EA580C"/>
        <text x="40" y="54" font-size="8" font-weight="900" text-anchor="middle" fill="#78350F" font-family="sans-serif">365</text>
    </svg>`,

    'badge_streak_society_500': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="24" fill="#0F172A" stroke="#F59E0B" stroke-width="3"/>
        <polygon points="40,22 43,30 52,30 45,35 48,43 40,38 32,43 35,35 28,30 37,30" fill="#F59E0B"/>
        <text x="40" y="56" font-size="11" font-weight="900" text-anchor="middle" fill="#F59E0B" font-family="sans-serif">500</text>
    </svg>`,

    'badge_streak_society_1000': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Mythic Titan Diamond Shield -->
        <polygon points="40,14 62,24 58,54 40,68 22,54 18,24" fill="#6366F1" stroke="#4F46E5" stroke-width="2"/>
        <polygon points="40,20 54,28 50,50 40,60 30,50 26,28" fill="#818CF8"/>
        <text x="40" y="44" font-size="9" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">1000</text>
        <text x="40" y="52" font-size="6" font-weight="800" text-anchor="middle" fill="#C7D2FE" font-family="sans-serif">DAYS</text>
    </svg>`,

    'badge_friend_quest_champion': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Clapped Hands Badge -->
        <circle cx="40" cy="40" r="22" fill="#58CC02" stroke="#16A34A" stroke-width="2"/>
        <path d="M28 42 L36 36 L44 42 L42 46 L34 40 L28 44 Z" fill="#FFFFFF"/>
        <path d="M52 42 L44 36 L36 42 L38 46 L46 40 L52 44 Z" fill="#FEF08A"/>
        <path d="M40 28 C41 26 44 26 45 28 C46 30 44 32 40 35 C36 32 34 30 35 28 C36 26 39 26 40 28 Z" fill="#EF4444"/>
    </svg>`,

    'badge_wildfire_champion': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Roaring Triple Wildfire Flame -->
        <path d="M40 14 C48 24 56 34 56 46 C56 56 48 64 40 64 C32 64 24 56 24 46 C24 34 32 24 40 14 Z" fill="#F97316"/>
        <path d="M40 26 C45 32 50 40 50 48 C50 54 45 60 40 60 C35 60 30 54 30 48 C30 40 35 32 40 26 Z" fill="#FACC15"/>
        <path d="M40 38 C42 42 44 46 44 50 C44 54 42 56 40 56 C38 56 36 54 36 50 C36 46 38 42 40 38 Z" fill="#FFFFFF"/>
    </svg>`,

    'badge_sharpshooter_master': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Target Bullseye -->
        <circle cx="40" cy="40" r="24" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
        <circle cx="40" cy="40" r="18" fill="#FFFFFF"/>
        <circle cx="40" cy="40" r="12" fill="#EF4444"/>
        <circle cx="40" cy="40" r="6" fill="#FACC15"/>
        <!-- Golden Arrow -->
        <line x1="20" y1="20" x2="40" y2="40" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
        <polygon points="40,40 34,36 36,34" fill="#FACC15"/>
    </svg>`,

    'badge_speed_racer': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="22" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
        <!-- Golden Lightning Bolt -->
        <polygon points="44,18 26,38 38,38 34,58 54,34 42,34" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
    </svg>`,

    // ----------------------------------------------------
    // 4. STREAK PROTECTION, BOOSTERS & HEARTS
    // ----------------------------------------------------
    'streak_freeze': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Ice Cube -->
        <polygon points="40,16 64,28 40,40 16,28" fill="#BAE6FD" stroke="#38BDF8" stroke-width="2"/>
        <polygon points="16,28 40,40 40,64 16,52" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
        <polygon points="64,28 40,40 40,64 64,52" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
        <!-- Snowflake on Top -->
        <line x1="40" y1="22" x2="40" y2="34" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="28" x2="48" y2="28" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    'streak_freeze_pack': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 2x Double Freeze Pack -->
        <polygon points="32,14 52,24 32,34 12,24" fill="#BAE6FD" stroke="#38BDF8" stroke-width="1.5"/>
        <polygon points="12,24 32,34 32,54 12,44" fill="#38BDF8"/>
        <polygon points="52,24 32,34 32,54 52,44" fill="#0284C7"/>
        <polygon points="48,24 68,34 48,44 28,34" fill="#BAE6FD" stroke="#38BDF8" stroke-width="1.5"/>
        <polygon points="28,34 48,44 48,64 28,54" fill="#38BDF8"/>
        <polygon points="68,34 48,44 48,64 68,54" fill="#0284C7"/>
        <circle cx="58" cy="22" r="9" fill="#EF4444"/>
        <text x="58" y="26" font-size="10" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">2x</text>
    </svg>`,

    'streak_society_shield': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- 7-Day Super Shield -->
        <path d="M40 14 L62 22 L58 48 C56 58 40 66 40 66 C40 66 24 58 22 48 L18 22 Z" fill="#58CC02" stroke="#16A34A" stroke-width="2.5"/>
        <!-- Shield Boss with Flame -->
        <circle cx="40" cy="38" r="12" fill="#FACC15"/>
        <path d="M40 30 C43 34 44 36 44 39 C44 42 42 44 40 44 C38 44 36 42 36 39 C36 36 37 34 40 30 Z" fill="#EA580C"/>
        <text x="40" y="58" font-size="9" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">7 DAYS</text>
    </svg>`,

    'heart_refill_full': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Big Full Heart -->
        <path d="M40 26 C43 18 56 18 60 26 C64 34 54 46 40 58 C26 46 16 34 20 26 C24 18 37 18 40 26 Z" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
        <circle cx="30" cy="24" r="3" fill="#F87171"/>
        <text x="40" y="44" font-size="14" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">+5</text>
    </svg>`,

    'unlimited_hearts_pass': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Infinity Heart Pass -->
        <circle cx="40" cy="40" r="24" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
        <!-- Infinity Loop in Gold & Cyan -->
        <path d="M30 40 C30 34 36 34 40 40 C44 46 50 46 50 40 C50 34 44 34 40 40 C36 46 30 46 30 40 Z" fill="none" stroke="#FACC15" stroke-width="5" stroke-linecap="round"/>
        <!-- Small Heart in center -->
        <path d="M40 24 C41 22 43 22 44 24 C45 26 43 28 40 31 C37 28 35 26 36 24 C37 22 39 22 40 24 Z" fill="#EF4444"/>
    </svg>`,

    'weekend_amulet': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Silver Chain -->
        <path d="M26 16 C30 28 50 28 54 16" fill="none" stroke="#94A3B8" stroke-width="2"/>
        <!-- Amulet Stone -->
        <polygon points="40,24 54,34 50,56 40,64 30,56 26,34" fill="#6366F1" stroke="#4F46E5" stroke-width="2"/>
        <circle cx="40" cy="44" r="8" fill="#A5B4FC"/>
        <polygon points="40,38 43,44 40,50 37,44" fill="#312E81"/>
    </svg>`,

    'double_or_nothing_wager': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Two Blue Gems -->
        <polygon points="32,22 42,30 32,44 22,30" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
        <polygon points="48,22 58,30 48,44 38,30" fill="#0284C7" stroke="#0369A1" stroke-width="1.5"/>
        <!-- 2X Banner -->
        <rect x="22" y="46" width="36" height="14" rx="4" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
        <text x="40" y="57" font-size="11" font-weight="900" text-anchor="middle" fill="#78350F" font-family="sans-serif">2X GEM</text>
    </svg>`,

    'early_bird_boost_15m': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="24" fill="#FEF08A" stroke="#EAB308" stroke-width="2"/>
        <!-- Rising Sun -->
        <path d="M26 46 A14 14 0 0 1 54 46 Z" fill="#F97316"/>
        <line x1="40" y1="24" x2="40" y2="28" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="28" y1="28" x2="31" y2="31" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="52" y1="28" x2="49" y2="31" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"/>
        <!-- 2x XP Pill -->
        <rect x="26" y="48" width="28" height="12" rx="3" fill="#58CC02"/>
        <text x="40" y="57" font-size="8" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">2X XP</text>
    </svg>`,

    'night_owl_boost_15m': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="24" fill="#1E1B4B" stroke="#4338CA" stroke-width="2"/>
        <!-- Crescent Moon -->
        <path d="M46 22 A14 14 0 1 0 46 50 A16 16 0 0 1 46 22 Z" fill="#FACC15"/>
        <circle cx="30" cy="26" r="1.5" fill="#FFFFFF"/>
        <circle cx="52" cy="36" r="1.5" fill="#FFFFFF"/>
        <!-- 2x XP Pill -->
        <rect x="26" y="50" width="28" height="12" rx="3" fill="#6366F1"/>
        <text x="40" y="59" font-size="8" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">2X XP</text>
    </svg>`,

    'timer_boost_extra': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Stopwatch Timer -->
        <circle cx="40" cy="44" r="20" fill="#F8FAFC" stroke="#0F172A" stroke-width="2"/>
        <rect x="37" y="18" width="6" height="6" fill="#0F172A"/>
        <line x1="40" y1="44" x2="40" y2="32" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="40" y1="44" x2="48" y2="44" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>
        <!-- +60s Tag -->
        <rect x="24" y="52" width="32" height="12" rx="3" fill="#58CC02"/>
        <text x="40" y="61" font-size="8" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">+60s</text>
    </svg>`,

    // ----------------------------------------------------
    // 5. CHESTS & BONUS DROPS
    // ----------------------------------------------------
    'early_bird_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Sunbeam Early Bird Chest -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#B45309" stroke="#78350F" stroke-width="2"/>
        <path d="M16 36 Q40 22 64 36 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#78350F"/>
        <!-- Sunburst latch -->
        <polygon points="40,24 41,20 44,22 47,19 46,24" fill="#FACC15"/>
    </svg>`,

    'night_owl_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Night Owl Indigo Chest -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#312E81" stroke="#1E1B4B" stroke-width="2"/>
        <path d="M16 36 Q40 22 64 36 Z" fill="#4338CA" stroke="#312E81" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#C7D2FE" stroke="#818CF8" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#1E1B4B"/>
        <!-- Moon Emblem -->
        <path d="M42 22 A5 5 0 1 0 42 30 A6 6 0 0 1 42 22 Z" fill="#FACC15"/>
    </svg>`,

    'free_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Daily Gift Box -->
        <rect x="20" y="34" width="40" height="30" rx="3" fill="#58CC02" stroke="#16A34A" stroke-width="2"/>
        <rect x="18" y="28" width="44" height="10" rx="2" fill="#46A302"/>
        <!-- Red Ribbon -->
        <rect x="36" y="28" width="8" height="36" fill="#EF4444"/>
        <rect x="20" y="44" width="40" height="8" fill="#EF4444"/>
        <!-- Ribbon Bow -->
        <circle cx="34" cy="24" r="5" fill="#EF4444"/>
        <circle cx="46" cy="24" r="5" fill="#EF4444"/>
    </svg>`,

    'friends_quest_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Friends Co-op Chest -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#0D9488" stroke="#115E59" stroke-width="2"/>
        <path d="M16 36 Q40 22 64 36 Z" fill="#14B8A6" stroke="#0D9488" stroke-width="2"/>
        <!-- Dual Heart Lock -->
        <rect x="34" y="34" width="12" height="12" rx="3" fill="#FACC15"/>
        <path d="M40 37 C40.5 35 42 35 42.5 37 C43 39 42 41 40 43 C38 41 37 39 37.5 37 C38 35 39.5 35 40 37 Z" fill="#EF4444"/>
    </svg>`,

    'monthly_challenge_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Gold Challenge Vault -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#B45309" stroke="#78350F" stroke-width="2"/>
        <path d="M16 36 Q40 20 64 36 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
        <!-- Badge Star Seal -->
        <circle cx="40" cy="42" r="9" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <polygon points="40,36 42,40 46,40 43,43 44,47 40,44 36,47 37,43 34,40 38,40" fill="#B45309"/>
    </svg>`,

    'diamond_league_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Diamond Crystal Chest -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#0369A1" stroke="#075985" stroke-width="2"/>
        <path d="M16 36 Q40 18 64 36 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/>
        <!-- Glowing Diamond Latch -->
        <polygon points="40,30 48,38 40,48 32,38" fill="#E0F2FE" stroke="#38BDF8" stroke-width="1.5"/>
        <polygon points="40,34 44,38 40,44 36,38" fill="#38BDF8"/>
    </svg>`,

    'obsidian_league_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <!-- Obsidian Purple Chest -->
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#18181B" stroke="#09090B" stroke-width="2"/>
        <path d="M16 36 Q40 20 64 36 Z" fill="#3F3F46" stroke="#27272A" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#A855F7" stroke="#7E22CE" stroke-width="1.5"/>
        <polygon points="40,37 42,41 40,44 38,41" fill="#FFFFFF"/>
    </svg>`,

    'emerald_league_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#065F46" stroke="#064E3B" stroke-width="2"/>
        <path d="M16 36 Q40 20 64 36 Z" fill="#10B981" stroke="#059669" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#065F46"/>
    </svg>`,

    'ruby_league_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#881337" stroke="#4C0519" stroke-width="2"/>
        <path d="M16 36 Q40 20 64 36 Z" fill="#F43F5E" stroke="#E11D48" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#881337"/>
    </svg>`,

    'sapphire_league_chest': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="36" width="44" height="28" rx="4" fill="#1E3A8A" stroke="#172554" stroke-width="2"/>
        <path d="M16 36 Q40 20 64 36 Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
        <rect x="36" y="34" width="8" height="12" rx="2" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#1E3A8A"/>
    </svg>`
};

console.log('Writing 58 handcrafted item SVGs...');
let count = 0;
for (const [id, svgContent] of Object.entries(SVGS)) {
    const filePath = path.join(OUT_DIR, `${id}.svg`);
    fs.writeFileSync(filePath, svgContent.trim());
    count++;
}
console.log(`Successfully generated ${count} tailored item SVGs in ${OUT_DIR}`);
