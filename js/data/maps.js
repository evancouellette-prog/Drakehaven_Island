/* Drakehaven Island — the world. Maps are drawn as character rows and normalised
   at load, so hand-authored art cannot break on a short line.

   Legend keys:  t = tile painter, p = prop painter, s = solid, h = hazard,
                 i = interaction id, l = light radius */
window.DH = window.DH || {};

DH.LEGEND = {
  ' ': { t: 'void', s: true },
  '#': { t: 'wall', s: true },
  'W': { t: 'woodwall', s: true },
  '.': { t: 'floor' },
  ',': { t: 'deck' },
  'S': { t: 'stonefloor' },
  'V': { t: 'cave' },
  'g': { t: 'grass' },
  'G': { t: 'grass2' },
  's': { t: 'sand' },
  'p': { t: 'path' },
  'd': { t: 'dirt' },
  'm': { t: 'mud', slow: 5 },
  'c': { t: 'carpet' },
  'M': { t: 'marble' },
  'r': { t: 'rug' },
  '~': { t: 'water', s: true },
  '=': { t: 'deepwater', s: true },
  'L': { t: 'lava', s: true, h: 'lava' },
  'T': { t: 'grass', p: 'tree', s: true },
  'P': { t: 'grass', p: 'pine', s: true },
  'A': { t: 'sand', p: 'palm', s: true },
  'B': { t: 'grass', p: 'bush' },
  'R': { t: 'cave', p: 'rock', s: true },
  'O': { t: 'cave', p: 'boulder', s: true },
  'b': { t: 'floor', p: 'barrel', s: true, i: 'barrel' },
  'x': { t: 'floor', p: 'crate', s: true, i: 'crate' },
  'H': { t: 'floor', p: 'hammock', i: 'hammock' },
  'E': { t: 'floor', p: 'bed', i: 'bed' },
  't': { t: 'floor', p: 'table', s: true },
  'h': { t: 'floor', p: 'chair' },
  'C': { t: 'floor', p: 'chest', i: 'chest' },
  '>': { t: 'floor', p: 'door', i: 'door' },
  '^': { t: 'stonefloor', p: 'stairs', i: 'stairs' },
  '|': { t: 'deck', p: 'mast', s: true },
  '/': { t: 'deck', p: 'rigging' },
  'o': { t: 'deck', p: 'rope', i: 'rope' },
  'F': { t: 'stonefloor', p: 'forge', s: true, l: 46, i: 'forge' },
  'a': { t: 'floor', p: 'anvil', s: true },
  'n': { t: 'path', p: 'sign', s: true, i: 'sign' },
  '*': { t: 'stonefloor', p: 'torch', s: true, l: 62 },
  '!': { t: 'stonefloor', p: 'brazier', s: true, l: 74 },
  'I': { t: 'marble', p: 'pillar', s: true },
  'U': { t: 'stonefloor', p: 'statue', s: true, i: 'statue' },
  'l': { t: 'stonefloor', p: 'lever', s: true, i: 'lever' },
  '_': { t: 'stonefloor', p: 'pedestal', s: true, i: 'pedestal' },
  'K': { t: 'floor', p: 'bookshelf', s: true, i: 'bookshelf' },
  'Z': { t: 'floor', p: 'boozewall', s: true },
  'k': { t: 'path', p: 'stall', s: true, i: 'stall' },
  'D': { t: 'floor', p: 'dragonskull', s: true },
  'q': { t: 'path', p: 'pole', s: true, i: 'pole' },
  'f': { t: 'floor', p: 'fungus', h: 'spore' },
  'y': { t: 'grass', p: 'herb', i: 'forage', node: 'herb' },
  'u': { t: 'cave', p: 'mushroom', i: 'forage', node: 'mushroom' },
  'v': { t: 'cave', p: 'ore', s: true, i: 'mine', node: 'ore' },
  'w': { t: 'woodwall', p: 'window', s: true },
  'j': { t: 'marble', p: 'banner', s: true },
  'Q': { t: 'stonefloor', p: 'cauldron', s: true, i: 'workbench' },
  'Y': { t: 'floor', p: 'commandpod', s: true, i: 'commandpod', l: 40 },
  '0': { t: 'water', s: true, p: 'fishspot', i: 'fish' },
  'i': { t: 'cave', p: 'bones', i: 'bones' },
  'X': { t: 'stonefloor', p: 'rune', h: 'rune' },
  'e': { t: 'marble', p: 'egg', s: true, i: 'egg' },
  'z': { t: 'floor', p: 'web' },
  'N': { t: 'floor', p: 'gel', i: 'gel' },
  '+': { t: 'tilled', i: 'plot', plot: true },
  '"': { t: 'grass', p: 'bush', i: 'forage', node: 'herb' },
  ':': { t: 'sand', i: 'forage', node: 'drift' },
  ';': { t: 'stonefloor', p: 'glowtile', i: 'glowtile' }
};

