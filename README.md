# Drakehaven Island

A tactical D&D-style role-playing game built from **complete zero**: no engine, no
libraries, no build step, no image files and no audio files. Every sprite is drawn
by code onto a canvas, every note of music is synthesized live in the browser, and
the rules are a hand-written implementation of fifth-edition-style play.

**Open `index.html` in a browser. That is the whole install.**

```
git clone <this repo>
cd Drakehaven_Island
# either double-click index.html, or:
python3 -m http.server 8000   # then visit http://localhost:8000
```

Click once anywhere before you expect sound — browsers hold audio back until you do.

### Or take one file

`dist/drakehaven-island.html` is the whole game inlined into a single 762 KB file —
no folder, no server, no network. Download it and double-click. Rebuild it with
`npm run build`.

### Hosting it

The game is plain static files, so any static host works. The repository root *is*
the site root.

| Host | What to set |
|---|---|
| **Render** — Static Site *(best: free, no spin-down)* | Build Command: *empty* · Publish Directory: `.` |
| **Render** — Web Service, Node | Build Command: `npm ci` · Start Command: `npm start` |
| **Render** — Web Service, Python | Build Command: `pip install -r requirements.txt` · Start Command: `python server.py` |
| **GitHub Pages** | Settings → Pages → deploy from a branch, folder `/ (root)` |
| **Anywhere else** | `node server.js`, `python server.py`, or copy the files behind any web server |

A host may be configured any of these ways, often without asking, so the
repository satisfies all of them:

| File | Why it is there |
|---|---|
| `render.yaml` | Render Blueprint for a static site |
| `server.js` | static server, `node:http` only |
| `server.py` | static server, Python standard library only |
| `app.py` | WSGI callable, so `gunicorn app:app` resolves; also runnable directly |
| `gunicorn.conf.py` | binds gunicorn to `$PORT`, so a bare `gunicorn app:app` is reachable |
| `requirements.txt` | so `pip install -r requirements.txt` succeeds instead of erroring |
| `package-lock.json` | so `npm ci` succeeds |

Either publish path works: the repository root serves the multi-file game, and
`dist/` serves the single-file build.

Run `bash tools/deploycheck.sh` to verify all of it from a clean clone — it
clones `main`, runs every build command, starts every start command, and refuses
to pass unless each one actually serves a working page (correct MIME types,
unknown paths falling back to the game, and no file leaking from outside the
project).

---

## What it is

You are a P.A.C.T. recruit — *Protective Acts for Controlling Tyrants* — being
carried to Drakehaven Island to deal with some rogue civilians. Nobody has told you
much more than that, and the brief turns out to be wrong in an interesting way.

Four layers:

1. **A main screen.** An animated storm at sea, with New Game, Continue, How to Play,
   House Rules, Settings and Credits.
2. **Character creation, staged like Baldur's Gate 3.** Race → Class → Subclass →
   Abilities → Background → Skills → Appearance → Name → Review, with a live portrait
   and a live stat panel that updates as you choose. **All twelve classes.** You start
   at 3rd level, the same as the five adventurers you sail in with, so the first fight
   is yours too rather than something you watch them handle.
3. **An overworld shaped like Stardew Valley.** Walk freely, with a clock and a day
   counter, sleeping for a long rest, named people who remember you, shops with real
   stock, foraging, mining, fishing, crafting, and a herb plot behind the inn.
4. **Combat on squares you can go to.** Turn-based tactical grid. Each tile is five
   feet, reachable tiles glow, and you click one to move there.

## Controls

| | |
|---|---|
| `W` `A` `S` `D` / arrows | Walk |
| `Shift` | Hurry |
| `Space` / `E` | Talk, open, forage, mine, fish, sleep — and advance dialogue |
| `C` | Character sheet |
| `J` | Journal and quests |
| `I` | Inventory |
| `Esc` | Menu, saving, quitting |
| **In combat** | |
| Click a glowing tile | Move there (the path and its cost are previewed) |
| Click an enemy | Attack with the selected action |
| `T` | End turn |
| `P` | Raise your P.A.C.T. Pod shield |
| Hover anything | Its full numbers |

## The rules it implements

Ability scores and modifiers, proficiency by level, advantage and disadvantage
(which cancel), skills, saving throws, armour class from armour or Unarmoured
Defence, hit dice, short and long rests, spell slots for full, half, third and pact
casters, prepared versus known spells, concentration checks when you take damage,
resistance, immunity and vulnerability, temporary hit points, death saving throws,
critical hits, and around thirty conditions.

**All twelve classes**, each with subclasses and features the engine actually
resolves: Rage, Sneak Attack, Divine Smite, Ki and Flurry of Blows, Wild Shape,
Bardic Inspiration, Channel Divinity, Metamagic, Extra Attack, Cunning Action,
Uncanny Dodge, Evasion, Fighting Styles, Action Surge, Second Wind, Lay on Hands,
Hunter's Mark, Arcane Recovery, Eldritch Invocations, Superiority Dice, and more.

Fifteen peoples to play, including Dragonborn with all ten draconic ancestries,
plus Tabaxi, Minotaur, Kobold and Orc. Around seventy spells from cantrips to fifth
level, with real shapes — spheres, cones, lines and cubes — resolved on the grid.

### House rules, exactly as the table plays them

