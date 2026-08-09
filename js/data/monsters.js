/* Drakehaven Island — every stat block the campaign fights, plus the party you sailed in with.
   Damage strings are rolled by rules/dice.js; `visual` feeds the procedural renderer. */
window.DH = window.DH || {};

const AB = (s, d, c, i, w, ch) => ({ str: s, dex: d, con: c, int: i, wis: w, cha: ch });

DH.MONSTERS = {

  /* ============================ ACT 0 — THE MARY PARKER ============================ */
  sea_hag: {
    name: 'Sea Hag', type: 'fey', cr: 2, xp: 450, hp: 52, ac: 14, speed: 30, swim: 40, init: 1,
    abilities: AB(16, 13, 16, 12, 12, 13),
    resist: [], immune: [], senses: { darkvision: 60 },
    blurb: 'Skin swollen from tan to blue, teeth grown long, hair turned to green seaweed. It came aboard as a drowning man.',
    traits: [
      { name: 'Amphibious', desc: 'It breathes air and water equally well.' },
      { name: 'Horrific Appearance', desc: 'A creature that sees it must make a DC 11 WIS save or be frightened for one minute.', effects: ['fear_aura:11'] },
      { name: 'Drag Under', desc: 'A grappled creature can be hauled overboard, which is how the crew died.', effects: ['drag_under'] }
    ],
    actions: [
      { name: 'Claws', kind: 'attack', atk: 5, reach: 5, dmg: '2d6+3', type: 'slashing', desc: 'Long yellow nails.' },
      { name: 'Grapple', kind: 'grapple', atk: 5, reach: 5, dc: 13, desc: 'Seizes a creature to drag it into the sea.', weight: 2 },
      { name: 'Death Glare', kind: 'save', range: 30, save: { ab: 'wis', dc: 11 }, dmg: '3d6', type: 'psychic', recharge: 3, desc: 'It fixes a frightened creature with a look that stops hearts.' }
    ],
    visual: { body: 'humanoid', skin: '#4a7f9a', hair: '#3f6b3a', cloth: '#2f4a3a', cloth2: '#1f3428', hairStyle: 'seaweed', tusks: true, sleeves: false },
    scale: 1.05, ai: { prefer: 'melee', focus: 'weakest' }
  },
  drowned_man: {
    name: 'The Drowning Man', type: 'humanoid', cr: 0, xp: 10, hp: 12, ac: 10, speed: 20, init: 0,
    abilities: AB(10, 10, 14, 8, 9, 10),
    blurb: 'Very fat, very fine, and standing at an angle a living spine does not permit.',
    actions: [{ name: 'Feeble Grab', kind: 'attack', atk: 2, reach: 5, dmg: '1d4', type: 'bludgeoning' }],
    visual: { body: 'humanoid', skin: '#7f9fae', hair: '#3f5b4a', cloth: '#4a4a52', cloth2: '#33333a', hairStyle: 'long' },
    scale: 1.1, ai: { prefer: 'melee' }
  },
  sailor: {
    name: 'Sailor of the Mary Parker', type: 'humanoid', cr: '1/8', xp: 25, hp: 11, ac: 12, speed: 30, init: 1,
    abilities: AB(12, 12, 12, 10, 10, 11),
    actions: [
      { name: 'Belaying Pin', kind: 'attack', atk: 3, reach: 5, dmg: '1d4+1', type: 'bludgeoning' },
      { name: 'Thrown Bottle', kind: 'attack', atk: 3, range: 30, dmg: '1d4', type: 'slashing' }
    ],
    visual: { body: 'humanoid', skin: '#d8a878', hair: '#5a3a22', cloth: '#8a7350', cloth2: '#4a4a6a', hairStyle: 'short' },
    ai: { prefer: 'melee' }, friendly: true
  },
  captain_hobbs: {
    name: 'Captain Ordell Hobbs', type: 'humanoid', cr: 5, xp: 1800, hp: 105, ac: 15, speed: 30, init: 3,
    /* Exactly the stats the captain was written with. */
    abilities: AB(19, 17, 18, 19, 18, 16),
    saves: { str: 7, con: 7, wis: 7 }, skills: { athletics: 7, intimidation: 6, perception: 7, deception: 6 },
    blurb: 'A fat man at the wheel who yells over the rain and treats "the higher ups" with utmost respect. He fights like a dockside brawl that learned manners.',
    traits: [
      { name: 'Ship\'s Master', desc: 'On a deck he never loses his footing and cannot be knocked prone.', effects: ['sea_legs'] }
    ],
    actions: [
      { name: 'Punch', kind: 'attack', atk: 7, reach: 5, dmg: '4d6+4', type: 'bludgeoning', rider: { save: { ab: 'con', dc: 17 }, cond: 'prone' }, desc: 'On a hit, a DC 17 CON save or you go prone.' },
      { name: 'Sword', kind: 'attack', atk: 7, reach: 5, dmg: '3d10+4', type: 'slashing' },
      { name: 'Sailor Call', kind: 'summon', summon: 'sailor', count: 2, uses: 2, desc: 'Two of the crew pile in.', weight: 2 },
      { name: 'Beatdown', kind: 'combo', punches: 2, grapple: true, dc: 15, desc: 'Punch twice, then grapple.', weight: 3, recharge: 3 }
    ],
    visual: { body: 'humanoid', skin: '#e8b088', hair: '#6a4a22', cloth: '#7a2a30', cloth2: '#3a2a4a', hairStyle: 'short', beard: '#6a4a22', hat: '#2b2a3a', belt: '#c2a668' },
    scale: 1.2, ai: { prefer: 'melee', focus: 'strongest' }, friendly: true
  },

  /* ============================ ACT 2 — THE CRAZY ONES ============================ */
  crazed_dragonborn: {
    name: 'Crazed Dragonborn', type: 'humanoid', cr: 2, xp: 450, hp: 45, ac: 14, speed: 30, init: 1,
    abilities: AB(17, 12, 15, 9, 10, 13),
    blurb: 'Eyes and open mouth glowing gold, breathing fire at the tavern furniture. It is not itself. Something is speaking through it.',
    traits: [
      { name: 'Possessed', desc: 'It cannot be reasoned with, and it repeats one sentence about eggs in a voice that is not its own.', effects: ['possessed'] },
      { name: 'Nonlethal Preferred', desc: 'Knocking it unconscious rather than killing it counts as catching it.', effects: ['capturable'] }
    ],
    actions: [
      { name: 'Claw', kind: 'attack', atk: 5, reach: 5, dmg: '1d8+3', type: 'slashing' },
      { name: 'Flipped Table', kind: 'attack', atk: 5, range: 20, dmg: '2d6+3', type: 'bludgeoning', weight: 1 },
      { name: 'Fire Breath', kind: 'save', shape: { k: 'cone', size: 15 }, save: { ab: 'dex', dc: 12 }, dmg: '4d6', type: 'fire', half: true, recharge: 4, desc: 'A cone of flame 15 ft long.' }
    ],
    visual: { body: 'humanoid', skin: '#a83a2a', scales: '#a83a2a', snout: true, tail: true, horns: 'curved', hairStyle: 'bald', cloth: '#5a4a3a', cloth2: '#3a3028', eyeGlow: true },
    ai: { prefer: 'melee', focus: 'nearest' }
  },
  crazed_kobold: {
    name: 'Shrieking Kobold', type: 'humanoid', cr: '1/4', xp: 50, hp: 16, ac: 13, speed: 30, climb: 30, init: 2,
    abilities: AB(7, 15, 9, 8, 7, 8),
    blurb: 'On the roof of the chandler\'s shop, shrieking without pause. It is not panicking. It is calling something.',
    traits: [
      { name: 'Pack Tactics', desc: 'Advantage on attacks when an ally is within 5 ft of the target.', effects: ['pack_tactics'] },
      { name: 'Sunlight Sensitivity', desc: 'Disadvantage on attacks and Perception in sunlight.', effects: ['sunlight_sensitivity'] },
      { name: 'The Call', desc: 'Every third round it shrieks again, and something enormous gets closer.', effects: ['calling'] }
    ],
    actions: [
      { name: 'Dagger', kind: 'attack', atk: 4, reach: 5, dmg: '1d4+2', type: 'piercing' },
      { name: 'Sling', kind: 'attack', atk: 4, range: 30, dmg: '1d4+2', type: 'bludgeoning' },
      { name: 'Shriek', kind: 'special', special: 'call_half_dragon', desc: 'A sound that carries much further than it should.', weight: 4 }
    ],
    visual: { body: 'humanoid', skin: '#a8623a', scales: '#a8623a', snout: true, tail: true, horns: 'spike', hairStyle: 'bald', cloth: '#6a5a3a', cloth2: '#4a3a28', smallBody: true },
    scale: 0.78, ai: { prefer: 'ranged', focus: 'nearest', flee: true }
  },
  rogue_civilian: {
    name: 'Rogue Civilian', type: 'humanoid', cr: '1/8', xp: 25, hp: 14, ac: 12, speed: 30, init: 1,
    abilities: AB(13, 12, 12, 10, 10, 10),
    blurb: 'One of the ones who broke loose from the pole in the square. Wild-eyed, and not entirely present.',
    actions: [{ name: 'Improvised Club', kind: 'attack', atk: 3, reach: 5, dmg: '1d6+1', type: 'bludgeoning' }],
    visual: { body: 'humanoid', skin: '#c89870', hair: '#3a2a18', cloth: '#6a5a4a', cloth2: '#4a3a2a', hairStyle: 'short' },
    ai: { prefer: 'melee' }
  },
  grey_cat: {
    name: 'Grey Cat', type: 'beast', cr: 0, xp: 10, hp: 3, ac: 11, speed: 40, climb: 30, init: 2,
    abilities: AB(3, 15, 10, 3, 12, 7),
    blurb: 'Movement in a shadow behind a building. It is a grey cat, and it is sizing you up as much as you are sizing it up.',
    traits: [
      { name: 'Tameable', desc: 'A DC 10 Animal Handling check and it is yours. It will fight for you.', effects: ['tameable:10'] },
      { name: 'Keen Smell', desc: 'Advantage on Perception checks that rely on smell.' }
    ],
    actions: [{ name: 'Claw', kind: 'attack', atk: 4, reach: 5, dmg: '1d4', type: 'slashing' }],
    visual: { body: 'beast', fur: '#7a7a82', eye: '#c8d048' },
    scale: 0.55, ai: { prefer: 'melee', focus: 'nearest' }
  },
  half_dragon: {
    name: 'Half-Dragon', type: 'dragon', cr: 5, xp: 1800, hp: 90, ac: 14, speed: 40, init: 3,
    abilities: AB(19, 14, 17, 10, 12, 15),
    blurb: 'It roars and takes a chunk out of the chandler\'s wall. Its eyes are glowing gold and it is furious about something it cannot name.',
    traits: [
      { name: 'Golden Rage', desc: 'It is not hunting. It is looking, and failing, and taking that out on the buildings.', effects: ['possessed'] },
      { name: 'Bitter Cold', desc: 'Weapons dipped in the barrels of freezing water deal an extra 1d6 to it; a thrown barrel deals 20.', effects: ['cold_vulnerable_story'] }
    ],
    actions: [
      { name: 'Claw', kind: 'attack', atk: 7, reach: 5, dmg: '2d6+4', type: 'slashing' },
      { name: 'Bite', kind: 'attack', atk: 7, reach: 10, dmg: '2d10+4', type: 'piercing', weight: 2 },
      { name: 'Tail Sweep', kind: 'save', shape: { k: 'sphere', size: 10 }, save: { ab: 'dex', dc: 15 }, dmg: '2d8+4', type: 'bludgeoning', half: true, cond: 'prone', recharge: 4, desc: 'It pivots and clears the ground around it.' },
      { name: 'Fire Breath', kind: 'save', shape: { k: 'cone', size: 30 }, save: { ab: 'dex', dc: 15 }, dmg: '7d6', type: 'fire', half: true, recharge: 5, desc: 'A 30-ft cone of dragonfire.' }
    ],
    multiattack: 2,
    visual: { body: 'humanoid', skin: '#b8853a', scales: '#c2954a', snout: true, tail: true, horns: 'curved', hairStyle: 'bald', cloth: '#5a3a28', cloth2: '#3a2818', wings: true, wingCol: '#8a6a3a', bigBody: true, eyeGlow: true },
    scale: 1.45, boss: true, ai: { prefer: 'melee', focus: 'strongest' }
  },

  /* ============================ ACT 3 — ERZA'S HOUSE ============================ */
  eyeball_monster: {
    name: 'The Thing in Erza\'s House', type: 'aberration', cr: 6, xp: 2300, hp: 104, ac: 15, speed: 0, fly: 20, init: 1,
    abilities: AB(14, 12, 18, 6, 14, 8),
    resist: ['poison'], immune: ['prone'],
    blurb: 'A giant floating ball of flesh at the far side of a fungus-filled room, tendrils ending in eyes. It has not noticed you yet.',
    traits: [
      { name: 'Spore Burst', desc: 'The doorway is thick with spores: DC 12 CON save or be poisoned.', effects: ['spore_door:12'] },
      { name: 'All-Round Vision', desc: 'It cannot be surprised and cannot be flanked.', effects: ['all_around_sight'] },
      { name: 'Rooted', desc: 'It cannot move from its corner. Its reach is the problem.', effects: ['immobile'] }
    ],
    actions: [
      { name: 'Tendril Lash', kind: 'attack', atk: 6, reach: 20, dmg: '2d8+2', type: 'bludgeoning' },
      { name: 'Eye Ray', kind: 'save', range: 60, save: { ab: 'con', dc: 14 }, dmg: '3d8', type: 'necrotic', half: true, cond: 'blinded', desc: 'One of the eyes fixes on you and the light goes out of the room.' },
      { name: 'Spore Cloud', kind: 'save', shape: { k: 'sphere', size: 20 }, save: { ab: 'con', dc: 14 }, dmg: '2d6', type: 'poison', cond: 'poisoned', half: true, recharge: 4 }
    ],
    multiattack: 3,
    visual: { body: 'eyeball', body_col: '#9a5f6a' },
    scale: 1.2, boss: true, ai: { prefer: 'ranged', focus: 'weakest' }
  },

  /* ============================ ACT 5 — GRIMEY'S MINE ============================ */
  rotting_cube: {
    name: 'Rotting Gelatinous Cube', type: 'ooze', cr: 0, xp: 0, hp: 1, ac: 5, speed: 0, init: -5,
    abilities: AB(14, 3, 20, 1, 6, 1),
    blurb: 'Dead and going over. You can see straight through it to a lever, and past that, a door.',
    traits: [{ name: 'Flammable', desc: 'A torch will take it up in seconds.', effects: ['burnable'] }],
    actions: [],
    visual: { body: 'ooze', body_col: '#7a9a6a', rotten: true },
    scale: 1, scenery: true, ai: { prefer: 'none' }
  },
  annoying_fly: {
    name: 'Annoying Fly', type: 'beast', cr: 0, xp: 0, hp: 1, ac: 26, speed: 0, fly: 60, init: 5,
    abilities: AB(1, 22, 1, 1, 6, 1),
    blurb: 'It will not stop. Its AC is 26 unless you hit it with something that fills a space.',
    traits: [{ name: 'Impossible to Swat', desc: 'AC 26 against anything but an area effect.', effects: ['aoe_only'] }],
    actions: [{ name: 'Buzz', kind: 'special', special: 'annoy', desc: 'It buzzes. That is the entire threat, and it is enough to ruin a silence.' }],
    visual: { body: 'beast', fur: '#2b2b33', eye: '#8a2a2a' },
    scale: 0.25, ai: { prefer: 'none', flee: true }
  },
  wight: {
    name: 'Wight', type: 'undead', cr: 3, xp: 700, hp: 45, ac: 14, speed: 30, init: 2,
    abilities: AB(15, 14, 16, 10, 13, 15),
    resist: ['necrotic', 'poison'], immune: ['poisoned'], senses: { darkvision: 60 },
    blurb: 'A pale undead thing wearing a crown, standing beside a hulking construct. An Arcana check names it; a Perception check finds the amulet.',
    traits: [
      { name: 'Sunlight Sensitivity', desc: 'Disadvantage on attacks and Perception in sunlight.', effects: ['sunlight_sensitivity'] },
      { name: 'Amulet of the Pale King', desc: 'While the amulet is intact, all maximum hit points it has drained are restored to it.', effects: ['amulet_regen'] },
      { name: 'Life Drain', desc: 'Its touch reduces the maximum hit points of the living.', effects: ['life_drain'] }
    ],
    actions: [
      { name: 'Life Drain', kind: 'attack', atk: 4, reach: 5, dmg: '1d6+2', type: 'necrotic', rider: { save: { ab: 'con', dc: 13 }, maxHpDrain: true }, desc: 'On a failed DC 13 CON save, maximum hit points drop by the damage taken.' },
      { name: 'Longsword', kind: 'attack', atk: 4, reach: 5, dmg: '1d8+2', type: 'slashing' },
      { name: 'Longbow', kind: 'attack', atk: 4, range: 150, dmg: '1d8+2', type: 'piercing' }
    ],
    multiattack: 2,
    visual: { body: 'humanoid', skin: '#c8c8b8', hair: '#4a4a52', cloth: '#3a2a4a', cloth2: '#241a30', hairStyle: 'long', armor: '#5a5a6a', hat: '#c2a03a' },
    ai: { prefer: 'melee', focus: 'weakest' }, boss: true
  },
  hulking_construct: {
    name: 'Hulking Construct', type: 'construct', cr: 4, xp: 1100, hp: 68, ac: 17, speed: 25, init: -1,
    abilities: AB(18, 9, 18, 3, 10, 1),
    immune: ['poison', 'psychic', 'charmed', 'frightened', 'poisoned'],
    blurb: 'Stone and bolted iron, taller than the doorway it came through. Whoever built it did not build it for conversation.',
    traits: [
      { name: 'Immutable Form', desc: 'It cannot be changed by any shape-altering effect.' },
      { name: 'Siege Engine', desc: 'It deals double damage to objects and structures.' }
    ],
    actions: [
      { name: 'Slam', kind: 'attack', atk: 6, reach: 10, dmg: '2d8+4', type: 'bludgeoning' },
      { name: 'Sweeping Arms', kind: 'save', shape: { k: 'cone', size: 15 }, save: { ab: 'str', dc: 15 }, dmg: '2d6+4', type: 'bludgeoning', half: true, push: 10, recharge: 4 }
    ],
    multiattack: 2,
    visual: { body: 'construct', metal: '#5f6879', metal2: '#4d5566', eye: '#e8bd58', rune: true },
    scale: 1.25, ai: { prefer: 'melee', focus: 'nearest' }
  },
  skeleton: {
    name: 'Skeleton', type: 'undead', cr: '1/4', xp: 50, hp: 13, ac: 13, speed: 30, init: 2,
    abilities: AB(10, 14, 15, 6, 8, 5),
    vuln: ['bludgeoning'], immune: ['poison', 'poisoned', 'exhaustion'],
    actions: [
      { name: 'Shortsword', kind: 'attack', atk: 4, reach: 5, dmg: '1d6+2', type: 'piercing' },
      { name: 'Shortbow', kind: 'attack', atk: 4, range: 80, dmg: '1d6+2', type: 'piercing' }
    ],
    visual: { body: 'humanoid', skin: '#d8d4c0', hair: '#00000000', hairStyle: 'bald', cloth: '#3a3a42', cloth2: '#2b2b33' },
    ai: { prefer: 'melee' }
  },
  zombie: {
    name: 'Zombie', type: 'undead', cr: '1/4', xp: 50, hp: 22, ac: 8, speed: 20, init: -2,
    abilities: AB(13, 6, 16, 3, 6, 5),
    immune: ['poison', 'poisoned'],
    traits: [{ name: 'Undead Fortitude', desc: 'Unless the killing blow was radiant or a critical, a DC 5 + damage CON save leaves it at 1 hit point.', effects: ['undead_fortitude'] }],
    actions: [{ name: 'Slam', kind: 'attack', atk: 3, reach: 5, dmg: '1d6+1', type: 'bludgeoning' }],
    visual: { body: 'humanoid', skin: '#8a9a7a', hair: '#3a3a2a', hairStyle: 'long', cloth: '#4a4a3a', cloth2: '#33332a' },
    ai: { prefer: 'melee' }
  },

  /* ============================ ACT 6 — THE SWAMP ============================ */
  black_dragon: {
    name: 'Young Black Dragon', type: 'dragon', cr: 7, xp: 2900, hp: 127, ac: 18, speed: 40, fly: 80, swim: 40, init: 2,
    abilities: AB(19, 14, 17, 12, 11, 15),
    saves: { dex: 5, con: 6, wis: 4, cha: 6 }, immune: ['acid'], senses: { darkvision: 120, blindsight: 30 },
    blurb: 'Digging in the mud, snout down, searching. It said "WHERE ARE MY EGGS" once with its eyes glowing and has not spoken since. Fair warning: it spits acid.',
    traits: [
      { name: 'Amphibious', desc: 'It breathes air and water.' },
      { name: 'Swamp Hunter', desc: 'The mud does not slow it at all, and it sees through the murk.', effects: ['ignore_difficult'] },
      { name: 'Wounded Hind Leg', desc: 'The left hind leg is badly hurt. Attacks that target it deal an extra 1d8, and it limps toward you.', effects: ['weak_point:1d8'] }
    ],
    actions: [
      { name: 'Bite', kind: 'attack', atk: 7, reach: 10, dmg: '2d10+4', type: 'piercing', extra: { dmg: '1d8', type: 'acid' } },
      { name: 'Claw', kind: 'attack', atk: 7, reach: 5, dmg: '1d6+4', type: 'slashing' },
      { name: 'Acid Breath', kind: 'save', shape: { k: 'line', size: 30 }, save: { ab: 'dex', dc: 14 }, dmg: '11d8', type: 'acid', half: true, recharge: 5, desc: 'A line of acid 30 ft long and 5 ft wide.' },
      { name: 'Frightful Presence', kind: 'save', range: 60, save: { ab: 'wis', dc: 14 }, cond: 'frightened', dur: 10, uses: 1, weight: 1 }
    ],
    multiattack: 3,
    visual: { body: 'dragon', scales: '#3a3540', belly: '#5a5560', wingCol: '#2b2833', spine: '#8a8a92' },
    scale: 1.5, boss: true, ai: { prefer: 'melee', focus: 'strongest' }
  },
  green_dragon: {
    name: 'Adult Green Dragon', type: 'dragon', cr: 15, xp: 13000, hp: 207, ac: 19, speed: 40, fly: 80, init: 4,
    abilities: AB(23, 12, 21, 18, 15, 17),
    immune: ['poison', 'poisoned'], senses: { darkvision: 120, blindsight: 60 },
    blurb: 'It drops the golden egg, lands on it, snarls, and a voice arrives inside your head: MINE. This is not a fight you were meant to win today.',
    traits: [
      { name: 'Far Above Your Weight', desc: 'It is here for the egg. It will leave when it has it.', effects: ['scripted_flee'] },
      { name: 'Legendary Resistance', desc: 'Three times a day, it simply succeeds on a save it failed.', effects: ['legendary:3'] }
    ],
    actions: [
      { name: 'Bite', kind: 'attack', atk: 11, reach: 10, dmg: '2d10+6', type: 'piercing', extra: { dmg: '2d6', type: 'poison' } },
      { name: 'Claw', kind: 'attack', atk: 11, reach: 5, dmg: '2d6+6', type: 'slashing' },
      { name: 'Poison Breath', kind: 'save', shape: { k: 'cone', size: 60 }, save: { ab: 'con', dc: 18 }, dmg: '16d6', type: 'poison', half: true, recharge: 5 }
    ],
    multiattack: 3,
    visual: { body: 'dragon', scales: '#3a6b3f', belly: '#8a9a6a', wingCol: '#2f5a34', spine: '#d8cca8' },
    scale: 1.9, boss: true, ai: { prefer: 'melee', focus: 'nearest' }
  },
  crazed_silver_dragon: {
    name: 'Crazed Silver Dragon', type: 'dragon', cr: 9, xp: 5000, hp: 168, ac: 18, speed: 40, fly: 80, init: 2,
    abilities: AB(23, 10, 21, 14, 13, 17),
    immune: ['cold'], senses: { darkvision: 120 },
    blurb: 'The arena\'s first round. It is trying to eat everyone in the sand, and it does not care who signed up.',
    traits: [{ name: 'Arena Rules', desc: 'The round ends when ten fighters are left standing in the sand.', effects: ['arena_count:10'] }],
    actions: [
      { name: 'Bite', kind: 'attack', atk: 9, reach: 10, dmg: '2d10+6', type: 'piercing' },
      { name: 'Claw', kind: 'attack', atk: 9, reach: 5, dmg: '2d6+6', type: 'slashing' },
      { name: 'Cold Breath', kind: 'save', shape: { k: 'cone', size: 30 }, save: { ab: 'con', dc: 17 }, dmg: '12d8', type: 'cold', half: true, recharge: 5 },
      { name: 'Paralysing Breath', kind: 'save', shape: { k: 'cone', size: 30 }, save: { ab: 'con', dc: 17 }, cond: 'paralyzed', dur: 3, recharge: 6 }
    ],
    multiattack: 3,
    visual: { body: 'dragon', scales: '#c8d0dc', belly: '#e8eef4', wingCol: '#a8b0bc', spine: '#f0f4f8' },
    scale: 1.75, boss: true, ai: { prefer: 'melee', focus: 'nearest' }
  },
  copper_dragon: {
    name: 'Adult Copper Dragon', type: 'dragon', cr: 14, xp: 11500, hp: 184, ac: 18, speed: 40, fly: 80, init: 3,
    abilities: AB(23, 12, 21, 18, 15, 17),
    immune: ['acid'],
    blurb: 'Copper dragons are famously good-natured, and famously willing to raise a hatchling that is not theirs. This one is trying to find a parent for a young blue.',
    traits: [{ name: 'Kindly', desc: 'It will not start a fight it can talk out of.', effects: ['peaceful'] }],
    actions: [
      { name: 'Bite', kind: 'attack', atk: 11, reach: 10, dmg: '2d10+6', type: 'piercing' },
      { name: 'Acid Breath', kind: 'save', shape: { k: 'line', size: 60 }, save: { ab: 'dex', dc: 18 }, dmg: '12d8', type: 'acid', half: true, recharge: 5 }
    ],
    visual: { body: 'dragon', scales: '#b86a3a', belly: '#d8a86a', wingCol: '#9a5a2a', spine: '#e8cca8' },
    scale: 1.8, ai: { prefer: 'melee' }, friendly: true
  },
  baby_dragon: {
    name: 'Copper Wyrmling', type: 'dragon', cr: 1, xp: 200, hp: 22, ac: 16, speed: 30, fly: 60, init: 2,
    abilities: AB(15, 12, 13, 14, 11, 13), immune: ['acid'],
    blurb: 'Small enough to fit in a cargo net, and utterly convinced it is enormous.',
    actions: [{ name: 'Bite', kind: 'attack', atk: 4, reach: 5, dmg: '1d10+2', type: 'piercing' }],
    visual: { body: 'dragon', scales: '#c47a3a', belly: '#e8b878', wingCol: '#a86a2a', spine: '#f0d8b0' },
    scale: 0.62, ai: { prefer: 'melee' }, friendly: true
  },
  blue_wyrmling: {
    name: 'Young Blue Dragon', type: 'dragon', cr: 3, xp: 700, hp: 52, ac: 17, speed: 30, fly: 60, init: 2,
    abilities: AB(17, 10, 15, 12, 11, 15), immune: ['lightning'],
    blurb: 'Orphaned, and the copper is trying to work out what to do with it. It has nobody.',
    actions: [
      { name: 'Bite', kind: 'attack', atk: 5, reach: 5, dmg: '1d10+3', type: 'piercing', extra: { dmg: '1d6', type: 'lightning' } },
      { name: 'Lightning Breath', kind: 'save', shape: { k: 'line', size: 30 }, save: { ab: 'dex', dc: 12 }, dmg: '4d10', type: 'lightning', half: true, recharge: 5 }
    ],
    visual: { body: 'dragon', scales: '#3f6f9a', belly: '#7fa8c8', wingCol: '#2f5a80', spine: '#c8e0f0' },
    scale: 0.85, ai: { prefer: 'melee' }
  },
  owlbear_small: {
    name: 'Small Owlbear', type: 'monstrosity', cr: 1, xp: 200, hp: 34, ac: 12, speed: 40, init: 1,
    abilities: AB(16, 12, 15, 3, 12, 7),
    blurb: 'A young one, in the clearing, doing its best to look large.',
    traits: [{ name: 'Keen Sight and Smell', desc: 'Advantage on Perception by sight or smell.' }],
    actions: [
      { name: 'Beak', kind: 'attack', atk: 5, reach: 5, dmg: '1d10+3', type: 'piercing' },
      { name: 'Claws', kind: 'attack', atk: 5, reach: 5, dmg: '2d6+3', type: 'slashing' }
    ],
    visual: { body: 'beast', fur: '#8a6a4a', beak: true, eye: '#e8b048' },
    scale: 0.95, ai: { prefer: 'melee' }
  },
  wolf: {
    name: 'Wolf', type: 'beast', cr: '1/4', xp: 50, hp: 11, ac: 13, speed: 40, init: 2,
    abilities: AB(12, 15, 12, 3, 12, 6),
    traits: [{ name: 'Pack Tactics', desc: 'Advantage when an ally is within 5 ft of the target.', effects: ['pack_tactics'] }],
    actions: [{ name: 'Bite', kind: 'attack', atk: 4, reach: 5, dmg: '2d4+2', type: 'piercing', rider: { save: { ab: 'str', dc: 11 }, cond: 'prone' } }],
    visual: { body: 'beast', fur: '#6a6a72', eye: '#d8c048' },
    scale: 0.7, ai: { prefer: 'melee' }
  },

  /* ============================ ARENA & TOWN ============================ */
  gladiator: {
    name: 'Arena Gladiator', type: 'humanoid', cr: 5, xp: 1800, hp: 76, ac: 16, speed: 30, init: 2,
    abilities: AB(18, 15, 16, 10, 12, 15),
    blurb: 'Sand in the sandals, scars in a pattern. They fight for the crowd and they are very good at it.',
    actions: [
      { name: 'Spear', kind: 'attack', atk: 7, reach: 10, dmg: '2d6+4', type: 'piercing' },
      { name: 'Shield Bash', kind: 'attack', atk: 7, reach: 5, dmg: '2d4+4', type: 'bludgeoning', rider: { save: { ab: 'str', dc: 15 }, cond: 'prone' } }
    ],
    multiattack: 3,
    visual: { body: 'humanoid', skin: '#b8845a', hair: '#2b1f16', cloth: '#8a3f3a', cloth2: '#5a2a28', armor: '#8a7350', hairStyle: 'mohawk' },
    ai: { prefer: 'melee', focus: 'weakest' }
  },
  arena_brawler: {
    name: 'Arena Brawler', type: 'humanoid', cr: 2, xp: 450, hp: 42, ac: 13, speed: 30, init: 1,
    abilities: AB(17, 13, 15, 9, 10, 11),
    actions: [{ name: 'Fists', kind: 'attack', atk: 5, reach: 5, dmg: '2d4+3', type: 'bludgeoning' }],
    multiattack: 2,
    visual: { body: 'humanoid', skin: '#8a9a6a', hair: '#1a1410', cloth: '#5a4a3a', cloth2: '#3a2f28', tusks: true, bigBody: true },
    ai: { prefer: 'melee' }
  },
  arena_mage: {
    name: 'Arena Hedge-Mage', type: 'humanoid', cr: 3, xp: 700, hp: 33, ac: 12, speed: 30, init: 2,
    abilities: AB(9, 14, 12, 17, 12, 11),
    actions: [
      { name: 'Fire Bolt', kind: 'attack', atk: 5, range: 120, dmg: '2d10', type: 'fire' },
      { name: 'Burning Hands', kind: 'save', shape: { k: 'cone', size: 15 }, save: { ab: 'dex', dc: 13 }, dmg: '3d6', type: 'fire', half: true, recharge: 3 },
      { name: 'Shield', kind: 'buff', buff: { ac: 5 }, dur: 1, uses: 2, weight: 1 }
    ],
    visual: { body: 'humanoid', skin: '#d8a878', hair: '#c8c4b0', cloth: '#4a3560', cloth2: '#33244a', hairStyle: 'long', hood: '#5c4275' },
    ai: { prefer: 'ranged', focus: 'weakest', keepDistance: 5 }
  },
  town_guard: {
    name: 'Drakehaven Guard', type: 'humanoid', cr: '1/8', xp: 25, hp: 16, ac: 16, speed: 30, init: 1,
    abilities: AB(13, 12, 12, 10, 11, 10),
    actions: [{ name: 'Spear', kind: 'attack', atk: 3, reach: 10, dmg: '1d6+1', type: 'piercing' }],
    visual: { body: 'humanoid', skin: '#c89870', hair: '#3a2a18', cloth: '#3f5f8a', cloth2: '#2b3f5a', armor: '#7d8798' },
    ai: { prefer: 'melee' }, friendly: true
  },
  marked_man: {
    name: 'The Marked Man', type: 'humanoid', cr: 4, xp: 1100, hp: 58, ac: 15, speed: 30, init: 4,
    abilities: AB(12, 18, 14, 15, 13, 16),
    skills: { stealth: 8, deception: 7, sleight_of_hand: 8 },
    blurb: 'He stands by the refreshments, not drinking, not dancing, not talking. Every few moments his eyes drift to the golden egg on the stage.',
    traits: [
      { name: 'Egg-Minded', desc: 'When the wall comes down he goes straight for the podium.', effects: ['egg_thief'] },
      { name: 'Evasive', desc: 'Half damage from area effects even on a failure.', effects: ['evasion'] }
    ],
    actions: [
      { name: 'Poisoned Dagger', kind: 'attack', atk: 7, reach: 5, dmg: '1d4+4', type: 'piercing', extra: { dmg: '2d6', type: 'poison' } },
      { name: 'Hand Crossbow', kind: 'attack', atk: 7, range: 30, dmg: '1d6+4', type: 'piercing' },
      { name: 'Vanish', kind: 'special', special: 'hide', desc: 'He steps behind a dancing couple and is not there any more.', weight: 2 }
    ],
    multiattack: 2,
    visual: { body: 'humanoid', skin: '#c89870', hair: '#1a1410', cloth: '#2b2b3a', cloth2: '#1a1a24', hairStyle: 'short', cloak: '#3a2a3a' },
    ai: { prefer: 'melee', focus: 'weakest', flee: true }, boss: true
  },
  ball_guest: {
    name: 'Ball Guest', type: 'humanoid', cr: 0, xp: 10, hp: 9, ac: 10, speed: 30, init: 0,
    abilities: AB(10, 10, 10, 12, 11, 14),
    actions: [{ name: 'Panicked Shove', kind: 'attack', atk: 1, reach: 5, dmg: '1d2', type: 'bludgeoning' }],
    visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#5a3a22', cloth: '#7a2a4a', cloth2: '#c2a668', hairStyle: 'long' },
    ai: { prefer: 'flee' }, friendly: true
  },
  dragon_at_the_window: {
    name: 'The Eye at the Window', type: 'dragon', cr: 17, xp: 18000, hp: 256, ac: 19, speed: 40, fly: 80, init: 4,
    abilities: AB(25, 10, 23, 16, 13, 21),
    immune: ['fire'],
    blurb: 'An enormous orange slit eye, peering back at you through the ballroom glass.',
    traits: [{ name: 'Through the Wall', desc: 'It does not need the door.', effects: ['legendary:3'] }],
    actions: [
      { name: 'Bite', kind: 'attack', atk: 13, reach: 15, dmg: '2d10+8', type: 'piercing', extra: { dmg: '2d6', type: 'fire' } },
      { name: 'Claw', kind: 'attack', atk: 13, reach: 10, dmg: '2d6+8', type: 'slashing' },
      { name: 'Fire Breath', kind: 'save', shape: { k: 'cone', size: 60 }, save: { ab: 'dex', dc: 21 }, dmg: '18d6', type: 'fire', half: true, recharge: 5 }
    ],
    multiattack: 3,
    visual: { body: 'dragon', scales: '#a8452a', belly: '#d8845a', wingCol: '#8a2f1a', spine: '#e8b048', glowEyes: true },
    scale: 2.2, boss: true, ai: { prefer: 'melee', focus: 'nearest' }
  }
};