DH.MAPS = {

  /* ===================== ACT 0 — THE MARY PARKER ===================== */
  ship_quarters: {
    name: 'Crew Quarters, The Mary Parker', music: 'storm', ambience: 'rain',
    indoor: true, baseDark: 0.42, thunder: true, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWWWWWWWWWWWW',
      'W......bb........C.......^W',
      'W..H.............b.......>W',
      'W..............t..........W',
      'W.....H.............x.....W',
      'W.........a...............W',
      'W..H...........H..........W',
      'W.....b.......b......x....W',
      'WWWWWWWWWWWWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 5, y: 4 }, below: { x: 24, y: 2 } },
    exits: [
      { x: 25, y: 1, to: 'ship_deck', spawn: 'below', label: 'Up to the deck', gate: 'called_on_deck' },
      { x: 25, y: 2, to: 'ship_deck', spawn: 'below', label: 'Up to the deck', gate: 'called_on_deck' }
    ],
    lights: [{ x: 10, y: 5, r: 60, flicker: true }, { x: 20, y: 2, r: 50, flicker: true }],
    npcs: [
      { id: 'anvil', x: 11, y: 5, name: 'Anvil', script: 'npc_anvil', visualFrom: 'anvil', facing: 'up' },
      { id: 'umarion', x: 5, y: 6, name: 'Umarion', script: 'npc_umarion', visualFrom: 'umarion', facing: 'right' },
      { id: 'ball_wizard', x: 6, y: 4, name: 'Sleeping Gnome', script: 'npc_sleeper', visualFrom: 'ball_wizard', facing: 'down', asleep: true },
      { id: 'cabin_boy', x: 23, y: 3, name: 'A Small Man', script: 'npc_cabin_boy', hidden: 'called_on_deck', appearAfter: 'boy_arrives', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#c2a668', cloth: '#6a5a4a', cloth2: '#4a3a2a', hairStyle: 'short', smallBody: true }, scale: 0.8 }
    ],
    triggers: [
      { x: 4, y: 4, w: 18, h: 4, script: 'act0_open', once: true }
    ]
  },

  ship_deck: {
    name: 'The Deck, The Mary Parker', music: 'storm', ambience: 'rain',
    outdoor: true, rain: 1.2, thunder: true, baseDark: 0.5, fill: '=',
    rows: [
      '==========================',
      '=====,,,,,,,,,,,,,,,,=====',
      '===,,,,,,,,,/,,,,,,,,,,,==',
      '==,,,b,,,,,,|,,,,,,,b,,,,=',
      '=,,,,,,,,,o,|,o,,,,,,,,,,,',
      '=,,,,,,,,,,,|,,,,,,,,,,,,,',
      '=,,,b,,,,,,,,,,,,,,,b,,,,,',
      '==,,,,,,,,,,/,,,,,,,,,,,,=',
      '===,,,,,,,,,,,,,,,,,,,,,==',
      '=====,,,,,,,,,,,,,,,,=====',
      '=========,,,,,,,,=========',
      '=========================='
    ],
    spawns: { start: { x: 12, y: 8 }, below: { x: 12, y: 9 }, cabin: { x: 21, y: 3 } },
    exits: [
      { x: 12, y: 10, to: 'ship_quarters', spawn: 'below', label: 'Down to the crew quarters' },
      { x: 21, y: 2, to: 'ship_cabin', spawn: 'start', label: 'The captain\'s cabin', gate: 'invited_to_cabin' }
    ],
    lights: [{ x: 12, y: 3, r: 70, flicker: true }, { x: 20, y: 2, r: 55, flicker: true }],
    npcs: [
      { id: 'captain', x: 12, y: 2, name: 'The Captain', script: 'npc_captain', visualFrom: 'captain_hobbs', facing: 'down', scale: 1.2 },
      { id: 'crew1', x: 7, y: 5, name: 'Deckhand', script: 'npc_crew', visualFrom: 'sailor', wander: true },
      { id: 'crew2', x: 17, y: 6, name: 'Deckhand', script: 'npc_crew', visualFrom: 'sailor', wander: true },
      { id: 'cabin_boy2', x: 10, y: 6, name: 'The Small Man', script: 'npc_cabin_boy2', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#c2a668', cloth: '#6a5a4a', cloth2: '#4a3a2a', hairStyle: 'short' }, scale: 0.8 }
    ],
    triggers: [
      { x: 6, y: 6, w: 12, h: 4, script: 'act0_deck', once: true }
    ]
  },

  ship_cabin: {
    name: 'The Captain\'s Cabin', music: 'tavern', ambience: 'rain',
    indoor: true, baseDark: 0.22, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWWWW',
      'W..ZZZZ....wwww..W',
      'W................W',
      'W...ttt....C.....W',
      'W...h.h..........W',
      'W........Y.......W',
      'W..b..........b..W',
      'W........>.......W',
      'WWWWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 9, y: 7 } },
    exits: [{ x: 9, y: 7, to: 'ship_deck', spawn: 'cabin', label: 'Back out on deck' }],
    lights: [{ x: 9, y: 3, r: 90, flicker: true }],
    npcs: [
      { id: 'captain_seated', x: 5, y: 2, name: 'Captain Hobbs', script: 'npc_captain_cabin', visualFrom: 'captain_hobbs', facing: 'down', scale: 1.2 }
    ],
    triggers: [{ x: 7, y: 5, w: 5, h: 2, script: 'act0_cabin', once: true }]
  },

  /* ===================== ACT 1–2 — DRAKEHAVEN ===================== */
  dock: {
    name: 'Drakehaven Dock', music: 'town', ambience: 'sea',
    outdoor: true, fill: '=',
    rows: [
      '==========================',
      '=========,,,,,,,==========',
      '=====0===,,,,,,,====0=====',
      '=========,,,,,,,==========',
      '=====,,,,,,,,,,,,,,,,=====',
      '=====,,,,,,,,,,,,,,,,=====',
      '==:ss,,,,,,,,,,,,,,,,ss:==',
      '=:ssssssppppppppssssssss:=',
      'ssssssApppppppppAssssssss=',
      'ssyssssppppppppppsssss"sss',
      'gggggggppppppppppgggggggg',
      'gggTggggppppppppgggggTggg'
    ],
    spawns: { start: { x: 12, y: 3 }, town: { x: 12, y: 11 } },
    exits: [{ x: 12, y: 11, to: 'town_square', spawn: 'dock', label: 'Into Drakehaven' },
    { x: 11, y: 11, to: 'town_square', spawn: 'dock', label: 'Into Drakehaven' }],
    triggers: [
      { x: 9, y: 6, w: 8, h: 3, script: 'act1_landfall', once: true }
    ]
  },

  town_square: {
    name: 'Drakehaven — The Square', music: 'town', ambience: 'crowd', town: true,
    outdoor: true, fill: 'g',
    rows: [
      'WWWWWWWWggggggWWWWWWWWWWggggg',
      'W..>..WWggggggWW..>...WWggggg',
      'WWWWWWWWpppppppWWWWWWWWWppppg',
      'ggggppppppppppppppppppppppppg',
      'ggggpppppppppqpppppppppppppppg',
      'WWWWppppppppppppppppppWWWWWpp',
      'W.>.ppppnppppppppppppp>....Wpp',
      'WWWWpppppppppppppppppWWWWWWpp',
      'ggggppppppppppppppppppppppppg',
      'ggyggppppppppppppppppppppTggg',
      'gggggpppWWWWWWWppppppppppgggg',
      'ggggggppW..>..WppppppppppTggg',
      'gggggggpWWWWWWWppppppppgggggg'
    ],
    spawns: { start: { x: 14, y: 3 }, dock: { x: 14, y: 3 }, market: { x: 3, y: 6 }, tavern: { x: 22, y: 6 }, hall: { x: 11, y: 11 }, inn: { x: 18, y: 1 }, north: { x: 3, y: 1 } },
    exits: [
      { x: 14, y: 2, to: 'dock', spawn: 'town', label: 'Down to the dock' },
      { x: 3, y: 6, to: 'market', spawn: 'start', label: 'The market' },
      { x: 22, y: 6, to: 'tavern', spawn: 'start', label: 'The Dragon\'s Keg' },
      { x: 11, y: 11, to: 'town_hall', spawn: 'start', label: 'The town hall' },
      { x: 18, y: 1, to: 'inn_room', spawn: 'start', label: 'The inn — your room' },
      { x: 3, y: 1, to: 'erza_house', spawn: 'start', label: 'A shuttered house' },
      { x: 28, y: 4, to: 'dig_site', spawn: 'start', label: 'The road east' },
      { x: 28, y: 5, to: 'dig_site', spawn: 'start', label: 'The road east' },
      { x: 1, y: 9, to: 'forest_path', spawn: 'start', label: 'The forest road' }
    ],
    npcs: [
      { id: 'crier', x: 16, y: 4, name: 'Panicking Townsfolk', script: 'npc_crier', visual: { body: 'humanoid', skin: '#d8a878', hair: '#5a3a22', cloth: '#7a5f3a', cloth2: '#5a4228', hairStyle: 'short' }, wander: true },
      { id: 'minotaur_boy', x: 19, y: 8, name: 'A Young Minotaur', script: 'npc_minotaur_boy', appearAfter: 'half_dragon_beaten', visual: { body: 'humanoid', skin: '#8a6a4a', hair: '#3a2a18', cloth: '#6a5a3a', cloth2: '#4a3a28', horns: 'bull', tail: true, snout: true }, scale: 0.85 },
      { id: 'guard_sq', x: 9, y: 6, name: 'Drakehaven Guard', script: 'npc_guard', visualFrom: 'town_guard', wander: true },
      { id: 'cat', x: 5, y: 8, name: 'A Grey Cat', script: 'npc_cat', visualFrom: 'grey_cat', scale: 0.55, appearAfter: 'act2_started' }
    ],
    triggers: [
      { x: 12, y: 3, w: 6, h: 3, script: 'act2_the_crazy_ones', once: true, needFlag: 'act1_done' }
    ]
  },

  market: {
    name: 'Drakehaven Market', music: 'town', ambience: 'crowd', town: true,
    outdoor: true, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWWWWWWWW',
      'Wppppppppppppppppppp>W',
      'WpkkkppppppppppkkkpppW',
      'Wppppppppppppppppppp.W',
      'WppppppkkkkppppppppppW',
      'WppppppppppppppppkkppW',
      'WppppppppppppppppppppW',
      'WpppppppppppppppppppnW',
      'WWWWWWWWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 20, y: 1 } },
    exits: [{ x: 20, y: 1, to: 'town_square', spawn: 'market', label: 'Back to the square' }],
    npcs: [
      { id: 'potion_seller', x: 3, y: 3, name: 'Wenna Tolm, Potions', script: 'shop_potion_stand', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#7a4a8a', cloth: '#5a3f7a', cloth2: '#3f2a5a', hairStyle: 'long' } },
      { id: 'food_seller', x: 16, y: 3, name: 'Bessaly Crumb, Food', script: 'shop_food', visual: { body: 'humanoid', skin: '#d8a878', hair: '#8a6a3a', cloth: '#8a6a3a', cloth2: '#6a4a28', hairStyle: 'short', smallBody: true }, scale: 0.85 },
      { id: 'shady_man', x: 18, y: 6, name: 'A Man in the Shade', script: 'shop_shady', visual: { body: 'humanoid', skin: '#b8845a', hair: '#1a1410', cloth: '#2b2b3a', cloth2: '#1a1a24', hairStyle: 'short', hood: '#22222e' } },
      { id: 'smith', x: 9, y: 5, name: 'Hesta Ironhale, Smith', script: 'shop_smith', visual: { body: 'humanoid', skin: '#c89870', hair: '#7a2a20', cloth: '#5a4a3a', cloth2: '#3a3028', beard: '#7a2a20', hairStyle: 'braid', smallBody: true }, scale: 0.88 }
    ]
  },

  tavern: {
    name: 'The Dragon\'s Keg', music: 'tavern', ambience: 'crowd', town: true,
    indoor: true, baseDark: 0.18, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWWWWWW',
      'W..ZZZZZZ..DD......W',
      'W..aaaaaa..........W',
      'W..................W',
      'W..th..th....th....W',
      'W..t...t.....t.....W',
      'W..th..th....th....W',
      'W...........b..b...W',
      'W.......>..........W',
      'WWWWWWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 8, y: 8 } },
    exits: [{ x: 8, y: 8, to: 'town_square', spawn: 'tavern', label: 'Out into the square' }],
    lights: [{ x: 5, y: 2, r: 80 }, { x: 14, y: 5, r: 70 }],
    npcs: [
      { id: 'mimsy', x: 6, y: 3, name: 'Little Mimsy', script: 'npc_mimsy', visual: { body: 'humanoid', skin: '#a88a6a', hair: '#3a2a18', cloth: '#8a3f6a', cloth2: '#5a2a48', horns: 'bull', snout: true, tail: true }, scale: 1.1, facing: 'down' },
      { id: 'tabaxi', x: 12, y: 3, name: 'An Orange Tabaxi', script: 'npc_tabaxi', visual: { body: 'humanoid', skin: '#d8954a', fur: '#d8954a', hair: '#8a5f3a', cloth: '#3f5f7a', cloth2: '#2b4258', ears: 'cat', tail: true } },
      { id: 'gnome_alone', x: 15, y: 6, name: 'A Gnome, Alone', script: 'npc_gnome_alone', visual: { body: 'humanoid', skin: '#f0cfa8', hair: '#c8c4b0', cloth: '#4a6a4a', cloth2: '#33482f', beard: '#c8c4b0', smallBody: true }, scale: 0.8 },
      { id: 'dwarf_food', x: 4, y: 6, name: 'A Dwarf and a Full Plate', script: 'npc_dwarf', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#7a2a20', cloth: '#5a5a6a', cloth2: '#3a3a4a', beard: '#7a2a20', smallBody: true }, scale: 0.85 },
      { id: 'orc_corner', x: 17, y: 4, name: 'An Orc, Talking Low', script: 'npc_orc', visual: { body: 'humanoid', skin: '#6a8a5a', hair: '#1a1410', cloth: '#4a3a2a', cloth2: '#332a1f', tusks: true, bigBody: true }, scale: 1.1 },
      { id: 'erza', x: 2, y: 4, name: 'Erza', script: 'npc_erza', visual: { body: 'humanoid', skin: '#c2a668', fur: '#c2a668', hair: '#8a6a3a', cloth: '#7a5f3a', cloth2: '#5a4228', ears: 'cat', tail: true } },
      { id: 'musicians', x: 10, y: 7, name: 'Musicians', script: 'npc_musicians', visual: { body: 'humanoid', skin: '#d8a878', hair: '#2b1f16', cloth: '#7a2a4a', cloth2: '#5a1f38', hairStyle: 'long' } }
    ]
  },

  town_hall: {
    name: 'Drakehaven Town Hall', music: 'town', town: true,
    indoor: true, baseDark: 0.12, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWW',
      'W..KK......KK..W',
      'W..............W',
      'W....ttt.......W',
      'W....h.........W',
      'W..............W',
      'W......>.......W',
      'WWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 7, y: 6 } },
    exits: [{ x: 7, y: 6, to: 'town_square', spawn: 'hall', label: 'Out to the square' }],
    npcs: [
      { id: 'mayor', x: 6, y: 2, name: 'The Mayor', script: 'npc_mayor', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#5a3a22', cloth: '#3a4a7a', cloth2: '#2b3558', hairStyle: 'short', ears: 'long' }, facing: 'down' },
      { id: 'hall_guard1', x: 3, y: 3, name: 'Soldier', script: 'npc_guard', visualFrom: 'town_guard' },
      { id: 'hall_guard2', x: 9, y: 3, name: 'Soldier', script: 'npc_guard', visualFrom: 'town_guard' }
    ]
  },

  inn_room: {
    name: 'Your Room at the Wet Rope Inn', music: 'tavern', town: true,
    indoor: true, baseDark: 0.2, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWW',
      'W.E...E...E....W',
      'W..............W',
      'W.Q........C...W',
      'W..............W',
      'WWWWW++++++WWWWW',
      'gggg++++++gggggg',
      'gggy++++++"ggggg',
      'ggggggggggggggg>'
    ],
    spawns: { start: { x: 8, y: 4 } },
    exits: [{ x: 15, y: 8, to: 'town_square', spawn: 'inn', label: 'Out to the square' }],
    lights: [{ x: 8, y: 2, r: 90 }],
    npcs: []
  },

  erza_house: {
    name: 'The Shuttered House', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.5, fill: 'W',
    rows: [
      'WWWWWWWWWWWWWWWWWW',
      'Wff............ffW',
      'Wf..ff......ff..fW',
      'W....ff...ff.....W',
      'Wf....ffffff....fW',
      'W..ff........ff..W',
      'Wff.....>.....fffW',
      'WWWWWWWWWWWWWWWWWW'
    ],
    spawns: { start: { x: 8, y: 6 } },
    exits: [{ x: 8, y: 6, to: 'town_square', spawn: 'north', label: 'Out, quickly' }],
    triggers: [{ x: 6, y: 5, w: 5, h: 2, script: 'act3_eyeball', once: true }]
  },

  /* ===================== ACT 4–5 — THE DIG AND THE MINE ===================== */
  dig_site: {
    name: 'The Collapsed Cave Mouth', music: 'town', ambience: 'sea',
    outdoor: true, fill: 'g',
    rows: [
      'ggggggggggggTggggggggg',
      'ggTgggggggggggggggTggg',
      'gggggppppppppppgggggyg',
      'ggggppppppppppppgggggg',
      'gggppppRRRRRRRRppppggg',
      'ggpppppROOOOOORppppggg',
      'ggppppppROOOORppppppgg',
      'gggppppppRRRRppppppggg',
      'ggggggpppppppppppgggBg',
      'gggTgggggggggggggggggg'
    ],
    spawns: { start: { x: 3, y: 3 }, mine: { x: 11, y: 8 } },
    exits: [
      { x: 1, y: 3, to: 'town_square', spawn: 'start', label: 'Back to the square' },
      { x: 11, y: 8, to: 'mine_boulder', spawn: 'start', label: 'Into the cave', gate: 'dig_done' },
      { x: 21, y: 8, to: 'swamp', spawn: 'start', label: 'The swamp road', gate: 'swamp_known' }
    ],
    npcs: [
      { id: 'digger_orc', x: 8, y: 7, name: 'An Orc with a Shovel', script: 'npc_digger', visual: { body: 'humanoid', skin: '#6a8a5a', hair: '#1a1410', cloth: '#5a4a3a', cloth2: '#3a3028', tusks: true, bigBody: true }, scale: 1.1 },
      { id: 'digger_minotaur', x: 13, y: 7, name: 'A Minotaur with a Shovel', script: 'npc_digger', visual: { body: 'humanoid', skin: '#6a4a32', hair: '#3a2a18', cloth: '#6a5a3a', cloth2: '#4a3a28', horns: 'bull', tail: true, snout: true }, scale: 1.15 }
    ]
  },

  mine_boulder: {
    name: 'The Mine — First Chamber', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.72, fill: 'R',
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRRRR',
      'R^VVVVVVVVVVVVVVVVVVVVVVVR',
      'RVVVVVVVVVVVVVVVVVVVVVV*VR',
      'RVVvVVVVVVVVVVVVNNVVlVVVVR',
      'RVVVVVVVVVVVVVVVNNVVVVV>VR',
      'RVVVVVVVuVVVVVVVVVVVVVVVVR',
      'RVV*VVVVVVVVVVVVVVVVV*VVVR',
      'RRRRRRRRRRRRRRRRRRRRRRRRRR'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'dig_site', spawn: 'mine', label: 'Back out into the light' },
      { x: 23, y: 4, to: 'mine_statue', spawn: 'start', label: 'The next room', gate: 'lever_pulled' }
    ],
    lights: [{ x: 23, y: 2, r: 70, flicker: true }, { x: 3, y: 6, r: 70, flicker: true }, { x: 21, y: 6, r: 70, flicker: true }],
    triggers: [{ x: 3, y: 1, w: 6, h: 6, script: 'mine_boulder_trap', once: true }]
  },

  mine_statue: {
    name: 'The Mine — The Statue', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.55, fill: '#',
    rows: [
      '##################',
      '#^SSSSSSSSSSSSSS.#',
      '#SSSSSSSSSSSSSSSS#',
      '#SS*SSSSUSSSS*SS>#',
      '#SSSSSSSSSSSSSSSS#',
      '#SSSSSSSSSSSSSSSS#',
      '##################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_boulder', spawn: 'start', label: 'Back' },
      { x: 16, y: 3, to: 'mine_runes', spawn: 'start', label: 'Onward', gate: 'statue_solved' }
    ],
    lights: [{ x: 3, y: 3, r: 80, flicker: true }, { x: 13, y: 3, r: 80, flicker: true }],
    triggers: [{ x: 4, y: 1, w: 8, h: 5, script: 'mine_statue_riddle', once: true }]
  },

  mine_runes: {
    name: 'The Mine — The Rune Rays', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.45, fill: '#',
    rows: [
      '####################',
      '#^SSSSSSSSSSSSSSSS.#',
      '#SSSXXXXXXXXXXSS;;S#',
      '#SSSXXXXXXXXXXSS;;>#',
      '#SSSXXXXXXXXXXSSSSS#',
      '#SSSSSSSSSSSSSSSSSS#',
      '####################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_statue', spawn: 'start', label: 'Back' },
      { x: 18, y: 3, to: 'mine_lava', spawn: 'start', label: 'Through the far door', gate: 'runes_crossed' }
    ],
    triggers: [{ x: 2, y: 1, w: 2, h: 5, script: 'mine_runes_intro', once: true }]
  },

  mine_lava: {
    name: 'The Mine — The Lava Cut', music: 'mine', ambience: 'fire',
    indoor: true, baseDark: 0.25, fill: '#',
    rows: [
      '##################',
      '#^SSSSSLLSSSSSSS.#',
      '#SSSSSSLLSSSSSSSS#',
      '#SSSSSSLLSSSSSS>S#',
      '#SSSSSSLLSSSSSSSS#',
      '#SSSSSSLLSSSSSSSS#',
      '##################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_runes', spawn: 'start', label: 'Back' },
      { x: 15, y: 3, to: 'mine_gas', spawn: 'start', label: 'The sealed door', gate: 'lava_crossed' }
    ],
    lights: [{ x: 7, y: 3, r: 130, flicker: true }],
    triggers: [{ x: 3, y: 1, w: 3, h: 5, script: 'mine_lava_intro', once: true }]
  },

  mine_gas: {
    name: 'The Mine — The Sealed Room', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.4, fill: '#',
    rows: [
      '################',
      '#^SSSSSSSSSSSS.#',
      '#SSSSSSSSSSSSSS#',
      '#SSSSS_SSSSSS>S#',
      '#SSSSSSSSSSSSSS#',
      '#SS*SSSSSSSS*SS#',
      '################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_lava', spawn: 'start', label: 'Back' },
      { x: 13, y: 3, to: 'mine_knock', spawn: 'start', label: 'The exit door', gate: 'gas_escaped' }
    ],
    lights: [{ x: 3, y: 5, r: 70, flicker: true }, { x: 12, y: 5, r: 70, flicker: true }],
    triggers: [{ x: 2, y: 1, w: 4, h: 5, script: 'mine_gas_room', once: true }]
  },

  mine_knock: {
    name: 'The Mine — The Polite Door', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.5, fill: '#',
    rows: [
      '##############',
      '#^SSSSSSSSSS.#',
      '#SSSSSSSSSSSS#',
      '#SS*SSSSSS>SS#',
      '#SSSSSSSSSSSS#',
      '##############'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_gas', spawn: 'start', label: 'Back' },
      { x: 10, y: 3, to: 'mine_wight', spawn: 'start', label: 'The unlocked door', gate: 'knocked' }
    ],
    lights: [{ x: 3, y: 3, r: 80, flicker: true }],
    triggers: [{ x: 6, y: 2, w: 4, h: 3, script: 'mine_knock_door', once: true }]
  },

  mine_wight: {
    name: 'The Mine — The Guard Room', music: 'boss', ambience: 'cave',
    indoor: true, baseDark: 0.42, fill: '#',
    rows: [
      '######################',
      '#^SSSSSSSSSSSSSSSSSS.#',
      '#SSiSSSSSSSSSSSSiSSSS#',
      '#SS*SSSSSSSSSSSS*SS>S#',
      '#SSSSSSSSSSSSSSSSSSSS#',
      '#SSSSSSSSSSSSSSSSSSSS#',
      '######################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [
      { x: 1, y: 1, to: 'mine_knock', spawn: 'start', label: 'Back' },
      { x: 19, y: 3, to: 'mine_lab', spawn: 'start', label: 'The last door', gate: 'wight_beaten' }
    ],
    lights: [{ x: 3, y: 3, r: 80, flicker: true }, { x: 16, y: 3, r: 80, flicker: true }],
    triggers: [{ x: 4, y: 1, w: 6, h: 5, script: 'mine_wight_fight', once: true }]
  },

  mine_lab: {
    name: 'Grimble\'s Workshop', music: 'mine', ambience: 'fire',
    indoor: true, baseDark: 0.15, fill: '#',
    rows: [
      '####################',
      '#^SSSSSSSSSSSSSSSS.#',
      '#SSKKSSSSSSSSQSSSSS#',
      '#SSSSSSSSSSSSSSSCSS#',
      '#SSSSSSSSSSSSSSSSSS#',
      '#SS!SSSSSSSSSSSS!SS#',
      '####################'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [{ x: 1, y: 1, to: 'mine_wight', spawn: 'start', label: 'Back' }],
    lights: [{ x: 3, y: 5, r: 100, flicker: true }, { x: 16, y: 5, r: 100, flicker: true }],
    npcs: [
      { id: 'grimble', x: 9, y: 3, name: 'Grimble the Trialsmith', script: 'npc_grimble', visual: { body: 'humanoid', skin: '#f0cfa8', hair: '#e8dcc0', cloth: '#4a6a7a', cloth2: '#33485a', beard: '#e8dcc0', smallBody: true }, scale: 0.8, facing: 'down' },
      { id: 'lab_wyrmling', x: 11, y: 4, name: 'A Very Calm Baby Dragon', script: 'npc_lab_dragon', visualFrom: 'baby_dragon', scale: 0.5 }
    ],
    triggers: [{ x: 4, y: 1, w: 4, h: 5, script: 'mine_lab_meet', once: true }]
  },

  /* ===================== ACT 6 — THE SWAMP ===================== */
  swamp: {
    name: 'The Swamp Behind Grimble\'s House', music: 'swamp', ambience: 'sea',
    outdoor: true, fill: 'm', fog: true,
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPP',
      'PgggmmmmmmmmmmmmmmmgggPP',
      'PgmmmmmmmmmmmmmmmmmmmmgP',
      'Pmmmm~~mmmmmmmm~~mmmmmmP',
      'Pmmmmmmmmmmmmmmmmmmmmm"P',
      'Pmmm~~mmmmmmmmmm~~mmmmmP',
      'PgmmmmmmmmmmmmmmmmmmmmgP',
      'PPgggmmmmmmmmmmmmmgggPPP',
      'PPPPPPPPPPPPPPPPPPPPPPPP'
    ],
    spawns: { start: { x: 2, y: 4 } },
    exits: [{ x: 1, y: 4, to: 'dig_site', spawn: 'start', label: 'Back to the road' }],
    triggers: [{ x: 5, y: 2, w: 6, h: 5, script: 'act6_black_dragon', once: true }]
  },

  /* ===================== ACT 8–9 — THE ISLAND ===================== */
  forest_path: {
    name: 'The Drakehaven Forest Road', music: 'town', ambience: 'sea',
    outdoor: true, fill: 'g',
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPP',
      'PgggyggggPPPPggggggggggP',
      'PggggggggPPPPgggBgggggyP',
      'Pppppppppppppppppppppp.P',
      'PgggBggggPPPPgggggggggPP',
      'Pgg"ggggPPPPPgggyggggggP',
      'PPPPPPPPPPPPPPPPPPPPPPPP'
    ],
    spawns: { start: { x: 22, y: 3 } },
    exits: [
      { x: 22, y: 3, to: 'town_square', spawn: 'start', label: 'Back to Drakehaven' },
      { x: 1, y: 3, to: 'forest_clearing', spawn: 'start', label: 'A clearing ahead' }
    ],
    triggers: []
  },

  forest_clearing: {
    name: 'A Clearing in the Forest', music: 'vision', ambience: 'sea',
    outdoor: true, fill: 'P',
    rows: [
      'PPPPPPPPPPPPPPPPPPPP',
      'PPBBggggggggggBBPPPP',
      'PBggggggggggggggBBPP',
      '.gggggggggggggggggPP',
      'PBggggggggggggggggPP',
      'PPBBggggggggggBBPPPP',
      'PPPPPPPPPPPPPPPPPPPP'
    ],
    spawns: { start: { x: 0, y: 3 } },
    exits: [
      { x: 0, y: 3, to: 'forest_path', spawn: 'start', label: 'Back to the road' },
      { x: 17, y: 3, to: 'baycrest', spawn: 'start', label: 'On toward Baycrest', gate: 'clearing_done' }
    ],
    npcs: [
      { id: 'copper', x: 13, y: 3, name: 'Adult Copper Dragon', script: 'npc_copper', visualFrom: 'copper_dragon', scale: 1.5, appearAfter: 'clearing_seen' },
      { id: 'copper_baby', x: 15, y: 4, name: 'Copper Wyrmling', script: 'npc_copper_baby', visualFrom: 'baby_dragon', scale: 0.55, appearAfter: 'clearing_seen' },
      { id: 'blue_orphan', x: 11, y: 2, name: 'Young Blue Dragon', script: 'npc_blue_orphan', visualFrom: 'blue_wyrmling', scale: 0.8, appearAfter: 'clearing_seen' },
      { id: 'owlbear', x: 6, y: 4, name: 'A Small Owlbear', script: 'npc_owlbear', visualFrom: 'owlbear_small', scale: 0.9, appearAfter: 'clearing_seen' }
    ],
    triggers: [{ x: 3, y: 2, w: 4, h: 4, script: 'act9_clearing', once: true }]
  },

  baycrest: {
    name: 'The Town of Baycrest', music: 'town', ambience: 'sea', town: true,
    outdoor: true, fill: 'g',
    rows: [
      'ggggggggggggggggggggg',
      'gWWWWggWWWWggWWWWWggg',
      'gW.>WggW.>WggW..>Wggg',
      'gWWWWggWWWWggWWWWWggg',
      'gpppppppppppppppppppg',
      'gppppppppppppppppppp.',
      'gpppppppppppppppppppg',
      'gWWWWWWWggggggRRRRggg',
      'gW.....>gggggggRVRggg',
      'gWWWWWWWggggggRRRRggg',
      'ggyggggggggggggggg"gg'
    ],
    spawns: { start: { x: 20, y: 5 } },
    exits: [
      { x: 20, y: 5, to: 'forest_clearing', spawn: 'start', label: 'Back through the forest' },
      { x: 3, y: 2, to: 'baycrest_tower', spawn: 'start', label: 'The observation tower' },
      { x: 9, y: 2, to: 'baycrest_museum', spawn: 'start', label: 'The museum' },
      { x: 16, y: 2, to: 'baycrest_house', spawn: 'start', label: 'A house' },
      { x: 7, y: 8, to: 'arena', spawn: 'start', label: 'The arena' },
      { x: 16, y: 8, to: 'baycrest_cave', spawn: 'start', label: 'A cave mouth' }
    ],
    npcs: [
      { id: 'baycrest_local', x: 12, y: 5, name: 'A Baycrest Local', script: 'npc_baycrest_local', visual: { body: 'humanoid', skin: '#d8a878', hair: '#3a2a18', cloth: '#4a5f7a', cloth2: '#33465a', hairStyle: 'short' }, wander: true },
      { id: 'ball_herald', x: 15, y: 5, name: 'A Herald in Gold', script: 'npc_ball_herald', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#c2a668', cloth: '#c2a03a', cloth2: '#8a7028', hairStyle: 'long', ears: 'long' } }
    ]
  },

  baycrest_tower: {
    name: 'The Observation Tower', music: 'town', indoor: true, baseDark: 0.14, fill: '#',
    rows: [
      '##############',
      '#SSSSSSSSSSS.#',
      '#SSKKSSSSSSSS#',
      '#SSSSSS_SSSSS#',
      '#SSSSSSSSSSSS#',
      '#SSSSS>SSSSSS#',
      '##############'
    ],
    spawns: { start: { x: 6, y: 5 } },
    exits: [{ x: 6, y: 5, to: 'baycrest', spawn: 'start', label: 'Down and out' }],
    npcs: [{ id: 'astronomer', x: 8, y: 3, name: 'The Watcher', script: 'npc_astronomer', visual: { body: 'humanoid', skin: '#c89870', hair: '#c8c4b0', cloth: '#3a3560', cloth2: '#282045', hairStyle: 'long', hat: '#2f2a55' } }]
  },

  baycrest_museum: {
    name: 'The Baycrest Museum', music: 'town', indoor: true, baseDark: 0.14, fill: '#',
    rows: [
      '################',
      '#MMMMMMMMMMMMM.#',
      '#MIMMUMMMUMMIMM#',
      '#MMMMMMMMMMMMMM#',
      '#MMMMMM>MMMMMMM#',
      '################'
    ],
    spawns: { start: { x: 7, y: 4 } },
    exits: [{ x: 7, y: 4, to: 'baycrest', spawn: 'start', label: 'Out' }],
    npcs: [{ id: 'curator', x: 4, y: 3, name: 'The Curator', script: 'npc_curator', visual: { body: 'humanoid', skin: '#8a6a4a', hair: '#1a1410', cloth: '#5a3f6a', cloth2: '#3f2a4a', hairStyle: 'braid' } }]
  },

  baycrest_house: {
    name: 'A House in Baycrest', music: 'tavern', indoor: true, baseDark: 0.2, fill: 'W',
    rows: [
      'WWWWWWWWWWWW',
      'W.E....C...W',
      'W..........W',
      'W..t.h.....W',
      'W....>.....W',
      'WWWWWWWWWWWW'
    ],
    spawns: { start: { x: 5, y: 4 } },
    exits: [{ x: 5, y: 4, to: 'baycrest', spawn: 'start', label: 'Out' }],
    npcs: [{ id: 'baycrest_host', x: 8, y: 3, name: 'A Nervous Host', script: 'npc_baycrest_host', visual: { body: 'humanoid', skin: '#e8c0a0', hair: '#8a6a3a', cloth: '#6a5a4a', cloth2: '#4a3a2a', hairStyle: 'short' } }]
  },

  baycrest_cave: {
    name: 'The Cave Above Baycrest', music: 'mine', ambience: 'cave',
    indoor: true, baseDark: 0.7, fill: 'R',
    rows: [
      'RRRRRRRRRRRRRRRR',
      'R^VVVVVVVVVVVVVR',
      'RVVvVVVuVVVVvVVR',
      'RVVVVVVVVVVVVVVR',
      'RVVVVVVCVVVVVVVR',
      'RRRRRRRRRRRRRRRR'
    ],
    spawns: { start: { x: 1, y: 1 } },
    exits: [{ x: 1, y: 1, to: 'baycrest', spawn: 'start', label: 'Back out' }],
    triggers: [{ x: 5, y: 2, w: 6, h: 3, script: 'baycrest_cave_encounter', once: true }]
  },

  arena: {
    name: 'The Drakehaven Arena', music: 'battle', ambience: 'crowd',
    outdoor: true, fill: '#',
    rows: [
      '####################',
      '#ssssssssssssssss..#',
      '#ssssssssssssssssss#',
      '#ssssssssssssssssss#',
      '#ssssssssssssssssss#',
      '#sssssssss>ssssssss#',
      '####################'
    ],
    spawns: { start: { x: 10, y: 5 } },
    exits: [{ x: 10, y: 5, to: 'baycrest', spawn: 'start', label: 'Leave the sand' }],
    npcs: [{ id: 'arena_master', x: 6, y: 3, name: 'The Arena Master', script: 'npc_arena_master', visual: { body: 'humanoid', skin: '#b8845a', hair: '#1a1410', cloth: '#8a3f3a', cloth2: '#5a2a28', armor: '#8a7350', hairStyle: 'mohawk' }, scale: 1.1 }]
  },

  /* ===================== ACT 10 — THE BALL ===================== */
  manor_lobby: {
    name: 'The Manor Lobby', music: 'ball',
    indoor: true, baseDark: 0.1, fill: '#',
    rows: [
      '################',
      '#MMMMMMMMMMMMM.#',
      '#MjMMMMMMMMMjMM#',
      '#MMMMMMMMMMMMMM#',
      '#MMMMMM>MMMMMMM#',
      '################'
    ],
    spawns: { start: { x: 7, y: 4 } },
    exits: [
      { x: 7, y: 4, to: 'baycrest', spawn: 'start', label: 'Leave' },
      { x: 14, y: 1, to: 'ballroom', spawn: 'start', label: 'Into the ballroom', gate: 'ball_admitted' }
    ],
    npcs: [{ id: 'door_elf', x: 8, y: 2, name: 'A Tall Elf Woman', script: 'npc_door_elf', visual: { body: 'humanoid', skin: '#f4e0c8', hair: '#e8dcc0', cloth: '#2b2b4a', cloth2: '#1f1f38', hairStyle: 'long', ears: 'long' }, scale: 1.05, facing: 'down' }]
  },

  ballroom: {
    name: 'The Grand Ballroom', music: 'ball',
    indoor: true, baseDark: 0.08, fill: '#',
    rows: [
      '##########wwwwww##########',
      '#MMMMMMMMMMMMMMMMMMMMMMM.#',
      '#MjMMMMMMMMMeMMMMMMMMjMMM#',
      '#MMMMMMIMMMMMMMMIMMMMMMMM#',
      '#MMMMMMMMMMMMMMMMMMMMMMMM#',
      '#MMtMMMMMMMMMMMMMMMMMtMMM#',
      '#MMMMMMMMMMM>MMMMMMMMMMMM#',
      '##########################'
    ],
    spawns: { start: { x: 12, y: 6 } },
    exits: [{ x: 12, y: 6, to: 'manor_lobby', spawn: 'start', label: 'Back to the lobby' }],
    npcs: [
      { id: 'target', x: 20, y: 5, name: 'A Man by the Refreshments', script: 'npc_target', visualFrom: 'marked_man' },
      { id: 'guest1', x: 8, y: 4, name: 'A Dancing Guest', script: 'npc_ball_guest', visualFrom: 'ball_guest', wander: true },
      { id: 'guest2', x: 15, y: 3, name: 'An Important Guest', script: 'npc_ball_guest', visualFrom: 'ball_guest', wander: true },
      { id: 'guest3', x: 5, y: 5, name: 'A Guest with a Glass', script: 'npc_ball_guest', visualFrom: 'ball_guest', wander: true }
    ],
    triggers: [{ x: 10, y: 4, w: 6, h: 3, script: 'act10_ball', once: true }]
  }
};