- **Ending Action.** Once per turn, after your Action, Bonus Action *and* movement
  are all spent, you get one more thing: a knowledge or observation check (Arcana,
  Investigation, Nature, History, Perception, Religion, Insight, Survival), or a
  consumable used on yourself or fed to a willing creature within five feet.
- **No opportunity attacks.** Walk away from whoever you like.
- **Critical hits carry.** A critical that kills its target passes the leftover
  damage to a new target within reach.
- **Shared initiative.** Tie with a party member and you choose the order; tie with
  a monster and you go first.
- **Death costs a level.** Fail your third death save and you lose one character
  level. Keep the character, or make a new one a level below the rest.
- **P.A.C.T. Pods.** A reaction press of the blue "S" gives +2 AC until your next
  turn for one charge. Charges grow with level, to five at ninth. The Command Pod
  restores four charges on a long rest, charges four pods at a time, and is how the
  higher-ups send you things. Pod Archetype — Attack, Defence or Utility — at
  seventh level; you bond with the thing at tenth.

## The campaign

Eleven acts, from a hammock in a thunderstorm to a burning ballroom.

| Act | |
|---|---|
| **0** | The *Mary Parker* in a storm. Mahoraga punching a bar of ship-iron, an elf reading in a hammock, "all hands on deck", a dingy with one very fine man in it, and two sea hags. Then the captain's cabin, the P.A.C.T. briefing, the pods, and ship games. |
| **1** | Landfall, and an Ancient Golden Dragon speaking through somebody else's mouth. |
| **2** | "THEY'RE GONE!" Tracking the crazy ones through a panicking town, a grey cat worth taming, and a Half-Dragon in the square with three barrels of freezing water nearby. |
| **3** | The market — a potion stand, a food row, and a man in the shade with a contract. The Dragon's Keg, Little Mimsy, and the thing living in Erza's house. |
| **4** | The town hall, the muster, and a collapsed cave mouth with three shovels. |
| **5** | Grimble's trials: a rolling boulder, a rotting gelatinous cube, a statue that vanishes at her own name, rune rays that shrink you, a river of lava, a sealed room with twenty minutes of air, a door that insists on being knocked on, and a Wight in a crown. |
| **6** | A black dragon digging in a swamp with a bad hind leg — and a green dragon that drops a five-foot golden egg and comes back for it. |
| **7** | The arena. Four rounds. |
| **8–9** | Baycrest, its museum and its tower, and a clearing where a copper dragon is trying to find a parent for somebody else's child. |
| **10** | The Grand Ball, an orange slit eye at the window, and a golden egg that is not there any more. |

Six dice minigames run by the captain (Dragon's Hoard, Arm Wrestling, Darts,
Drinking, Roulette, The Winning Roll), plus the dig-site save relay, the statue
riddle, the twenty-minute escape room, fishing and crafting.

## How it is built

```
index.html          markup, the canvas, the UI roots
css/style.css       every screen
js/core/            util · input · audio · gfx · ui · save · game (loop and scenes)
js/rules/           dice (the d20 engine) · character (build and derive)
js/data/            races · classes · backgrounds · spells · items · monsters · maps · story
js/scenes/          title · charcreate · overworld · combat · script · shop · minigames · journal
tools/              smoketest.js (headless) · browsertest.js (real Chromium)
```

- **No dependencies.** Classic `<script>` tags and one `window.DH` namespace, so it
  runs straight off `file://` with no module or CORS trouble.
- **All art is procedural.** `js/core/gfx.js` holds painters for terrain, props and
  creatures — humanoid, dragon, beast, construct, ooze and floating horror — driven
  by a palette and a set of flags, so any race or monster is just a description.
- **All audio is synthesized.** `js/core/audio.js` is a small subtractive synth and a
  sixteenth-note step sequencer, with ten tracks, looping noise ambience for rain,
  sea, cave and fire, and about two dozen sound effects.
- **The story is data.** `js/data/story.js` is the campaign as a list of instructions
  — `say`, `choice`, `check`, `combat`, `give`, `flag`, `travel`, `shop`, `minigame` —
  executed by `js/scenes/script.js`. The prose is the data; the engine stays general.

## Tests

```
node tools/smoketest.js     # 2,771 assertions, no browser needed
node tools/browsertest.js   # drives real Chromium and screenshots a playthrough
bash tools/deploycheck.sh   # every build and start command a host might use
```

The headless suite runs 2,771 assertions. It builds **every class against every race** (180 combinations),
levels each class to ten, puts every monster on a grid, loads and renders every map
and arena, walks the whole story graph for dangling references, round-trips a save,
and checks the campaign's written numbers — the Half-Dragon's 90 hit points and AC
14, the captain's six ability scores and his 4d6+4 punch, the grey cat's 3 hit
points, the fly's AC 26, and every price on the potion stand.

`browsertest.js` needs Chromium and `playwright-core`. It runs 64 checks against a
real browser: it creates a character through the actual creator, plays the prologue,
walks the ship, fights the sea hags by clicking squares and enemies on the canvas,
collects the hag's necklace when the story resumes, opens the sheet and the pod page,
buys a potion, plays a hand of Dragon's Hoard, saves, reloads, takes a long rest,
renders every map, opens the Half-Dragon fight, and asserts there were no page
errors anywhere in the run. It writes a screenshot at each step to `screenshots/`.

Your companions fight for themselves — they are other people's characters, not
pets — so a battle plays out around you while you take your own turn.