/* fill ids */
Object.keys(DH.MONSTERS).forEach(id => { DH.MONSTERS[id].id = id; });
DH.monster = (id) => DH.MONSTERS[id];

/* ================= THE PARTY YOU SAILED IN WITH =================
   Companions are built like characters but authored directly. */
DH.COMPANIONS = [
  {
    id: 'mahoraga', name: 'Mahoraga', raceName: 'Half-Orc', className: 'Monk', subclassName: 'Way of the Open Hand',
    level: 3, hitDie: 8, abilities: AB(16, 17, 15, 8, 15, 10),
    hp: 27, ac: 16, speed: 40, weapon: 'unarmed', art: 'fists',
    blurb: 'Punching a bar of hard ship-iron in the crew quarters because the storm woke him. He trains his fists on whatever will not give.',
    intro: 'A half-orc the size of a doorway is holding a bent bar of ship-iron and hitting it, over and over, with the flat of his fist. He does not look up.',
    skills: ['athletics', 'acrobatics', 'insight'],
    features: ['martial_arts', 'ki', 'unarmored_defense:wis', 'open_hand', 'deflect_missiles'],
    actions: [
      { name: 'Unarmed Strike', kind: 'attack', atk: 5, reach: 5, dmg: '1d6+3', type: 'bludgeoning' },
      { name: 'Flurry of Blows', kind: 'attack', atk: 5, reach: 5, dmg: '1d6+3', type: 'bludgeoning', times: 2, cost: { ki: 1 }, weight: 3 },
      { name: 'Step of the Wind', kind: 'move', cost: { ki: 1 }, desc: 'Disengage and double his jump.', weight: 1 }
    ],
    ki: 3,
    visual: { body: 'humanoid', skin: '#7a9a6a', hair: '#1a1410', cloth: '#5a4a3a', cloth2: '#3a2f28', hairStyle: 'mohawk', tusks: true, bigBody: true, sleeves: false },
    scale: 1.15, ai: { prefer: 'melee', focus: 'strongest' }
  },
  {
    id: 'dex', name: 'Dex', raceName: 'Wood Elf', className: 'Ranger', subclassName: 'Gloom Stalker',
    level: 3, hitDie: 10, abilities: AB(12, 18, 14, 12, 15, 11),
    hp: 25, ac: 15, speed: 35, weapon: 'longbow', art: 'bow',
    blurb: 'Swinging back and forth in a hammock, reading, entirely unbothered by the weather or by the sound of a man hitting metal.',
    intro: 'Swinging back and forth in a hammock, reading by the light of a shuttered lantern, is a wood elf. They turn a page. The thunder does not appear to have registered.',
    skills: ['perception', 'stealth', 'survival', 'investigation', 'nature'],
    features: ['dread_ambusher', 'favored_enemy', 'hunters_mark', 'archery'],
    actions: [
      { name: 'Longbow', kind: 'attack', atk: 8, range: 150, dmg: '1d8+4', type: 'piercing' },
      { name: 'Shortsword', kind: 'attack', atk: 6, reach: 5, dmg: '1d6+4', type: 'piercing' },
      { name: 'Hunter\'s Mark', kind: 'buff', mark: { dmg: '1d6' }, dur: 10, uses: 3, weight: 2 }
    ],
    visual: { body: 'humanoid', skin: '#e8d0b0', hair: '#6a5a2a', cloth: '#3a5a3a', cloth2: '#2b4229', hairStyle: 'long', ears: 'long', cloak: '#4a6b42' },
    ai: { prefer: 'ranged', focus: 'weakest', keepDistance: 6 }
  },
  {
    id: 'wyatt', name: 'Wyatt', raceName: 'Gold Dragonborn', className: 'Sorcerer', subclassName: 'Draconic Bloodline',
    level: 3, hitDie: 6, abilities: AB(12, 13, 15, 12, 11, 18),
    hp: 23, ac: 14, speed: 30, weapon: 'staff', art: 'staff',
    blurb: 'The one the Command Pod sent. When his knees hit the dock and his eyes started to glow gold, something very old spoke through him.',
    intro: 'A gold dragonborn, broad in the shoulder, asleep until the fat man hit the deck. He wakes badly, the way people do when they dream about something calling them.',
    skills: ['arcana', 'persuasion', 'insight'],
    features: ['spellcasting', 'draconic_ac', 'hp_per_level:1', 'breath', 'dragon_touched'],
    spells: ['fire_bolt', 'shocking_grasp', 'minor_illusion', 'magic_missile', 'shield', 'burning_hands', 'scorching_ray'],
    slots: { 1: 4, 2: 2 },
    actions: [
      { name: 'Fire Bolt', kind: 'attack', atk: 6, range: 120, dmg: '2d10', type: 'fire' },
      { name: 'Scorching Ray', kind: 'spell', spell: 'scorching_ray', slot: 2, weight: 4 },
      { name: 'Magic Missile', kind: 'spell', spell: 'magic_missile', slot: 1, weight: 3 },
      { name: 'Breath Weapon', kind: 'save', shape: { k: 'cone', size: 15 }, save: { ab: 'dex', dc: 13 }, dmg: '2d6', type: 'fire', half: true, uses: 1, weight: 2 }
    ],
    visual: { body: 'humanoid', skin: '#c2954a', scales: '#e8bd58', snout: true, tail: true, horns: 'curved', hairStyle: 'bald', cloth: '#8a6a2a', cloth2: '#5a4418', eyeGlow: false },
    scale: 1.08, ai: { prefer: 'ranged', focus: 'strongest', keepDistance: 5 }
  },
  {
    id: 'lucas', name: 'Lucas', raceName: 'Human', className: 'Fighter', subclassName: 'Battle Master',
    level: 3, hitDie: 10, abilities: AB(18, 13, 16, 11, 12, 12),
    hp: 31, ac: 18, speed: 30, weapon: 'longsword', art: 'sword', shield: true,
    blurb: 'The strongest pair of hands in the party, and the reason the rolling boulder in the mine can be stopped at all.',
    intro: 'Asleep in the third hammock with one boot still on, a human in a mail shirt he clearly did not take off to sleep.',
    skills: ['athletics', 'intimidation', 'perception'],
    features: ['second_wind', 'action_surge', 'superiority:4', 'defense'],
    actions: [
      { name: 'Longsword', kind: 'attack', atk: 7, reach: 5, dmg: '1d8+4', type: 'slashing' },
      { name: 'Trip Attack', kind: 'attack', atk: 7, reach: 5, dmg: '1d8+4', type: 'slashing', rider: { save: { ab: 'str', dc: 15 }, cond: 'prone' }, extra: { dmg: '1d8' }, cost: { superiority: 1 }, weight: 3 },
      { name: 'Second Wind', kind: 'heal', heal: '1d10+3', uses: 1, weight: 2, self: true }
    ],
    superiority: 4,
    visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#8a6a3a', cloth: '#5a5a6a', cloth2: '#3a3a4a', armor: '#8a92a2', hairStyle: 'short' },
    ai: { prefer: 'melee', focus: 'strongest' }
  },
  {
    id: 'ball_wizard', name: 'Ball Wizard', raceName: 'Rock Gnome', className: 'Wizard', subclassName: 'School of Evocation',
    level: 3, hitDie: 6, abilities: AB(8, 14, 14, 18, 13, 10),
    hp: 20, ac: 12, speed: 25, weapon: 'staff', art: 'staff',
    blurb: 'Nobody remembers giving him that name. He answers to it. He is, in fairness, extremely good with force damage.',
    intro: 'A rock gnome in a nightshirt, fast asleep, with a spellbook open on his chest and a half-finished diagram of a sphere on the page.',
    skills: ['arcana', 'investigation', 'history'],
    features: ['spellcasting', 'arcane_recovery', 'sculpt_spells'],
    spells: ['fire_bolt', 'ray_of_frost', 'mage_hand', 'magic_missile', 'shield', 'thunderwave', 'scorching_ray', 'misty_step'],
    slots: { 1: 4, 2: 2 },
    actions: [
      { name: 'Fire Bolt', kind: 'attack', atk: 6, range: 120, dmg: '2d10', type: 'fire' },
      { name: 'Magic Missile', kind: 'spell', spell: 'magic_missile', slot: 1, weight: 4 },
      { name: 'Thunderwave', kind: 'spell', spell: 'thunderwave', slot: 1, weight: 3 },
      { name: 'Scorching Ray', kind: 'spell', spell: 'scorching_ray', slot: 2, weight: 4 }
    ],
    visual: { body: 'humanoid', skin: '#f0cfa8', hair: '#c8c4b0', cloth: '#3a4a7a', cloth2: '#2b3558', hairStyle: 'long', beard: '#c8c4b0', smallBody: true, hat: '#2f3f6a' },
    scale: 0.82, ai: { prefer: 'ranged', focus: 'strongest', keepDistance: 6 }
  }
];

DH.companion = (id) => DH.COMPANIONS.find(c => c.id === id);