/* ---------------- normalisation ---------------- */
(function normalise() {
  Object.keys(DH.MAPS).forEach(id => {
    const m = DH.MAPS[id];
    m.id = id;
    const fill = m.fill || '.';
    let w = 0;
    m.rows.forEach(r => w = Math.max(w, r.length));
    m.rows = m.rows.map(r => r.length < w ? r + fill.repeat(w - r.length) : r);
    m.w = w; m.h = m.rows.length;
    m.pxW = w * DH.gfx.TILE; m.pxH = m.h * DH.gfx.TILE;
    /* validate legend coverage so a typo is loud, not silent */
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < w; x++) {
        const c = m.rows[y][x];
        if (!DH.LEGEND[c]) {
          console.warn('map "' + id + '" has unknown tile "' + c + '" at ' + x + ',' + y);
          m.rows[y] = m.rows[y].substring(0, x) + fill + m.rows[y].substring(x + 1);
        }
      }
    }
  });
})();

DH.mapAt = function (m, x, y) {
  if (!m || x < 0 || y < 0 || y >= m.h || x >= m.w) return DH.LEGEND[' '];
  return DH.LEGEND[m.rows[y][x]] || DH.LEGEND[' '];
};
DH.mapChar = function (m, x, y) {
  if (!m || x < 0 || y < 0 || y >= m.h || x >= m.w) return ' ';
  return m.rows[y][x];
};
DH.setMapChar = function (m, x, y, c) {
  if (!m || x < 0 || y < 0 || y >= m.h || x >= m.w) return;
  m.rows[y] = m.rows[y].substring(0, x) + c + m.rows[y].substring(x + 1);
};

