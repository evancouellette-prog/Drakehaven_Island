# Drakehaven Island — Design Document

## 0. The Brief (rewritten)

> **Original ask:** *"Make a dnd based game from complete zero. Make a story of drakehaven island, with all dnd classes available, you start on a main screen, when u start you make ur charater like bg3, then the story starts. i want gameplay to be like stardew valley and have battles have squeres u can go."*

**Rewritten brief:**

Build **Drakehaven Island**, a single-player tactical RPG that runs in any modern browser with
**zero dependencies, zero build step, and zero external assets** — no engine, no npm, no image or
audio files. All art is drawn procedurally to a canvas; all music and sound is synthesized live in
the WebAudio API; all rules are a hand-written implementation of 5th-edition-style D&D.

The game has four layers:

1. **Main menu** — an animated storm-at-sea title screen (New Game / Continue / How to Play /
   Settings / Credits).
2. **BG3-style character creation** — a staged wizard: Race → Class → Subclass → Ability scores
   (point buy, standard array, or 4d6-drop-lowest) → Background → Skill proficiencies → Appearance
   → Name → Summary. **All 12 core classes** with subclasses, plus a race roster drawn from the
   world (including Dragonborn, Tabaxi, Minotaur, Kobold, Orc).
3. **Overworld — Stardew Valley shaped.** Top-down tile world you walk freely. A clock and a day
   counter, sleeping to advance the day and take a long rest, NPCs with names and dialogue and an
   affinity meter, shops that hold real stock, foraging nodes, ore veins in the mine, fishing off
   the dock, a herb plot at your lodging, crafting, and a quest journal. The campaign's dungeons
   are entered from this world, not from a menu.
4. **Combat — squares you can go.** Turn-based tactical grid. Each tile is 5 ft. Click a highlighted
   tile to move, spend Action / Bonus Action / Reaction / **Ending Action**, roll real dice on
   screen, use terrain (barrels, ropes, glass bottles, barrels of freezing water, mud, lava).

The campaign is the Drakehaven Island story: the *Mary Parker* in a thunderstorm, sea hags, the
P.A.C.T. briefing and the Pods, the town where the "crazy ones" break loose, the Half-Dragon, the
market and its shady man, the Dragon's Keg, the mayor, Grimey's trial-mine, the swamp black dragon,
the arena, Baycrest, and the royal ball where a golden egg goes missing.

**Success criteria:** open `index.html`, and you can create a character and play the story from the
crew quarters to the ballroom, fight on a grid, buy potions, gamble with the captain, and save.

---

## 1. Technology

| Decision | Choice | Why |
| --- | --- | --- |
| Runtime | Browser, `file://`-openable | No install, no server, no toolchain |
| Modules | Classic `<script>` tags + one `window.DH` namespace | ES modules are blocked over `file://` |
| World & combat rendering | `<canvas>` 2D, virtual 480×270, integer-scaled | Crisp pixel look, cheap |
| Menus, dialogue, sheets, shops | DOM + CSS overlay above the canvas | Text-heavy UI is far cheaper in DOM |
| Art | Procedural — palette-driven shape drawing per creature archetype | No asset pipeline |
| Audio | WebAudio oscillators + noise, a tiny step sequencer | No audio files |
| Persistence | `localStorage`, 3 save slots | Instant, offline |

## 2. File layout

```
index.html                  markup, canvas, UI roots, script order
css/style.css               dark-fantasy / parchment theme, all screens
js/core/util.js             maths, RNG, dice parser, grid helpers, event bus
js/core/input.js            keyboard + mouse, key remapping, held-key state
js/core/audio.js            synth voices, sequencer, tracks, SFX
js/core/gfx.js              canvas, camera, tile & creature painters, particles
js/core/ui.js               DOM helpers: panels, choice lists, toasts, dice popups
js/core/save.js             slots, serialize/deserialize, versioning
js/core/game.js             scene stack, main loop, global state, flags/quests
js/rules/dice.js            d20 tests, advantage, attacks, damage, saves, crits
js/rules/character.js       build, derive, level up, equip, spell slots, rest
js/data/races.js            13 races/subraces
js/data/classes.js          12 classes, subclasses, features, spell progression
js/data/backgrounds.js      backgrounds + starting kit
js/data/spells.js           ~70 spells, cantrip → 5th, with resolvable effects
js/data/items.js            weapons, armour, potions, quest items, shop stock
js/data/monsters.js         every stat block in the campaign
js/data/maps.js             tile maps, NPC placement, triggers, encounter arenas
js/data/story.js            the campaign as a script the runner executes
js/scenes/title.js          main screen
js/scenes/charcreate.js     the BG3-style wizard
js/scenes/overworld.js      Stardew layer: walking, time, NPCs, foraging
js/scenes/combat.js         the grid battle scene
js/scenes/script.js         dialogue + cutscene interpreter
js/scenes/shop.js           buying, selling, stock
js/scenes/minigames.js      the captain's ship games + dig site + riddles
js/scenes/journal.js        sheet, inventory, spells, quests, map, pod
js/main.js                  boot
```

