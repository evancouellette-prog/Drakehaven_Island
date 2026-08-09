/* Drakehaven Island — backgrounds. Each gives two skills, a kit, coin and a hook
   the story can reference. */
window.DH = window.DH || {};

DH.BACKGROUNDS = [
  {
    id: 'sailor', name: 'Sailor',
    blurb: 'You know the difference between a squall and a real storm, and you know it in your knees.',
    skills: ['athletics', 'perception'], tools: ['navigators_tools', 'vehicles_water'],
    gold: 10, kit: ['belaying_pin', 'rope_50ft', 'lucky_charm'],
    feature: { name: 'Ship\'s Passage', desc: 'You can secure free passage on a sailing ship for yourself and your companions, in exchange for work.' },
    hook: 'The captain of the Mary Parker recognises your knots and treats you a little better for it.'
  },
  {
    id: 'soldier', name: 'Soldier',
    blurb: 'You have stood in a line and held it. P.A.C.T. recruited you off a muster roll.',
    skills: ['athletics', 'intimidation'], tools: ['dice_set', 'vehicles_land'],
    gold: 10, kit: ['insignia_of_rank', 'trophy_from_battle', 'dice_set'],
    feature: { name: 'Military Rank', desc: 'Soldiers loyal to your old outfit recognise your authority and will defer on small matters.' },
    hook: 'You already know what P.A.C.T. stands for, and what it does to people who fail a posting.'
  },
  {
    id: 'criminal', name: 'Criminal',
    blurb: 'You have a contact for everything and a reason not to use most of them.',
    skills: ['deception', 'stealth'], tools: ['thieves_tools', 'dice_set'],
    gold: 15, kit: ['crowbar', 'dark_clothes'],
    feature: { name: 'Criminal Contact', desc: 'You know how to find the person in any town who sells what should not be sold.' },
    hook: 'The shady man in the Drakehaven market will make you an offer before he makes anyone else one.'
  },
  {
    id: 'sage', name: 'Sage',
    blurb: 'You read about dragons long before one screamed at you inside your own head.',
    skills: ['arcana', 'history'], tools: [],
    gold: 10, kit: ['ink_and_quill', 'small_knife', 'unfinished_letter'],
    feature: { name: 'Researcher', desc: 'If you do not know a piece of lore, you know who does and where they keep it.' },
    hook: 'You recognise the necklace on the sea hag before anyone else thinks to look at it.'
  },
  {
    id: 'acolyte', name: 'Acolyte',
    blurb: 'You served at an altar. The service did not end when you left the building.',
    skills: ['insight', 'religion'], tools: [],
    gold: 15, kit: ['holy_symbol', 'prayer_book', 'incense'],
    feature: { name: 'Shelter of the Faithful', desc: 'Temples of your faith will house and heal you and your companions.' },
    hook: 'When the dragonborn\'s eyes glow gold, you are the one who recognises that it is a prayer.'
  },
  {
    id: 'folk_hero', name: 'Folk Hero',
    blurb: 'You did one large thing in a small place, and people there still tell the story wrong.',
    skills: ['animal_handling', 'survival'], tools: ['artisans_tools', 'vehicles_land'],
    gold: 10, kit: ['smiths_tools', 'shovel', 'iron_pot'],
    feature: { name: 'Rustic Hospitality', desc: 'Common folk will hide and shelter you, so long as you do not bring danger to their door.' },
    hook: 'The minotaur boy who thanks you after the Half-Dragon will remember your name for the rest of his life.'
  },
  {
    id: 'charlatan', name: 'Charlatan',
    blurb: 'You have never met a game you could not tilt, which is why you spot a loaded die instantly.',
    skills: ['deception', 'sleight_of_hand'], tools: ['disguise_kit', 'forgery_kit'],
    gold: 15, kit: ['fine_clothes', 'weighted_dice', 'signet_ring'],
    feature: { name: 'False Identity', desc: 'You have a second name with papers to match, and can forge documents convincingly.' },
    hook: 'The captain\'s charlatan\'s dice will not fool you for a second, and you may want to lose anyway.'
  },
  {
    id: 'guild_artisan', name: 'Guild Artisan',
    blurb: 'You make things properly, which means you notice immediately when something was made badly on purpose.',
    skills: ['insight', 'persuasion'], tools: ['artisans_tools'],
    gold: 15, kit: ['smiths_tools', 'letter_of_introduction', 'travelers_clothes'],
    feature: { name: 'Guild Membership', desc: 'Your guild will vouch for you, feed you and lend you a workshop in any town of size.' },
    hook: 'You can tell the blue brass knuckles are enspelled before the tabaxi says a word.'
  },
  {
    id: 'outlander', name: 'Outlander',
    blurb: 'You grew up outside the walls. Mud tells you things and you have never once been lost.',
    skills: ['athletics', 'survival'], tools: ['herbalism_kit'],
    gold: 10, kit: ['staff', 'hunting_trap', 'travelers_clothes'],
    feature: { name: 'Wanderer', desc: 'You remember the shape of any land you have crossed, and can find food and water for five people each day.' },
    hook: 'The swamp outside the gnome\'s house does not frighten you the way it frightens the others.'
  },
  {
    id: 'urchin', name: 'Urchin',
    blurb: 'You raised yourself in alleys. You know every roofline in a town within an hour of arriving.',
    skills: ['sleight_of_hand', 'stealth'], tools: ['disguise_kit', 'thieves_tools'],
    gold: 10, kit: ['small_knife', 'city_map', 'pet_mouse'],
    feature: { name: 'City Secrets', desc: 'You travel between any two points in a town at twice the normal speed, using ways nobody else uses.' },
    hook: 'You spot the kobold shrieking on the rooftop before it finishes its first breath.'
  },
  {
    id: 'noble', name: 'Noble',
    blurb: 'You have an invitation to the royal ball already, and the elf at the door will believe you.',
    skills: ['history', 'persuasion'], tools: ['gaming_set'],
    gold: 25, kit: ['fine_clothes', 'signet_ring', 'scroll_of_pedigree'],
    feature: { name: 'Position of Privilege', desc: 'People assume you have a right to be wherever you are, and let you speak to whoever is in charge.' },
    hook: 'At the ball you will not need a forged invitation, and the tall elf woman will be politely terrified of you.'
  },
  {
    id: 'entertainer', name: 'Entertainer',
    blurb: 'You can hold a room. In a tavern full of tired dock workers that is a form of power.',
    skills: ['acrobatics', 'performance'], tools: ['musical_instrument', 'disguise_kit'],
    gold: 15, kit: ['lute', 'costume', 'admirers_favor'],
    feature: { name: 'By Popular Demand', desc: 'You can always find a place to perform for food and lodging, and the locals will take your side in a dispute.' },
    hook: 'The musicians in the corner of the Dragon\'s Keg will let you sit in, and Little Mimsy will comp your drinks.'
  }
];

DH.backgroundById = (id) => DH.BACKGROUNDS.find(b => b.id === id);
