/* Drakehaven Island — all twelve classes, their subclasses, and the features the
   engine actually resolves. `effects` tokens are read by rules/character.js and combat. */
window.DH = window.DH || {};

/* ---------- spell slot progressions (levels 1..10) ---------- */
DH.SLOTS = {
  full: [
    {}, { 1: 2 }, { 1: 3 }, { 1: 4, 2: 2 }, { 1: 4, 2: 3 }, { 1: 4, 2: 3, 3: 2 },
    { 1: 4, 2: 3, 3: 3 }, { 1: 4, 2: 3, 3: 3, 4: 1 }, { 1: 4, 2: 3, 3: 3, 4: 2 },
    { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
  ],
  half: [
    {}, {}, { 1: 2 }, { 1: 3 }, { 1: 3 }, { 1: 4, 2: 2 }, { 1: 4, 2: 2 },
    { 1: 4, 2: 3 }, { 1: 4, 2: 3 }, { 1: 4, 2: 3, 3: 2 }, { 1: 4, 2: 3, 3: 2 }
  ],
  third: [
    {}, {}, {}, { 1: 2 }, { 1: 3 }, { 1: 3 }, { 1: 4, 2: 2 }, { 1: 4, 2: 2 },
    { 1: 4, 2: 2 }, { 1: 4, 2: 2 }, { 1: 4, 2: 3 }
  ],
  /* Warlock: few slots, all of the highest level, recovered on a short rest */
  pact: [
    {}, { n: 1, lv: 1 }, { n: 2, lv: 1 }, { n: 2, lv: 2 }, { n: 2, lv: 2 }, { n: 2, lv: 3 },
    { n: 2, lv: 3 }, { n: 2, lv: 4 }, { n: 2, lv: 4 }, { n: 2, lv: 5 }, { n: 2, lv: 5 }
  ]
};

DH.CANTRIPS = {
  bard: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3], cleric: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5],
  druid: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4], sorcerer: [0, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6],
  warlock: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3], wizard: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5]
};

const ALL_SKILLS = ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history',
  'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'];

