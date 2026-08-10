/* Drakehaven Island — the campaign. Every beat from the table, encoded as
   instructions for scenes/script.js. */
window.DH = window.DH || {};

DH.STORY = {

  /* ==========================================================================
     PROLOGUE — the early hours of a thunderstorm
     ========================================================================== */
  prologue: [
    { t: 'music', id: 'storm' },
    { t: 'ambience', id: 'rain' },
    { t: 'thunder', on: true },
    { t: 'chapter', label: 'ACT ZERO', title: 'The Mary Parker', sub: 'somewhere off Drakehaven Island', ms: 3000 },
    { t: 'narr', text: 'It is the early hours of the morning, and it is thundering.' },
    {
      t: 'narr', text: 'You are in the crew quarters of a ship called the Mary Parker. Thunder booms somewhere above the deck, and waves break against the wood in a long, slow rhythm that is — genuinely — quite calming.'
    },
    { t: 'sfx', id: 'thunder' },
    {
      t: 'narr', text: 'Less calming is the other sound. Metal, twisting and turning, over and over, from the far end of the room.'
    },
    { t: 'travel', map: 'ship_quarters', spawn: 'start' },
    { t: 'flag', k: 'game_started' },
    { t: 'quest', id: 'pact', title: 'A P.A.C.T. Posting', desc: 'You are being carried to Drakehaven Island to stop some rogue civilians. Nobody has told you much more than that.' }
  ],

  act0_open: [
    {
      t: 'narr', text: 'Swinging back and forth in a hammock, reading by a shuttered lantern, is a wood elf. They turn a page. The thunder does not appear to have registered.'
    },
    {
      t: 'narr', text: 'And at the other end of the room, a half-orc built like a doorway is holding a bar of hard ship-iron and punching it. Not hitting it with a hammer. Punching it. He has been doing this for some time.'
    },
    {
      t: 'choice', text: 'Do you find this annoying, and would you like to talk to him?',
      options: [
        {
          text: 'Yes. Go and ask him to stop.', then: [
            { t: 'run', id: 'npc_anvil' }
          ]
        },
        {
          text: 'No — go and ask the elf what they are reading.', then: [
            { t: 'run', id: 'npc_umarion' }
          ]
        },
        {
          text: 'Try to go back to sleep.', then: [
            { t: 'narr', text: 'You lie back down. The ship rolls. The metal clangs. Somewhere above, somebody drops something heavy and swears about it.' },
            { t: 'narr', text: 'You do not go back to sleep.' }
          ]
        }
      ]
    },
    { t: 'wait', ms: 400 },
    { t: 'run', id: 'act0_all_hands' }
  ],

  npc_anvil: [
    { t: 'sfx', id: 'hit' },
    { t: 'say', who: 'Anvil', text: '"It gives." *He hits the bar again.* "Iron gives, eventually. Everythin\' does."' },
    {
      t: 'choice', text: 'He does not stop punching while he talks.',
      options: [
        {
          text: '"It is the middle of the night."', then: [
            { t: 'say', who: 'Anvil', text: '"It\'s a storm. Nobody\'s sleepin\'." *A pause. He looks at your hands, then your face.* "You could hit it too, if you like."' },
            {
              t: 'choice', text: '', options: [
                {
                  text: 'Hit the bar.', then: [
                    { t: 'check', skill: 'athletics', dc: 12, label: 'Athletics — hit the iron', ok: [{ t: 'say', who: 'Anvil', text: '*The bar rings. He grins with a great many teeth.* "Ha! Good. You\'ll do."' }, { t: 'do', fn: () => DH.game.addAffinity('anvil', 2, 'Anvil') }], fail: [{ t: 'say', who: 'Anvil', text: '*Your knuckles scream. He nods, unbothered.* "Yeah. That\'s the first bit."' }, { t: 'do', fn: () => DH.game.addAffinity('anvil', 1, 'Anvil') }] }
                  ]
                },
                { text: 'Decline politely.', then: [{ t: 'say', who: 'Anvil', text: '"Suit yerself."' }] }
              ]
            }
          ]
        },
        {
          text: '"Why the hands? Why not a hammer?"', then: [
            { t: 'say', who: 'Anvil', text: '"Hammer can be took off ya." *He turns the bar over, considering a fresh spot.* "Hands can\'t."' },
            { t: 'do', fn: () => DH.game.addAffinity('anvil', 1, 'Anvil') }
          ]
        },
        { text: 'Say nothing and go back to your hammock.', then: [{ t: 'narr', text: 'He does not seem to notice you leave.' }] }
      ]
    }
  ],

  npc_umarion: [
    { t: 'say', who: 'The Wood Elf', text: '*Without looking up.* "It\'s a book about tides. It is dreadful. I have read it four times."' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: '"Does the noise not bother you?"', then: [
            { t: 'say', who: 'The Wood Elf', text: '"Anvil? No. He stops eventually." *A page turns.* "Or the iron does. It\'s about even."' },
            { t: 'do', fn: () => DH.game.addAffinity('umarion', 1, 'Umarion') }
          ]
        },
        {
          text: '"What is your name?"', then: [
            { t: 'say', who: 'Umarion', text: '"Umarion." *They finally look at you, and their eyes catch the lantern in a way human eyes do not.* "You\'re the new one they sent. P.A.C.T. never explains anything. You\'ll get used to it."' },
            { t: 'do', fn: () => DH.game.addAffinity('umarion', 2, 'Umarion') }
          ]
        },
        {
          text: '"Where exactly are we going?"', then: [
            { t: 'say', who: 'Umarion', text: '"Drakehaven. An island. Somebody there has stopped doing what the higher-ups want." *Shrug.* "That is generally the whole brief."' }
          ]
        }
      ]
    }
  ],

  npc_sleeper: [
    { t: 'narr', text: 'Fast asleep, and in no mood to be woken by anyone who is not the captain.' }
  ],

  act0_all_hands: [
    { t: 'sfx', id: 'door' },
    { t: 'say', who: 'A Stern Voice, Above', text: '"ALL HANDS ON DECK!"' },
    { t: 'narr', text: 'Then quick footsteps coming down the stairs, two at a time.' },
    { t: 'flag', k: 'boy_arrives' },
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) },
    { t: 'say', who: 'A Small Man', text: '"C-captain says all h-hands on deck!"' },
    {
      t: 'choice', text: 'Would you like to go? And if so, will you wake the others?',
      options: [
        {
          text: 'Go up, and wake everyone on the way.', then: [
            { t: 'run', id: 'act0_introduce' },
            { t: 'flag', k: 'woke_them' }
          ]
        },
        {
          text: 'Go up alone and let them sleep.', then: [
            { t: 'narr', text: 'You leave the three of them where they are. Anvil sets the bar down and follows you without being asked. Umarion marks their page.' },
            { t: 'join', who: 'anvil' },
            { t: 'join', who: 'umarion' },
            { t: 'flag', k: 'let_them_sleep' }
          ]
        },
        {
          text: '"Tell the captain we are asleep."', then: [
            { t: 'say', who: 'A Small Man', text: '"I— I don\'t think I can t-tell him that, sir."' },
            { t: 'narr', text: 'He is right. You get up.' },
            { t: 'run', id: 'act0_introduce' }
          ]
        }
      ]
    },
    { t: 'flag', k: 'called_on_deck' },
    { t: 'toast', text: 'The way up to the deck is open.', ms: 2600 },
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) }
  ],

  act0_introduce: [
    { t: 'narr', text: 'You go round the hammocks.' },
    { t: 'say', who: 'Anvil', text: '*The half-orc sets the iron bar down carefully, as though it were the one that might get hurt.* "Bout time somethin\' happened."' },
    { t: 'join', who: 'anvil' },
    { t: 'say', who: 'Umarion', text: '*The wood elf swings out of the hammock without touching the floor awkwardly once.* "If it is nothing, I am going back to my dreadful book."' },
    { t: 'join', who: 'umarion' },
    { t: 'narr', text: 'The last hammock holds a rock gnome in a nightshirt with a spellbook open on his chest, a diagram of a sphere half-finished on the page.' },
    { t: 'say', who: 'Ball Wizard', text: '"Mm. Yes. Just — one moment — " *He closes the book on his own thumb.* "Ready."' },
    { t: 'join', who: 'ball_wizard' },
    { t: 'narr', text: 'Three of them, then, and you. It is not much of a company. It is the one that is awake.' }
  ],

  npc_cabin_boy: [
    { t: 'say', who: 'A Small Man', text: '"C-captain says all h-hands on deck. Please, sir. He\'s in a state."' }
  ],
  npc_cabin_boy2: [
    { t: 'say', who: 'The Small Man', text: '"He shouted at me for wakin\' you. I\'m sorry. He says we treat the higher-ups with utmost respect." *He looks utterly miserable and utterly soaked.*' },
    {
      t: 'choice', text: '', options: [
        {
          text: '"You did the right thing."', then: [
            { t: 'say', who: 'The Small Man', text: '*He straightens up about two inches.* "Th-thank you, sir."' },
            { t: 'do', fn: () => DH.game.addAffinity('cabin_boy', 3, 'the cabin boy') }
          ]
        },
        { text: '"What is your name?"', then: [{ t: 'say', who: 'The Small Man', text: '"Pell, sir. Just Pell."' }, { t: 'do', fn: () => DH.game.addAffinity('cabin_boy', 2, 'Pell') }] }
      ]
    }
  ],

  npc_crew: [
    { t: 'say', who: 'Deckhand', text: '"Storm\'s a bad \'un but she\'s a good ship. Don\'t touch the rigging on the port side, it\'s frayed and the captain won\'t pay for new."' }
  ],

  /* ==========================================================================
     THE DECK — the dingy, the fine gentleman, and the hags
     ========================================================================== */
  act0_deck: [
    { t: 'music', id: 'storm', restart: true },
    { t: 'narr', text: 'You come up the stairs and are instantly, comprehensively drenched.' },
    { t: 'say', who: 'A Fat Man at the Wheel', text: '"Ah, y\'all are up! You need anythin\'?" *He has to yell it over the rain. He is at the wheel, and he looks very much like the captain.*' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'The Captain', text: '"Hey! What numbskull decided to wake the higher ups?"' },
    { t: 'say', who: 'Pell', text: '"M-me sir."' },
    { t: 'say', who: 'The Captain', text: '"We treat them with utmost respect." *He says this as if reciting a rule he has been told off about before.*' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'The Captain', text: '"We—, hey, wait. What is that, at ten o\'clock." *He points out into the black water.*' },
    { t: 'sfx', id: 'thunder' },
    { t: 'flash' },
    { t: 'narr', text: 'A dingy. Small, low in the water, and there is only one man in it.' },
    {
      t: 'choice', text: 'The crew are already reaching for the boat hooks.',
      options: [
        {
          text: 'Help haul him aboard.', then: [
            { t: 'check', skill: 'athletics', dc: 10, label: 'Athletics — haul him up', ok: [{ t: 'narr', text: 'You get a fist in his collar and heave.' }], fail: [{ t: 'narr', text: 'He is much heavier than he looks, and you nearly go over the rail with him.' }] }
          ]
        },
        {
          text: 'Watch him first. Something is wrong with this.', hint: 'Perception',
          then: [
            {
              t: 'check', skill: 'perception', dc: 14, label: 'Perception — the man in the boat',
              ok: [
                { t: 'narr', text: 'He is not shivering. He is not bailing. He is sitting very still in a boat full of water, and his hands are wrong — too long in the finger.' },
                { t: 'flag', k: 'suspected_hag' },
                { t: 'toast', text: 'You will act first when this turns.', kind: 'good', ms: 3000 }
              ],
              fail: [{ t: 'narr', text: 'Rain, dark, a man in a boat. Nothing else to see.' }]
            }
          ]
        },
        { text: 'Say nothing and let the crew work.', then: [{ t: 'narr', text: 'The crew hoist them up.' }] }
      ]
    },
    { t: 'sfx', id: 'hit' },
    { t: 'narr', text: 'The man falls face first onto the deck with a thunk.' },
    { t: 'narr', text: 'He looks very fine. That is the strange part. Soaked to the skin, hauled out of a freezing sea in the middle of a storm — and he looks *very fine*.' },
    { t: 'narr', text: 'He is also heavy enough that the impact wakes the rest of the ship. You see the others emerge from the darkness below.' },
    { t: 'joinAll' },
    { t: 'say', who: 'The Man', text: '"Please," *he breathes.*' },
    { t: 'narr', text: 'Then he stands. He stands *weirdly* — the joints going in an order that joints do not go in. And he looks odd. He looks, in this light, faintly blue.' },
    { t: 'say', who: 'The Captain', text: '"Hey, how are you alive? You must\'ve been in the water for a long time."' },
    { t: 'narr', text: 'The man looks at the captain. Then at one of the crew. And he nods.' },
    { t: 'wait', ms: 700 },
    { t: 'sfx', id: 'growl' },
    { t: 'narr', text: 'Then, at the same time, the two of them start to twitch.' },
    {
      t: 'narr', text: 'Their skin swells from tan to blue. Their teeth grow. Their hair turns green and long, like seaweed.\n\nSea hags.'
    },
    { t: 'sfx', id: 'splash' },
    { t: 'narr', text: 'They each grab a crew member, jump off the boat and pull them under. The thrashing waves turn red.' },
    { t: 'wait', ms: 600 },
    { t: 'narr', text: 'And when they have finished their meals, they come back for seconds.' },
    { t: 'banner', big: 'ROLL INITIATIVE', small: 'two sea hags · the deck in a storm', ms: 1700 },
    {
      t: 'combat', arena: 'ship_deck_fight',
      enemies: ['sea_hag', 'sea_hag'], allies: ['sailor', 'sailor'],
      set: 'hags_beaten',
      onWin: [
        { t: 'run', id: 'act0_after_hags' }
      ],
      onLose: [
        { t: 'narr', text: 'The hags take what they came for and slide back into the black water. The captain hauls you up by the collar, one at a time, swearing continuously.' },
        { t: 'say', who: 'The Captain', text: '"Ya lived. That\'s the job most days." *He spits over the rail.* "Come up ta my cabin. We\'ll talk."' },
        { t: 'flag', k: 'hags_beaten' },
        { t: 'run', id: 'act0_necklace' }
      ]
    }
  ],

  act0_after_hags: [
    { t: 'music', id: 'storm' },
    { t: 'narr', text: 'The last hag goes over the rail and does not come back up.' },
    { t: 'say', who: 'The Captain', text: '"Well. That\'s me two best rope-men gone." *He grips the wheel again, hard.* "Thank you. Truly. Ya done more than the crew did."' },
    { t: 'xp', n: 100 },
    { t: 'run', id: 'act0_necklace' }
  ],

  act0_necklace: [
    { t: 'say', who: 'The Captain', text: '"Hoy. That one." *He points a thick finger at the hag draped over the rail.* "There\'s somethin\' glimmerin\' on her neck."' },
    { t: 'narr', text: 'A necklace. Salt-crusted silver, and still cold to the touch.' },
    {
      t: 'choice', text: 'What is it?',
      options: [
        {
          text: 'Work it out. (History or Investigation, DC 14)', then: [
            {
              t: 'choice', text: 'Which way do you come at it?',
              options: [
                {
                  text: 'History — where have I read about this?', then: [
                    {
                      t: 'check', skill: 'history', dc: 14, by: 'party', label: 'History — the hag\'s necklace',
                      ok: [{ t: 'run', id: 'act0_necklace_known' }],
                      fail: [{ t: 'run', id: 'act0_necklace_unknown' }]
                    }
                  ]
                },
                {
                  text: 'Investigation — take it apart and look.', then: [
                    {
                      t: 'check', skill: 'investigation', dc: 14, by: 'party', label: 'Investigation — the hag\'s necklace',
                      ok: [{ t: 'run', id: 'act0_necklace_known' }],
                      fail: [{ t: 'run', id: 'act0_necklace_unknown' }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        { text: 'Just take it and worry later.', then: [{ t: 'run', id: 'act0_necklace_unknown' }] }
      ]
    },
    { t: 'give', item: 'hag_necklace' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'The Captain', text: '"Hey, sorry \'bout that. Me crew is pretty dumb. How about you guys come up to my cabin and we\'ll talk!"' },
    { t: 'flag', k: 'invited_to_cabin' },
    { t: 'toast', text: 'The captain\'s cabin is open.', ms: 2600 },
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) }
  ],
  act0_necklace_known: [
    { t: 'narr', text: 'It comes to you cleanly: hag-silver, worn against the skin, holding a single favour. Once between rests it will tilt one roll of the dice in your favour — advantage on a d20 test.' },
    { t: 'flag', k: 'necklace_identified' },
    { t: 'toast', text: 'Sea Hag\'s Necklace — advantage on one d20 test per short rest.', kind: 'item', ms: 4000 }
  ],
  act0_necklace_unknown: [
    { t: 'narr', text: 'It is silver, it is cold, and it is faintly humming. Whatever it does, it has not decided to tell you yet.' }
  ],

  /* ==========================================================================
     THE CABIN — P.A.C.T., the pods, and ship games
     ========================================================================== */
  act0_cabin: [
    { t: 'music', id: 'tavern' },
    { t: 'narr', text: 'The cabin is very nice. A beautifully crafted wooden desk, charts pinned flat with knives, and an entire wall of booze.' },
    { t: 'narr', text: 'He sits behind the desk and tells you to take a seat.' },
    {
      t: 'say', who: 'Captain Hobbs', text: '"I know they haven\'t tol\' you much yet, but you obviously know you\'re working for P.A.C.T. — Protective Acts for Controlling Tyrants."'
    },
    {
      t: 'say', who: 'Captain Hobbs', text: '"They\'ve sent you ta stop some rogue civilians in a place call\' Drakehaven Island. I know this seems like an easy job, but you neva know what\'ll happen."'
    },
    { t: 'say', who: 'Captain Hobbs', text: '"An\' me an\' me crew is responsible for gettin\' you to the island. An\' maybe back."' },
    { t: 'wait', ms: 400 },
    { t: 'narr', text: 'He turns and grabs something from the floor. He lays out a handful of weird egg-shaped purple pods and slides one to each of you. Then he sets a much larger pod on the table.' },
    { t: 'sfx', id: 'quest' },
    { t: 'pods' },
    { t: 'say', who: 'Captain Hobbs', text: '"These are P.A.C.T. pods. Them higher-ups give you these to help ya get the job done quicker. They can do a few cool things."' },
    { t: 'say', who: 'Captain Hobbs', text: '"One: they all track each otha. On the screen, the red dots show each one of ya."' },
    { t: 'say', who: 'Captain Hobbs', text: '"Two: they can defend ya. By clickin\' the blue \'S\' button — this\'ll make a biiiiig shield aroun\' the presser."' },
    { t: 'say', who: 'Captain Hobbs', text: '"Finall-ay: you can personalize \'em. Once you get strong enough, you can make \'em do special things personalized to you."' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'Captain Hobbs', text: '"Oh ya, I almos\' forgot the biggest part." *He taps the large pod.* "Ya see this big pod\'ll charge them baby pods. They call it a Command Pod. Cuz them baby ones ain\'t last foreva!"' },
    { t: 'say', who: 'Captain Hobbs', text: '"This bugun might do some more but I don\'t really know."' },
    { t: 'say', who: 'Captain Hobbs', text: '"Ya have any questions?" *He asks it with a grin.*' },
    { t: 'run', id: 'act0_questions' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'Captain Hobbs', text: '"Hey, ya know what I like to do when I\'m waitin\'?"' },
    { t: 'say', who: 'Captain Hobbs', text: '"SHIP GAMES!"' },
    { t: 'say', who: 'Captain Hobbs', text: '"I got us a few fun games to play if ya up fo\' it! Alrighty, I got some choices for ya —"' },
    { t: 'run', id: 'ship_games' },
    { t: 'run', id: 'act0_arrival' }
  ],

  act0_questions: [
    {
      t: 'choice', text: 'Questions for the captain.',
      options: [
        {
          text: '"Rogue civilians? Rogue how?"', then: [
            { t: 'say', who: 'Captain Hobbs', text: '"Ain\'t been told. Which usually means it\'s worse than they wanna write down." *He pours himself something.* "Word from the docks is it ain\'t people gone rogue at all."' },
            { t: 'run', id: 'act0_questions' }
          ]
        },
        {
          text: '"How many charges does a pod hold?"', then: [
            { t: 'say', who: 'Captain Hobbs', text: '"Couple, startin\' out. More as ya get harder to kill. Big one gives back four after a proper sleep, but it only does four pods at a time, mind."' },
            { t: 'run', id: 'act0_questions' }
          ]
        },
        {
          text: '"You have been to Drakehaven before?"', then: [
            { t: 'say', who: 'Captain Hobbs', text: '"Lived there, when I were young." *He laughs, entirely without bitterness.* "Got kicked out for losin\' in the arena. Good memories."' },
            { t: 'flag', k: 'knows_arena' },
            { t: 'run', id: 'act0_questions' }
          ]
        },
        {
          text: '"What was that thing in the water, really?"', then: [
            { t: 'say', who: 'Captain Hobbs', text: '"Sea hag. Wears a drownin\' man like a coat till someone\'s soft enough to pull it aboard." *He looks at the door.* "My fault. I gave the order."' },
            { t: 'run', id: 'act0_questions' }
          ]
        },
        { text: 'No questions.', then: [{ t: 'say', who: 'Captain Hobbs', text: '"Good. Hate questions."' }] }
      ]
    }
  ],

  ship_games: [
    {
      t: 'choice', text: 'Which game?',
      options: [
        { text: 'Dragon\'s Hoard — ante ten gold, three dice, and the house takes a number away.', then: [{ t: 'minigame', game: 'dragons_hoard' }, { t: 'run', id: 'ship_games_again' }] },
        { text: 'Arm Wrestling — Strength saves, first to three.', then: [{ t: 'minigame', game: 'arm_wrestling' }, { t: 'run', id: 'ship_games_again' }] },
        { text: 'Darts — three darts, tightest cluster wins.', then: [{ t: 'minigame', game: 'darts' }, { t: 'run', id: 'ship_games_again' }] },
        { text: 'Drinking — escalating Constitution saves. Last one upright.', then: [{ t: 'minigame', game: 'drinking' }, { t: 'run', id: 'ship_games_again' }] },
        { text: 'Roulette — up to four numbers on a d20, four times your stake.', then: [{ t: 'minigame', game: 'roulette' }, { t: 'run', id: 'ship_games_again' }] },
        { text: 'The Winning Roll — hidden d20s and a secret bid.', then: [{ t: 'minigame', game: 'winning_roll' }, { t: 'run', id: 'ship_games_again' }] },
        {
          text: 'Watch him instead of the dice.', hint: 'Perception or Insight', then: [
            { t: 'run', id: 'captain_dice_tell' },
            { t: 'run', id: 'ship_games' }
          ]
        },
        { text: 'None, thank you.', then: [{ t: 'say', who: 'Captain Hobbs', text: '"Suit yerself. More for me."' }] }
      ]
    }
  ],
  ship_games_again: [
    {
      t: 'choice', text: 'Another?',
      options: [
        { text: 'Yes — pick another game.', run: 'ship_games' },
        { text: 'No, that is enough.', then: [{ t: 'say', who: 'Captain Hobbs', text: '"Fair enough. Ya got good sense, which is rare on my boat."' }] }
      ]
    }
  ],
  captain_dice_tell: [
    {
      t: 'choice', text: 'How are you watching him?',
      options: [
        {
          text: 'Perception — look at what is on the table. (DC 12)', then: [
            {
              t: 'check', skill: 'perception', dc: 12, label: 'Perception — the captain\'s table',
              ok: [
                { t: 'narr', text: 'There is a small box tucked half under the chart, on his side of the desk. It is the size of a set of dice, and it is not the set he handed you.' },
                { t: 'flag', k: 'saw_dice_box' }
              ],
              fail: [{ t: 'narr', text: 'Charts, a bottle, a knife holding down a corner. Nothing unusual.' }]
            }
          ]
        },
        {
          text: 'Insight — watch the man, not the table. (DC 14)', then: [
            {
              t: 'check', skill: 'insight', dc: 14, label: 'Insight — the captain',
              ok: [
                { t: 'narr', text: 'He is shifting uncomfortably in his chair and smiling in a way that has nothing to do with being happy. Whatever is about to happen on this table, he already knows the result.' },
                { t: 'flag', k: 'read_the_captain' }
              ],
              fail: [{ t: 'narr', text: 'He grins at you. He is, as far as you can tell, delighted.' }]
            }
          ]
        }
      ]
    },
    {
      t: 'if', flag: 'saw_dice_box',
      then: [{ t: 'run', id: 'captain_charlatan' }],
      else: [{ t: 'if', flag: 'read_the_captain', then: [{ t: 'run', id: 'captain_charlatan' }] }]
    }
  ],
  captain_charlatan: [
    {
      t: 'choice', text: 'Charlatan\'s dice. He has a weighted set within arm\'s reach.',
      options: [
        {
          text: 'Call him on it.', then: [
            { t: 'say', who: 'Captain Hobbs', text: '*A long pause. Then an enormous laugh.* "HA! Ya got me. Ya got me." *He slides the box across the desk to you.* "Keep \'em. I got another."' },
            { t: 'give', item: 'weighted_dice' },
            { t: 'do', fn: () => DH.game.addAffinity('captain', 3, 'Captain Hobbs') }
          ]
        },
        {
          text: 'Say nothing. Play anyway. Lose on purpose.', then: [
            { t: 'narr', text: 'You let him win. He is so pleased with himself that he tops up your glass twice and tells you a story about a whale that is almost certainly untrue.' },
            { t: 'do', fn: () => DH.game.addAffinity('captain', 2, 'Captain Hobbs') },
            { t: 'flag', k: 'let_captain_win' }
          ]
        },
        {
          text: 'Steal the box while he pours.', hint: 'Sleight of Hand', then: [
            {
              t: 'check', skill: 'sleight_of_hand', dc: 15, label: 'Sleight of Hand — the dice box',
              ok: [{ t: 'narr', text: 'It is in your sleeve before the bottle finishes glugging.' }, { t: 'give', item: 'weighted_dice' }],
              fail: [
                { t: 'say', who: 'Captain Hobbs', text: '*His hand closes over your wrist without him appearing to look.* "Nnnope." *He is still grinning.* "But I like ya more now."' },
                { t: 'do', fn: () => DH.game.addAffinity('captain', 1, 'Captain Hobbs') }
              ]
            }
          ]
        }
      ]
    }
  ],

  act0_arrival: [
    { t: 'wait', ms: 400 },
    { t: 'sfx', id: 'hit' },
    { t: 'shake', amt: 6 },
    { t: 'narr', text: 'You feel a hard rock in the ship, and you hear a crewmate yell — "WE\'RE HERE!"' },
    { t: 'say', who: 'Captain Hobbs', text: '*He stands and opens the door.* "Ah, seems like we\'re here. Drakehaven Island!"' },
    { t: 'say', who: 'Captain Hobbs', text: '"Ahh, I lived here when I was young but was kicked out for losing in the arena. Hahaha, good memories."' },
    { t: 'narr', text: 'The storm has stopped. A plank has been run out from the deck to a dock.' },
    { t: 'ambience', id: 'sea' },
    { t: 'thunder', on: false },
    /* the last of the crossing took most of the morning: you land in daylight */
    { t: 'do', fn: (s) => { s.minutes = 8 * 60 + 10; s.weather = 'clear'; } },
    { t: 'flag', k: 'act0_done' },
    { t: 'questDone', id: 'pact', xp: 150 },
    { t: 'travel', map: 'dock', spawn: 'start' }
  ],

  npc_captain: [
    {
      t: 'if', flag: 'invited_to_cabin',
      then: [{ t: 'say', who: 'Captain Hobbs', text: '"Cabin\'s that way. Mind the step, it\'s rotten."' }],
      else: [{ t: 'say', who: 'Captain Hobbs', text: '"Hold the rail an\' don\'t fall in. That\'s all I ask of anybody."' }]
    }
  ],
  npc_captain_cabin: [
    {
      t: 'choice', text: 'Captain Hobbs, behind his desk.',
      options: [
        { text: 'Ship games.', run: 'ship_games' },
        { text: '"Tell me about Drakehaven."', then: [{ t: 'say', who: 'Captain Hobbs', text: '"Market\'ll rob ya, tavern\'ll fleece ya, an\' the mayor\'ll thank ya politely while he does both. Arena\'s honest, though. Arena\'s the only honest thing there."' }] },
        { text: 'Nothing.', then: [] }
      ]
    }
  ],

  /* ==========================================================================
     ACT ONE — landfall and the golden dragon
     ========================================================================== */
  act1_landfall: [
    { t: 'music', id: 'town' },
    { t: 'narr', text: 'You step off the plank onto the dock. Behind you the captain waves and yells — "Nice meetin\' ya!"' },
    { t: 'narr', text: 'A few moments after you are clear, they have already cast off. The Mary Parker pulls away into the grey.' },
    { t: 'wait', ms: 500 },
    { t: 'sfx', id: 'death' },
    { t: 'narr', text: 'And right as you step off the dock, your knees hit the boards and you start to shake.' },
    { t: 'music', id: 'vision', restart: true },
    { t: 'wait', ms: 500 },
    { t: 'narr', text: 'You all see it. Not in front of you — behind your eyes. An Ancient Golden Dragon, vast beyond scale, curled in a dark that has no walls.' },
    { t: 'say', who: 'The Ancient Golden Dragon', text: '"Where have they gone. Please. Help me, child."' },
    { t: 'particles', kind: 'gold', n: 40 },
    { t: 'narr', text: 'Your eyes are glowing. The others can see it. So is your mouth.' },
    { t: 'wait', ms: 400 },
    { t: 'narr', text: 'Behind you, the large pod starts to speak in a man\'s voice.' },
    { t: 'say', who: 'The Command Pod', text: '"We\'ve heard that the main creatures going rogue are dragonic. Something dragonic just spoke through our own recruit. Get one of these into them."' },
    { t: 'sfx', id: 'quest' },
    { t: 'narr', text: 'Five green potions materialise in a pocket you were not aware you had.' },
    { t: 'give', item: 'green_potion', qty: 5 },
    {
      t: 'choice', text: 'You are on your knees on the boards with light coming out of your mouth.',
      options: [
        {
          text: 'Drink one of the green potions.', then: [
            { t: 'take', item: 'green_potion', qty: 1 },
            { t: 'sfx', id: 'heal' },
            { t: 'narr', text: 'You get it down. The glow goes out of you. Anvil hauls you up by the back of your coat without being asked.' },
            { t: 'say', who: () => DH.game.pc().name, text: '"It wasn\'t asking me." *You wipe your mouth.* "It was asking through me. There\'s a difference and I don\'t like it."' }
          ]
        },
        {
          text: 'Wait. Let it finish saying whatever it is saying.', then: [
            { t: 'say', who: () => DH.game.pc().name, text: '*Not with your own voice.* "WHERE. HAVE. THEY. GONE."' },
            { t: 'narr', text: 'Umarion puts the potion in your hand and folds your fingers round it. You drink. The light goes out.' },
            { t: 'take', item: 'green_potion', qty: 1 }
          ]
        }
      ]
    },
    { t: 'music', id: 'town' },
    { t: 'flag', k: 'act1_done' },
    { t: 'quest', id: 'eggs', title: 'Where Are The Eggs?', desc: 'Something ancient and golden is missing its eggs, and it is speaking through dragons all over this island. Find out what happened to them.' },
    { t: 'xp', n: 100 }
  ],

  /* ==========================================================================
     ACT TWO — the crazy ones
     ========================================================================== */
  act2_the_crazy_ones: [
    { t: 'narr', text: 'Before you have even properly left the dock road, you can see the town working: creatures and wagons bustling, voices everywhere, metal clanking somewhere, and the smell of smoke and bread.' },
    { t: 'wait', ms: 400 },
    { t: 'say', who: 'Someone, Screaming', text: '"OH NO! THEY\'RE GONE! The crazy ones are on the loose!"' },
    { t: 'narr', text: 'There is a metal pole in the middle of the town with rope tied round it. The rope has been broken.' },
    { t: 'wait', ms: 300 },
    { t: 'narr', text: 'The streets go silent. Then everyone runs and screams at the same time.' },
    { t: 'sfx', id: 'roar' },
    { t: 'flag', k: 'act2_started' },
    { t: 'quest', id: 'crazy', title: 'The Crazy Ones', desc: 'Three of them broke loose from the pole in the square: two dragonborn and a kobold. People are shouting different directions.' },
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) },
    { t: 'narr', text: 'People are shouting different directions — you will need to figure out where the crazy ones went.' },
    { t: 'run', id: 'act2_investigate' }
  ],

  act2_investigate: [
    {
      t: 'choice', text: 'How do you find them?',
      options: [
        {
          text: 'Perception — listen for crashing and shouting.', then: [
            {
              t: 'check', skill: 'perception', dc: 13, by: 'party', label: 'Perception — listen',
              ok: [{ t: 'narr', text: 'Two directions, clearly. Furniture breaking and a roar from the tavern up the east road. And screaming — the frightened kind, not the fleeing kind — from the square behind you.' }, { t: 'flag', k: 'lead_tavern' }, { t: 'flag', k: 'lead_civilians' }],
              fail: [{ t: 'narr', text: 'Everything is crashing and everyone is shouting. That is not narrowing it down.' }]
            }
          ]
        },
        {
          text: 'Investigation — broken stalls, footprints, the snapped rope.', then: [
            {
              t: 'check', skill: 'investigation', dc: 13, by: 'party', label: 'Investigation — the square',
              ok: [{ t: 'narr', text: 'The rope was not cut, it was pulled apart. Three sets of tracks leave the pole: two heavy, clawed, going different ways — and one small set that goes up a rain barrel and onto a roof.' }, { t: 'flag', k: 'lead_kobold' }, { t: 'flag', k: 'lead_civilians' }],
              fail: [{ t: 'narr', text: 'Wreckage, and a great many people\'s footprints on top of whatever was underneath.' }]
            }
          ]
        },
        {
          text: 'Survival — track them through the mud and dust.', then: [
            {
              t: 'check', skill: 'survival', dc: 13, by: 'party', label: 'Survival — track',
              ok: [{ t: 'narr', text: 'You have all three. One toward the tavern, one into the crowd, and one climbing. The climbing one is not running away from anything — it is looking for height.' }, { t: 'flag', k: 'lead_tavern' }, { t: 'flag', k: 'lead_civilians' }, { t: 'flag', k: 'lead_kobold' }],
              fail: [{ t: 'narr', text: 'Cobbles. Hundreds of feet. No trail worth the name.' }]
            }
          ]
        },
        {
          text: 'Persuasion — get a straight answer out of a witness.', then: [
            {
              t: 'check', skill: 'persuasion', dc: 12, by: 'party', label: 'Persuasion — a witness',
              ok: [{ t: 'narr', text: 'A baker with flour to the elbow points, firmly. "One went for the Keg. One\'s in the square going for folk. And there\'s a little one on my roof and it will not stop screaming."' }, { t: 'flag', k: 'lead_tavern' }, { t: 'flag', k: 'lead_civilians' }, { t: 'flag', k: 'lead_kobold' }],
              fail: [{ t: 'narr', text: 'Three people give you three different directions and one of them is upward, which you assume is a joke.' }]
            }
          ]
        },
        {
          text: 'Intimidation — stop somebody and make them talk.', then: [
            {
              t: 'check', skill: 'intimidation', dc: 12, by: 'party', label: 'Intimidation — a witness',
              ok: [{ t: 'narr', text: 'A dockhand freezes solid and tells you everything, at speed, including two things about his brother that you did not need.' }, { t: 'flag', k: 'lead_civilians' }, { t: 'flag', k: 'lead_kobold' }],
              fail: [{ t: 'narr', text: 'He screams and runs. Everyone near him also screams and runs.' }]
            }
          ]
        },
        { text: 'Stop investigating and just look around.', then: [] }
      ]
    },
    {
      t: 'choice', text: 'Where do you go?',
      options: [
        { text: 'The one attacking civilians, here in the square.', run: 'act2_dragonborn_civilians' },
        { text: 'The tavern, where something is breathing fire.', run: 'act2_dragonborn_tavern' },
        { text: 'Up onto the roof, after whatever is shrieking.', run: 'act2_kobold' },
        { text: 'Keep looking for leads first.', run: 'act2_investigate' }
      ]
    }
  ],

  act2_dragonborn_civilians: [
    { t: 'if', flag: 'caught_db2', then: [{ t: 'narr', text: 'That one is already down and tied.' }, { t: 'run', id: 'act2_status' }, { t: 'stop' }] },
    { t: 'narr', text: 'It is in the middle of the square with a fishmonger\'s apron in one fist and the fishmonger still in it. Its eyes and open mouth are glowing gold.' },
    { t: 'say', who: 'The Dragonborn', text: '*In a voice much too large for it.* "WHERE ARE MY EGGS."' },
    { t: 'narr', text: 'It drops the fishmonger, who runs. It looks at you instead.' },
    { t: 'banner', big: 'INITIATIVE', small: 'a crazed dragonborn in the square', ms: 1500 },
    {
      t: 'combat', arena: 'town_street', enemies: ['crazed_dragonborn'], allies: ['town_guard'],
      set: 'caught_db2',
      onWin: [
        { t: 'narr', text: 'It goes down. The guards get rope on it before it can get up, and its eyes are ordinary again — frightened, and entirely its own.' },
        { t: 'say', who: 'The Dragonborn', text: '"I don\'t— I was at the market. I was buying rope." *It looks at the rope on its own wrists.* "Oh."' },
        { t: 'flag', k: 'caught_db2' },
        { t: 'run', id: 'act2_status' }
      ]
    }
  ],

  act2_dragonborn_tavern: [
    { t: 'if', flag: 'caught_db1', then: [{ t: 'narr', text: 'The tavern one is already dealt with.' }, { t: 'run', id: 'act2_status' }, { t: 'stop' }] },
    { t: 'music', id: 'battle' },
    { t: 'narr', text: 'The door of the Dragon\'s Keg is off one hinge. Inside, a dragonborn is flipping tables and breathing fire at the ceiling, and a minotaur behind the bar is holding a wet cloth over a burning stool with an expression of profound resignation.' },
    { t: 'say', who: 'Little Mimsy', text: '"Oh, thank goodnessss. Please do NOT let it near the barrelsss."' },
    { t: 'banner', big: 'INITIATIVE', small: 'inside the Dragon\'s Keg', ms: 1500 },
    {
      t: 'combat', arena: 'tavern_fight', enemies: ['crazed_dragonborn'],
      set: 'caught_db1',
      onWin: [
        { t: 'narr', text: 'It slumps against the bar and the glow goes out of it.' },
        { t: 'say', who: 'Little Mimsy', text: '"You are all drinking free tonight. I mean it. Look at my stool."' },
        { t: 'flag', k: 'caught_db1' },
        { t: 'do', fn: () => DH.game.addAffinity('mimsy', 3, 'Little Mimsy') },
        { t: 'run', id: 'act2_status' }
      ]
    }
  ],

  act2_kobold: [
    { t: 'if', flag: 'caught_kobold', then: [{ t: 'narr', text: 'The roof is quiet now.' }, { t: 'run', id: 'act2_status' }, { t: 'stop' }] },
    { t: 'narr', text: 'The kobold is on top of the chandler\'s shop, shrieking. Not panicking — pacing the roofline, filling its lungs properly each time, and shrieking again.' },
    {
      t: 'check', skill: 'arcana', dc: 12, by: 'party', label: 'Arcana or Insight — the shrieking',
      ok: [
        { t: 'narr', text: 'That is not fear. That is a call. It has a rhythm, and it is being answered from somewhere outside the walls.' },
        { t: 'flag', k: 'knows_kobold_calls' },
        { t: 'toast', text: 'It is calling something. Be quick.', kind: 'bad', ms: 3200 }
      ],
      fail: [{ t: 'narr', text: 'It is just screaming. Horribly, and without pausing.' }]
    },
    {
      t: 'choice', text: 'It is a roof, and the drainpipe looks awful.',
      options: [
        {
          text: 'Climb up after it.', then: [
            {
              t: 'check', skill: 'athletics', dc: 12, label: 'Athletics — climb the drainpipe',
              ok: [{ t: 'narr', text: 'You get up quietly enough that it does not see you until you are on the ridge with it.' }, { t: 'flag', k: 'kobold_surprised' }],
              fail: [{ t: 'narr', text: 'A slate goes. It sees you coming from a long way off and shrieks louder.' }]
            }
          ]
        },
        { text: 'Shoot and throw things at it from the ground.', then: [{ t: 'narr', text: 'It scrambles along the ridge, spitting, and lobs a roof tile back at you.' }] }
      ]
    },
    { t: 'banner', big: 'INITIATIVE', small: 'the shrieking kobold', ms: 1400 },
    {
      t: 'combat', arena: 'town_street', enemies: ['crazed_kobold'],
      set: 'caught_kobold',
      onWin: [
        { t: 'narr', text: 'It comes off the roof and lands badly. When you get rope on it, it is still trying to shriek, and its eyes are glowing gold like the others.' },
        { t: 'flag', k: 'caught_kobold' },
        { t: 'run', id: 'act2_status' }
      ]
    }
  ],

  act2_status: [
    { t: 'do', fn: (s) => { s.counters.caught = ['caught_db1', 'caught_db2', 'caught_kobold'].filter(f => s.flags[f]).length; } },
    {
      t: 'if', test: (s) => s.counters.caught >= 3,
      then: [{ t: 'run', id: 'act2_possession' }],
      else: [
        { t: 'do', fn: (s) => DH.ui.toast('Caught ' + s.counters.caught + ' of 3.', '', 2600) },
        {
          t: 'choice', text: 'One down. Where next?',
          options: [
            { text: 'The one in the square.', run: 'act2_dragonborn_civilians' },
            { text: 'The tavern.', run: 'act2_dragonborn_tavern' },
            { text: 'The roof.', run: 'act2_kobold' },
            { text: 'There is movement in a shadow behind a building.', run: 'npc_cat' },
            { text: 'Catch your breath first.', then: [{ t: 'narr', text: 'You take a moment. The town does not.' }] }
          ]
        }
      ]
    }
  ],

  npc_cat: [
    { t: 'if', flag: 'cat_resolved', then: [{ t: 'say', who: 'The Cat', text: '*It headbutts your shin, once, businesslike.*' }, { t: 'stop' }] },
    { t: 'narr', text: 'In a shadow behind a building, you see movement.' },
    { t: 'sfx', id: 'meow' },
    { t: 'narr', text: 'It is a grey cat. It has been watching all of this happen and has formed opinions.' },
    {
      t: 'choice', text: 'A grey cat, in an alley, in the middle of a crisis.',
      options: [
        {
          text: 'Try to tame it. (Animal Handling, DC 10)', then: [
            {
              t: 'check', skill: 'animal_handling', dc: 10, by: 'party', label: 'Animal Handling — the grey cat',
              ok: [
                { t: 'sfx', id: 'meow' },
                { t: 'narr', text: 'It walks straight into your hands as though this had been agreed in advance.' },
                { t: 'tamePet', id: 'grey_cat' },
                { t: 'toast', text: 'The cat will fight with you: 3 HP, AC 11, claw 1d4.', kind: 'item', ms: 4000 },
                { t: 'flag', k: 'cat_resolved' }
              ],
              fail: [
                { t: 'narr', text: 'It looks at your hand. It looks at your face. It leaves, slowly, so that you understand it was a choice.' },
                { t: 'flag', k: 'cat_resolved' }
              ]
            }
          ]
        },
        { text: 'Leave it alone.', then: [{ t: 'narr', text: 'It stays in the shadow, watching, entirely unbothered.' }] }
      ]
    }
  ],

  act2_possession: [
    { t: 'questDone', id: 'crazy', xp: 300 },
    { t: 'narr', text: 'All three of them are caught and tied on the cobbles in front of the town hall.' },
    { t: 'wait', ms: 500 },
    { t: 'narr', text: 'Then their eyes and open mouths start to glow.' },
    { t: 'sfx', id: 'roar' },
    { t: 'say', who: 'All Three, Together', text: '"WHERE ARE MY EGGS."' },
    { t: 'narr', text: 'The same voice out of three throats. A dragonborn, a dragonborn and a kobold, speaking in unison with something that is none of them.' },
    { t: 'say', who: 'All Three, Together', text: '"I WILL SEND AN ARMY AND KILL FOR THEM."' },
    { t: 'wait', ms: 600 },
    { t: 'sfx', id: 'roar' },
    { t: 'shake', amt: 8 },
    { t: 'narr', text: 'Somewhere very close, a Half-Dragon roars and takes a bite out of the chandler\'s wall. Its eyes are glowing gold and it looks mad in every sense of the word.' },
    { t: 'music', id: 'boss', restart: true },
    { t: 'narr', text: 'In the square there are three barrels of extremely cold water, left out for the fishmongers.' },
    { t: 'narr', text: 'Dip a weapon in one and your attacks do an extra 1d6 to it. Throw the barrel and it does a flat 20.' },
    { t: 'banner', big: 'HALF-DRAGON', small: '90 hit points · AC 14 · 40 ft', ms: 2000 },
    {
      t: 'combat', arena: 'town_boss', enemies: ['half_dragon'], allies: ['town_guard', 'town_guard'],
      set: 'half_dragon_beaten',
      onWin: [
        { t: 'narr', text: 'It goes down in the middle of the square, and the gold goes out of its eyes before it stops moving.' },
        { t: 'music', id: 'town' },
        { t: 'flag', k: 'half_dragon_beaten' },
        { t: 'xp', n: 400 },
        { t: 'run', id: 'act2_minotaur_boy' }
      ],
      onLose: [
        { t: 'narr', text: 'The guards drag you out of the square by your ankles while the Half-Dragon takes the chandler\'s shop apart. It leaves on its own, eventually, still looking for something.' },
        { t: 'flag', k: 'half_dragon_beaten' },
        { t: 'run', id: 'act2_minotaur_boy' }
      ]
    }
  ],

  act2_minotaur_boy: [
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) },
    { t: 'narr', text: 'A young minotaur boy comes up to you out of a doorway, still shaking, holding something out in both hands.' },
    { t: 'say', who: 'The Minotaur Boy', text: '"T-thank you. Please. Please take this."' },
    { t: 'give', item: 'minotaur_charm' },
    { t: 'say', who: 'The Minotaur Boy', text: '"I carved it. It\'s a calf. It\'s not very good." *It is quite good.*' },
    { t: 'do', fn: () => DH.game.addAffinity('minotaur_boy', 5, 'the minotaur boy') },
    { t: 'flag', k: 'act2_done' },
    { t: 'quest', id: 'island', title: 'Drakehaven Island', desc: 'The market, the tavern, the town hall — and whatever is beyond the walls. Somebody on this island knows about the eggs.' },
    { t: 'toast', text: 'The market, the Dragon\'s Keg and the town hall are all open to you.', ms: 4000 }
  ],

  npc_minotaur_boy: [
    { t: 'say', who: 'The Minotaur Boy', text: '"My mum says you\'re the ones from the boat. She says P.A.C.T. never comes here." *He looks up.* "Are you going to stay?"' }
  ],
  npc_crier: [
    {
      t: 'if', flag: 'half_dragon_beaten',
      then: [{ t: 'say', who: 'Townsfolk', text: '"That thing took the front off the chandler\'s. Second time this month somethin\' with wings has done that."' }],
      else: [{ t: 'say', who: 'Townsfolk', text: '"They were tied to the pole! Tied! And now they\'re loose and they\'re not right, none of them are right—"' }]
    }
  ],
  npc_guard: [
    {
      t: 'if', flag: 'half_dragon_beaten',
      then: [{ t: 'say', who: 'Drakehaven Guard', text: '"Mayor wants to see you at the hall. And the lads at the cave mouth east of town could use six more hands, if you\'ve got them."' }, { t: 'flag', k: 'heard_about_dig' }],
      else: [{ t: 'say', who: 'Drakehaven Guard', text: '"Stay out of the square if you can\'t fight. If you can, the square is exactly where you should be."' }]
    }
  ],

  /* ==========================================================================
     ACT THREE — the market, the tavern, and the thing in Erza's house
     ========================================================================== */
  shop_potion_stand: [
    { t: 'say', who: 'Wenna Tolm', text: '"Everythin\' brewed this week, everythin\' labelled. I don\'t sell nothin\' I wouldn\'t drink."' },
    { t: 'shop', id: 'potion_stand' }
  ],
  shop_food: [
    { t: 'say', who: 'Bessaly Crumb', text: '"Bread\'s out the oven, cheese is older than you, and the skewers are whatever the docks landed."' },
    { t: 'shop', id: 'food_section' }
  ],
  shop_smith: [
    { t: 'say', who: 'Hesta Ironhale', text: '"You break it, I mend it. You want it sharper, that\'s extra." *She does not stop working while she says it.*' },
    { t: 'shop', id: 'smith' }
  ],

  shop_shady: [
    { t: 'narr', text: 'A man in the shade between two stalls. He was not looking at you a moment ago and now he is looking at nothing else.' },
    { t: 'say', who: 'The Shady Man', text: '"Do you want to buy anything… nice?"' },
    { t: 'shop', id: 'shady_man' },
    {
      t: 'if', flag: 'shady_contract',
      then: [{ t: 'run', id: 'shady_contract_followup' }],
      else: [{ t: 'run', id: 'shady_offer' }]
    }
  ],
  shady_offer: [
    { t: 'say', who: 'The Shady Man', text: '"Do you want to do a little something for me?"' },
    {
      t: 'choice', text: 'He has not blinked in a while.',
      options: [
        {
          text: '"Go on."', then: [
            { t: 'say', who: 'The Shady Man', text: '"I\'ve got someone that needs to be eliminated. He will be at a royal ball, and you will need to dispose of him."' },
            { t: 'narr', text: 'He hands you a map. A manor house on the far side of the island, and a face circled in charcoal.' },
            { t: 'give', item: 'shady_map' },
            { t: 'say', who: 'The Shady Man', text: '"If you fail to eliminate him in the next two months, you all will be new targets."' },
            { t: 'narr', text: 'He says it in exactly the same tone he used about the poison.' },
            { t: 'flag', k: 'shady_contract' },
            { t: 'deadline', days: 60 },
            { t: 'quest', id: 'contract', title: 'The Shady Man\'s Contract', desc: 'A man at a royal ball must be disposed of within two months. Fail, and the whole party becomes the next contract.' },
            { t: 'flag', k: 'ball_known' }
          ]
        },
        {
          text: '"No."', then: [
            { t: 'say', who: 'The Shady Man', text: '"Mm." *He looks past you at nothing.* "The offer will be here. So will I."' }
          ]
        },
        {
          text: '"Who is he?"', then: [
            { t: 'say', who: 'The Shady Man', text: '"Someone who has been asking about eggs." *A very small pause.* "Which I understand is fashionable."' },
            { t: 'run', id: 'shady_offer' }
          ]
        }
      ]
    }
  ],
  shady_contract_followup: [
    {
      t: 'if', flag: 'contract_done',
      then: [{ t: 'say', who: 'The Shady Man', text: '"Settled, then. You will not see me again unless you want to." *He almost smiles.*' }],
      else: [{ t: 'say', who: 'The Shady Man', text: (s) => '"The ball is still coming. You have ' + Math.max(0, (s.contractDeadlineDay || 0) - s.day) + ' days."' }]
    }
  ],

  npc_mimsy: [
    { t: 'narr', text: 'The bell rings as you open the door to The Dragon\'s Keg. The air is bustling with townsfolk settling down after a hard day, and behind the bar a minotaur is polishing a glass. Above him hangs a giant dragon skull.' },
    { t: 'say', who: 'Little Mimsy', text: '"Heyyyy, can I get you a drinkkk? Our special today is something called Dragon\'s Breath."' },
    {
      t: 'choice', text: 'The bartender is named Mimsy Huddle, but he goes by Little Mimsy.',
      options: [
        { text: '"What is in a Dragon\'s Breath?" (15 gp)', then: [{ t: 'say', who: 'Little Mimsy', text: '"It gives you any breath weapon off the dragonborn list for fifteen minutes. Also you will not be able to do anything delicate for fifteen minutes. Trade-offsss."' }, { t: 'shop', id: 'tavern' }] },
        { text: 'Buy something.', then: [{ t: 'shop', id: 'tavern' }] },
        {
          text: '"Who is worth talking to in here?"', then: [
            { t: 'say', who: 'Little Mimsy', text: '"Orc in the corner is talking business with a man I do not like. Tabaxi at the bar knows more about magic weapons than anyone should. Gnome by himself is sad and will tell you why. Dwarf with the full plate has not looked up in an hour."' },
            { t: 'flag', k: 'mimsy_pointers' }
          ]
        },
        {
          text: '"Anyone been talking about dragon eggs?"', then: [
            { t: 'say', who: 'Little Mimsy', text: '*The cloth stops.* "Everyone. Since the dragons started saying it." *He leans in.* "Ask the gnome by himself. He came in from a cave and he has been muttering about a hatchling."' },
            { t: 'flag', k: 'mine_hint' }
          ]
        }
      ]
    }
  ],
  npc_musicians: [
    { t: 'narr', text: 'Three of them in the corner, playing for whatever the room throws, and trying very hard to get a day\'s worth of dollar out of a room this tired.' },
    {
      t: 'choice', text: '',
      options: [
        { text: 'Throw them a coin.', then: [{ t: 'do', fn: () => { DH.game.spendGold(5); } }, { t: 'sfx', id: 'coin' }, { t: 'narr', text: 'The fiddler nods at you mid-phrase, which from a working musician is a standing ovation.' }, { t: 'do', fn: () => DH.game.addAffinity('musicians', 2, 'the musicians') }] },
        { text: 'Play with them.', hint: 'Performance', then: [{ t: 'check', skill: 'performance', dc: 12, label: 'Performance — sit in with the band', ok: [{ t: 'narr', text: 'The room actually stops talking for a bar and a half, which in the Dragon\'s Keg counts as a riot.' }, { t: 'gold', n: 25 }, { t: 'do', fn: () => DH.game.addAffinity('musicians', 4, 'the musicians') }], fail: [{ t: 'narr', text: 'You are enthusiastic. That is the kindest available word.' }] }] },
        { text: 'Listen.', then: [{ t: 'narr', text: 'It is a song about a ship that does not come back, which given the harbour outside is a bold choice.' }] }
      ]
    }
  ],
  npc_dwarf: [
    { t: 'say', who: 'The Dwarf', text: '*Through food.* "S\'good. Try the pie." *He does not look up.*' }
  ],
  npc_orc: [
    { t: 'say', who: 'The Orc', text: '*He stops talking to the man in the corner as you approach, and waits for you to leave.* "Somethin\' you need?"' },
    {
      t: 'choice', text: 'The man he was talking to is not looking at you either.',
      options: [
        { text: 'Insight — what is this conversation?', then: [{ t: 'check', skill: 'insight', dc: 14, label: 'Insight — the corner table', ok: [{ t: 'narr', text: 'Money is being counted under the table, and neither of them wants to be the one holding it when you walk past. Nothing to do with dragons. Just ordinary crime.' }], fail: [{ t: 'narr', text: 'Two men, one table, nothing you can read.' }] }] },
        { text: 'Leave them to it.', then: [] }
      ]
    }
  ],
  npc_gnome_alone: [
    { t: 'say', who: 'The Gnome', text: '*He is holding a beer he has not drunk any of.* "You\'re the boat lot. Good. Somebody should hear this."' },
    { t: 'say', who: 'The Gnome', text: '"There is a cave east of town, past where they\'re digging. Somebody put trials in it. Actual trials, with doors and riddles and a poison gas room, like it\'s a game."' },
    { t: 'say', who: 'The Gnome', text: '"And at the end of it there\'s another gnome with a baby dragon that isn\'t crazy." *He finally drinks.* "Not crazy. Do you understand what that\'s worth right now?"' },
    { t: 'flag', k: 'mine_hint' },
    { t: 'quest', id: 'mine', title: 'The Trials in the Mine', desc: 'Somebody built a course of trials into a cave east of Drakehaven, and at the end of it is a gnome with a dragon that is not going mad.' }
  ],
  npc_tabaxi: [
    { t: 'say', who: 'The Orange Tabaxi', text: '"Ordering a drink. Then I am going to talk to you about weapons, because that is what I do to strangers."' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: '"Go on then."', then: [
            { t: 'say', who: 'The Orange Tabaxi', text: '"Enspelled weapons. A weapon with a spell folded into it that you can use as an action, no slot, no book, no fuss." *He taps the bar.* "Rare. Worth knowing what one looks like."' },
            { t: 'flag', k: 'knows_enspelled' }
          ]
        },
        { text: 'Walk away.', then: [{ t: 'narr', text: 'He shrugs and goes back to his drink, entirely unoffended.' }] }
      ]
    }
  ],
  npc_erza: [
    {
      t: 'if', flag: 'erza_done',
      then: [{ t: 'say', who: 'Erza', text: '"House is mine again. That is not a small thing." *He turns his glass round on the bar.* "Thank you."' }],
      else: [
        { t: 'say', who: 'Erza', text: '*A tabaxi with fur the colour of old parchment, and one ear notched.* "Is it OK to ask you something? About my home."' },
        { t: 'say', who: 'Erza', text: '"There is a thing living in it. I opened the door six days ago and there was a wall of spores and something at the back of the room with eyes on the ends of it. I have been sleeping here since."' },
        {
          t: 'choice', text: '"Would you go and look? Please. It is my house."',
          options: [
            {
              text: '"We will deal with it."', then: [
                { t: 'flag', k: 'erza_quest' },
                { t: 'quest', id: 'erza', title: 'The Thing in Erza\'s House', desc: 'A fungal horror has taken over a tabaxi\'s home on the north side of the square. It has eyes on tendrils and it has not noticed you yet.' },
                { t: 'say', who: 'Erza', text: '"North side of the square. Shuttered windows. I would come with you but I have discovered that I am a coward, at forty-one." ' },
                { t: 'do', fn: () => DH.game.addAffinity('erza', 2, 'Erza') }
              ]
            },
            { text: '"Not right now."', then: [{ t: 'say', who: 'Erza', text: '"No. Fair. It is a lot to ask of strangers." *He goes back to his drink.*' }] }
          ]
        }
      ]
    }
  ],

  act3_eyeball: [
    { t: 'music', id: 'boss' },
    { t: 'narr', text: 'You enter the house and a wave of spores grabs your faces.' },
    { t: 'partySave', ability: 'con', dc: 12, cond: 'poisoned', dur: 100, who: 'DC 12 Constitution Saves' },
    { t: 'narr', text: 'As you turn the corner, you see a fungus-filled house with a giant floating ball of flesh at the other side of the room.' },
    { t: 'narr', text: 'It has individual tendrils with eyes at the end of each one.' },
    { t: 'narr', text: 'It does not notice you yet.' },
    {
      t: 'choice', text: 'It has not noticed you yet.',
      options: [
        {
          text: 'Set up carefully first. (Stealth)', then: [
            {
              t: 'check', skill: 'stealth', dc: 13, by: 'party', label: 'Stealth — get into position',
              ok: [{ t: 'narr', text: 'You spread out along the wall with the fungus muffling every footfall. When it turns, you are all already where you want to be.' }, { t: 'flag', k: 'eyeball_ambush' }, { t: 'toast', text: 'You strike first.', kind: 'good' }],
              fail: [{ t: 'narr', text: 'A floorboard. Every eye on every tendril swings round at once.' }]
            }
          ]
        },
        { text: 'Attack immediately.', then: [{ t: 'narr', text: 'You go straight at it, which it does not expect, because nothing sensible does that.' }] },
        {
          text: 'Back out and shut the door.', then: [
            { t: 'narr', text: 'You close the door on it. Erza will understand. Erza will also keep sleeping in the tavern.' },
            { t: 'travel', map: 'town_square', spawn: 'north' },
            { t: 'stop' }
          ]
        }
      ]
    },
    { t: 'banner', big: 'INITIATIVE', small: 'the thing in Erza\'s house', ms: 1600 },
    {
      t: 'combat', arena: 'fungus_house', enemies: ['eyeball_monster'],
      set: 'erza_done',
      onWin: [
        { t: 'narr', text: 'It deflates over the course of about four seconds, and every eye closes at a slightly different time, which is the worst part.' },
        { t: 'xp', n: 350 },
        { t: 'flag', k: 'erza_done' },
        { t: 'questDone', id: 'erza', xp: 200 },
        { t: 'run', id: 'act3_brass_knuckles' }
      ]
    }
  ],

  act3_brass_knuckles: [
    { t: 'narr', text: 'Erza is at the door within the hour, and he asks — twice — whether it is all right for him to come into his own home.' },
    { t: 'say', who: 'Erza', text: '"I owe you. I know what that is worth to say and I mean it properly."' },
    { t: 'gold', n: 300 },
    { t: 'narr', text: 'He digs a bundle out from under a floorboard the fungus never reached, and hands you a pair of blue brass knuckles.' },
    { t: 'give', item: 'blue_brass_knuckles' },
    { t: 'narr', text: 'As you put them on you feel magic power course through you.' },
    { t: 'narr', text: 'They add 1d6 to unarmed strikes, and they knock what you hit ten feet backwards.' },
    { t: 'say', who: 'The Orange Tabaxi', text: '*From the doorway, having followed you here for exactly this reason.* "This is something called an Enspelled weapon. This gives you a spell you can use as an action. For the brass knuckles, the spell is Booming Blade."' },
    { t: 'do', fn: () => DH.game.addAffinity('erza', 5, 'Erza') },
    { t: 'flag', k: 'knows_enspelled' }
  ],

  /* ==========================================================================
     ACT FOUR — the town hall and the dig
     ========================================================================== */
  npc_mayor: [
    {
      t: 'if', flag: 'mayor_met',
      then: [{ t: 'run', id: 'npc_mayor_again' }],
      else: [
        { t: 'narr', text: 'You walk in and see a half-elf writing on paper very quickly, with a key on the desk beside him, flanked by two soldiers.' },
        { t: 'say', who: 'The Mayor', text: '*He looks up.* "Ah, hello. Are you here to sign up to defend the town tomorrow?"' },
        {
          t: 'choice', text: 'He has already gone back to writing.',
          options: [
            { text: '"Yes."', then: [{ t: 'run', id: 'mayor_signup' }] },
            {
              text: '"Defend it from what?"', then: [
                { t: 'say', who: 'The Mayor', text: '"Ever since the dragons have gone crazy, wanting their eggs, we haven\'t had a great way to defend the village." *He does not stop writing.* "So I thank you for your help."' },
                { t: 'run', id: 'mayor_signup' }
              ]
            }
          ]
        }
      ]
    }
  ],
  mayor_signup: [
    { t: 'say', who: 'The Mayor', text: '"Ever since the dragons have gone crazy, wanting their eggs, we haven\'t had a great way to defend the village. So I thank you for your help."' },
    { t: 'gold', n: 400 },
    { t: 'give', item: 'red_flower' },
    { t: 'give', item: 'town_parchment', qty: 2 },
    { t: 'narr', text: 'He gives you four hundred gold, a cut red flower, and two pieces of parchment. Then he instantly goes back to work, writing on a third.' },
    { t: 'flag', k: 'mayor_met' },
    { t: 'muster', days: 1 },
    { t: 'quest', id: 'muster', title: 'Defend the Town', desc: 'Your name is on the muster parchment for tomorrow.' },
    { t: 'wait', ms: 300 },
    { t: 'narr', text: 'On your way out, past the hall\'s east window, you see the entrance to a cave covered with stones, and an orc and a minotaur trying to move them.' },
    { t: 'flag', k: 'heard_about_dig' },
    { t: 'quest', id: 'dig', title: 'The Collapsed Cave Mouth', desc: 'An orc and a minotaur are shifting stones off a cave east of town. They have three shovels and no plan.' }
  ],
  npc_mayor_again: [
    {
      t: 'choice', text: 'The mayor, still writing.',
      options: [
        { text: '"What is the key for?"', then: [{ t: 'say', who: 'The Mayor', text: '*He puts a hand flat over it without looking.* "The records room. Which is not interesting." *It is clearly interesting.*' }] },
        { text: '"Who built the trials in the cave east of town?"', then: [{ t: 'say', who: 'The Mayor', text: '"A gnome. Years ago. We let him because he was polite about it and because nothing that goes in there comes back out to bother us." *Pause.* "Mostly."' }, { t: 'flag', k: 'mine_hint' }] },
        { text: '"What do you know about a royal ball?"', need: { flag: 'ball_known' }, lockNote: 'you have not heard of one', then: [{ t: 'say', who: 'The Mayor', text: '"Baycrest. Across the forest. Very important people, very large windows." *He finally stops writing.* "Wear something decent or the elf on the door will eat you alive."' }, { t: 'flag', k: 'ball_directions' }] },
        { text: 'Leave him to his paperwork.', then: [] }
      ]
    }
  ],

  npc_digger: [
    {
      t: 'if', flag: 'dig_done',
      then: [{ t: 'say', who: 'The Orc', text: '"Cave\'s open. Somethin\' clanks in there. We\'re not goin\' in, we\'re paid to dig." *He hands you a torch anyway.*' }, { t: 'give', item: 'torch', qty: 2 }],
      else: [
        { t: 'say', who: 'The Orc', text: '*He straightens up, wipes his forehead and looks at your shoulders.* "Hey, you want to help?"' },
        { t: 'narr', text: 'They have three shovels between all of you.' },
        {
          t: 'choice', text: '',
          options: [
            { text: 'Dig.', then: [{ t: 'minigame', game: 'dig' }, { t: 'if', flag: 'dig_done', then: [{ t: 'run', id: 'dig_finished' }] }] },
            { text: 'Not now.', then: [{ t: 'say', who: 'The Orc', text: '"Suit yourself. Rocks aren\'t goin\' anywhere."' }] }
          ]
        }
      ]
    }
  ],
  dig_finished: [
    { t: 'wait', ms: 300 },
    { t: 'sfx', id: 'door' },
    /* carve the mouth open so the way in is visible, not just unlocked */
    { t: 'setTile', map: 'dig_site', edits: [{ x: 11, y: 6, c: 'V' }, { x: 11, y: 7, c: 'V' }] },
    { t: 'narr', text: 'You hear a clank coming from inside the cave.' },
    { t: 'say', who: 'The Minotaur', text: '"That was not us."' },
    { t: 'flag', k: 'mine_open' },
    { t: 'toast', text: 'The cave east of town is open.', kind: 'item', ms: 3200 }
  ],

  /* ==========================================================================
     ACT FIVE — Grimble's trials
     ========================================================================== */
  mine_boulder_trap: [
    { t: 'music', id: 'mine' },
    { t: 'narr', text: 'You see farther down into the cave, torches illuminating something.' },
    { t: 'narr', text: 'Once you get closer you hear a click behind you — and then a large thud.' },
    { t: 'sfx', id: 'dig' },
    { t: 'shake', amt: 8 },
    {
      t: 'if', test: (s) => s.party.some(c => DH.char.hasEffect(c, 'darkvision:60')),
      then: [{ t: 'narr', text: 'Those of you with darkvision see it clearly: a giant rock, filling the tunnel, rolling towards you.' }],
      else: [{ t: 'narr', text: 'Somebody with better eyes than yours says the word "rock" in a tone that makes everything clear.' }]
    },
    { t: 'narr', text: 'Ahead, near the torches, is a dead and rotting gelatinous cube. You can see straight through it — and behind it is a lever, and farther behind that, a door.' },
    {
      t: 'choice', text: 'The rock is coming. What do you do?',
      options: [
        {
          text: 'Brace it. Anvil and the Ball Wizard, with everyone behind them.', then: [
            {
              t: 'check', skill: 'athletics', dc: 13, by: 'party', label: 'Athletics — brace the boulder',
              ok: [
                { t: 'narr', text: 'Anvil gets his shoulder into it and the Ball Wizard puts something invisible and stubborn between the stone and all of you. It grinds, and it stops.' },
                { t: 'flag', k: 'rock_held' }
              ],
              fail: [
                { t: 'narr', text: 'It gets past you.' },
                { t: 'partySave', ability: 'dex', dc: 13, dmg: '2d6', type: 'bludgeoning', half: true, who: 'DC 13 Dexterity Saves' }
              ]
            }
          ]
        },
        {
          text: 'Run for the lever.', then: [
            { t: 'narr', text: 'You sprint. The rock is faster than it has any right to be.' },
            { t: 'partySave', ability: 'dex', dc: 14, dmg: '2d6', type: 'bludgeoning', half: true, who: 'DC 14 Dexterity Saves' },
            { t: 'narr', text: 'You reach the far end scraped and winded, with the boulder sitting where you were standing.' }
          ]
        },
        {
          text: 'Look for a gap. (Perception DC 11)', then: [
            {
              t: 'check', skill: 'perception', dc: 11, by: 'party', label: 'Perception — above the cube',
              ok: [{ t: 'narr', text: 'There is a gap above the gelatinous cube, up where the ceiling steps back. Enough for all of you if you are quick and unfussy about dignity.' }, { t: 'flag', k: 'found_gap' }],
              fail: [{ t: 'narr', text: 'Rock, rock, rolling rock.' }]
            },
            {
              t: 'if', flag: 'found_gap',
              then: [{ t: 'narr', text: 'You go over the top of the cube and the boulder slams into it, which is the only time in recorded history a gelatinous cube has been useful to anybody.' }],
              else: [{ t: 'partySave', ability: 'dex', dc: 13, dmg: '2d6', type: 'bludgeoning', half: true, who: 'DC 13 Dexterity Saves' }]
            }
          ]
        }
      ]
    },
    { t: 'narr', text: 'You are past it. The lever is there, and beyond the lever, a door.' },
    { t: 'flag', k: 'saw_lever' }
  ],

  mine_cube: [
    { t: 'narr', text: 'A gelatinous cube, quite dead, going over in the way that things which are ninety-five percent water do. You can see the lever through it.' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: 'Burn it with a torch.', need: { item: 'torch' }, lockNote: 'you have no torch',
          then: [
            { t: 'sfx', id: 'fire' },
            { t: 'narr', text: 'It goes up faster than you expect and smells worse than you feared. The way to the lever is clear.' },
            { t: 'flag', k: 'cube_burned' }
          ]
        },
        { text: 'Push through it.', then: [{ t: 'narr', text: 'You go through it. You are going to be picking this out of your clothes for a week.' }, { t: 'flag', k: 'cube_burned' }] },
        { text: 'Leave it.', then: [] }
      ]
    }
  ],

  mine_lever: [
    {
      t: 'if', flag: 'lever_pulled',
      then: [{ t: 'narr', text: 'The lever is down, the stone stopper is in, and the boulder is going nowhere.' }, { t: 'stop' }]
    },
    { t: 'narr', text: 'You hit the lever.' },
    { t: 'sfx', id: 'door' },
    { t: 'narr', text: 'As you do, the gelatinous cube gets burned up in a flash of something white, and the rock gets held up by a stone stopper that rises out of the floor.' },
    { t: 'flag', k: 'lever_pulled' },
    { t: 'xp', n: 150 },
    { t: 'toast', text: 'The door onward is open.', kind: 'item', ms: 2600 }
  ],

  mine_statue_riddle: [
    { t: 'narr', text: 'In this room you see a statue of a woman, and an annoying fly is buzzing around the room.' },
    { t: 'wait', ms: 400 },
    { t: 'sfx', id: 'spell' },
    { t: 'narr', text: 'The statue suddenly sparks to life and says:' },
    { t: 'say', who: 'The Statue', text: '"I\'m difficult for you to hear, say my name and I disappear."' },
    { t: 'narr', text: 'The fly continues, tirelessly. Its hide is somehow AC 26 — unless something hits it that fills a space rather than a point.' },
    { t: 'minigame', game: 'statue_riddle' }
  ],
  statue_examine: [
    {
      t: 'if', flag: 'statue_solved',
      then: [{ t: 'narr', text: 'Where the statue was, there is a clean patch of floor with no dust on it.' }],
      else: [{ t: 'run', id: 'mine_statue_riddle' }]
    }
  ],

  mine_runes_intro: [
    { t: 'narr', text: 'This room has runes down both walls, connected across the floor by rays of light. There are four glowing tiles on the other side of the room.' },
    {
      t: 'choice', text: 'The rays hum. The floor between here and there is entirely covered by them.',
      options: [
        {
          text: 'Go across acrobatically. (DC 15)', then: [
            {
              t: 'check', skill: 'acrobatics', dc: 15, label: 'Acrobatics — cross the rays',
              ok: [{ t: 'narr', text: 'You go over, under and through without touching one, and land on a glowing tile like you meant to.' }, { t: 'flag', k: 'runes_crossed' }],
              fail: [{ t: 'run', id: 'mine_runes_touch' }]
            }
          ]
        },
        {
          text: 'Just walk through and take it.', then: [
            { t: 'run', id: 'mine_runes_touch' }
          ]
        },
        {
          text: 'Study the runes first. (Arcana)', then: [
            {
              t: 'check', skill: 'arcana', dc: 14, by: 'party', label: 'Arcana — the runes',
              ok: [{ t: 'narr', text: 'The rays are a size ward — they compress whatever crosses them. Knowing that, you can time your crossing to the pulse between them.' }, { t: 'flag', k: 'runes_crossed' }, { t: 'toast', text: 'You cross without shrinking.', kind: 'good', ms: 3000 }],
              fail: [{ t: 'narr', text: 'Lights on a wall. Very pretty. No idea.' }]
            }
          ]
        }
      ]
    },
    {
      t: 'if', flag: 'runes_crossed',
      then: [],
      else: [{ t: 'run', id: 'mine_runes_touch' }]
    }
  ],
  mine_runes_touch: [
    { t: 'narr', text: 'As you touch the ray, you feel a scrunching in your skin.' },
    { t: 'narr', text: 'Make two DC 17 Constitution saving throws.' },
    { t: 'partySave', ability: 'con', dc: 17, cond: 'reduced', dur: 600, who: 'First DC 17 Constitution Save' },
    { t: 'partySave', ability: 'con', dc: 17, cond: 'reduced', dur: 600, who: 'Second DC 17 Constitution Save' },
    { t: 'narr', text: 'Those of you who failed are now considerably smaller than you were, and standing in your own clothes like children in a costume box.' },
    { t: 'flag', k: 'someone_shrank' },
    { t: 'flag', k: 'runes_crossed' }
  ],

  mine_lava_intro: [
    { t: 'ambience', id: 'fire' },
    { t: 'narr', text: 'Right as you enter the next room, you instantly feel very hot. You see a river of lava five feet wide, and a door on the other side.' },
    {
      t: 'choice', text: 'Five feet. That is one good step, or one bad one.',
      options: [
        {
          text: 'Jump it.', then: [
            {
              t: 'check', skill: 'athletics', dc: 10, by: 'party', label: 'Athletics — clear five feet of lava',
              ok: [{ t: 'narr', text: 'Everyone gets across. The small ones get thrown, and are dignified about it afterwards.' }, { t: 'flag', k: 'lava_crossed' }],
              fail: [
                { t: 'narr', text: 'Somebody\'s trailing boot goes in.' },
                { t: 'partySave', ability: 'dex', dc: 12, dmg: '2d10', type: 'fire', half: true, who: 'DC 12 Dexterity Saves' },
                { t: 'flag', k: 'lava_crossed' }
              ]
            }
          ]
        },
        {
          text: 'Bridge it with something.', then: [
            { t: 'narr', text: 'Between a door off its hinges upstream, two spear shafts and a great deal of rope, you build something that only slightly catches fire.' },
            { t: 'flag', k: 'lava_crossed' },
            { t: 'xp', n: 100 }
          ]
        }
      ]
    },
    {
      t: 'if', flag: 'someone_shrank',
      then: [{ t: 'narr', text: 'As you enter the next room, the ones who shrank return to your normal size, all at once, which knocks two of you over.' }, { t: 'do', fn: (s) => s.party.forEach(c => DH.char.removeCondition(c, 'reduced')) }]
    }
  ],

  mine_gas_room: [
    { t: 'narr', text: 'An envelope falls to each one of you.' },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'A Voice From a Speaker', text: '"You must get to the next room, or die. A poisonous gas will fill the room in some time. Tamper as much as you please — especially you, imposter."' },
    { t: 'narr', text: 'In the middle of the room is a pedestal with a ten-sided die sitting on it.' },
    { t: 'minigame', game: 'gas_room' }
  ],
  pedestal_examine: [
    {
      t: 'if', flag: 'gas_escaped',
      then: [{ t: 'narr', text: 'A stone pedestal with a ten-sided die on it, and nothing else, forever.' }],
      else: [{ t: 'run', id: 'mine_gas_room' }]
    }
  ],

  mine_knock_door: [
    { t: 'narr', text: 'In this room is an unlocked door.' },
    {
      t: 'choice', text: 'It is not even properly closed.',
      options: [
        {
          text: 'Open it and walk through.', then: [
            { t: 'sfx', id: 'door' },
            { t: 'narr', text: 'A large hand — very large, and coming out of nowhere in particular — picks you up and places you back behind the door.' },
            { t: 'narr', text: 'The door is unlocked again.' },
            {
              t: 'choice', text: '',
              options: [
                { text: 'Knock.', then: [{ t: 'run', id: 'mine_knock_yes' }] },
                { text: 'Try again, faster.', then: [{ t: 'narr', text: 'The hand is faster. You are put back with what can only be described as patience.' }, { t: 'run', id: 'mine_knock_yes' }] }
              ]
            }
          ]
        },
        { text: 'Knock first.', then: [{ t: 'run', id: 'mine_knock_yes' }] }
      ]
    }
  ],
  mine_knock_yes: [
    { t: 'sfx', id: 'confirm' },
    { t: 'narr', text: 'You knock. Nothing answers. The door swings wide, and this time you can walk through it.' },
    { t: 'flag', k: 'knocked' },
    { t: 'xp', n: 100 }
  ],

  mine_wight_fight: [
    { t: 'music', id: 'boss' },
    { t: 'narr', text: 'In the next room you see a hulking construct and a pale undead.' },
    { t: 'narr', text: 'Someone roll Arcana and Perception, with advantage.' },
    {
      t: 'check', skill: 'arcana', dc: 14, by: 'party', adv: true, label: 'Arcana (advantage) — the pale one',
      ok: [
        { t: 'narr', text: 'It is a Wight. Not a zombie, not a ghoul — a Wight, which means it drains the life out of what it touches and it will not stay down if something is feeding it.' },
        { t: 'flag', k: 'knows_wight' }
      ],
      fail: [{ t: 'narr', text: 'Undead. Pale. Wearing a crown. That is as far as you get.' }]
    },
    {
      t: 'check', skill: 'perception', dc: 15, by: 'party', adv: true, label: 'Perception (advantage) — look closer',
      ok: [
        { t: 'narr', text: 'There is an amulet at its throat under the collar. Every scrap of maximum hit points it drains is being poured back into it through that amulet.' },
        { t: 'flag', k: 'knows_amulet' },
        { t: 'toast', text: 'Break the amulet or it keeps everything it takes.', kind: 'bad', ms: 4000 }
      ],
      fail: [{ t: 'narr', text: 'A crown on its head. Nothing else you can make out from here.' }]
    },
    { t: 'narr', text: 'Roll initiative.' },
    {
      t: 'combat', arena: 'mine_room', enemies: ['wight', 'hulking_construct'],
      set: 'wight_beaten',
      onWin: [
        { t: 'narr', text: 'The construct comes apart at the shoulder and stops. The Wight goes down last, and its crown rolls across the flagstones and rings like a struck bell.' },
        { t: 'narr', text: 'All the maximum hit points it took come back the moment the amulet cracks.' },
        { t: 'do', fn: (s) => s.party.forEach(c => { DH.char.derive(c); }) },
        { t: 'give', item: 'crown_of_the_wight' },
        { t: 'narr', text: 'You see the Wight had a crown on his head. It gives you +1d4 necrotic damage on all attacks. The crown also lets you speak with and briefly revive the dead, and command a weak undead.' },
        { t: 'xp', n: 500 },
        { t: 'flag', k: 'wight_beaten' }
      ]
    }
  ],

  mine_lab_meet: [
    { t: 'music', id: 'mine' },
    { t: 'narr', text: 'In this room you see a gnome petting a baby dragon.' },
    { t: 'say', who: 'The Gnome', text: '"Yes! Finally, I\'ve made it — the cure to the dragon craziness!"' },
    { t: 'narr', text: 'He turns around and jumps when he sees you.' },
    { t: 'say', who: 'Grimble', text: '"Wow, you— you\'ve passed my trials. No one has ever passed my trials. You all must be really tough."' },
    { t: 'say', who: 'Grimble', text: '"Uh— um. You must have a reward for this."' },
    { t: 'narr', text: 'He walks over to a chest and starts to dig.' },
    { t: 'sfx', id: 'quest' },
    { t: 'narr', text: 'He pulls out a pair of arm guards, a quiver, a cloak, and a watch, and hands them to you.' },
    { t: 'give', item: 'grimey_armguards' },
    { t: 'give', item: 'endless_quiver' },
    { t: 'give', item: 'cloak_of_the_quiet' },
    { t: 'give', item: 'tinkers_watch' },
    { t: 'say', who: 'Grimble', text: '"I hope you enjoy. Ah — I must tell you about this. I made a potion to make dragons not, well, crazy." *He peers up at you and frowns.* "Wait. Something spoke through you on that dock and you are standing here perfectly polite. How?"' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: '"We fed him a green potion the higher-ups sent."', then: [
            { t: 'say', who: 'Grimble', text: '"Oh. Oh, wow, very smart!" *He writes something on his own wrist.*' }
          ]
        },
        {
          text: '"Something ancient and golden is speaking through him."', then: [
            { t: 'say', who: 'Grimble', text: '*He stops writing.* "…Golden. You are certain about golden." *He does not explain why that matters, and he does not look happy.*' },
            { t: 'flag', k: 'grimble_golden' }
          ]
        }
      ]
    },
    { t: 'wait', ms: 300 },
    { t: 'say', who: 'Grimble', text: '"Have you, by any chance, seen a gnome by the name of Grimey? I— I haven\'t seen him in years."' },
    { t: 'say', who: 'Grimble', text: '"When we were only seven he had this crazy thought that he wanted to be a magical wizard. He started to buy soil and fertiliser and keep it in his room. Then suddenly he ran away."' },
    { t: 'say', who: 'Grimble', text: '"Oh, the sadness."' },
    {
      t: 'choice', text: 'He has stopped moving entirely.',
      options: [
        { text: '"We will keep an eye out for him."', then: [{ t: 'say', who: 'Grimble', text: '"Would you? Would you really?" *He shakes your hand with both of his.*' }, { t: 'quest', id: 'grimey', title: 'Find Grimey', desc: 'Grimble has not seen his childhood friend Grimey in years. Grimey wanted to be a magical wizard and started stockpiling soil.' }, { t: 'do', fn: () => DH.game.addAffinity('grimble', 4, 'Grimble') }] },
        { text: '"Soil and fertiliser?"', then: [{ t: 'say', who: 'Grimble', text: '"Bags of it. Under his bed. He said it was the first step." *A shrug that has been rehearsed for thirty years.* "Nobody ever asked what the second step was."' }, { t: 'quest', id: 'grimey', title: 'Find Grimey', desc: 'Grimble has not seen his childhood friend Grimey in years. Grimey wanted to be a magical wizard and started stockpiling soil.' }] }
      ]
    },
    { t: 'say', who: 'Grimble', text: '"Oh yes — the potion. I made this potion that lets the little dragons be calm. Ay, if you want to take one, feel free. But if you want more, it\'ll come with a price. Same with the potions, I\'ll let you buy them."' },
    { t: 'give', item: 'potion_calm_dragon' },
    { t: 'narr', text: 'He hands you a map. "Don\'t want you to get lost, now, do you?"' },
    { t: 'give', item: 'grimey_map' },
    { t: 'flag', k: 'mine_done' },
    { t: 'flag', k: 'clearing_known' },
    { t: 'flag', k: 'baycrest_known' },
    { t: 'questDone', id: 'mine', xp: 400 },
    { t: 'run', id: 'grimble_swamp_offer' }
  ],
  npc_grimble: [
    {
      t: 'choice', text: 'Grimble, surrounded by glassware and one extremely calm baby dragon.',
      options: [
        { text: 'Buy potions.', then: [{ t: 'shop', id: 'gnome_lab' }] },
        { text: '"Tell me about the trials."', then: [{ t: 'say', who: 'Grimble', text: '"They are meant to be *possible*." *He sounds hurt.* "The gas room is possible. There is a screw. There is always a screw."' }] },
        { text: 'The dragon in the swamp.', need: { noFlag: 'swamp_done' }, then: [{ t: 'run', id: 'grimble_swamp_offer' }] },
        { text: '"Have you found Grimey?"', need: { flag: 'grimey' }, then: [{ t: 'say', who: 'Grimble', text: '"No." *He goes back to his bench.* "But thank you for asking. Nobody asks."' }] },
        { text: 'Nothing.', then: [] }
      ]
    }
  ],
  npc_lab_dragon: [
    { t: 'narr', text: 'A copper wyrmling, no bigger than a cargo net, lying on a warm rock with its chin on its own foot. It is not screaming about eggs. It is the first dragon on this island that is not.' }
  ],

  /* ==========================================================================
     ACT SIX — the dragon infestation
     ========================================================================== */
  grimble_swamp_offer: [
    { t: 'if', flag: 'swamp_done', then: [{ t: 'say', who: 'Grimble', text: '"You cleared the swamp. I have been to my own front door twice since. Twice!"' }, { t: 'stop' }] },
    { t: 'say', who: 'Grimble', text: '"Do you want to deal with the dragon near my home? I can\'t even get to my house."' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: '"Show us."', then: [
            { t: 'flag', k: 'swamp_known' },
            { t: 'quest', id: 'swamp', title: 'Dragon Infestation', desc: 'A black dragon is digging in the swamp behind Grimble\'s house, looking for something. Fair warning: it spits acid.' },
            { t: 'say', who: 'Grimble', text: '"This one is really mad. One time it said \'WHERE ARE MY EGGS?\' and its eyes glowed. And fair warning: he spits acid."' },
            { t: 'toast', text: 'The swamp road is open from the cave mouth.', kind: 'item', ms: 3200 }
          ]
        },
        { text: '"Later."', then: [{ t: 'say', who: 'Grimble', text: '"Yes. Yes, of course. It is only my house."' }] }
      ]
    }
  ],

  act6_black_dragon: [
    { t: 'music', id: 'swamp' },
    { t: 'narr', text: 'The swamp is thick. Your movement is slowed by five feet, and if you stand still for a turn you must make a DC 11 Strength or Dexterity save to avoid getting stuck when you next try to move.' },
    { t: 'narr', text: 'The murk cuts your sight to fifty feet and puts disadvantage on Perception.' },
    { t: 'wait', ms: 400 },
    { t: 'narr', text: 'Through it, you see a black dragon digging in the mud, snout down, both forelegs working. It is searching for something and it is not finding it.' },
    {
      t: 'check', skill: 'nature', dc: 14, by: 'party', label: 'Nature or Perception — study the dragon',
      ok: [
        { t: 'narr', text: 'The hind left leg is badly hurt — torn along the hamstring and not healing. Attacks aimed there will do an extra 1d8.' },
        { t: 'flag', k: 'knows_weak_leg' },
        { t: 'toast', text: 'Aim for the wounded hind leg: +1d8.', kind: 'good', ms: 4000 }
      ],
      fail: [{ t: 'narr', text: 'Mud, murk, and something very large moving in it.' }]
    },
    {
      t: 'choice', text: 'How would you like to do this?',
      options: [
        { text: 'Attack from the treeline, at range.', then: [{ t: 'narr', text: 'You spread along the firmer ground at the edge and open up.' }] },
        {
          text: 'Try to talk to it.', then: [
            {
              t: 'check', skill: 'persuasion', dc: 18, label: 'Persuasion — reason with a mad dragon',
              ok: [{ t: 'narr', text: 'It stops. For four whole seconds it is a thinking thing looking at another thinking thing. Then whatever is riding it takes the wheel again — but it has cost the dragon something.' }, { t: 'toast', text: 'It starts the fight rattled.', kind: 'good', ms: 3000 }],
              fail: [{ t: 'narr', text: 'It lifts its head, and the sound it makes has words underneath it, and none of them are for you.' }]
            }
          ]
        },
        { text: 'Charge it.', then: [{ t: 'narr', text: 'You go in through the mud, which is exactly as bad an idea as it sounds and exactly as fast as it needs to be.' }] }
      ]
    },
    { t: 'narr', text: 'You see as the dragon limps toward you.' },
    { t: 'banner', big: 'BLACK DRAGON', small: 'the swamp · acid · a bad leg', ms: 1800 },
    {
      t: 'combat', arena: 'swamp_fight', enemies: ['black_dragon'],
      set: 'black_dragon_beaten',
      onWin: [
        { t: 'narr', text: 'It goes down in the mud it was digging, and the gold light goes out of its eyes.' },
        { t: 'give', item: 'dragon_scale', qty: 3 },
        { t: 'xp', n: 700 },
        { t: 'flag', k: 'black_dragon_beaten' },
        { t: 'run', id: 'act6_green_dragon' }
      ],
      onLose: [
        { t: 'narr', text: 'It drives you back to the treeline and returns to digging, which is somehow more frightening than being chased.' }
      ]
    }
  ],

  act6_green_dragon: [
    { t: 'wait', ms: 500 },
    { t: 'sfx', id: 'roar' },
    { t: 'narr', text: 'You see an adult green dragon fly overhead and drop something.' },
    { t: 'narr', text: 'It looks like an odd large rock — but when it hits the ground you can see it is an egg. Not an ordinary rock. About five feet tall, golden, and glowing.' },
    { t: 'particles', kind: 'gold', n: 40 },
    { t: 'wait', ms: 400 },
    {
      t: 'choice', text: 'The green dragon is already coming down after it.',
      options: [
        {
          text: 'Get to the egg first.', then: [
            {
              t: 'check', skill: 'athletics', dc: 16, label: 'Athletics — reach the egg through the mud',
              ok: [
                { t: 'narr', text: 'You get a hand on it. It is warm, and it hums, and a piece of shell the size of your palm comes away in your fingers as the dragon\'s foot closes over the rest.' },
                { t: 'give', item: 'golden_egg_shard' }
              ],
              fail: [{ t: 'narr', text: 'The mud takes your leg to the knee and the dragon is simply faster.' }]
            }
          ]
        },
        {
          text: 'Stand still and watch.', then: [
            { t: 'narr', text: 'You do the sensible thing, which is nothing at all.' }
          ]
        },
        {
          text: 'Attack it.', then: [
            { t: 'narr', text: 'You put everything you have into an adult green dragon and it does not look up.' },
            { t: 'partySave', ability: 'dex', dc: 16, dmg: '4d6', type: 'bludgeoning', half: true, who: 'It swats you aside — DC 16 Dexterity' }
          ]
        }
      ]
    },
    { t: 'narr', text: 'It lands directly on the egg and grabs it with its feet. It snarls at you — and you all hear a voice inside your head.' },
    { t: 'say', who: 'Inside Your Head', text: '"MINE."' },
    { t: 'sfx', id: 'roar' },
    { t: 'narr', text: 'Then it starts to fly off, and it is gone before anybody finishes deciding what to do.' },
    { t: 'flag', k: 'green_dragon_took_egg' },
    { t: 'wait', ms: 400 },
    { t: 'say', who: 'Grimble', text: '"Well that was odd." *He is standing behind you holding a kettle, having come out to see if the noise was over.* "Oh yeah — your reward!"' },
    { t: 'gold', n: 1350 },
    { t: 'give', item: 'healing_ointment' },
    { t: 'give', item: 'odd_red_hat' },
    { t: 'narr', text: 'One thousand three hundred and fifty gold, a jar of healing ointment, and an odd red hat.' },
    { t: 'flag', k: 'swamp_done' },
    { t: 'questDone', id: 'swamp', xp: 400 },
    { t: 'quest', id: 'golden_egg', title: 'The Golden Egg', desc: 'A green dragon dropped a five-foot golden egg in the swamp and then reclaimed it. MINE, it said, inside your heads. There is at least one more of these on this island.' }
  ],

  /* ==========================================================================
     ACT SEVEN — the arena
     ========================================================================== */
  npc_arena_master: [
    { t: 'say', who: 'The Arena Master', text: '"Four rounds. Sand is free, healing is not, and the crowd does not care about either." *He looks you over the way you would look over a horse.*' },
    { t: 'minigame', game: 'arena_signup' },
    { t: 'run', id: 'arena_dispatch' }
  ],
  arena_dispatch: [
    { t: 'do', fn: (s) => { s.counters._arenaPick = 0; } },
    {
      t: 'choice', text: 'Which round are you entering?',
      options: [
        { text: 'Round one — the crazed silver dragon, until ten are left standing.', run: 'arena_round1' },
        { text: 'Round two — hold an egg when the time runs out.', need: { test: (s) => (s.counters.arena_round || 0) >= 1 }, lockNote: 'clear round one first', run: 'arena_round2' },
        { text: 'Round three — two three-way fights.', need: { test: (s) => (s.counters.arena_round || 0) >= 2 }, lockNote: 'clear round two first', run: 'arena_round3' },
        { text: 'Round four — one against one.', need: { test: (s) => (s.counters.arena_round || 0) >= 3 }, lockNote: 'clear round three first', run: 'arena_round4' },
        { text: 'Leave the sand.', then: [] }
      ]
    }
  ],
  arena_round1: [
    { t: 'music', id: 'boss' },
    { t: 'narr', text: 'They open a gate at the far end and a crazed silver dragon comes out of it sideways, already eating.' },
    { t: 'narr', text: 'The round ends when ten fighters are left standing in the sand — which means you do not have to kill it. You have to outlast the crowd.' },
    { t: 'banner', big: 'ROUND ONE', small: 'crazed silver dragon', ms: 1800 },
    {
      t: 'combat', arena: 'arena_sand', enemies: ['crazed_silver_dragon'], allies: ['gladiator', 'arena_brawler', 'arena_brawler'],
      onWin: [
        { t: 'narr', text: 'The dragon goes down under a great many people at once, and about ten of you are still upright when the horn goes.' },
        { t: 'count', k: 'arena_round' },
        { t: 'gold', n: 300 },
        { t: 'xp', n: 600 },
        { t: 'run', id: 'arena_dispatch' }
      ]
    }
  ],
  arena_round2: [
    { t: 'narr', text: 'Round two: an egg is put on a plinth in the middle of the sand, and six fighters are let in with you. Hold the egg when the timer runs out.' },
    { t: 'narr', text: 'To take an egg from another fighter you must beat them: your Sleight of Hand against their Strength save.' },
    { t: 'banner', big: 'ROUND TWO', small: 'hold the egg', ms: 1600 },
    {
      t: 'choice', text: 'The horn goes.',
      options: [
        {
          text: 'Go straight for the egg.', then: [
            {
              t: 'check', skill: 'athletics', dc: 13, label: 'Athletics — get there first',
              ok: [{ t: 'narr', text: 'You have it in both arms before the nearest gladiator has finished standing up.' }, { t: 'flag', k: 'has_arena_egg' }],
              fail: [{ t: 'narr', text: 'A brawler gets there first and turns to face the sand with the egg against his chest.' }]
            }
          ]
        },
        {
          text: 'Let somebody else take it, then take it from them.', then: [
            { t: 'narr', text: 'You wait. A gladiator wins the scramble, and now there is exactly one target in the arena and everyone knows where it is.' },
            {
              t: 'check', skill: 'sleight_of_hand', dc: 14, label: 'Sleight of Hand — lift the egg',
              ok: [{ t: 'narr', text: 'You take it out from under his arm and he fights three other people for four seconds before he notices.' }, { t: 'flag', k: 'has_arena_egg' }],
              fail: [{ t: 'narr', text: 'He feels your hand and swings for you.' }]
            }
          ]
        }
      ]
    },
    {
      t: 'combat', arena: 'arena_sand', enemies: ['gladiator', 'arena_brawler', 'arena_mage'],
      onWin: [
        { t: 'narr', text: 'The horn goes with you holding an egg and most of your blood.' },
        { t: 'count', k: 'arena_round' },
        { t: 'gold', n: 400 },
        { t: 'xp', n: 500 },
        { t: 'run', id: 'arena_dispatch' }
      ]
    }
  ],
  arena_round3: [
    { t: 'narr', text: 'Round three: two three-way fights, run at once, on opposite halves of the sand. Whoever is left when both halves are settled goes through.' },
    { t: 'banner', big: 'ROUND THREE', small: 'two three-way fights', ms: 1600 },
    {
      t: 'combat', arena: 'arena_sand', enemies: ['gladiator', 'gladiator', 'arena_mage', 'arena_brawler'],
      onWin: [
        { t: 'count', k: 'arena_round' },
        { t: 'gold', n: 500 },
        { t: 'xp', n: 700 },
        { t: 'narr', text: 'Two left standing. The crowd is entirely on your side now, which is worth precisely nothing.' },
        { t: 'run', id: 'arena_dispatch' }
      ]
    }
  ],
  arena_round4: [
    { t: 'narr', text: 'Round four: one against one, until one person is left in the fight.' },
    { t: 'narr', text: 'Across the sand from you is the arena\'s own champion, and he is not crazed, or possessed, or looking for eggs. He is simply better than everyone here and would like to keep the title.' },
    { t: 'banner', big: 'ROUND FOUR', small: 'one against one', ms: 1700 },
    {
      t: 'combat', arena: 'arena_sand', enemies: [{ id: 'gladiator', name: 'The Champion of Drakehaven', hp: 110 }],
      onWin: [
        { t: 'music', id: 'victory', restart: true },
        { t: 'narr', text: 'He goes down on one knee, then all the way, and the noise from the stands is physical.' },
        { t: 'count', k: 'arena_round' },
        { t: 'gold', n: 1200 },
        { t: 'give', item: 'gem_large' },
        { t: 'xp', n: 900 },
        { t: 'flag', k: 'arena_champion' },
        { t: 'say', who: 'The Arena Master', text: '"Hobbs lost here, you know. Years back." *He hands you the purse.* "You did not. Tell him."' },
        { t: 'quest', id: 'arena_done', title: 'Champion of the Arena', desc: 'You cleared all four rounds. The captain of the Mary Parker was thrown off this island for losing in this building.' },
        { t: 'questDone', id: 'arena_done', xp: 200 }
      ]
    }
  ],

  /* ==========================================================================
     ACT EIGHT AND NINE — Baycrest and the clearing
     ========================================================================== */
  act9_clearing: [
    { t: 'music', id: 'vision' },
    { t: 'narr', text: 'There is a clearing in the forest up ahead.' },
    {
      t: 'check', skill: 'perception', dc: 17, by: 'party', label: 'Perception — behind the bushes',
      ok: [
        { t: 'narr', text: 'Behind some bushes you see a large copper dragon and its baby. And with them, a young blue dragon, which does not belong to either of them.' },
        { t: 'flag', k: 'clearing_seen' }
      ],
      fail: [
        { t: 'narr', text: 'A clearing. Birds. Then the birds stop, all at once, and something very large shifts its weight behind the bushes.' },
        { t: 'flag', k: 'clearing_seen' }
      ]
    },
    {
      t: 'check', skill: 'arcana', dc: 14, by: 'party', label: 'Arcana or History — copper dragons',
      ok: [
        { t: 'narr', text: 'The details click into place: copper dragons are very friendly dragons, and can easily befriend and care for dragons that may not be their own.' },
        { t: 'flag', k: 'knows_copper' }
      ],
      fail: [{ t: 'narr', text: 'Copper. Large. Not currently trying to kill you, which puts it in a minority on this island.' }]
    },
    { t: 'do', fn: () => DH.scenes.overworld.loadMap(DH.game.state.map, null) },
    { t: 'narr', text: 'In the clearing you also see a small owlbear, doing its best to look large.' },
    { t: 'narr', text: 'The adult copper dragon, as far as you can tell, is trying to find a parent for the blue dragon.' },
    { t: 'flag', k: 'clearing_done' },
    { t: 'quest', id: 'clearing', title: 'The Orphan in the Clearing', desc: 'A copper dragon is trying to find a parent for a young blue dragon that is not hers. There is also a small owlbear.' }
  ],
  npc_copper: [
    { t: 'say', who: 'The Copper Dragon', text: '*She speaks without opening her mouth, and politely, which is somehow worse.* "You are the ones from the boat. You smell of the swamp and of my cousin\'s blood."' },
    {
      t: 'choice', text: 'She has not moved and does not appear to intend to.',
      options: [
        {
          text: '"That one is not yours. Whose is it?"', then: [
            { t: 'say', who: 'The Copper Dragon', text: '"Nobody\'s. Its mother went east and came back wrong and then did not come back. It follows me because I am warm." *A pause.* "I have one already."' },
            { t: 'flag', k: 'blue_story' }
          ]
        },
        {
          text: '"We could take the blue one somewhere safe."', need: { flag: 'mine_done' }, lockNote: 'you have nowhere to take it',
          then: [
            { t: 'say', who: 'The Copper Dragon', text: '"The gnome in the hill. With the glass and the calm." *Her head tilts.* "Yes. Take it there. Tell it I said it could go."' },
            { t: 'flag', k: 'blue_rehomed' },
            { t: 'questDone', id: 'clearing', xp: 400 },
            { t: 'gold', n: 200 },
            { t: 'give', item: 'dragon_scale', qty: 2 },
            { t: 'narr', text: 'She gives you two scales off her own shoulder, which she does not appear to enjoy, and which is the largest thanks available from a dragon.' }
          ]
        },
        { text: '"Have you heard a golden voice asking about eggs?"', then: [{ t: 'say', who: 'The Copper Dragon', text: '"All of us have heard it." *Her eyes close.* "It is not asking us. It is asking through us. There is a difference and none of you understand it yet."' }] }
      ]
    }
  ],
  npc_copper_baby: [{ t: 'narr', text: 'A copper wyrmling asleep against its mother\'s foreleg with one wing over its own face.' }],
  npc_blue_orphan: [
    {
      t: 'if', flag: 'blue_rehomed',
      then: [{ t: 'narr', text: 'The young blue watches you with its chin on the grass. It will follow you when you go.' }],
      else: [{ t: 'narr', text: 'The young blue dragon keeps a careful distance from you and a careful closeness to the copper. It has nobody, and it knows it.' }]
    }
  ],
  npc_owlbear: [
    { t: 'narr', text: 'A small owlbear, in the middle of the clearing, standing up as tall as it can go.' },
    {
      t: 'choice', text: 'It is making a noise it clearly believes is terrifying.',
      options: [
        {
          text: 'Try to calm it. (Animal Handling)', then: [
            {
              t: 'check', skill: 'animal_handling', dc: 13, label: 'Animal Handling — the small owlbear',
              ok: [{ t: 'narr', text: 'It sits down. Then it lies down. Then it rolls over, which for an owlbear is a diplomatic surrender.' }, { t: 'xp', n: 100 }],
              fail: [{ t: 'narr', text: 'It bites your bag, takes your rations, and leaves at speed with its prize.' }, { t: 'take', item: 'rations', qty: 1 }]
            }
          ]
        },
        { text: 'Fight it.', then: [{ t: 'combat', arena: 'clearing_fight', enemies: ['owlbear_small'], onWin: [{ t: 'narr', text: 'It runs off into the trees, entirely alive and deeply insulted.' }, { t: 'xp', n: 150 }] }] },
        { text: 'Leave it alone.', then: [{ t: 'narr', text: 'You walk round it. It watches you the whole way, and considers that a victory.' }] }
      ]
    }
  ],

  npc_baycrest_local: [
    { t: 'say', who: 'A Baycrest Local', text: '"Observation tower\'s open, museum\'s open, and there\'s a cave up the hill nobody goes in. And there\'s a ball at the manor, which is not for the likes of us."' },
    { t: 'flag', k: 'ball_known' }
  ],
  npc_ball_herald: [
    { t: 'say', who: 'A Herald in Gold', text: '"The Grand Ball. Invitation only. No dragons — and I do mean none, we have had incidents."' },
    {
      t: 'choice', text: 'He looks at your boots and makes a decision about you.',
      options: [
        {
          text: 'Ask for an invitation.', need: { noFlag: 'has_invitation' },
          then: [
            {
              t: 'check', skill: 'persuasion', dc: 14, label: 'Persuasion — talk your way onto the list',
              ok: [
                { t: 'narr', text: 'He writes your name down, which he clearly did not expect to do this morning.' },
                { t: 'give', item: 'ball_invitation' }, { t: 'flag', k: 'has_invitation' }
              ],
              fail: [
                { t: 'say', who: 'A Herald in Gold', text: '"No."' },
                {
                  t: 'choice', text: '', options: [
                    {
                      text: 'Offer him money. (200 gp)', need: { gold: 200 }, then: [
                        { t: 'do', fn: () => DH.game.spendGold(200) },
                        { t: 'narr', text: 'The invitation appears from inside his coat, already filled in, which suggests this happens rather a lot.' },
                        { t: 'give', item: 'ball_invitation' }, { t: 'flag', k: 'has_invitation' }
                      ]
                    },
                    { text: 'Leave it.', then: [] }
                  ]
                }
              ]
            }
          ]
        },
        { text: 'Show him the invitation you already have.', need: { flag: 'has_invitation' }, then: [{ t: 'say', who: 'A Herald in Gold', text: '"…So you do. Enjoy your evening." *He is visibly annoyed about it.*' }] },
        { text: 'Walk away.', then: [] }
      ]
    },
    { t: 'if', flag: 'has_invitation', then: [{ t: 'toast', text: 'The manor is on the map now.', kind: 'item', ms: 3000 }, { t: 'flag', k: 'manor_known' }] }
  ],
  npc_astronomer: [
    { t: 'say', who: 'The Watcher', text: '"I count them going out and I count them coming back." *She does not look away from the glass.* "Eleven went east over the water last month. Two came back. Both of them wrong."' },
    { t: 'flag', k: 'watcher_lore' },
    {
      t: 'choice', text: '',
      options: [
        { text: '"East to what?"', then: [{ t: 'say', who: 'The Watcher', text: '"Nothing. That is the problem. There is nothing east of here for two hundred miles, and something out there has all their eggs."' }, { t: 'xp', n: 100 }] },
        { text: 'Look through the glass.', then: [{ t: 'narr', text: 'The sea, and the curve of the world, and — for a moment, at the very edge — something with wings, going the wrong way.' }] }
      ]
    }
  ],
  npc_curator: [
    { t: 'say', who: 'The Curator', text: '"Two rooms, four exhibits, one of which is a rock. Take your time."' },
    {
      t: 'choice', text: '',
      options: [
        {
          text: 'Examine the exhibits.', then: [
            {
              t: 'check', skill: 'history', dc: 12, label: 'History — the museum\'s collection',
              ok: [
                { t: 'narr', text: 'The rock is not a rock. It is a fragment of shell, five inches thick, golden, and catalogued as "found in the eastern shallows, 40 years ago". There were, the label says, nine of them.' },
                { t: 'flag', k: 'museum_shell' },
                { t: 'xp', n: 150 },
                { t: 'quest', id: 'nine_eggs', title: 'Nine of Them', desc: 'The Baycrest museum holds a fragment of golden shell found in the eastern shallows forty years ago. The label says there were nine.' }
              ],
              fail: [{ t: 'narr', text: 'A sword, two coins, a bad painting of a harbour, and a rock.' }]
            }
          ]
        },
        { text: 'Ask about the rock.', then: [{ t: 'say', who: 'The Curator', text: '"Shell. Golden. Somebody dredged it up before I was born and nobody has ever come to claim it." *She shrugs.* "Lately I have started locking the door at night."' }, { t: 'flag', k: 'museum_shell' }] }
      ]
    }
  ],
  npc_baycrest_host: [
    { t: 'say', who: 'A Nervous Host', text: '"You are not from the manor, are you? Good. Good." *He does not explain.* "Sit down, there is soup."' },
    { t: 'give', item: 'bread' },
    { t: 'do', fn: () => DH.game.addAffinity('baycrest_host', 2, 'the host') }
  ],
  baycrest_cave_encounter: [
    { t: 'music', id: 'mine' },
    { t: 'narr', text: 'The cave above Baycrest goes back further than it looks, and something has been living in it.' },
    {
      t: 'combat', arena: 'cave_fight', enemies: ['skeleton', 'skeleton', 'zombie'],
      onWin: [
        { t: 'narr', text: 'Three of them, and all three wearing the remains of Baycrest fishing gear.' },
        { t: 'gold', n: 120 },
        { t: 'give', item: 'gem_small', qty: 2 },
        { t: 'xp', n: 200 }
      ]
    }
  ],

  /* ==========================================================================
     ACT TEN — the ball
     ========================================================================== */
  npc_door_elf: [
    { t: 'music', id: 'ball' },
    { t: 'narr', text: 'You enter a lobby and a tall elf woman asks for your invitation. Then she says that you may not bring in dragons, and that they will have to stay outside.' },
    {
      t: 'check', skill: 'insight', dc: 10, label: 'Insight — the woman on the door',
      ok: [
        { t: 'narr', text: 'You immediately tell, from her speech and her manner, that she is not scared of the dragons in the slightest. She is saying it the way one says a rule about umbrellas.' },
        { t: 'flag', k: 'elf_unafraid' }
      ],
      fail: [{ t: 'narr', text: 'You do not notice anything in particular about her.' }]
    },
    {
      t: 'choice', text: 'She waits, with the patience of someone who has thrown out better dressed people than you.',
      options: [
        {
          text: 'Present the invitation.', need: { item: 'ball_invitation' }, lockNote: 'you have no invitation',
          then: [
            { t: 'narr', text: 'She reads it twice, looks at your shoes, and steps aside.' },
            { t: 'flag', k: 'ball_admitted' },
            { t: 'toast', text: 'The ballroom is open.', ms: 2600 }
          ]
        },
        {
          text: '"You are not frightened of them at all, are you?"', need: { flag: 'elf_unafraid' },
          then: [
            { t: 'say', who: 'The Tall Elf Woman', text: '*The smallest possible pause.* "No." *Then, brightly:* "Do you have an invitation?"' },
            { t: 'flag', k: 'elf_questioned' },
            { t: 'run', id: 'npc_door_elf_retry' }
          ]
        },
        {
          text: 'Talk your way in.', then: [
            {
              t: 'check', skill: 'deception', dc: 16, label: 'Deception — bluff the door',
              ok: [{ t: 'narr', text: 'She does not believe a word of it and lets you in anyway, which is a different and more frightening outcome.' }, { t: 'flag', k: 'ball_admitted' }],
              fail: [{ t: 'say', who: 'The Tall Elf Woman', text: '"No. And if you mess up like that again, you will be leaving."' }]
            }
          ]
        },
        { text: 'Step back outside.', then: [] }
      ]
    }
  ],
  npc_door_elf_retry: [
    {
      t: 'choice', text: '',
      options: [
        { text: 'Present the invitation.', need: { item: 'ball_invitation' }, lockNote: 'you have no invitation', then: [{ t: 'flag', k: 'ball_admitted' }, { t: 'narr', text: 'She steps aside.' }] },
        { text: 'Leave it for now.', then: [] }
      ]
    }
  ],

  act10_ball: [
    { t: 'music', id: 'ball' },
    { t: 'chapter', label: 'ACT TEN', title: 'The Grand Ball', sub: 'Baycrest Manor', ms: 2600 },
    { t: 'narr', text: 'Many people are here. Some dancing, some eating, and they all seem very important.' },
    { t: 'narr', text: 'There is a podium on a stage, and on top of it sits a large golden egg.' },
    {
      t: 'check', skill: 'perception', dc: 12, by: 'party', label: 'Perception — the room',
      ok: [
        { t: 'narr', text: 'You see a man that resembles your target from the shady man exactly. He stands near the refreshments. Every few moments his eyes drift to the golden egg on the stage.' },
        { t: 'narr', text: 'He isn\'t drinking, dancing, or talking. Just looking.' },
        { t: 'flag', k: 'spotted_target' }
      ],
      fail: [{ t: 'narr', text: 'Silk, candlelight, four hundred people and a great deal of noise.' }]
    },
    {
      t: 'if', flag: 'shady_contract',
      then: [
        {
          t: 'choice', text: 'The contract says he does not leave this building.',
          options: [
            {
              text: 'Move on him now, quietly.', need: { flag: 'spotted_target' }, lockNote: 'you have not found him',
              then: [
                {
                  t: 'check', skill: 'stealth', dc: 15, label: 'Stealth — cross the room unnoticed',
                  ok: [{ t: 'narr', text: 'You are beside him between one bar of the waltz and the next, and he has no idea.' }, { t: 'flag', k: 'ball_ambush' }],
                  fail: [{ t: 'narr', text: 'He sees you at twenty paces and his hand goes inside his coat.' }]
                },
                { t: 'run', id: 'ball_target_fight' },
                { t: 'stop' }
              ]
            },
            { text: 'Wait. Watch what he does.', then: [{ t: 'narr', text: 'You wait. He waits. Somebody plays something in three-four time.' }] },
            { text: 'Warn him.', then: [{ t: 'narr', text: 'You tell him someone has paid to have him killed at this ball. He does not look surprised, which tells you a great deal.' }, { t: 'say', who: 'The Marked Man', text: '"I know. He always pays too late." *He does not stop watching the egg.*' }, { t: 'flag', k: 'warned_target' }] }
          ]
        }
      ],
      else: [
        { t: 'narr', text: 'A man by the refreshments is not drinking, dancing or talking. He is watching the egg, and he has been for some time.' }
      ]
    },
    { t: 'wait', ms: 500 },
    { t: 'run', id: 'act10_dragon' }
  ],

  act10_dragon: [
    { t: 'narr', text: 'You suddenly hear rumbling coming from outside. Then an earthy crunch, as though there were a tornado just beyond the wall.' },
    { t: 'wait', ms: 400 },
    { t: 'narr', text: 'You look out through the giant window at the back of the room — and you see something peering back at you. An enormous orange slit eye, belonging to a dragon.' },
    { t: 'sfx', id: 'roar' },
    { t: 'shake', amt: 9 },
    { t: 'wait', ms: 400 },
    { t: 'flash' },
    { t: 'narr', text: 'Suddenly intense fire erupts from the wall under the window, scorching many attendees.' },
    { t: 'music', id: 'boss', restart: true },
    { t: 'banner', big: 'ROLL INITIATIVE', small: 'the ballroom, on fire', ms: 1800 },
    {
      t: 'combat', arena: 'ballroom_fight',
      enemies: ['dragon_at_the_window'], allies: ['ball_guest', 'ball_guest'],
      onRound: (round, api) => {
        if (round === 2) {
          api.log('Amid the chaos, someone is walking toward the podium.', 'turn');
        }
      },
      onWin: [
        { t: 'narr', text: 'It pulls its head back out through its own hole in the wall and goes, and the room is left screaming and burning and entirely uninterested in whatever happens next.' },
        { t: 'xp', n: 1200 },
        { t: 'run', id: 'act10_egg_gone' }
      ],
      onLose: [
        { t: 'narr', text: 'You come to on the marble with your ears ringing and somebody\'s glove in your hand. The dragon is gone. So is most of the wall.' },
        { t: 'run', id: 'act10_egg_gone' }
      ]
    }
  ],

  act10_egg_gone: [
    {
      t: 'check', skill: 'perception', dc: 14, by: 'party', label: 'Perception — through the smoke',
      ok: [
        { t: 'narr', text: 'Amid the chaos you see your target walk up to the podium, look around, and snatch the golden egg off it.' },
        { t: 'narr', text: 'He wraps it in a thick protective cloth before taking off.' },
        { t: 'flag', k: 'saw_egg_taken' }
      ],
      fail: [{ t: 'narr', text: 'Smoke, and people, and by the time it clears the podium is empty.' }]
    },
    {
      t: 'if', flag: 'saw_egg_taken',
      then: [
        {
          t: 'choice', text: 'He is heading for the servants\' door with a five-foot golden egg under a blanket.',
          options: [
            { text: 'Go after him.', run: 'ball_target_fight' },
            { text: 'Let him go, and follow at a distance.', then: [{ t: 'narr', text: 'You let the door close behind him and count to ten. Then you go through it. There is a cart. There is a road. There is a very clear pair of wheel-ruts heading east.' }, { t: 'flag', k: 'egg_trail' }] }
          ]
        }
      ],
      else: [
        { t: 'narr', text: 'The podium is bare. The cloth that covered it is gone as well, which means whoever took the egg came prepared for it — before the wall came down.' },
        { t: 'flag', k: 'egg_trail' }
      ]
    },
    { t: 'run', id: 'act10_close' }
  ],

  ball_target_fight: [
    { t: 'narr', text: 'He drops the cloth, and there is a hand crossbow in his fist before it touches the floor.' },
    {
      t: 'combat', arena: 'ballroom_fight', enemies: ['marked_man'],
      onWin: [
        { t: 'narr', text: 'He goes down beside the golden egg with one hand still on it.' },
        { t: 'flag', k: 'contract_done' },
        { t: 'questDone', id: 'contract', xp: 500 },
        { t: 'give', item: 'golden_egg_shard' },
        { t: 'gold', n: 800 },
        { t: 'narr', text: 'Inside his coat: eight hundred gold, and a sealed order in handwriting you last saw on a map, in a market, in Drakehaven.' },
        { t: 'say', who: 'The Marked Man', text: '*Not quite dead yet.* "You have not stopped anything. There are nine." *And then he is.*' },
        { t: 'flag', k: 'knows_nine' },
        { t: 'flag', k: 'egg_trail' }
      ],
      onLose: [
        { t: 'narr', text: 'He is gone through the servants\' door with the egg before you can stand up.' },
        { t: 'flag', k: 'egg_trail' }
      ]
    }
  ],

  act10_close: [
    { t: 'wait', ms: 600 },
    { t: 'music', id: 'vision', restart: true },
    { t: 'narr', text: 'Outside, the manor lawn is burning in three places and nobody is putting it out.' },
    {
      t: 'if', flag: 'knows_nine',
      then: [{ t: 'narr', text: 'Nine. The museum label said nine. The watcher in the tower counted eleven going east and two coming back.' }],
      else: [{ t: 'narr', text: 'Somewhere east of here, past two hundred miles of nothing, something enormous and golden is still asking where they have gone.' }]
    },
    { t: 'say', who: 'The Command Pod', text: '*It speaks up from the bottom of somebody\'s bag, in that same flat man\'s voice.* "Understood. Hold position. We are sending a ship."' },
    { t: 'wait', ms: 400 },
    { t: 'say', who: 'Anvil', text: '"It said please." *He is looking east.* "The big one. It said please, and nobody has said that to me my whole life."' },
    { t: 'flag', k: 'act10_done' },
    { t: 'quest', id: 'east', title: 'East, Past the Nothing', desc: 'Nine golden eggs left this island forty years ago. Something ancient wants them back, and it is speaking through every dragon between here and the horizon. A ship is coming.' },
    { t: 'chapter', label: 'END OF ACT TEN', title: 'A ship is coming', sub: 'to be continued', ms: 4200 },
    { t: 'toast', text: 'The story so far is complete. The island is still yours to wander.', kind: 'good', ms: 6000 },
    { t: 'do', fn: () => DH.game.saveTo(DH.game.state.slot || 1) }
  ],

  ball_egg: [
    {
      t: 'if', flag: 'act10_done',
      then: [{ t: 'narr', text: 'The podium is empty, and scorched.' }],
      else: [
        { t: 'narr', text: 'A golden egg, five feet tall, on a podium on a stage, with a rope around it and a card reading DO NOT TOUCH.' },
        { t: 'narr', text: 'It is warm. From here. Across a ballroom.' }
      ]
    }
  ],
  npc_target: [
    {
      t: 'if', flag: 'spotted_target',
      then: [{ t: 'say', who: 'The Marked Man', text: '*He does not turn round.* "It is warm, isn\'t it. You can feel it from here."' }],
      else: [{ t: 'narr', text: 'A man by the refreshments, not drinking, not dancing, not talking.' }]
    }
  ],
  npc_ball_guest: [
    {
      t: 'choice', text: 'A guest, delighted to be seen talking to someone new.',
      options: [
        { text: '"Whose egg is that?"', then: [{ t: 'say', who: 'A Guest', text: '"Nobody\'s! Isn\'t it marvellous? Dredged up east years ago. They bring it out for the ball." *They sip.* "Some people say there were more."' }] },
        { text: '"Has anything odd happened tonight?"', then: [{ t: 'say', who: 'A Guest', text: '"The woman on the door told a duke he could not bring his wolfhound in. To his face! I have never enjoyed anything more."' }] },
        { text: 'Dance.', then: [{ t: 'check', skill: 'performance', dc: 11, label: 'Performance — dance', ok: [{ t: 'narr', text: 'Two turns of the floor, and half the room decides you are somebody.' }, { t: 'do', fn: () => DH.game.addAffinity('ball_guests', 3, 'the guests') }], fail: [{ t: 'narr', text: 'You step on a viscount. The viscount is gracious. Everyone saw.' }] }] }
      ]
    }
  ],

  /* ==========================================================================
     ODDS AND ENDS
     ========================================================================== */
  command_pod: [
    { t: 'narr', text: 'The Command Pod, purple and faintly humming, sitting where somebody put it down.' },
    {
      t: 'choice', text: 'A screen on the top shows red dots — one for each of you.',
      options: [
        {
          text: 'Ask the higher-ups for supplies.', then: [
            {
              t: 'if', test: (s) => !s.flags.pod_supply_day || s.flags.pod_supply_day < s.day,
              then: [
                { t: 'do', fn: (s) => { s.flags.pod_supply_day = s.day; } },
                { t: 'sfx', id: 'quest' },
                { t: 'say', who: 'The Command Pod', text: '"Acknowledged. Sending." *Something small materialises in the tray.*' },
                { t: 'give', item: 'potion_greater_healing', qty: 2 },
                { t: 'give', item: 'rations', qty: 2 }
              ],
              else: [{ t: 'say', who: 'The Command Pod', text: '"One resupply per day. You have had yours." *It is not unkind about it. It is not anything about it.*' }]
            }
          ]
        },
        {
          text: 'Ask about the eggs.', need: { flag: 'act1_done' }, then: [
            { t: 'say', who: 'The Command Pod', text: '"We\'ve heard that the main creatures that are going rogue are dragonic. Beyond that: hold position, gather information, do not engage anything with a wingspan." *A pause.* "You have already engaged something with a wingspan."' }
          ]
        },
        { text: 'Charge the pods.', then: [{ t: 'do', fn: (s) => { s.party.forEach(c => { if (c.pod) c.pod.charges = c.pod.max; }); } }, { t: 'sfx', id: 'shield' }, { t: 'toast', text: 'All pods at full charge.', kind: 'good' }] },
        { text: 'Leave it alone.', then: [] }
      ]
    }
  ]
};

/* A tiny sanity pass: warn in the console about any `run` or option target that
   does not exist, so a typo in the campaign shows up immediately. */
(function validateStory() {
  const ids = Object.keys(DH.STORY);
  const missing = [];
  function walk(list, where) {
    (list || []).forEach(step => {
      if (!step) return;
      if (step.t === 'run' && ids.indexOf(step.id) < 0) missing.push(where + ' → run:' + step.id);
      (step.options || []).forEach(o => {
        if (o.run && ids.indexOf(o.run) < 0) missing.push(where + ' → option run:' + o.run);
        if (o.then) walk(o.then, where);
      });
      if (step.then) walk(step.then, where);
      if (step.else) walk(step.else, where);
      if (step.ok) walk(step.ok, where);
      if (step.fail) walk(step.fail, where);
      if (step.onWin) walk(step.onWin, where);
      if (step.onLose) walk(step.onLose, where);
    });
  }
  ids.forEach(id => walk(DH.STORY[id], id));
  if (missing.length) console.warn('story: unresolved targets —', missing);
})();
