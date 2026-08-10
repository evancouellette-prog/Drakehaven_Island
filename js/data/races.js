/* Drakehaven Island — the peoples of the island and the wider sea.
   `look` drives the procedural portrait; `effects` are tokens the engine reads. */
window.DH = window.DH || {};

DH.RACES = [
  {
    id: 'human', name: 'Human', size: 'Medium', speed: 30,
    blurb: 'Ambitious, adaptable, and everywhere. P.A.C.T. recruits more humans than anything else, mostly because more of them volunteer.',
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: [
      { name: 'Versatile', desc: '+1 to every ability score.' },
      { name: 'Driven', desc: 'One extra skill proficiency of your choice.', effects: ['skill_choice:1'] }
    ],
    look: { skin: ['#f0cfa8', '#d8a878', '#b8845a', '#8a5f3c', '#5f4028'], hair: ['#2b1f16', '#5a3a22', '#8a6a3a', '#c2a668', '#7a2a20', '#1a1410'] }
  },
  {
    id: 'wood_elf', name: 'Wood Elf', size: 'Medium', speed: 35,
    blurb: 'Long-lived, quiet-footed, and hard to startle. They sleep less than anyone thinks is decent, which makes them excellent in a hammock during a storm.',
    bonus: { dex: 2, wis: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Keen Senses', desc: 'Proficiency in Perception.', effects: ['skill:perception'] },
      { name: 'Fey Ancestry', desc: 'Advantage on saves against being charmed, and magic cannot put you to sleep.', effects: ['adv_vs_charmed', 'no_sleep'] },
      { name: 'Fleet of Foot', desc: 'Your walking speed is 35 ft.' },
      { name: 'Mask of the Wild', desc: 'You can hide when only lightly obscured by foliage, rain, mist or falling snow.', effects: ['mask_of_wild'] },
      { name: 'Trance', desc: 'Four hours of meditation counts as a long rest.', effects: ['trance'] }
    ],
    /* Wood elves take their colour from the wood. The green tones are the ones
       who have lived under canopy long enough to match it. */
    look: {
      skin: ['#e8d0b0', '#d8b890', '#c2a878', '#a8865f', '#a8bd8a', '#8aa87a', '#6f9a68', '#527f52'],
      hair: ['#3a2a18', '#6a5a2a', '#8a7a4a', '#2b3a2a', '#c2b088', '#4a6b3a'],
      flags: { ears: 'long' }
    }
  },
  {
    id: 'high_elf', name: 'High Elf', size: 'Medium', speed: 30,
    blurb: 'Raised on libraries and lineage. High elves consider the sea beneath them, and say so, loudly, while being seasick.',
    bonus: { dex: 2, int: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Keen Senses', desc: 'Proficiency in Perception.', effects: ['skill:perception'] },
      { name: 'Fey Ancestry', desc: 'Advantage on saves against being charmed, and magic cannot put you to sleep.', effects: ['adv_vs_charmed', 'no_sleep'] },
      { name: 'Cantrip', desc: 'You know one wizard cantrip, cast with Intelligence.', effects: ['wizard_cantrip'] },
      { name: 'Trance', desc: 'Four hours of meditation counts as a long rest.', effects: ['trance'] }
    ],
    look: { skin: ['#f4e0c8', '#e8d0b0', '#d8b890', '#c8a888'], hair: ['#e8dcc0', '#c2a668', '#8a7a4a', '#2b1f16', '#a8b8d0'], flags: { ears: 'long' } }
  },
  {
    id: 'hill_dwarf', name: 'Hill Dwarf', size: 'Medium', speed: 25,
    blurb: 'Stout, stubborn, and impossible to poison properly. Hill dwarves keep grudges the way other people keep gardens.',
    bonus: { con: 2, wis: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Dwarven Resilience', desc: 'Advantage on saves against poison, and resistance to poison damage.', effects: ['adv_vs_poison', 'resist:poison'] },
      { name: 'Stonecunning', desc: 'Double proficiency on History checks about stonework.', effects: ['stonecunning'] },
      { name: 'Dwarven Toughness', desc: '+1 hit point per level.', effects: ['hp_per_level:1'] }
    ],
    look: { skin: ['#e8c0a0', '#d8a878', '#b8845a', '#8a5f3c'], hair: ['#7a2a20', '#5a3a22', '#8a6a3a', '#c8c4b0', '#2b1f16'], flags: { beard: true, short: true } }
  },
  {
    id: 'mountain_dwarf', name: 'Mountain Dwarf', size: 'Medium', speed: 25,
    blurb: 'Born inside the rock and armored before they can walk. If a mountain dwarf tells you a tunnel is unsafe, leave.',
    bonus: { str: 2, con: 2 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Dwarven Resilience', desc: 'Advantage on saves against poison, and resistance to poison damage.', effects: ['adv_vs_poison', 'resist:poison'] },
      { name: 'Dwarven Armor Training', desc: 'Proficiency with light and medium armor.', effects: ['armor:light', 'armor:medium'] },
      { name: 'Stonecunning', desc: 'Double proficiency on History checks about stonework.', effects: ['stonecunning'] }
    ],
    look: { skin: ['#e8c0a0', '#d8a878', '#b8845a', '#8a5f3c'], hair: ['#5a3a22', '#7a2a20', '#c8c4b0', '#2b1f16'], flags: { beard: true, short: true } }
  },
  {
    id: 'halfling', name: 'Lightfoot Halfling', size: 'Small', speed: 25,
    blurb: 'Cheerful, hard to hit, and luckier than the maths allows. Nobody has ever successfully sneaked up on a halfling cook.',
    bonus: { dex: 2, cha: 1 },
    traits: [
      { name: 'Lucky', desc: 'When you roll a 1 on a d20 test, reroll it.', effects: ['lucky'] },
      { name: 'Brave', desc: 'Advantage on saves against being frightened.', effects: ['adv_vs_frightened'] },
      { name: 'Halfling Nimbleness', desc: 'You can move through the space of any creature larger than you.', effects: ['nimble'] },
      { name: 'Naturally Stealthy', desc: 'You can hide behind a creature one size larger than you.', effects: ['naturally_stealthy'] }
    ],
    look: { skin: ['#f0cfa8', '#d8a878', '#b8845a'], hair: ['#8a6a3a', '#5a3a22', '#c2a668', '#7a4a20'], flags: { small: true } }
  },
  {
    id: 'dragonborn', name: 'Dragonborn', size: 'Medium', speed: 30,
    blurb: 'Scaled, proud, and increasingly nervous. Since the dragons started screaming about eggs, dragonborn hear things in their sleep.',
    bonus: { str: 2, cha: 1 },
    traits: [
      { name: 'Draconic Ancestry', desc: 'Choose a dragon; it sets your breath weapon and damage resistance.' },
      { name: 'Breath Weapon', desc: 'Exhale destruction in a 15-ft cone or 30-ft line. 2d6 damage, DC 8 + CON + proficiency for half. Once per short rest.', effects: ['breath'] },
      { name: 'Draconic Resistance', desc: 'Resistance to your ancestry damage type.', effects: ['draconic_resist'] },
      { name: 'The Dragon\'s Ear', desc: 'Something in the deep places knows your name.', effects: ['dragon_touched'] }
    ],
    ancestries: [
      { id: 'gold', name: 'Gold', dmg: 'fire', shape: 'cone', col: '#e8bd58' },
      { id: 'red', name: 'Red', dmg: 'fire', shape: 'cone', col: '#a83a2a' },
      { id: 'brass', name: 'Brass', dmg: 'fire', shape: 'line', col: '#c2954a' },
      { id: 'blue', name: 'Blue', dmg: 'lightning', shape: 'line', col: '#3f6f9a' },
      { id: 'bronze', name: 'Bronze', dmg: 'lightning', shape: 'line', col: '#8a7a4a' },
      { id: 'green', name: 'Green', dmg: 'poison', shape: 'cone', col: '#3a6b3f' },
      { id: 'black', name: 'Black', dmg: 'acid', shape: 'line', col: '#3a3540' },
      { id: 'copper', name: 'Copper', dmg: 'acid', shape: 'line', col: '#b86a3a' },
      { id: 'silver', name: 'Silver', dmg: 'cold', shape: 'cone', col: '#c8d0dc' },
      { id: 'white', name: 'White', dmg: 'cold', shape: 'cone', col: '#dce8f0' }
    ],
    look: {
      skin: ['#c2954a', '#a83a2a', '#3f6f9a', '#3a6b3f', '#3a3540', '#c8d0dc', '#b86a3a', '#8a7a4a'],
      hair: ['#00000000'], flags: { snout: true, scalesFromSkin: true, hairStyle: 'bald', tail: true, horns: 'curved' }
    }
  },
  {
    id: 'gnome', name: 'Rock Gnome', size: 'Small', speed: 25,
    blurb: 'Inventors, tinkers, and the reason the mine has traps in it. A gnome once wanted to be a magical wizard and bought a great deal of soil.',
    bonus: { int: 2, con: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Gnome Cunning', desc: 'Advantage on INT, WIS and CHA saves against magic.', effects: ['gnome_cunning'] },
      { name: 'Artificer\'s Lore', desc: 'Double proficiency on History about devices and contraptions.', effects: ['artificers_lore'] },
      { name: 'Tinker', desc: 'You can build small clockwork oddities. Proficiency with tinker\'s tools.', effects: ['tool:tinker'] }
    ],
    look: { skin: ['#f0cfa8', '#e8c0a0', '#d8a878'], hair: ['#c8c4b0', '#e8dcc0', '#8a6a3a', '#c2452a'], flags: { small: true, beard: true } }
  },
  {
    id: 'half_elf', name: 'Half-Elf', size: 'Medium', speed: 30,
    blurb: 'At home in two places and belonging to neither, which makes them very good at talking their way into a third.',
    bonus: { cha: 2 }, flexBonus: { count: 2, amount: 1, exclude: ['cha'] },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Fey Ancestry', desc: 'Advantage on saves against being charmed, and magic cannot put you to sleep.', effects: ['adv_vs_charmed', 'no_sleep'] },
      { name: 'Two Worlds', desc: 'Two extra skill proficiencies of your choice.', effects: ['skill_choice:2'] }
    ],
    look: { skin: ['#f0cfa8', '#d8a878', '#b8845a', '#8a5f3c'], hair: ['#2b1f16', '#5a3a22', '#8a6a3a', '#c2a668'], flags: { ears: 'long' } }
  },
  {
    id: 'half_orc', name: 'Half-Orc', size: 'Medium', speed: 30,
    blurb: 'Built to keep going after the point where keeping going stops making sense. P.A.C.T. loves them for exactly that reason.',
    bonus: { str: 2, con: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Menacing', desc: 'Proficiency in Intimidation.', effects: ['skill:intimidation'] },
      { name: 'Relentless Endurance', desc: 'When dropped to 0 hit points, drop to 1 instead. Once per long rest.', effects: ['relentless'] },
      { name: 'Savage Attacks', desc: 'On a critical hit, roll one extra weapon damage die.', effects: ['savage_crit'] }
    ],
    look: { skin: ['#8a9a6a', '#6a8a5a', '#9aa87a', '#5f7a4a'], hair: ['#1a1410', '#2b1f16', '#3a2a18'], flags: { tusks: true, big: true } }
  },
  {
    id: 'tiefling', name: 'Tiefling', size: 'Medium', speed: 30,
    blurb: 'Marked by a bargain someone else made. They get used to the staring; the tail knocking over drinks is harder to get used to.',
    bonus: { cha: 2, int: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Hellish Resistance', desc: 'Resistance to fire damage.', effects: ['resist:fire'] },
      { name: 'Infernal Legacy', desc: 'You know the Thaumaturgy cantrip; at 3rd level you can cast Hellish Rebuke once per long rest.', effects: ['spell:thaumaturgy'] }
    ],
    look: {
      skin: ['#c2453a', '#a83a5a', '#8a3f6a', '#d8845a', '#6a3f5a'],
      hair: ['#1a1410', '#5c1a20', '#2b1f3a', '#c2a668'], flags: { horns: 'spike', tail: true }
    }
  },
  {
    id: 'tabaxi', name: 'Tabaxi', size: 'Medium', speed: 30,
    blurb: 'Curious to a fault and faster than seems fair over short distances. There is an orange one in the Dragon\'s Keg who knows what an enspelled weapon is.',
    bonus: { dex: 2, cha: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Feline Agility', desc: 'Once per combat, double your speed for a turn.', effects: ['feline_agility'] },
      { name: 'Cat\'s Claws', desc: 'Unarmed strikes deal 1d4 slashing, and you have a climb speed of 20 ft.', effects: ['claws', 'climb:20'] },
      { name: 'Cat\'s Talent', desc: 'Proficiency in Perception and Stealth.', effects: ['skill:perception', 'skill:stealth'] }
    ],
    look: {
      skin: ['#d8954a', '#c2a668', '#8a6a4a', '#e8dcc0', '#3a3028'],
      hair: ['#8a5f3a', '#5a3a22', '#c8c4b0'], flags: { ears: 'cat', tail: true, furFromSkin: true }
    }
  },
  {
    id: 'minotaur', name: 'Minotaur', size: 'Medium', speed: 30,
    blurb: 'Horns first, questions later. Drakehaven has a lot of minotaurs, and a lot of doorways they resent.',
    bonus: { str: 2, con: 1 },
    traits: [
      { name: 'Horns', desc: 'Your horns are a natural weapon dealing 1d6 piercing.', effects: ['horns'] },
      { name: 'Goring Rush', desc: 'When you Dash, you may make one free horn attack as a bonus action.', effects: ['goring_rush'] },
      { name: 'Hammering Horns', desc: 'After hitting with a melee attack, shove a creature 10 ft as a bonus action.', effects: ['hammering_horns'] },
      { name: 'Powerful Build', desc: 'You count as one size larger for carrying and shoving.', effects: ['powerful_build'] }
    ],
    look: {
      skin: ['#8a6a4a', '#6a4a32', '#c2a668', '#4a3828', '#e8dcc0'],
      hair: ['#3a2a18', '#1a1410', '#8a6a3a'], flags: { horns: 'bull', tail: true, big: true, snout: true }
    }
  },
  {
    id: 'kobold', name: 'Kobold', size: 'Small', speed: 30,
    blurb: 'Small, scaled, and desperately loyal to something enormous. When one is shrieking on a rooftop, it is calling for help.',
    bonus: { dex: 2 }, penalty: { str: -2 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Pack Tactics', desc: 'Advantage on attacks when an ally is within 5 ft of your target.', effects: ['pack_tactics'] },
      { name: 'Grovel, Cower and Beg', desc: 'As an action, give allies within 10 ft advantage on their next attack.', effects: ['grovel'] }
    ],
    look: {
      skin: ['#a8453a', '#8a6a3a', '#3a6b5f', '#6a4a7a', '#c2954a'],
      hair: ['#00000000'], flags: { snout: true, scalesFromSkin: true, hairStyle: 'bald', tail: true, small: true, horns: 'spike' }
    }
  },
  {
    id: 'orc', name: 'Orc', size: 'Medium', speed: 30,
    blurb: 'Aggressive in the technical sense: an orc closes distance faster than anyone expects, and apologises afterwards. Sometimes.',
    bonus: { str: 2, con: 1 },
    traits: [
      { name: 'Darkvision', desc: 'See 60 ft in dim light as though it were bright.', effects: ['darkvision:60'] },
      { name: 'Aggressive', desc: 'As a bonus action, move up to your speed toward a hostile creature.', effects: ['aggressive'] },
      { name: 'Powerful Build', desc: 'You count as one size larger for carrying and shoving.', effects: ['powerful_build'] },
      { name: 'Primal Intuition', desc: 'Proficiency in Survival and Intimidation.', effects: ['skill:survival', 'skill:intimidation'] }
    ],
    look: {
      skin: ['#6a8a5a', '#5f7a4a', '#8a9a6a', '#4a6a3a'],
      hair: ['#1a1410', '#2b1f16'], flags: { tusks: true, big: true, hairStyle: 'mohawk' }
    }
  }
];

