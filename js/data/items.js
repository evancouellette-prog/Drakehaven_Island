/* Drakehaven Island — every object you can hold, wear, drink or sell. */
window.DH = window.DH || {};

DH.ITEMS = {
  /* ============================ SIMPLE WEAPONS ============================ */
  club: { name: 'Club', kind: 'weapon', dmg: '1d4', type: 'bludgeoning', props: ['light'], price: 1, cat: 'simple', art: 'mace' },
  dagger: { name: 'Dagger', kind: 'weapon', dmg: '1d4', type: 'piercing', props: ['finesse', 'light', 'thrown'], range: [20, 60], price: 2, cat: 'simple', art: 'dagger' },
  greatclub: { name: 'Greatclub', kind: 'weapon', dmg: '1d8', type: 'bludgeoning', props: ['two_handed'], price: 2, cat: 'simple', art: 'hammer' },
  handaxe: { name: 'Handaxe', kind: 'weapon', dmg: '1d6', type: 'slashing', props: ['light', 'thrown'], range: [20, 60], price: 5, cat: 'simple', art: 'axe' },
  javelin: { name: 'Javelin', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['thrown'], range: [30, 120], price: 1, cat: 'simple', art: 'spear' },
  mace: { name: 'Mace', kind: 'weapon', dmg: '1d6', type: 'bludgeoning', price: 5, cat: 'simple', art: 'mace' },
  quarterstaff: { name: 'Quarterstaff', kind: 'weapon', dmg: '1d6', type: 'bludgeoning', props: ['versatile:1d8'], price: 2, cat: 'simple', art: 'staff' },
  sickle: { name: 'Sickle', kind: 'weapon', dmg: '1d4', type: 'slashing', props: ['light'], price: 1, cat: 'simple', art: 'axe' },
  spear: { name: 'Spear', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['thrown', 'versatile:1d8'], range: [20, 60], price: 1, cat: 'simple', art: 'spear' },
  light_crossbow: { name: 'Light Crossbow', kind: 'weapon', dmg: '1d8', type: 'piercing', props: ['ammunition', 'loading', 'two_handed'], range: [80, 320], price: 25, cat: 'simple', art: 'bow', ranged: true },
  dart: { name: 'Dart', kind: 'weapon', dmg: '1d4', type: 'piercing', props: ['finesse', 'thrown'], range: [20, 60], price: 1, cat: 'simple', art: 'dagger', stack: true },
  shortbow: { name: 'Shortbow', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['ammunition', 'two_handed'], range: [80, 320], price: 25, cat: 'simple', art: 'bow', ranged: true },
  sling: { name: 'Sling', kind: 'weapon', dmg: '1d4', type: 'bludgeoning', props: ['ammunition'], range: [30, 120], price: 1, cat: 'simple', art: 'dagger', ranged: true },
  belaying_pin: { name: 'Belaying Pin', kind: 'weapon', dmg: '1d4', type: 'bludgeoning', props: ['light'], price: 1, cat: 'simple', art: 'mace', desc: 'A sailor\'s club with a job description.' },

  /* ============================ MARTIAL WEAPONS ============================ */
  battleaxe: { name: 'Battleaxe', kind: 'weapon', dmg: '1d8', type: 'slashing', props: ['versatile:1d10'], price: 10, cat: 'martial', art: 'axe' },
  flail: { name: 'Flail', kind: 'weapon', dmg: '1d8', type: 'bludgeoning', price: 10, cat: 'martial', art: 'mace' },
  glaive: { name: 'Glaive', kind: 'weapon', dmg: '1d10', type: 'slashing', props: ['heavy', 'reach', 'two_handed'], price: 20, cat: 'martial', art: 'spear' },
  greataxe: { name: 'Greataxe', kind: 'weapon', dmg: '1d12', type: 'slashing', props: ['heavy', 'two_handed'], price: 30, cat: 'martial', art: 'axe' },
  greatsword: { name: 'Greatsword', kind: 'weapon', dmg: '2d6', type: 'slashing', props: ['heavy', 'two_handed'], price: 50, cat: 'martial', art: 'greatsword' },
  halberd: { name: 'Halberd', kind: 'weapon', dmg: '1d10', type: 'slashing', props: ['heavy', 'reach', 'two_handed'], price: 20, cat: 'martial', art: 'spear' },
  longsword: { name: 'Longsword', kind: 'weapon', dmg: '1d8', type: 'slashing', props: ['versatile:1d10'], price: 15, cat: 'martial', art: 'sword' },
  maul: { name: 'Maul', kind: 'weapon', dmg: '2d6', type: 'bludgeoning', props: ['heavy', 'two_handed'], price: 10, cat: 'martial', art: 'hammer' },
  morningstar: { name: 'Morningstar', kind: 'weapon', dmg: '1d8', type: 'piercing', price: 15, cat: 'martial', art: 'mace' },
  rapier: { name: 'Rapier', kind: 'weapon', dmg: '1d8', type: 'piercing', props: ['finesse'], price: 25, cat: 'martial', art: 'sword' },
  scimitar: { name: 'Scimitar', kind: 'weapon', dmg: '1d6', type: 'slashing', props: ['finesse', 'light'], price: 25, cat: 'martial', art: 'sword' },
  shortsword: { name: 'Shortsword', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['finesse', 'light'], price: 10, cat: 'martial', art: 'sword' },
  trident: { name: 'Trident', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['thrown', 'versatile:1d8'], range: [20, 60], price: 5, cat: 'martial', art: 'spear' },
  war_pick: { name: 'War Pick', kind: 'weapon', dmg: '1d8', type: 'piercing', price: 5, cat: 'martial', art: 'axe' },
  warhammer: { name: 'Warhammer', kind: 'weapon', dmg: '1d8', type: 'bludgeoning', props: ['versatile:1d10'], price: 15, cat: 'martial', art: 'hammer' },
  whip: { name: 'Whip', kind: 'weapon', dmg: '1d4', type: 'slashing', props: ['finesse', 'reach'], price: 2, cat: 'martial', art: 'dagger' },
  hand_crossbow: { name: 'Hand Crossbow', kind: 'weapon', dmg: '1d6', type: 'piercing', props: ['ammunition', 'light', 'loading'], range: [30, 120], price: 75, cat: 'martial', art: 'bow', ranged: true },
  heavy_crossbow: { name: 'Heavy Crossbow', kind: 'weapon', dmg: '1d10', type: 'piercing', props: ['ammunition', 'heavy', 'loading', 'two_handed'], range: [100, 400], price: 50, cat: 'martial', art: 'bow', ranged: true },
  longbow: { name: 'Longbow', kind: 'weapon', dmg: '1d8', type: 'piercing', props: ['ammunition', 'heavy', 'two_handed'], range: [150, 600], price: 50, cat: 'martial', art: 'bow', ranged: true },
  unarmed: { name: 'Unarmed Strike', kind: 'weapon', dmg: '1', type: 'bludgeoning', props: ['light'], price: 0, cat: 'natural', art: 'fists' },
  horns: { name: 'Horns', kind: 'weapon', dmg: '1d6', type: 'piercing', price: 0, cat: 'natural', art: 'fists' },
  claws: { name: 'Claws', kind: 'weapon', dmg: '1d4', type: 'slashing', props: ['finesse', 'light'], price: 0, cat: 'natural', art: 'fists' },

  /* ============================ ARMOUR ============================ */
  padded: { name: 'Padded Armour', kind: 'armor', armorKind: 'light', ac: 11, stealthDis: true, price: 5 },
  leather_armor: { name: 'Leather Armour', kind: 'armor', armorKind: 'light', ac: 11, price: 10 },
  studded_leather: { name: 'Studded Leather', kind: 'armor', armorKind: 'light', ac: 12, price: 45 },
  hide_armor: { name: 'Hide Armour', kind: 'armor', armorKind: 'medium', ac: 12, dexCap: 2, price: 10 },
  chain_shirt: { name: 'Chain Shirt', kind: 'armor', armorKind: 'medium', ac: 13, dexCap: 2, price: 50 },
  scale_mail: { name: 'Scale Mail', kind: 'armor', armorKind: 'medium', ac: 14, dexCap: 2, stealthDis: true, price: 50 },
  breastplate: { name: 'Breastplate', kind: 'armor', armorKind: 'medium', ac: 14, dexCap: 2, price: 400 },
  half_plate: { name: 'Half Plate', kind: 'armor', armorKind: 'medium', ac: 15, dexCap: 2, stealthDis: true, price: 750 },
  ring_mail: { name: 'Ring Mail', kind: 'armor', armorKind: 'heavy', ac: 14, dexCap: 0, stealthDis: true, price: 30 },
  chain_mail: { name: 'Chain Mail', kind: 'armor', armorKind: 'heavy', ac: 16, dexCap: 0, stealthDis: true, str: 13, price: 75 },
  splint: { name: 'Splint Armour', kind: 'armor', armorKind: 'heavy', ac: 17, dexCap: 0, stealthDis: true, str: 15, price: 200 },
  plate: { name: 'Plate Armour', kind: 'armor', armorKind: 'heavy', ac: 18, dexCap: 0, stealthDis: true, str: 15, price: 1500 },
  shield: { name: 'Shield', kind: 'armor', armorKind: 'shield', acBonus: 2, price: 10 },

  /* ============================ THE POTION STAND ============================
     Stock and prices exactly as the trader in the Drakehaven market lists them. */
  potion_pugilism: {
    name: 'Potion of Pugilism', kind: 'potion', price: 45, rarity: 'common',
    desc: 'For 10 minutes you deal an extra 1d6 damage with unarmed strikes.',
    use: { buff: { unarmedBonus: '1d6' }, dur: 100 }
  },
  potion_speed: {
    name: 'Potion of Speed', kind: 'potion', price: 195, rarity: 'rare',
    desc: 'You gain the effect of Haste for one turn, without the lethargy afterwards.',
    use: { buff: { hasted: true }, dur: 1, noLethargy: true }
  },
  potion_growth: {
    name: 'Potion of Growth', kind: 'potion', price: 60, rarity: 'uncommon',
    desc: 'For 10 minutes you are enlarged: one size larger, advantage on Strength, +1d4 weapon damage.',
    use: { cond: 'enlarged', dur: 100 }
  },
  potion_greater_healing: {
    name: 'Potion of Greater Healing', kind: 'potion', price: 45, rarity: 'uncommon',
    desc: 'Restores 4d4 + 4 hit points.', use: { heal: '4d4+4' }
  },
  potion_healing: {
    name: 'Potion of Healing', kind: 'potion', price: 25, rarity: 'common',
    desc: 'Restores 2d4 + 2 hit points.', use: { heal: '2d4+2' }
  },
  potion_resistance: {
    name: 'Potion of Resistance', kind: 'potion', price: 55, rarity: 'uncommon',
    desc: 'For one hour you have resistance to one damage type. The stand keeps one of each.',
    use: { buff: { resistChoice: true }, dur: 600 }
  },
  potion_gaseous: {
    name: 'Potion of Gaseous Form', kind: 'potion', price: 40, rarity: 'uncommon',
    desc: 'For one hour you have the effect of the Gaseous Form spell.',
    use: { buff: { gaseous: true }, dur: 600 }
  },
  potion_animal_friendship: {
    name: 'Potion of Animal Friendship', kind: 'potion', price: 60, rarity: 'uncommon',
    desc: 'For one hour you have the effect of the Animal Friendship spell.',
    use: { buff: { animalFriend: true }, dur: 600 }
  },
  potion_magical_action: {
    name: 'Potion of Magical Action', kind: 'potion', price: 30, rarity: 'common',
    desc: 'For one hour, when you use Action Surge you may also take the Magic action.',
    use: { buff: { magicalAction: true }, dur: 600 }
  },
  potion_calm_dragon: {
    name: 'Draught of Calm Scales', kind: 'potion', price: 120, rarity: 'rare',
    desc: 'The gnome\'s cure. A raging dragon that drinks it stops raging. Small ones, at least.',
    use: { calmDragon: true }
  },
  green_potion: {
    name: 'Green Potion', kind: 'potion', price: 0, rarity: 'uncommon', quest: true,
    desc: 'Five of these materialised in your pocket on the order of the Command Pod. Feed one to a dragonborn whose eyes are glowing.',
    use: { heal: '2d4+2', steadyDragonblood: true }
  },
  healing_ointment: {
    name: 'Healing Ointment', kind: 'potion', price: 110, rarity: 'uncommon',
    desc: 'A jar with three applications. Each restores 2d8 + 2 hit points and cures one poison.',
    charges: 3, use: { heal: '2d8+2', cure: ['poisoned'] }
  },

  /* ============================ THE SHADY MAN ============================ */
  wyvern_poison: {
    name: 'Wyvern Poison', kind: 'poison', price: 400, rarity: 'rare', illegal: true,
    desc: 'Coat a blade. A creature wounded by it must make a DC 15 CON save, taking 5d8 poison damage, or half as much on a success.',
    use: { coat: { save: 'con', dc: 15, dmg: '5d8', type: 'poison', half: true } }
  },
  crawlers_mucus: {
    name: 'Crawler\'s Mucus', kind: 'poison', price: 400, rarity: 'rare', illegal: true,
    desc: 'Contact poison. DC 14 CON save or the creature is paralysed for one turn.',
    use: { coat: { save: 'con', dc: 14, cond: 'paralyzed', dur: 1 } }
  },
  mystery_key: {
    name: 'Mystery Key', kind: 'quest', price: 25, illegal: true,
    desc: 'It opens something. The shady man does not know what, and says so with a straight face.'
  },
  necklace_adaptation: {
    name: 'Necklace of Adaptation', kind: 'wondrous', slot: 'neck', price: 90, rarity: 'uncommon', attune: true,
    desc: 'While you wear it you can breathe normally in any atmosphere, and you have advantage on saves against harmful gases.',
    effects: ['breathe_anything', 'adv_vs_gas']
  },

  /* ============================ CAMPAIGN TREASURE ============================ */
  hag_necklace: {
    name: 'Sea Hag\'s Glimmering Necklace', kind: 'wondrous', slot: 'neck', price: 250, rarity: 'uncommon', attune: true,
    desc: 'Salt-crusted silver, still cold. Once per short rest it grants advantage on one d20 test.',
    effects: ['boon_advantage'], charges: 1, recharge: 'short'
  },
  blue_brass_knuckles: {
    name: 'Blue Brass Knuckles', kind: 'weapon', slot: 'hands', price: 600, rarity: 'rare', attune: true,
    dmg: '1d6', type: 'bludgeoning', props: ['light'], cat: 'natural', art: 'fists', brass: true,
    desc: 'Enspelled. Your unarmed strikes add 1d6 damage and knock the target 10 ft back. As an action you may cast Booming Blade through them.',
    effects: ['unarmed_bonus:1d6', 'unarmed_push:10', 'enspelled:booming_blade']
  },
  ring_of_protection: {
    name: 'Ring of Protection', kind: 'wondrous', slot: 'ring', price: 700, rarity: 'rare', attune: true,
    desc: '+1 to AC and to all saving throws.', effects: ['ac:1', 'saves:1']
  },
  crown_of_the_wight: {
    name: 'Crown of the Pale King', kind: 'wondrous', slot: 'head', price: 900, rarity: 'rare', attune: true,
    desc: 'Taken from the Wight\'s head. All your attacks deal an extra 1d4 necrotic damage. You may speak with the recently dead, briefly raise one, and command a weak undead.',
    effects: ['attack_bonus_dmg:1d4:necrotic', 'speak_with_dead', 'command_undead']
  },
  grimey_armguards: {
    name: 'Tinkered Arm Guards', kind: 'wondrous', slot: 'arms', price: 400, rarity: 'uncommon', attune: true,
    desc: 'A trial-maker\'s gift. +1 AC, and you may reduce one instance of bludgeoning damage by 1d6 as a reaction.',
    effects: ['ac:1', 'reduce_bludgeoning:1d6']
  },
  endless_quiver: {
    name: 'Quiver of the Steady Hand', kind: 'wondrous', slot: 'back', price: 400, rarity: 'uncommon', attune: true,
    desc: 'It never empties, and the first ranged attack you make each turn gains +1 to hit.',
    effects: ['infinite_ammo', 'first_ranged_bonus:1']
  },
  cloak_of_the_quiet: {
    name: 'Cloak of the Quiet Step', kind: 'wondrous', slot: 'back', price: 400, rarity: 'uncommon', attune: true,
    desc: 'Advantage on Stealth checks, and you leave no sound on stone.',
    effects: ['adv_stealth']
  },
  tinkers_watch: {
    name: 'Tinker\'s Watch', kind: 'wondrous', slot: 'trinket', price: 400, rarity: 'uncommon',
    desc: 'It ticks a half-second ahead of everything else. Once per long rest, take an extra Ending Action.',
    effects: ['extra_ending_action'], charges: 1, recharge: 'long'
  },
  odd_red_hat: {
    name: 'Odd Red Hat', kind: 'wondrous', slot: 'head', price: 300, rarity: 'uncommon', attune: true,
    desc: 'Far too red. While you wear it, once per short rest you may reroll a failed saving throw against a dragon\'s breath.',
    effects: ['reroll_breath_save'], charges: 1, recharge: 'short'
  },
  minotaur_charm: {
    name: 'Boy\'s Carved Charm', kind: 'wondrous', slot: 'trinket', price: 150, rarity: 'uncommon',
    desc: 'A minotaur calf carved from horn, given by a very frightened, very grateful child. +1 to saves against being frightened, and it makes you feel better to carry it.',
    effects: ['save_vs_fear:1']
  },
  red_flower: {
    name: 'Mayor\'s Red Flower', kind: 'quest', price: 0,
    desc: 'A cut bloom from the town hall\'s window box, given as thanks. It has not wilted since.'
  },
  town_parchment: {
    name: 'Defence Muster Parchment', kind: 'quest', price: 0,
    desc: 'Signs you up to defend Drakehaven tomorrow. Your name is on it now.'
  },
  ball_invitation: {
    name: 'Invitation to the Grand Ball', kind: 'quest', price: 0,
    desc: 'Heavy paper, gold leaf, a wax seal shaped like an egg. No dragons admitted.'
  },
  shady_map: {
    name: 'The Shady Man\'s Map', kind: 'quest', price: 0,
    desc: 'A route to a manor house, and a face circled in charcoal. Two months, or you become the target.'
  },
  grimey_map: {
    name: 'The Gnome\'s Map of Drakehaven', kind: 'quest', price: 0,
    desc: 'Hand-drawn and surprisingly accurate. Baycrest is marked, and so is a clearing in the forest.'
  },
  golden_egg_shard: {
    name: 'Shard of Golden Shell', kind: 'quest', price: 500,
    desc: 'Warm to the touch. It hums when a dragon is near.'
  },

  /* ============================ PACT EQUIPMENT ============================ */
  pact_pod: {
    name: 'P.A.C.T. Pod', kind: 'wondrous', slot: 'pod', price: 0, quest: true,
    desc: 'A purple pod the size of a large egg. It tracks the other pods as red dots, and the blue "S" button raises a shield around whoever presses it. Personalises once you are strong enough.',
    effects: ['pod']
  },
  command_pod: {
    name: 'Command Pod', kind: 'wondrous', slot: 'none', price: 0, quest: true,
    desc: 'The big one. It recharges four pods on a long rest, and the higher-ups speak and send supplies through it.',
    effects: ['command_pod']
  },

  /* ============================ TOOLS & GEAR ============================ */
  thieves_tools: { name: 'Thieves\' Tools', kind: 'tool', price: 25, desc: 'Picks, files and a small mirror. Proficiency lets you add it to lock and trap checks.' },
  smiths_tools: { name: 'Smith\'s Tools', kind: 'tool', price: 20 },
  herbalism_kit: { name: 'Herbalism Kit', kind: 'tool', price: 5, desc: 'Turn foraged herbs into potions at a workbench.' },
  navigators_tools: { name: 'Navigator\'s Tools', kind: 'tool', price: 25 },
  disguise_kit: { name: 'Disguise Kit', kind: 'tool', price: 25 },
  forgery_kit: { name: 'Forgery Kit', kind: 'tool', price: 15 },
  tinkers_tools: { name: 'Tinker\'s Tools', kind: 'tool', price: 50 },
  dice_set: { name: 'Set of Dice', kind: 'tool', price: 1, desc: 'For Dragon\'s Hoard and worse decisions.' },
  weighted_dice: { name: 'Charlatan\'s Dice', kind: 'tool', price: 10, illegal: true, desc: 'They land how you want. The captain has a set and thinks nobody has noticed.' },
  gaming_set: { name: 'Gaming Set', kind: 'tool', price: 2 },
  musical_instrument: { name: 'Musical Instrument', kind: 'tool', price: 20 },
  lute: { name: 'Lute', kind: 'tool', price: 35 },
  shovel: { name: 'Shovel', kind: 'tool', price: 2, desc: 'At the collapsed cave mouth, holding one makes the digging much easier.' },
  crowbar: { name: 'Crowbar', kind: 'tool', price: 2 },
  rope_50ft: { name: '50 ft of Rope', kind: 'gear', price: 1 },
  torch: { name: 'Torch', kind: 'gear', price: 1, stack: true, desc: 'Bright light 20 ft. Also sets fire to a rotting gelatinous cube.' },
  lantern: { name: 'Hooded Lantern', kind: 'gear', price: 5 },
  rations: { name: 'Rations', kind: 'food', price: 1, stack: true, use: { heal: '1d4' } },
  arrows: { name: 'Arrows', kind: 'ammo', price: 1, stack: true },
  bolts: { name: 'Crossbow Bolts', kind: 'ammo', price: 1, stack: true },
  holy_symbol: { name: 'Holy Symbol', kind: 'focus', price: 5 },
  arcane_focus: { name: 'Arcane Focus', kind: 'focus', price: 10 },
  druidic_focus: { name: 'Druidic Focus', kind: 'focus', price: 10 },
  spellbook: { name: 'Spellbook', kind: 'focus', price: 50 },
  explorers_pack: { name: 'Explorer\'s Pack', kind: 'pack', price: 10, contains: ['rope_50ft', 'torch', 'torch', 'rations', 'rations'] },
  dungeoneers_pack: { name: 'Dungeoneer\'s Pack', kind: 'pack', price: 12, contains: ['crowbar', 'torch', 'torch', 'rations', 'rope_50ft'] },
  burglars_pack: { name: 'Burglar\'s Pack', kind: 'pack', price: 16, contains: ['rope_50ft', 'torch', 'crowbar', 'rations'] },
  priests_pack: { name: 'Priest\'s Pack', kind: 'pack', price: 19, contains: ['rations', 'rations', 'torch', 'incense'] },
  scholars_pack: { name: 'Scholar\'s Pack', kind: 'pack', price: 40, contains: ['ink_and_quill', 'rations'] },
  entertainers_pack: { name: 'Entertainer\'s Pack', kind: 'pack', price: 40, contains: ['costume', 'rations', 'rations'] },
  incense: { name: 'Incense', kind: 'gear', price: 1 },
  ink_and_quill: { name: 'Ink and Quill', kind: 'gear', price: 10 },
  prayer_book: { name: 'Prayer Book', kind: 'gear', price: 5 },
  small_knife: { name: 'Small Knife', kind: 'gear', price: 1 },
  fine_clothes: { name: 'Fine Clothes', kind: 'gear', price: 15, desc: 'You will need these at the ball.' },
  travelers_clothes: { name: 'Traveller\'s Clothes', kind: 'gear', price: 2 },
  dark_clothes: { name: 'Dark Common Clothes', kind: 'gear', price: 1 },
  costume: { name: 'Costume', kind: 'gear', price: 5 },
  signet_ring: { name: 'Signet Ring', kind: 'gear', price: 5 },
  insignia_of_rank: { name: 'Insignia of Rank', kind: 'gear', price: 0 },
  trophy_from_battle: { name: 'Battle Trophy', kind: 'gear', price: 0 },
  lucky_charm: { name: 'Sailor\'s Lucky Charm', kind: 'gear', price: 0 },
  letter_of_introduction: { name: 'Letter of Introduction', kind: 'gear', price: 0 },
  scroll_of_pedigree: { name: 'Scroll of Pedigree', kind: 'gear', price: 0 },
  unfinished_letter: { name: 'Unfinished Letter', kind: 'gear', price: 0 },
  city_map: { name: 'Map of a City', kind: 'gear', price: 0 },
  pet_mouse: { name: 'Pet Mouse', kind: 'gear', price: 0, desc: 'Her name is Button and she is not for sale.' },
  admirers_favor: { name: 'Admirer\'s Favour', kind: 'gear', price: 0 },
  hunting_trap: { name: 'Hunting Trap', kind: 'gear', price: 5 },
  iron_pot: { name: 'Iron Pot', kind: 'gear', price: 2 },
  staff: { name: 'Walking Staff', kind: 'weapon', dmg: '1d6', type: 'bludgeoning', props: ['versatile:1d8'], cat: 'simple', art: 'staff', price: 2 },

  /* ============================ FORAGED & CRAFTED ============================ */
  herb_bloodroot: { name: 'Bloodroot', kind: 'material', price: 8, stack: true, desc: 'Bitter red root. The base of any healing draught.' },
  herb_seaglass_moss: { name: 'Seaglass Moss', kind: 'material', price: 10, stack: true, desc: 'Grows only where salt spray reaches. Cools a burn and a temper.' },
  herb_emberleaf: { name: 'Emberleaf', kind: 'material', price: 12, stack: true, desc: 'Warm to the touch even in the rain.' },
  mushroom_cap: { name: 'Cave Cap', kind: 'material', price: 6, stack: true, desc: 'Pale and faintly luminous.' },
  driftwood: { name: 'Driftwood', kind: 'material', price: 2, stack: true },
  ore_copper: { name: 'Copper Ore', kind: 'material', price: 15, stack: true },
  ore_iron: { name: 'Iron Ore', kind: 'material', price: 30, stack: true },
  ore_silver: { name: 'Silver Ore', kind: 'material', price: 60, stack: true },
  dragon_scale: { name: 'Dragon Scale', kind: 'material', price: 90, stack: true, desc: 'Still faintly warm. Worth a great deal to the right buyer.' },
  fish_cod: { name: 'Salt Cod', kind: 'food', price: 8, stack: true, use: { heal: '1d6' } },
  fish_eel: { name: 'Harbour Eel', kind: 'food', price: 14, stack: true, use: { heal: '1d8' } },
  fish_glimmer: { name: 'Glimmerfin', kind: 'food', price: 45, stack: true, use: { heal: '2d6' }, desc: 'Rare, and it glows a little. Little Mimsy pays well for these.' },
  bread: { name: 'Fresh Bread', kind: 'food', price: 3, stack: true, use: { heal: '1d4' }, desc: 'The market smells of it before you even step off the dock.' },
  cheese: { name: 'Hard Cheese', kind: 'food', price: 4, stack: true, use: { heal: '1d4' } },
  spiced_meat: { name: 'Spiced Meat Skewer', kind: 'food', price: 6, stack: true, use: { heal: '1d6' } },
  dragons_breath_drink: {
    name: 'Dragon\'s Breath', kind: 'potion', price: 15,
    desc: 'Little Mimsy\'s special. For 15 minutes you gain a dragonborn breath weapon of your choice — and disadvantage on all Dexterity rolls.',
    use: { buff: { breathWeapon: true, dexDisadvantage: true }, dur: 150 }
  },
  ale: { name: 'Tankard of Ale', kind: 'food', price: 2, stack: true, use: { heal: '1d4', drunk: true } },

  /* ============================ GEMS & VALUABLES ============================ */
  gem_small: { name: 'Cut Amber', kind: 'gem', price: 50, stack: true },
  gem_large: { name: 'Deep Blue Sapphire', kind: 'gem', price: 500, stack: true },
  diamond_dust: { name: 'Diamond Dust', kind: 'material', price: 300, stack: true, desc: 'Three hundred gold of it, which is exactly what Revivify costs.' }
};