## 3. Rules engine

**Core maths.** `mod = floor((score-10)/2)`, `proficiency = 2 + floor((level-1)/4)`.

**d20 tests.** One function serves checks, saves and attacks: roll `d20`, take highest of two on
advantage / lowest on disadvantage, add ability mod + proficiency (if proficient) + situational
bonuses. Natural 1 and 20 are surfaced to the UI. Every roll is echoed in the dice log so the player
can see the maths, like a real table.

**Combat turn.** Movement pool in feet (speed, 5 ft per tile, diagonals cost 5 ft), one Action, one
Bonus Action, one Reaction, and the campaign's **Ending Action**.

**House rules from the campaign, implemented:**

- **Ending Action** — after your Action, Bonus Action and movement are all spent, you get a bonus
  action-shaped slot that may only make a knowledge/observation check (Arcana, Investigation,
  Nature, History, Perception, Religion, Insight, Survival) or use/administer a consumable to a
  willing creature within 5 ft.
- **No opportunity attacks** — leaving a hostile's reach is free.
- **Critical hits chain** — a crit that kills its target carries the leftover damage to a new target
  within reach.
- **Shared initiative** — a tie with another party member lets you choose the order; a tie with a
  monster means you go first.
- **Death** — failing the third death save costs one character level, and you may keep the character
  or roll a new one a level below the party.
- **P.A.C.T. Pods** — reaction shield ("S" button) for +2 AC until your next turn at the cost of one
  charge; charge pool grows with level; the Command Pod restores 4 charges on a long rest and is the
  higher-ups' delivery channel. Pod Archetype (Attack / Defense / Utility) unlocks at level 7,
  bonding at level 10.

**Conditions modelled:** prone, grappled, restrained, poisoned, paralysed, stunned, blinded,
frightened, charmed, incapacitated, unconscious, invisible, raging, dodging, blessed, hasted,
enlarged, reduced, marked, shielded, concentrating.

## 4. Character creation flow

```
Race ▸ Subrace ▸ Class ▸ Subclass ▸ Abilities ▸ Background ▸ Skills ▸ Look ▸ Name ▸ Review
```

Every step shows a live portrait and a live stat panel on the right, and you can walk backwards
without losing choices. Ability generation offers **Point Buy (27)**, **Standard Array**, and
**Roll 4d6 drop lowest**. Racial bonuses, class saves, hit points, AC, starting gold and starting
kit are all derived and shown before you commit.