DH.CLASSES = [
  /* ============================== BARBARIAN ============================== */
  {
    id: 'barbarian', name: 'Barbarian', hitDie: 12, primary: ['str', 'con'],
    blurb: 'You do not out-think the problem. You walk into it until it stops. Rage is not a mood, it is a resource.',
    flavor: 'Anvil has been punching a bar of ship-iron for two hours because the storm woke him and he had nothing else to hit.',
    saves: ['str', 'con'], armor: ['light', 'medium', 'shields'], weapons: ['simple', 'martial'],
    skillCount: 2, skillList: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
    kit: ['greataxe', 'handaxe', 'handaxe', 'explorers_pack', 'javelin'],
    features: {
      1: [
        { name: 'Rage', desc: 'Bonus action: for one minute you gain +2 damage on Strength attacks, resistance to bludgeoning, piercing and slashing, and advantage on Strength checks and saves. You cannot cast spells while raging.', effects: ['rage'] },
        { name: 'Unarmoured Defence', desc: 'With no armour, your AC is 10 + DEX + CON.', effects: ['unarmored_defense:con'] }
      ],
      2: [
        { name: 'Reckless Attack', desc: 'Attack with advantage; attacks against you have advantage until your next turn.', effects: ['reckless_attack'] },
        { name: 'Danger Sense', desc: 'Advantage on DEX saves against effects you can see.', effects: ['danger_sense'] }
      ],
      3: [{ name: 'Primal Path', desc: 'Choose the path your fury takes.', subclass: true }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [
        { name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] },
        { name: 'Fast Movement', desc: '+10 ft speed in no heavy armour.', effects: ['speed:10'] }
      ],
      7: [{ name: 'Feral Instinct', desc: 'Advantage on initiative, and you can act while surprised if you rage first.', effects: ['adv_initiative'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      9: [{ name: 'Brutal Critical', desc: 'One extra weapon die on a critical hit.', effects: ['brutal_crit:1'] }],
      10: [{ name: 'Path Feature', desc: 'Your path deepens.', subclassFeature: true }]
    },
    subclasses: [
      {
        id: 'berserker', name: 'Path of the Berserker',
        blurb: 'Fury without a lid. You keep swinging past the point of sense and pay for it later.',
        features: { 3: [{ name: 'Frenzy', desc: 'While raging, make one free melee attack as a bonus action each turn. You gain a level of exhaustion when the rage ends.', effects: ['frenzy'] }], 10: [{ name: 'Intimidating Presence', desc: 'Action: frighten a creature within 30 ft on a failed WIS save.', effects: ['intimidating_presence'] }] }
      },
      {
        id: 'totem', name: 'Path of the Totem Warrior',
        blurb: 'A bear\'s endurance, a wolf\'s pack sense, an eagle\'s eye. You borrow from beasts.',
        features: { 3: [{ name: 'Bear Totem', desc: 'While raging, you have resistance to all damage except psychic.', effects: ['bear_totem'] }], 10: [{ name: 'Spirit Walker', desc: 'Once per long rest, sense the way to what you seek.', effects: ['spirit_walker'] }] }
      },
      {
        id: 'zealot', name: 'Path of the Zealot',
        blurb: 'Something divine is riding your anger, and it wants you to keep fighting after you should have died.',
        features: { 3: [{ name: 'Divine Fury', desc: 'While raging, your first hit each turn deals an extra 1d6+half level necrotic damage.', effects: ['divine_fury'] }], 10: [{ name: 'Zealous Presence', desc: 'Bonus action: allies within 60 ft gain advantage on attacks and saves for a round.', effects: ['zealous_presence'] }] }
      }
    ]
  },

  /* ================================= BARD ================================= */
  {
    id: 'bard', name: 'Bard', hitDie: 8, primary: ['cha', 'dex'],
    blurb: 'You are good at everything by refusing to specialise, and you make everyone around you better at it too.',
    flavor: 'There are three musicians in the corner of the Dragon\'s Keg working for a day\'s worth of coin. You could do better.',
    saves: ['dex', 'cha'], armor: ['light'], weapons: ['simple', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
    skillCount: 3, skillList: ALL_SKILLS.slice(),
    caster: { ability: 'cha', type: 'full', list: 'bard', prepares: false, known: [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14] },
    kit: ['rapier', 'leather_armor', 'dagger', 'lute', 'entertainers_pack'],
    features: {
      1: [
        { name: 'Bardic Inspiration', desc: 'Bonus action: give an ally a d6 they can add to one d20 test or damage roll. Uses equal to your CHA modifier, back on a short rest.', effects: ['bardic_inspiration'] },
        { name: 'Spellcasting', desc: 'You cast bard spells using Charisma.', effects: ['spellcasting'] }
      ],
      2: [
        { name: 'Jack of All Trades', desc: 'Half proficiency on any ability check you are not already proficient in.', effects: ['jack_of_all_trades'] },
        { name: 'Song of Rest', desc: 'Allies who spend a short rest with you regain an extra 1d6 hit points.', effects: ['song_of_rest'] }
      ],
      3: [
        { name: 'Bard College', desc: 'Choose where you learned to perform.', subclass: true },
        { name: 'Expertise', desc: 'Double proficiency in two skills.', effects: ['expertise:2'] }
      ],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Font of Inspiration', desc: 'Bardic Inspiration returns on a short rest as well as a long one.', effects: ['font_of_inspiration'] }],
      6: [{ name: 'Countercharm', desc: 'Action: allies within 30 ft gain advantage against being frightened or charmed.', effects: ['countercharm'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      9: [{ name: 'Song of Rest improves', desc: 'The extra healing becomes 1d8.', effects: ['song_of_rest2'] }],
      10: [
        { name: 'Expertise', desc: 'Double proficiency in two more skills.', effects: ['expertise:2'] },
        { name: 'Magical Secrets', desc: 'Learn two spells from any class list.', effects: ['magical_secrets:2'] }
      ]
    },
    subclasses: [
      {
        id: 'lore', name: 'College of Lore',
        blurb: 'You collect facts the way other people collect debts, and you deploy them just as ruthlessly.',
        features: { 3: [{ name: 'Cutting Words', desc: 'Reaction: spend inspiration to subtract a d6 from an enemy\'s attack, check or damage roll.', effects: ['cutting_words'] }], 10: [{ name: 'Additional Magical Secrets', desc: 'Two more spells from any list.', effects: ['magical_secrets:2'] }] }
      },
      {
        id: 'valor', name: 'College of Valour',
        blurb: 'You sing from inside the fight, in armour, with a sword, which the other colleges find vulgar.',
        features: { 3: [{ name: 'Combat Inspiration', desc: 'Inspiration can be added to a damage roll, or to AC against one attack.', effects: ['combat_inspiration', 'armor:medium', 'armor:shields', 'weapons:martial'] }], 10: [{ name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] }] }
      },
      {
        id: 'swords', name: 'College of Swords',
        blurb: 'A blade dancer. The performance is the fight, and the fight is very good.',
        features: { 3: [{ name: 'Blade Flourish', desc: 'Your flourishes add inspiration dice to damage and let you move 10 ft as part of the attack.', effects: ['blade_flourish', 'armor:medium', 'weapons:scimitar'] }], 10: [{ name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] }] }
      }
    ]
  },

  /* ================================ CLERIC ================================ */
  {
    id: 'cleric', name: 'Cleric', hitDie: 8, primary: ['wis', 'con'],
    blurb: 'Someone enormous is paying attention to you. Channel that, heal with it, and burn the undead with it.',
    flavor: 'On a boat in a storm, everyone finds religion. You brought yours with you.',
    saves: ['wis', 'cha'], armor: ['light', 'medium', 'shields'], weapons: ['simple'],
    skillCount: 2, skillList: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
    caster: { ability: 'wis', type: 'full', list: 'cleric', prepares: true },
    kit: ['mace', 'scale_mail', 'shield', 'holy_symbol', 'priests_pack'],
    features: {
      1: [
        { name: 'Spellcasting', desc: 'You prepare cleric spells using Wisdom.', effects: ['spellcasting'] },
        { name: 'Divine Domain', desc: 'Your god\'s particular concern.', subclass: true }
      ],
      2: [{ name: 'Channel Divinity', desc: 'Once per short rest, Turn Undead (frighten undead within 30 ft on a failed WIS save) or use your domain\'s option.', effects: ['channel_divinity:1', 'turn_undead'] }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Destroy Undead', desc: 'Turned undead of CR 1/2 or lower are destroyed outright.', effects: ['destroy_undead'] }],
      6: [{ name: 'Channel Divinity (2/rest)', desc: 'A second use per short rest.', effects: ['channel_divinity:1'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Divine Intervention', desc: 'Once per long rest, ask your god directly. Roll d100 under your level.', effects: ['divine_intervention'] }]
    },
    subclasses: [
      {
        id: 'life', name: 'Life Domain',
        blurb: 'Your healing lands harder than anyone else\'s. Nobody dies on your watch if you can help it.',
        features: {
          1: [{ name: 'Disciple of Life', desc: 'Healing spells restore an extra 2 + spell level hit points.', effects: ['disciple_of_life', 'armor:heavy'] }],
          2: [{ name: 'Preserve Life', desc: 'Channel Divinity: restore 5 x level hit points, split among creatures within 30 ft.', effects: ['preserve_life'] }],
          6: [{ name: 'Blessed Healer', desc: 'When you heal another, you regain 2 + spell level too.', effects: ['blessed_healer'] }]
        }
      },
      {
        id: 'war', name: 'War Domain',
        blurb: 'Your god is in the swing of the weapon. You fight in the front rank and it approves.',
        features: {
          1: [{ name: 'War Priest', desc: 'When you take the Attack action, make one weapon attack as a bonus action. WIS-modifier uses per long rest.', effects: ['war_priest', 'armor:heavy', 'weapons:martial'] }],
          2: [{ name: 'Guided Strike', desc: 'Channel Divinity: +10 to one attack roll after you see the die.', effects: ['guided_strike'] }],
          6: [{ name: 'Channel Divinity: War God\'s Blessing', desc: 'Reaction: grant an ally +10 to an attack roll.', effects: ['war_gods_blessing'] }]
        }
      },
      {
        id: 'light', name: 'Light Domain',
        blurb: 'You are a lantern held up in a dark place, and things that hate the light hate you specifically.',
        features: {
          1: [{ name: 'Warding Flare', desc: 'Reaction: impose disadvantage on an attack against you. WIS-modifier uses per long rest.', effects: ['warding_flare', 'spell:light'] }],
          2: [{ name: 'Radiance of the Dawn', desc: 'Channel Divinity: 2d10 + level radiant damage to hostiles within 30 ft, half on a CON save.', effects: ['radiance_of_dawn'] }],
          6: [{ name: 'Improved Flare', desc: 'Warding Flare can protect an ally you can see.', effects: ['improved_flare'] }]
        }
      },
      {
        id: 'tempest', name: 'Tempest Domain',
        blurb: 'Thunder and salt water. On the deck of the Mary Parker in a storm, you have never felt more at home.',
        features: {
          1: [{ name: 'Wrath of the Storm', desc: 'Reaction: when hit in melee, deal 2d8 lightning to the attacker, half on a DEX save. WIS-modifier uses per long rest.', effects: ['wrath_of_storm', 'armor:heavy', 'weapons:martial'] }],
          2: [{ name: 'Destructive Wrath', desc: 'Channel Divinity: maximise lightning or thunder damage instead of rolling.', effects: ['destructive_wrath'] }],
          6: [{ name: 'Thunderbolt Strike', desc: 'Lightning damage you deal pushes Large or smaller creatures 10 ft.', effects: ['thunderbolt_strike'] }]
        }
      }
    ]
  },

  /* ================================= DRUID ================================= */
  {
    id: 'druid', name: 'Druid', hitDie: 8, primary: ['wis', 'con'],
    blurb: 'The island is alive and it will talk to you. When talking fails, become something with claws.',
    flavor: 'A copper dragon is looking after a blue dragon\'s orphan in a clearing. You are the one who will understand why.',
    saves: ['int', 'wis'], armor: ['light', 'medium', 'shields'], weapons: ['club', 'dagger', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
    skillCount: 2, skillList: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
    caster: { ability: 'wis', type: 'full', list: 'druid', prepares: true },
    kit: ['scimitar', 'leather_armor', 'shield', 'druidic_focus', 'explorers_pack'],
    features: {
      1: [
        { name: 'Druidic', desc: 'You speak the secret language of druids and can leave hidden messages.', effects: ['druidic'] },
        { name: 'Spellcasting', desc: 'You prepare druid spells using Wisdom.', effects: ['spellcasting'] }
      ],
      2: [
        { name: 'Wild Shape', desc: 'Twice per short rest, become a beast you have seen. You keep your mind and your own hit points return when the form drops.', effects: ['wild_shape'] },
        { name: 'Druid Circle', desc: 'The tradition you were taught.', subclass: true }
      ],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Circle Feature', desc: 'Your circle deepens.', subclassFeature: true }]
    },
    subclasses: [
      {
        id: 'land', name: 'Circle of the Land',
        blurb: 'You are a walking library of one particular landscape. The swamp holds no surprises for you.',
        features: {
          2: [{ name: 'Natural Recovery', desc: 'On a short rest, recover spell slots totalling half your druid level.', effects: ['natural_recovery'] }],
          10: [{ name: 'Nature\'s Ward', desc: 'You are immune to poison and disease and cannot be charmed by elementals or fey.', effects: ['immune:poison', 'natures_ward'] }]
        }
      },
      {
        id: 'moon', name: 'Circle of the Moon',
        blurb: 'Your Wild Shape is a weapon. You go into the fight as something with a lot of teeth.',
        features: {
          2: [{ name: 'Combat Wild Shape', desc: 'Wild Shape as a bonus action, and spend spell slots while shaped to heal 1d8 per slot level.', effects: ['combat_wild_shape'] }],
          10: [{ name: 'Elemental Wild Shape', desc: 'Spend two Wild Shape uses to become an elemental.', effects: ['elemental_shape'] }]
        }
      },
      {
        id: 'shepherd', name: 'Circle of the Shepherd',
        blurb: 'Spirits of beasts answer you. There is always something else in the fight on your side.',
        features: {
          2: [{ name: 'Spirit Totem', desc: 'Bonus action: summon a spirit aura within 60 ft that heals, hastens or shields allies.', effects: ['spirit_totem'] }],
          10: [{ name: 'Guardian Spirit', desc: 'Summoned creatures in your totem aura regain half your druid level in hit points.', effects: ['guardian_spirit'] }]
        }
      }
    ]
  },

  /* ================================ FIGHTER ================================ */
  {
    id: 'fighter', name: 'Fighter', hitDie: 10, primary: ['str', 'dex'],
    blurb: 'The most reliable person in the party. You hit more often, get back up more often, and can do it twice in one turn.',
    flavor: 'The captain of the Mary Parker fights like a fighter: punch, punch, grapple, and a sword for anything that survives.',
    saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shields'], weapons: ['simple', 'martial'],
    skillCount: 2, skillList: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
    kit: ['chain_mail', 'longsword', 'shield', 'light_crossbow', 'dungeoneers_pack'],
    features: {
      1: [
        { name: 'Fighting Style', desc: 'Pick the way you fight.', effects: ['fighting_style'] },
        { name: 'Second Wind', desc: 'Bonus action: regain 1d10 + level hit points. Once per short rest.', effects: ['second_wind'] }
      ],
      2: [{ name: 'Action Surge', desc: 'Take one extra action on your turn. Once per short rest.', effects: ['action_surge'] }],
      3: [{ name: 'Martial Archetype', desc: 'How you were trained.', subclass: true }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] }],
      6: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      9: [{ name: 'Indomitable', desc: 'Reroll a failed saving throw once per long rest.', effects: ['indomitable:1'] }],
      10: [{ name: 'Archetype Feature', desc: 'Your training deepens.', subclassFeature: true }]
    },
    subclasses: [
      {
        id: 'champion', name: 'Champion',
        blurb: 'Simple, brutal excellence. You crit more than anybody has any right to.',
        features: {
          3: [{ name: 'Improved Critical', desc: 'Your attacks crit on a 19 or 20.', effects: ['crit_range:19'] }],
          10: [{ name: 'Additional Fighting Style', desc: 'A second fighting style.', effects: ['fighting_style'] }]
        }
      },
      {
        id: 'battlemaster', name: 'Battle Master',
        blurb: 'You read a fight like a board. Superiority dice let you trip, disarm and reposition.',
        features: {
          3: [{ name: 'Combat Superiority', desc: 'Four d8 superiority dice, back on a short rest. Spend them to trip, menace, push or feint.', effects: ['superiority:4'] }],
          10: [{ name: 'Improved Combat Superiority', desc: 'Superiority dice become d10s.', effects: ['superiority_d10'] }]
        }
      },
      {
        id: 'eldritch_knight', name: 'Eldritch Knight',
        blurb: 'Steel plus a little theory. You bind a weapon to yourself and throw a spell when the sword will not reach.',
        features: {
          3: [{ name: 'Weapon Bond & Spellcasting', desc: 'You learn wizard spells using Intelligence, and can summon your bonded weapon to your hand.', effects: ['spellcasting', 'weapon_bond'] }],
          10: [{ name: 'Eldritch Strike', desc: 'When you hit, that creature has disadvantage on its next save against your spells.', effects: ['eldritch_strike'] }]
        },
        caster: { ability: 'int', type: 'third', list: 'wizard', prepares: false, known: [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7], cantrips: [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3] }
      }
    ]
  },

  /* ================================= MONK ================================= */
  {
    id: 'monk', name: 'Monk', hitDie: 8, primary: ['dex', 'wis'],
    blurb: 'Your body is the weapon and ki is the fuel. You are the fastest thing on the grid and you never stop punching.',
    flavor: 'Anvil punches hard metal to train his fists. This is a monk\'s idea of a quiet evening.',
    saves: ['str', 'dex'], armor: [], weapons: ['simple', 'shortsword'],
    skillCount: 2, skillList: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
    kit: ['shortsword', 'dungeoneers_pack', 'dart'],
    features: {
      1: [
        { name: 'Unarmoured Defence', desc: 'With no armour or shield, your AC is 10 + DEX + WIS.', effects: ['unarmored_defense:wis'] },
        { name: 'Martial Arts', desc: 'Unarmed strikes and monk weapons use DEX and deal 1d4 (rising with level). After attacking, make one unarmed strike as a bonus action.', effects: ['martial_arts'] }
      ],
      2: [
        { name: 'Ki', desc: 'Ki points equal to your level. Spend them on Flurry of Blows, Patient Defence and Step of the Wind. Back on a short rest.', effects: ['ki'] },
        { name: 'Unarmoured Movement', desc: '+10 ft speed without armour.', effects: ['speed:10'] }
      ],
      3: [
        { name: 'Monastic Tradition', desc: 'The school that shaped you.', subclass: true },
        { name: 'Deflect Missiles', desc: 'Reaction: reduce ranged weapon damage by 1d10 + DEX + level, and throw it back for 1 ki.', effects: ['deflect_missiles'] }
      ],
      4: [
        { name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] },
        { name: 'Slow Fall', desc: 'Reduce falling damage by five times your level.', effects: ['slow_fall'] }
      ],
      5: [
        { name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] },
        { name: 'Stunning Strike', desc: 'Spend 1 ki on a hit to stun on a failed CON save.', effects: ['stunning_strike'] }
      ],
      6: [{ name: 'Ki-Empowered Strikes', desc: 'Your unarmed strikes count as magical.', effects: ['magic_fists'] }],
      7: [{ name: 'Evasion & Stillness of Mind', desc: 'Take no damage on successful DEX saves against area effects, and end a charm or fright on yourself as an action.', effects: ['evasion', 'stillness'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      9: [{ name: 'Unarmoured Movement improves', desc: 'You can run along walls and across liquids on your turn.', effects: ['wall_run'] }],
      10: [{ name: 'Purity of Body', desc: 'You are immune to disease and poison.', effects: ['immune:poison'] }]
    },
    subclasses: [
      {
        id: 'open_hand', name: 'Way of the Open Hand',
        blurb: 'The purest expression of the fist. Your Flurry knocks people down, pushes them off things, and denies reactions.',
        features: {
          3: [{ name: 'Open Hand Technique', desc: 'When Flurry of Blows hits, also knock prone, push 15 ft, or deny reactions until your next turn.', effects: ['open_hand'] }],
          10: [{ name: 'Tranquility', desc: 'You begin each day under a Sanctuary effect.', effects: ['tranquility'] }]
        }
      },
      {
        id: 'shadow', name: 'Way of Shadow',
        blurb: 'A monk who is never quite where the lantern is. In the mine you will be indispensable.',
        features: {
          3: [{ name: 'Shadow Arts', desc: 'Spend 2 ki for Darkness, Pass Without Trace, Silence or Minor Illusion.', effects: ['shadow_arts'] }],
          10: [{ name: 'Cloak of Shadows', desc: 'Become invisible in dim light or darkness until you attack or cast.', effects: ['cloak_of_shadows'] }]
        }
      },
      {
        id: 'kensei', name: 'Way of the Kensei',
        blurb: 'The weapon is an extension of the hand. Bow, blade, whatever you pick up becomes a monk weapon.',
        features: {
          3: [{ name: 'Path of the Kensei', desc: 'Two weapons become kensei weapons, gaining +2 AC when you use them defensively and a d4 to ranged damage.', effects: ['kensei'] }],
          10: [{ name: 'Sharpen the Blade', desc: 'Spend ki for up to +3 on your kensei weapon\'s attacks and damage.', effects: ['sharpen_blade'] }]
        }
      }
    ]
  },

  /* ================================ PALADIN ================================ */
  {
    id: 'paladin', name: 'Paladin', hitDie: 10, primary: ['str', 'cha'],
    blurb: 'An oath with teeth. You heal by touch, you burn evil out of things with a sword, and your presence makes fear bounce off your friends.',
    flavor: 'P.A.C.T. exists to stop tyrants. You would have done it anyway, badge or not.',
    saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shields'], weapons: ['simple', 'martial'],
    skillCount: 2, skillList: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
    caster: { ability: 'cha', type: 'half', list: 'paladin', prepares: true },
    kit: ['longsword', 'shield', 'chain_mail', 'holy_symbol', 'priests_pack', 'javelin'],
    features: {
      1: [
        { name: 'Divine Sense', desc: 'Detect celestials, fiends and undead within 60 ft. 1 + CHA uses per long rest.', effects: ['divine_sense'] },
        { name: 'Lay on Hands', desc: 'A pool of healing equal to five times your level, spent by touch. It can also cure one disease or poison for 5 points.', effects: ['lay_on_hands'] }
      ],
      2: [
        { name: 'Divine Smite', desc: 'On a melee weapon hit, spend a spell slot for 2d8 radiant damage, +1d8 per slot level above first, +1d8 against undead or fiends.', effects: ['divine_smite'] },
        { name: 'Fighting Style', desc: 'Pick the way you fight.', effects: ['fighting_style'] },
        { name: 'Spellcasting', desc: 'You prepare paladin spells using Charisma.', effects: ['spellcasting'] }
      ],
      3: [
        { name: 'Sacred Oath', desc: 'The vow you actually swore.', subclass: true },
        { name: 'Divine Health', desc: 'You are immune to disease.', effects: ['immune:disease'] }
      ],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] }],
      6: [{ name: 'Aura of Protection', desc: 'You and allies within 10 ft add your CHA modifier to all saving throws.', effects: ['aura_protection'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Aura of Courage', desc: 'You and allies within 10 ft cannot be frightened.', effects: ['aura_courage'] }]
    },
    subclasses: [
      {
        id: 'devotion', name: 'Oath of Devotion',
        blurb: 'The straight road. Honesty, courage, and a weapon that shines when you ask it to.',
        features: {
          3: [{ name: 'Sacred Weapon', desc: 'Channel Divinity: add your CHA modifier to attack rolls and make the weapon glow for one minute.', effects: ['sacred_weapon'] }],
          10: [{ name: 'Aura of Devotion', desc: 'You and allies within 10 ft cannot be charmed.', effects: ['aura_devotion'] }]
        }
      },
      {
        id: 'ancients', name: 'Oath of the Ancients',
        blurb: 'Light, life, and green things. You are here to make sure the island survives whoever is shouting about eggs.',
        features: {
          3: [{ name: 'Nature\'s Wrath', desc: 'Channel Divinity: restrain a creature in spectral vines on a failed save.', effects: ['natures_wrath'] }],
          10: [{ name: 'Aura of Warding', desc: 'You and allies within 10 ft have resistance to damage from spells.', effects: ['aura_warding'] }]
        }
      },
      {
        id: 'vengeance', name: 'Oath of Vengeance',
        blurb: 'One target, no mercy, no distractions. The shady man has a job that would suit you and you will hate that.',
        features: {
          3: [{ name: 'Vow of Enmity', desc: 'Channel Divinity: advantage on all attacks against one creature for one minute.', effects: ['vow_of_enmity'] }],
          10: [{ name: 'Relentless Avenger', desc: 'When you hit a creature you may move half your speed without provoking.', effects: ['relentless_avenger'] }]
        }
      }
    ]
  },

  /* ================================= RANGER ================================= */
  {
    id: 'ranger', name: 'Ranger', hitDie: 10, primary: ['dex', 'wis'],
    blurb: 'You track, you shoot, and you know what the mud is telling you. In a town full of shouting witnesses, you are the one who finds the footprints.',
    flavor: 'Survival is not a skill on your sheet, it is the reason you are alive.',
    saves: ['str', 'dex'], armor: ['light', 'medium', 'shields'], weapons: ['simple', 'martial'],
    skillCount: 3, skillList: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
    caster: { ability: 'wis', type: 'half', list: 'ranger', prepares: false, known: [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6] },
    kit: ['longbow', 'scale_mail', 'shortsword', 'shortsword', 'explorers_pack'],
    features: {
      1: [
        { name: 'Favoured Enemy', desc: 'Advantage on Survival to track and on Intelligence checks to recall lore about one kind of creature. Dragons are an option, and on this island a wise one.', effects: ['favored_enemy'] },
        { name: 'Natural Explorer', desc: 'Double proficiency on Intelligence and Wisdom checks about your favoured terrain; your group cannot be lost or slowed by it.', effects: ['natural_explorer'] }
      ],
      2: [
        { name: 'Fighting Style', desc: 'Pick the way you fight.', effects: ['fighting_style'] },
        { name: 'Spellcasting', desc: 'You cast ranger spells using Wisdom.', effects: ['spellcasting'] }
      ],
      3: [
        { name: 'Ranger Archetype', desc: 'How you hunt.', subclass: true },
        { name: 'Primeval Awareness', desc: 'Spend a spell slot to sense whether certain creature types are within a mile.', effects: ['primeval_awareness'] }
      ],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Extra Attack', desc: 'Attack twice with the Attack action.', effects: ['extra_attack:1'] }],
      6: [{ name: 'Favoured Enemy improves', desc: 'A second favoured enemy and terrain.', effects: ['favored_enemy'] }],
      8: [{ name: 'Land\'s Stride', desc: 'Difficult terrain never slows you, and plants cannot entangle you.', effects: ['lands_stride'] }],
      10: [{ name: 'Hide in Plain Sight', desc: 'Camouflage yourself for +10 to Stealth while you stay still.', effects: ['hide_in_plain_sight'] }]
    },
    subclasses: [
      {
        id: 'hunter', name: 'Hunter',
        blurb: 'Built for exactly the fight you are about to have. Big things, or many things: pick your answer.',
        features: {
          3: [{ name: 'Hunter\'s Prey', desc: 'Colossus Slayer: once per turn, +1d8 damage to a creature below its maximum hit points.', effects: ['colossus_slayer'] }],
          10: [{ name: 'Multiattack', desc: 'Volley: one attack against every creature within 10 ft of a point you can see.', effects: ['volley'] }]
        }
      },
      {
        id: 'beast_master', name: 'Beast Master',
        blurb: 'You do not fight alone. Ever. There is a grey cat in an alley in Drakehaven who would suit you.',
        features: {
          3: [{ name: 'Ranger\'s Companion', desc: 'A beast fights alongside you, acting on your command.', effects: ['companion'] }],
          10: [{ name: 'Bestial Fury', desc: 'Your companion attacks twice.', effects: ['bestial_fury'] }]
        }
      },
      {
        id: 'gloom_stalker', name: 'Gloom Stalker',
        blurb: 'You go into the dark places first and come back. The mine will not frighten you the way it frightens the others.',
        features: {
          3: [{ name: 'Dread Ambusher', desc: '+WIS to initiative, and on your first turn +10 ft speed and one extra attack for 1d8 extra damage.', effects: ['dread_ambusher'] }],
          10: [{ name: 'Stalker\'s Flurry', desc: 'When you miss, attack again.', effects: ['stalkers_flurry'] }]
        }
      }
    ]
  },

  /* ================================= ROGUE ================================= */
  {
    id: 'rogue', name: 'Rogue', hitDie: 8, primary: ['dex', 'int'],
    blurb: 'You do the damage in one hit, from an angle nobody was watching. Locks, traps and pockets are all the same problem to you.',
    flavor: 'The shady man in the market will like you immediately, which should worry you.',
    saves: ['dex', 'int'], armor: ['light'], weapons: ['simple', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
    skillCount: 4, skillList: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'],
    kit: ['rapier', 'shortbow', 'leather_armor', 'dagger', 'dagger', 'thieves_tools', 'burglars_pack'],
    features: {
      1: [
        { name: 'Expertise', desc: 'Double proficiency in two skills.', effects: ['expertise:2'] },
        { name: 'Sneak Attack', desc: 'Once per turn, add 1d6 per two rogue levels when you have advantage, or when an ally is next to your target.', effects: ['sneak_attack'] },
        { name: 'Thieves\' Cant', desc: 'A secret argot of slang and signs.', effects: ['thieves_cant'] }
      ],
      2: [{ name: 'Cunning Action', desc: 'Bonus action: Dash, Disengage or Hide.', effects: ['cunning_action'] }],
      3: [{ name: 'Roguish Archetype', desc: 'What kind of specialist you are.', subclass: true }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Uncanny Dodge', desc: 'Reaction: halve the damage of one attack you can see.', effects: ['uncanny_dodge'] }],
      6: [{ name: 'Expertise', desc: 'Double proficiency in two more skills.', effects: ['expertise:2'] }],
      7: [{ name: 'Evasion', desc: 'Take no damage instead of half on a successful DEX save against an area effect.', effects: ['evasion'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      9: [{ name: 'Archetype Feature', desc: 'Your specialty sharpens.', subclassFeature: true }],
      10: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }]
    },
    subclasses: [
      {
        id: 'thief', name: 'Thief',
        blurb: 'Fast hands, fast climbing, and the ability to use anything you can pick up.',
        features: {
          3: [{ name: 'Fast Hands & Second-Story Work', desc: 'Cunning Action can also Use an Object or pick a lock, and climbing costs no extra movement.', effects: ['fast_hands', 'second_story'] }],
          9: [{ name: 'Supreme Sneak', desc: 'Advantage on Stealth if you move no more than half your speed.', effects: ['supreme_sneak'] }]
        }
      },
      {
        id: 'assassin', name: 'Assassin',
        blurb: 'The first strike is the whole plan. There is a man at a royal ball who should be nervous.',
        features: {
          3: [{ name: 'Assassinate', desc: 'Advantage against anything that has not acted yet, and any hit on a surprised creature is a critical.', effects: ['assassinate'] }],
          9: [{ name: 'Infiltration Expertise', desc: 'You can build and maintain a false identity.', effects: ['infiltration'] }]
        }
      },
      {
        id: 'arcane_trickster', name: 'Arcane Trickster',
        blurb: 'Sleight of hand with a spell list attached. Mage Hand does the stealing while you smile.',
        features: {
          3: [{ name: 'Mage Hand Legerdemain & Spellcasting', desc: 'You learn wizard spells using Intelligence, and your invisible Mage Hand can pick pockets and locks.', effects: ['spellcasting', 'mage_hand_legerdemain'] }],
          9: [{ name: 'Magical Ambush', desc: 'If you are hidden when you cast, the target has disadvantage on the save.', effects: ['magical_ambush'] }]
        },
        caster: { ability: 'int', type: 'third', list: 'wizard', prepares: false, known: [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7], cantrips: [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4] }
      }
    ]
  },

  /* ================================ SORCERER ================================ */
  {
    id: 'sorcerer', name: 'Sorcerer', hitDie: 6, primary: ['cha', 'con'],
    blurb: 'The magic is in your blood and it was never asked for. Metamagic lets you bend a spell into a shape it should not take.',
    flavor: 'Something in your family line was a dragon. On this island, that is no longer a fun story.',
    saves: ['con', 'cha'], armor: [], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'light_crossbow'],
    skillCount: 2, skillList: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
    caster: { ability: 'cha', type: 'full', list: 'sorcerer', prepares: false, known: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    kit: ['light_crossbow', 'dagger', 'arcane_focus', 'dungeoneers_pack'],
    features: {
      1: [
        { name: 'Spellcasting', desc: 'You cast sorcerer spells using Charisma.', effects: ['spellcasting'] },
        { name: 'Sorcerous Origin', desc: 'Where the power came from.', subclass: true }
      ],
      2: [{ name: 'Font of Magic', desc: 'Sorcery points equal to your level. Convert them into spell slots and back.', effects: ['sorcery_points'] }],
      3: [{ name: 'Metamagic', desc: 'Two ways to bend a spell: Quickened, Twinned, Careful, Distant, Empowered or Subtle.', effects: ['metamagic:2'] }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Metamagic', desc: 'A third way to bend a spell.', effects: ['metamagic:1'] }]
    },
    subclasses: [
      {
        id: 'draconic', name: 'Draconic Bloodline',
        blurb: 'A dragon is in your ancestry, and on Drakehaven that fact will come up.',
        features: {
          1: [{ name: 'Draconic Resilience', desc: '+1 hit point per level, and your unarmoured AC is 13 + DEX as scales surface on your skin.', effects: ['hp_per_level:1', 'draconic_ac'] }],
          6: [{ name: 'Elemental Affinity', desc: 'Add your CHA modifier to one damage roll of your ancestry\'s type, and spend a sorcery point for resistance to it.', effects: ['elemental_affinity'] }]
        }
      },
      {
        id: 'wild_magic', name: 'Wild Magic',
        blurb: 'The magic is not entirely yours and it has opinions. Sometimes it helps. Sometimes there are flowers.',
        features: {
          1: [{ name: 'Wild Magic Surge & Tides of Chaos', desc: 'Your spells can trigger a surge from the chaos table, and once per long rest you can take advantage on any roll.', effects: ['wild_surge', 'tides_of_chaos'] }],
          6: [{ name: 'Bend Luck', desc: 'Reaction: spend 2 sorcery points to add or subtract 1d4 from a creature\'s roll.', effects: ['bend_luck'] }]
        }
      },
      {
        id: 'storm', name: 'Storm Sorcery',
        blurb: 'You were born in weather like this. The Mary Parker\'s storm feels less like danger and more like a greeting.',
        features: {
          1: [{ name: 'Wind Speaker & Tempestuous Magic', desc: 'After casting a spell of 1st level or higher, fly 10 ft as a bonus action without provoking.', effects: ['tempestuous_magic'] }],
          6: [{ name: 'Heart of the Storm', desc: 'Resistance to lightning and thunder, and when you cast such a spell, creatures within 10 ft take half your level in damage.', effects: ['resist:lightning', 'resist:thunder', 'heart_of_storm'] }]
        }
      }
    ]
  },

  /* ================================ WARLOCK ================================ */
  {
    id: 'warlock', name: 'Warlock', hitDie: 8, primary: ['cha', 'con'],
    blurb: 'You made a deal. Few spell slots, but they come back on a short rest, and Eldritch Blast never runs out.',
    flavor: 'Something spoke to you first. On this island a great many things are trying to speak to a great many people.',
    saves: ['wis', 'cha'], armor: ['light'], weapons: ['simple'],
    skillCount: 2, skillList: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
    caster: { ability: 'cha', type: 'pact', list: 'warlock', prepares: false, known: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10] },
    kit: ['light_crossbow', 'leather_armor', 'dagger', 'dagger', 'arcane_focus', 'scholars_pack'],
    features: {
      1: [
        { name: 'Otherworldly Patron', desc: 'Who exactly you are indebted to.', subclass: true },
        { name: 'Pact Magic', desc: 'Your spell slots are few but always your highest level, and they return on a short rest.', effects: ['pact_magic', 'spellcasting'] }
      ],
      2: [{ name: 'Eldritch Invocations', desc: 'Two pieces of forbidden technique.', effects: ['invocations:2'] }],
      3: [{ name: 'Pact Boon', desc: 'A blade, a tome, or a familiar chain.', effects: ['pact_boon'] }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      5: [{ name: 'Eldritch Invocation', desc: 'A third invocation.', effects: ['invocations:1'] }],
      7: [{ name: 'Eldritch Invocation', desc: 'A fourth invocation.', effects: ['invocations:1'] }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Patron Feature', desc: 'Your patron gives more, and asks more.', subclassFeature: true }]
    },
    subclasses: [
      {
        id: 'fiend', name: 'The Fiend',
        blurb: 'A bargain signed in something that was probably not ink. Every kill gives you a little back.',
        features: {
          1: [{ name: 'Dark One\'s Blessing', desc: 'When you reduce a hostile to 0 hit points, gain CHA + warlock level temporary hit points.', effects: ['dark_ones_blessing'] }],
          10: [{ name: 'Fiendish Resilience', desc: 'Choose a damage type after each rest and gain resistance to it.', effects: ['fiendish_resilience'] }]
        }
      },
      {
        id: 'great_old_one', name: 'The Great Old One',
        blurb: 'Something under very deep water is faintly aware of you. It is not friendly and it is not hostile. It is large.',
        features: {
          1: [{ name: 'Awakened Mind', desc: 'Speak telepathically to any creature within 30 ft.', effects: ['awakened_mind'] }],
          10: [{ name: 'Thought Shield', desc: 'Resistance to psychic damage, and it reflects back on the attacker.', effects: ['resist:psychic', 'thought_shield'] }]
        }
      },
      {
        id: 'archfey', name: 'The Archfey',
        blurb: 'A beautiful and utterly untrustworthy patron who thinks all of this is very entertaining.',
        features: {
          1: [{ name: 'Fey Presence', desc: 'Action: charm or frighten creatures in a 10-ft cube on a failed WIS save. Once per short rest.', effects: ['fey_presence'] }],
          10: [{ name: 'Beguiling Defences', desc: 'Immune to being charmed, and you can reflect a charm back for 5d8 psychic.', effects: ['beguiling_defenses'] }]
        }
      }
    ]
  },

  /* ================================= WIZARD ================================= */
  {
    id: 'wizard', name: 'Wizard', hitDie: 6, primary: ['int', 'con'],
    blurb: 'You learned this. All of it, on purpose, out of books. The widest spell list in the world and the fewest hit points.',
    flavor: 'A gnome named Grimey once decided he wanted to be a magical wizard, bought a great deal of soil and fertiliser, and ran away. Not every approach works.',
    saves: ['int', 'wis'], armor: [], weapons: ['dagger', 'dart', 'sling', 'quarterstaff', 'light_crossbow'],
    skillCount: 2, skillList: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
    caster: { ability: 'int', type: 'full', list: 'wizard', prepares: true, spellbook: true },
    kit: ['quarterstaff', 'spellbook', 'arcane_focus', 'scholars_pack'],
    features: {
      1: [
        { name: 'Spellcasting', desc: 'You prepare wizard spells from your spellbook using Intelligence.', effects: ['spellcasting'] },
        { name: 'Arcane Recovery', desc: 'Once per day on a short rest, recover spell slots totalling half your wizard level.', effects: ['arcane_recovery'] }
      ],
      2: [{ name: 'Arcane Tradition', desc: 'The school you studied.', subclass: true }],
      4: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      6: [{ name: 'Tradition Feature', desc: 'Your school teaches you more.', subclassFeature: true }],
      8: [{ name: 'Ability Score Improvement', desc: '+2 to one score or +1 to two.', effects: ['asi'] }],
      10: [{ name: 'Tradition Feature', desc: 'Your school teaches you more still.', subclassFeature: true }]
    },
    subclasses: [
      {
        id: 'evocation', name: 'School of Evocation',
        blurb: 'The fireball school. You can carve your friends out of the middle of your own explosion.',
        features: {
          2: [{ name: 'Sculpt Spells', desc: 'Choose 1 + spell level allies to automatically succeed and take no damage from your evocations.', effects: ['sculpt_spells'] }],
          6: [{ name: 'Potent Cantrip', desc: 'Creatures that succeed on a save against your cantrips still take half damage.', effects: ['potent_cantrip'] }],
          10: [{ name: 'Empowered Evocation', desc: 'Add your INT modifier to one damage roll of any evocation spell.', effects: ['empowered_evocation'] }]
        }
      },
      {
        id: 'abjuration', name: 'School of Abjuration',
        blurb: 'The bodyguard school. You carry a ward around that eats damage before it reaches you.',
        features: {
          2: [{ name: 'Arcane Ward', desc: 'Casting an abjuration builds a ward with hit points equal to twice your level + INT that absorbs damage for you.', effects: ['arcane_ward'] }],
          6: [{ name: 'Projected Ward', desc: 'Reaction: your ward absorbs damage for an ally within 30 ft.', effects: ['projected_ward'] }],
          10: [{ name: 'Improved Abjuration', desc: 'Add your proficiency to ability checks made as part of abjuration spells.', effects: ['improved_abjuration'] }]
        }
      },
      {
        id: 'divination', name: 'School of Divination',
        blurb: 'You know how the dice are going to land, because you rolled them this morning.',
        features: {
          2: [{ name: 'Portent', desc: 'After each long rest, roll two d20s and keep them. Replace any roll made by you or a creature you can see with one of them.', effects: ['portent'] }],
          6: [{ name: 'Expert Divination', desc: 'Casting a divination of 2nd level or higher refunds a lower slot.', effects: ['expert_divination'] }],
          10: [{ name: 'The Third Eye', desc: 'Gain darkvision, see invisibility, or read any language after a rest.', effects: ['third_eye'] }]
        }
      },
      {
        id: 'necromancy', name: 'School of Necromancy',
        blurb: 'The line between alive and otherwise is thinner than people are comfortable with. The Wight in the mine wore a crown that agrees with you.',
        features: {
          2: [{ name: 'Grim Harvest', desc: 'When you kill with a spell, regain twice the spell\'s level in hit points, or three times for necromancy.', effects: ['grim_harvest'] }],
          6: [{ name: 'Undead Thralls', desc: 'Animate Dead raises an extra corpse, and your undead get bonus hit points and damage.', effects: ['undead_thralls'] }],
          10: [{ name: 'Inured to Undeath', desc: 'Resistance to necrotic damage, and your maximum hit points cannot be reduced.', effects: ['resist:necrotic', 'inured'] }]
        }
      }
    ]
  }
];

DH.classById = (id) => DH.CLASSES.find(c => c.id === id);
DH.ALL_SKILLS = ALL_SKILLS;

/* Skill → ability, and pretty names. */
DH.SKILLS = {
  acrobatics: { ab: 'dex', name: 'Acrobatics' },
  animal_handling: { ab: 'wis', name: 'Animal Handling' },
  arcana: { ab: 'int', name: 'Arcana' },
  athletics: { ab: 'str', name: 'Athletics' },
  deception: { ab: 'cha', name: 'Deception' },
  history: { ab: 'int', name: 'History' },
  insight: { ab: 'wis', name: 'Insight' },
  intimidation: { ab: 'cha', name: 'Intimidation' },
  investigation: { ab: 'int', name: 'Investigation' },
  medicine: { ab: 'wis', name: 'Medicine' },
  nature: { ab: 'int', name: 'Nature' },
  perception: { ab: 'wis', name: 'Perception' },
  performance: { ab: 'cha', name: 'Performance' },
  persuasion: { ab: 'cha', name: 'Persuasion' },
  religion: { ab: 'int', name: 'Religion' },
  sleight_of_hand: { ab: 'dex', name: 'Sleight of Hand' },
  stealth: { ab: 'dex', name: 'Stealth' },
  survival: { ab: 'wis', name: 'Survival' }
};

DH.ABILITIES = [
  { id: 'str', name: 'Strength', short: 'STR' },
  { id: 'dex', name: 'Dexterity', short: 'DEX' },
  { id: 'con', name: 'Constitution', short: 'CON' },
  { id: 'int', name: 'Intelligence', short: 'INT' },
  { id: 'wis', name: 'Wisdom', short: 'WIS' },
  { id: 'cha', name: 'Charisma', short: 'CHA' }
];

/* Fighting styles, offered to fighters, paladins, rangers and valour bards. */
DH.FIGHTING_STYLES = [
  { id: 'archery', name: 'Archery', desc: '+2 to attack rolls with ranged weapons.' },
  { id: 'defense', name: 'Defence', desc: '+1 AC while wearing armour.' },
  { id: 'dueling', name: 'Duelling', desc: '+2 damage with a one-handed weapon and no other weapon in hand.' },
  { id: 'great_weapon', name: 'Great Weapon Fighting', desc: 'Reroll 1s and 2s on damage with two-handed weapons.' },
  { id: 'two_weapon', name: 'Two-Weapon Fighting', desc: 'Add your ability modifier to the off-hand attack\'s damage.' },
  { id: 'protection', name: 'Protection', desc: 'Reaction with a shield: impose disadvantage on an attack against a nearby ally.' }
];

/* Metamagic options for sorcerers. */
DH.METAMAGIC = [
  { id: 'quickened', name: 'Quickened Spell', cost: 2, desc: 'Cast a 1-action spell as a bonus action.' },
  { id: 'twinned', name: 'Twinned Spell', cost: 1, desc: 'A single-target spell also hits a second target.' },
  { id: 'empowered', name: 'Empowered Spell', cost: 1, desc: 'Reroll up to your CHA modifier in damage dice.' },
  { id: 'careful', name: 'Careful Spell', cost: 1, desc: 'Chosen allies automatically succeed on the save.' },
  { id: 'distant', name: 'Distant Spell', cost: 1, desc: 'Double a spell\'s range.' },
  { id: 'subtle', name: 'Subtle Spell', cost: 1, desc: 'Cast without gestures or words.' }
];

/* Warlock invocations that the engine can honour. */
DH.INVOCATIONS = [
  { id: 'agonizing_blast', name: 'Agonising Blast', desc: 'Add your CHA modifier to each Eldritch Blast beam.' },
  { id: 'repelling_blast', name: 'Repelling Blast', desc: 'Eldritch Blast pushes creatures 10 ft away.' },
  { id: 'devils_sight', name: 'Devil\'s Sight', desc: 'See normally in darkness, magical or not, out to 120 ft.' },
  { id: 'armor_of_shadows', name: 'Armour of Shadows', desc: 'Cast Mage Armor on yourself at will.' },
  { id: 'beguiling_influence', name: 'Beguiling Influence', desc: 'Proficiency in Deception and Persuasion.' },
  { id: 'eldritch_sight', name: 'Eldritch Sight', desc: 'Cast Detect Magic at will.' },
  { id: 'thirsting_blade', name: 'Thirsting Blade', desc: 'Attack twice with your pact weapon. Requires Pact of the Blade and level 5.', min: 5 },
  { id: 'fiendish_vigor', name: 'Fiendish Vigour', desc: 'Cast False Life on yourself at will.' }
];

DH.PACT_BOONS = [
  { id: 'blade', name: 'Pact of the Blade', desc: 'Summon a weapon of your choice that you are proficient with and that uses Charisma.' },
  { id: 'tome', name: 'Pact of the Tome', desc: 'Three extra cantrips from any class list.' },
  { id: 'chain', name: 'Pact of the Chain', desc: 'A familiar that can attack in your place.' }
];