/* Fill in ids and defaults. */
Object.keys(DH.ITEMS).forEach(id => {
  const it = DH.ITEMS[id];
  it.id = id;
  if (it.price == null) it.price = 0;
  if (it.kind === 'weapon' && !it.cat) it.cat = 'simple';
});

DH.item = (id) => DH.ITEMS[id];

/* Rough sale value: shops pay a third. */
DH.sellPrice = (id) => Math.max(1, Math.floor((DH.ITEMS[id] ? DH.ITEMS[id].price : 0) / 3));

/* ---------- shop stock ---------- */
DH.SHOPS = {
  potion_stand: {
    name: 'The Potion Stand', keeper: 'Wenna Tolm', music: 'town',
    greet: '"Everythin\' brewed this week, everythin\' labelled. I don\'t sell nothin\' I wouldn\'t drink."',
    stock: [
      { id: 'potion_pugilism', qty: 10 }, { id: 'potion_speed', qty: 2 },
      { id: 'potion_growth', qty: 1 }, { id: 'potion_greater_healing', qty: 5 },
      { id: 'potion_resistance', qty: 10 }, { id: 'potion_gaseous', qty: 1 },
      { id: 'potion_animal_friendship', qty: 1 }, { id: 'potion_magical_action', qty: 3 },
      { id: 'potion_healing', qty: 8 }
    ]
  },
  food_section: {
    name: 'The Food Row', keeper: 'Bessaly Crumb', music: 'town',
    greet: '"Bread\'s out the oven, cheese is older than you, and the skewers are whatever the docks landed."',
    stock: [
      { id: 'bread', qty: 20 }, { id: 'cheese', qty: 12 }, { id: 'spiced_meat', qty: 15 },
      { id: 'rations', qty: 20 }, { id: 'torch', qty: 20 }, { id: 'rope_50ft', qty: 5 },
      { id: 'shovel', qty: 3 }, { id: 'arrows', qty: 40 }, { id: 'bolts', qty: 40 },
      { id: 'herbalism_kit', qty: 2 }
    ]
  },
  shady_man: {
    name: 'The Shady Man', keeper: 'He does not give a name', music: 'town', shady: true,
    greet: '"Do you want to buy anything… nice?"',
    stock: [
      { id: 'wyvern_poison', qty: 2 }, { id: 'crawlers_mucus', qty: 1 },
      { id: 'mystery_key', qty: 5 }, { id: 'necklace_adaptation', qty: 1 }
    ]
  },
  tavern: {
    name: 'The Dragon\'s Keg', keeper: 'Little Mimsy', music: 'tavern',
    greet: '"Heyyyy, can I get you a drinkkk? Our special today is something called Dragon\'s Breath."',
    stock: [
      { id: 'dragons_breath_drink', qty: 6 }, { id: 'ale', qty: 40 },
      { id: 'spiced_meat', qty: 10 }, { id: 'bread', qty: 10 },
      { id: 'potion_healing', qty: 3 }
    ],
    buys: ['fish_cod', 'fish_eel', 'fish_glimmer']
  },
  gnome_lab: {
    name: 'Grimble\'s Workbench', keeper: 'Grimble the Trialsmith', music: 'mine',
    greet: '"You passed my trials. Nobody passes my trials. Yes, all right, you may buy things."',
    stock: [
      { id: 'potion_calm_dragon', qty: 4 }, { id: 'potion_greater_healing', qty: 6 },
      { id: 'potion_resistance', qty: 4 }, { id: 'healing_ointment', qty: 2 },
      { id: 'diamond_dust', qty: 1 }, { id: 'tinkers_tools', qty: 1 }
    ]
  },
  smith: {
    name: 'The Drakehaven Forge', keeper: 'Hesta Ironhale', music: 'town',
    greet: '"You break it, I mend it. You want it sharper, that\'s extra."',
    stock: [
      { id: 'longsword', qty: 3 }, { id: 'greatsword', qty: 1 }, { id: 'greataxe', qty: 2 },
      { id: 'shortsword', qty: 4 }, { id: 'rapier', qty: 2 }, { id: 'warhammer', qty: 2 },
      { id: 'longbow', qty: 2 }, { id: 'shortbow', qty: 3 }, { id: 'light_crossbow', qty: 2 },
      { id: 'shield', qty: 5 }, { id: 'leather_armor', qty: 4 }, { id: 'studded_leather', qty: 2 },
      { id: 'chain_shirt', qty: 2 }, { id: 'scale_mail', qty: 2 }, { id: 'chain_mail', qty: 1 },
      { id: 'breastplate', qty: 1 }, { id: 'thieves_tools', qty: 2 }, { id: 'arrows', qty: 60 }
    ],
    buys: ['ore_copper', 'ore_iron', 'ore_silver', 'dragon_scale']
  }
};