**Classes:** Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer,
Warlock, Wizard — each with subclasses and a hand-picked set of features the combat engine actually
resolves (Rage, Sneak Attack, Divine Smite, Ki, Wild Shape, Bardic Inspiration, Channel Divinity,
Metamagic, Extra Attack, Cunning Action, Uncanny Dodge, Evasion, Fighting Styles, Action Surge,
Second Wind, Lay on Hands, Hunter's Mark, Arcane Recovery, Eldritch Invocations).

**Races:** Human, Wood Elf, High Elf, Hill Dwarf, Mountain Dwarf, Lightfoot Halfling, Dragonborn,
Rock Gnome, Half-Elf, Half-Orc, Tiefling, Tabaxi, Minotaur, Kobold, Orc.

## 5. The Stardew layer

- **Clock** — minutes tick as you walk; 6:00 wake, 2:00 forced sleep. Days advance, and the day
  counter drives the shady man's two-month contract deadline and the town-defence date.
- **Sleep** — in a bed: long rest, restores HP, spell slots, pod charges, advances the day.
- **Affinity** — every named NPC tracks a 0–10 meter; talking, gifting and finishing their quests
  raise it, and higher affinity opens dialogue, discounts, and side quests.
- **Foraging & mining** — respawning nodes (herbs, mushrooms, driftwood; copper, iron, silver in the
  mine) feed crafting.
- **Crafting** — a small recipe book at your lodging turns herbs into the potions the market sells.
- **Fishing** — a timing minigame off the Drakehaven dock.
- **Herb plot** — six tiles behind the inn: till, plant, water daily, harvest.

## 6. Combat scene

A 20×14 grid arena per encounter. The tile under the cursor shows its path cost and whether the
move is legal; reachable tiles glow. The right rail is the initiative ladder; the bottom bar is
Action / Bonus / Reaction / Ending Action plus the ability palette. Rolls animate as a d20 popup
with the breakdown.

**Terrain that matters:** barrels (cover, throwable, explode into difficult terrain), ropes and
rigging (climb for high ground and advantage), glass bottles (thrown, 1d4 and caltrop tiles),
**barrels of freezing water** (dip a weapon for +1d6 against the Half-Dragon, or hurl the barrel for
a flat 20), swamp mud (−5 ft and a DC 11 save to pull free), lava (a 5 ft river to cross), rune rays
(DC 15 Acrobatics, two DC 17 CON saves or shrink).

**Monster AI:** breadth-first pathing to the best target, threat scoring that prefers low-HP and
squishy targets, recharge tracking for breath weapons, and per-monster scripted behaviour (hags
grapple and drag victims overboard, the kobold shrieks to summon, the black dragon burrows for its
eggs).

## 7. Story structure

The campaign lives in `js/data/story.js` as a list of instructions the script runner executes:
`say`, `choice`, `check`, `combat`, `give`, `flag`, `music`, `shop`, `minigame`, `travel`, `quest`,
`camera`, `sfx`, `wait`, `branch`. That makes the prose the data and keeps the engine general.

| Act | Beats |
| --- | --- |
| **0 — The Mary Parker** | Storm, crew quarters, Mahoraga at the metal, the elf in the hammock, "all hands on deck", the captain at the wheel, the dingy, the sea hags, the hag's necklace (DC 14 History/Investigation), the cabin, the P.A.C.T. briefing, the Pods and the Command Pod, ship games, landfall |
| **1 — Landfall** | The captain's goodbye, the dragonborn's vision of the Ancient Golden Dragon, the Command Pod's order, five green potions |
| **2 — Drakehaven Town** | "THEY'RE GONE!", the snapped rope on the pole, tracking the crazy ones (Perception / Investigation / Survival / Persuasion / Intimidation), dragonborn in the tavern, dragonborn on the civilians, the shrieking kobold, the grey cat you can tame, the possession, the Half-Dragon and the cold barrels, the minotaur boy's gift |
| **3 — Market & Tavern** | The potion stand, the food row, the shady man's contraband and his contract, The Dragon's Keg, Little Mimsy and the Dragon's Breath, the tabaxi, the orc, the dwarf, the lonely gnome, Erza's house and the eyeball monster, the blue brass knuckles |
| **4 — Town Hall & Dig** | The mayor, signing up for the town's defence, the collapsed cave mouth and the dig (rock scale to 15), the Ring of Protection, the clank from inside |
| **5 — Grimey's Mine** | The boulder and the rotting gelatinous cube, the cypher room, the statue that vanishes at her name, the rune rays, the lava river, the 20-minute gas room and the d10 pedestal, the door that must be knocked on, the Wight and the construct, the crown, the gnome and his calm-dragon cure, the news about Grimey |
| **6 — Dragon Infestation** | The swamp, the black dragon's acid and its wounded hind leg, the green dragon that drops and reclaims a glowing golden egg, the reward |
| **7 — The Arena** | Four rounds: the crazed silver dragon, keep-the-egg, two three-ways, and the final 1v1 |
| **8 — Baycrest** | The observation tower, the museum, the houses, the cave |
| **9 — The Clearing** | The copper dragon and its baby, the orphaned young blue dragon, the small owlbear |
| **10 — The Royal Ball** | The invitation and the elf who is not afraid of dragons, the golden egg on the podium, the mark by the refreshments, the orange slit eye at the window, fire through the wall, and the egg gone |

## 8. Minigames

The captain's games are real, with the campaign's rules: **Dragon's Hoard** (ante, 3d6 kept secret,
the house's d6 confiscates), **Arm Wrestling** (STR saves, first to 3), **Darts** (three DEX checks,
tightest cluster wins, rerolls scaled to your DEX bonus), **Drinking** (escalating CON saves, two
failures and you're out), **Roulette** (bet up to four numbers on a d20 at 4×), and **The Winning
Roll** (hidden d20s, bid your rounds won, a die added each round). Also the **dig site** save-relay
and the mine's **riddle** and **escape-room** puzzles.

## 9. Build order

1. Core: loop, input, gfx, audio, save, UI toolkit, dice
2. Data: races, classes, backgrounds, spells, items
3. Title screen and character creation
4. Overworld: the ship, then the town; NPCs, time, journal
5. Grid combat + monsters + AI
6. Script runner and Act 0–2
7. Shops, minigames, pods, crafting
8. Acts 3–10
9. Balance pass, polish, README

Every stage is committed so the repo always holds a game you can open and play.