DH.raceById = (id) => DH.RACES.find(r => r.id === id);

/* Build the visual spec (palette + flags) the renderer needs for a character. */
DH.raceLook = function (race, choice) {
  choice = choice || {};
  const L = race.look || {};
  const skin = choice.skin || (L.skin && L.skin[0]) || '#d8a878';
  const hair = choice.hair || (L.hair && L.hair[0]) || '#2b1f16';
  const flags = Object.assign({}, L.flags || {});
  const spec = {
    body: 'humanoid', skin: skin, hair: hair,
    cloth: choice.cloth || '#5a4a7a', cloth2: choice.cloth2 || '#3a3050',
    hairStyle: choice.hairStyle || flags.hairStyle || 'short',
    sleeves: true
  };
  if (flags.ears) spec.ears = flags.ears;
  if (flags.horns) spec.horns = choice.horns || flags.horns;
  if (flags.tail) spec.tail = true;
  if (flags.tusks) spec.tusks = true;
  if (flags.beard && choice.beard !== false) spec.beard = choice.beardCol || hair;
  if (flags.snout) spec.snout = true;
  if (flags.scalesFromSkin) spec.scales = skin;
  if (flags.furFromSkin) spec.fur = skin;
  if (flags.small) spec.smallBody = true;
  if (flags.big) spec.bigBody = true;
  return spec;
};