/* ---------------- combat arenas ----------------
   Encounters build their own grid, separate from the walkable overworld. */
DH.ARENAS = {
  ship_deck_fight: {
    name: 'The Deck in the Storm', w: 20, h: 13, tile: 'deck', music: 'battle',
    rain: 1.4, thunder: true, dark: 0.3,
    walls: [], water: [{ x: 0, y: 0, w: 20, h: 1 }, { x: 0, y: 12, w: 20, h: 1 }],
    props: [
      { x: 3, y: 3, kind: 'barrel' }, { x: 4, y: 8, kind: 'barrel' },
      { x: 15, y: 3, kind: 'barrel' }, { x: 16, y: 9, kind: 'barrel' },
      { x: 9, y: 2, kind: 'mast', solid: true }, { x: 9, y: 3, kind: 'mast', solid: true },
      { x: 10, y: 6, kind: 'rope', climb: true }, { x: 8, y: 9, kind: 'rope', climb: true },
      { x: 6, y: 5, kind: 'bottle' }, { x: 13, y: 7, kind: 'bottle' }, { x: 11, y: 10, kind: 'bottle' },
      { x: 2, y: 6, kind: 'crate' }, { x: 17, y: 6, kind: 'crate' }
    ],
    playerZone: { x: 2, y: 5, w: 4, h: 4 },
    enemyZone: { x: 13, y: 4, w: 5, h: 5 }
  },
  town_street: {
    name: 'The Square', w: 20, h: 13, tile: 'path', music: 'battle',
    props: [
      { x: 4, y: 3, kind: 'stall', solid: true }, { x: 15, y: 4, kind: 'stall', solid: true },
      { x: 6, y: 8, kind: 'barrel' }, { x: 13, y: 9, kind: 'barrel' },
      { x: 9, y: 6, kind: 'pole', solid: true },
      { x: 2, y: 10, kind: 'crate' }, { x: 17, y: 2, kind: 'crate' }
    ],
    playerZone: { x: 2, y: 5, w: 4, h: 4 },
    enemyZone: { x: 14, y: 5, w: 4, h: 5 }
  },
  town_boss: {
    name: 'The Square, and the Half-Dragon', w: 22, h: 14, tile: 'path', music: 'boss',
    props: [
      { x: 3, y: 4, kind: 'coldbarrel', cold: true }, { x: 3, y: 9, kind: 'coldbarrel', cold: true },
      { x: 18, y: 6, kind: 'coldbarrel', cold: true },
      { x: 8, y: 2, kind: 'crate' }, { x: 14, y: 11, kind: 'crate' },
      { x: 6, y: 7, kind: 'barrel' }, { x: 16, y: 8, kind: 'barrel' },
      { x: 11, y: 3, kind: 'stall', solid: true }
    ],
    playerZone: { x: 2, y: 6, w: 4, h: 4 },
    enemyZone: { x: 15, y: 5, w: 5, h: 5 }
  },
  tavern_fight: {
    name: 'Inside the Dragon\'s Keg', w: 18, h: 12, tile: 'floor', music: 'battle',
    props: [
      { x: 4, y: 4, kind: 'table', solid: true }, { x: 12, y: 4, kind: 'table', solid: true },
      { x: 4, y: 8, kind: 'table', solid: true }, { x: 12, y: 8, kind: 'table', solid: true },
      { x: 8, y: 2, kind: 'bar', solid: true }, { x: 9, y: 2, kind: 'bar', solid: true },
      { x: 6, y: 6, kind: 'bottle' }, { x: 11, y: 6, kind: 'bottle' },
      { x: 2, y: 9, kind: 'barrel' }, { x: 15, y: 3, kind: 'barrel' }
    ],
    playerZone: { x: 2, y: 8, w: 4, h: 3 },
    enemyZone: { x: 12, y: 5, w: 4, h: 4 }
  },
  fungus_house: {
    name: 'The Fungus-Filled House', w: 18, h: 12, tile: 'floor', music: 'boss',
    dark: 0.4,
    props: [
      { x: 5, y: 3, kind: 'fungus', hazard: 'spore' }, { x: 8, y: 5, kind: 'fungus', hazard: 'spore' },
      { x: 6, y: 8, kind: 'fungus', hazard: 'spore' }, { x: 11, y: 3, kind: 'fungus', hazard: 'spore' },
      { x: 12, y: 8, kind: 'fungus', hazard: 'spore' },
      { x: 3, y: 6, kind: 'crate' }, { x: 15, y: 6, kind: 'barrel' }
    ],
    playerZone: { x: 2, y: 8, w: 4, h: 3 },
    enemyZone: { x: 14, y: 4, w: 3, h: 4 }
  },
  mine_room: {
    name: 'The Guard Room', w: 20, h: 12, tile: 'stonefloor', music: 'boss',
    dark: 0.35,
    props: [
      { x: 3, y: 3, kind: 'pillar', solid: true }, { x: 16, y: 3, kind: 'pillar', solid: true },
      { x: 3, y: 8, kind: 'pillar', solid: true }, { x: 16, y: 8, kind: 'pillar', solid: true },
      { x: 6, y: 5, kind: 'bones' }, { x: 13, y: 7, kind: 'bones' },
      { x: 9, y: 2, kind: 'brazier', solid: true, light: 80 }
    ],
    playerZone: { x: 2, y: 5, w: 3, h: 4 },
    enemyZone: { x: 14, y: 5, w: 4, h: 4 }
  },
  swamp_fight: {
    name: 'The Swamp', w: 22, h: 14, tile: 'mud', music: 'boss',
    fog: true, difficultAll: true,
    props: [
      { x: 5, y: 4, kind: 'pine', solid: true }, { x: 17, y: 9, kind: 'pine', solid: true },
      { x: 8, y: 11, kind: 'bush' }, { x: 14, y: 2, kind: 'bush' },
      { x: 11, y: 6, kind: 'rock', solid: true }
    ],
    water: [{ x: 3, y: 7, w: 2, h: 2 }, { x: 18, y: 3, w: 2, h: 2 }],
    playerZone: { x: 2, y: 10, w: 4, h: 3 },
    enemyZone: { x: 15, y: 5, w: 5, h: 5 }
  },
  arena_sand: {
    name: 'The Arena', w: 22, h: 14, tile: 'sand', music: 'battle',
    props: [
      { x: 5, y: 3, kind: 'barrel' }, { x: 16, y: 10, kind: 'barrel' },
      { x: 11, y: 6, kind: 'boulder', solid: true },
      { x: 4, y: 10, kind: 'crate' }, { x: 17, y: 3, kind: 'crate' }
    ],
    playerZone: { x: 2, y: 6, w: 3, h: 4 },
    enemyZone: { x: 17, y: 5, w: 4, h: 5 }
  },
  clearing_fight: {
    name: 'The Clearing', w: 20, h: 13, tile: 'grass', music: 'battle',
    props: [
      { x: 3, y: 3, kind: 'tree', solid: true }, { x: 16, y: 4, kind: 'tree', solid: true },
      { x: 5, y: 10, kind: 'bush' }, { x: 14, y: 9, kind: 'bush' }, { x: 9, y: 6, kind: 'rock', solid: true }
    ],
    playerZone: { x: 2, y: 5, w: 4, h: 4 },
    enemyZone: { x: 14, y: 5, w: 4, h: 4 }
  },
  ballroom_fight: {
    name: 'The Ballroom, On Fire', w: 22, h: 13, tile: 'marble', music: 'boss',
    props: [
      { x: 6, y: 3, kind: 'pillar', solid: true }, { x: 15, y: 3, kind: 'pillar', solid: true },
      { x: 6, y: 9, kind: 'pillar', solid: true }, { x: 15, y: 9, kind: 'pillar', solid: true },
      { x: 10, y: 2, kind: 'pedestal', solid: true }, { x: 11, y: 2, kind: 'egg' },
      { x: 3, y: 6, kind: 'table', solid: true }, { x: 18, y: 6, kind: 'table', solid: true }
    ],
    playerZone: { x: 8, y: 9, w: 5, h: 3 },
    enemyZone: { x: 16, y: 4, w: 4, h: 5 }
  },
  cave_fight: {
    name: 'The Cave', w: 18, h: 12, tile: 'cave', music: 'battle',
    dark: 0.5,
    props: [
      { x: 4, y: 4, kind: 'rock', solid: true }, { x: 13, y: 7, kind: 'rock', solid: true },
      { x: 8, y: 3, kind: 'bones' }, { x: 10, y: 9, kind: 'mushroom' }
    ],
    playerZone: { x: 2, y: 5, w: 3, h: 4 },
    enemyZone: { x: 13, y: 4, w: 3, h: 4 }
  }
};