/* ---------- crafting ---------- */
DH.RECIPES = [
  { out: 'potion_healing', qty: 1, need: { herb_bloodroot: 2 }, station: 'workbench', desc: 'Bloodroot, boiled down twice.' },
  { out: 'potion_greater_healing', qty: 1, need: { herb_bloodroot: 3, herb_seaglass_moss: 1 }, station: 'workbench' },
  { out: 'potion_pugilism', qty: 1, need: { herb_emberleaf: 2, mushroom_cap: 1 }, station: 'workbench' },
  { out: 'potion_resistance', qty: 1, need: { herb_seaglass_moss: 2, dragon_scale: 1 }, station: 'workbench' },
  { out: 'torch', qty: 3, need: { driftwood: 1 }, station: 'workbench' },
  { out: 'potion_growth', qty: 1, need: { mushroom_cap: 3, herb_emberleaf: 1 }, station: 'workbench' }
];

/* Loot tables for containers and corpses. */
DH.LOOT = {
  crew_chest: [['rations', 2], ['rope_50ft', 1], ['potion_healing', 1], ['gem_small', 1]],
  hag_hoard: [['hag_necklace', 1], ['gem_small', 2], ['ore_silver', 1]],
  mine_chest: [['gem_small', 2], ['potion_greater_healing', 1], ['diamond_dust', 1]],
  wight_hoard: [['crown_of_the_wight', 1], ['gem_large', 1], ['ore_silver', 2]],
  town_barrel: [['bread', 1], ['ale', 1], ['driftwood', 1]]
};
