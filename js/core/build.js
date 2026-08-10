/* Which build is actually running.

   A page served from a stable URL is cached aggressively, and a cached copy of
   an 800 KB single-file game looks exactly like a build where nothing changed.
   The title screen prints this stamp and lists these notes, so "did my changes
   land?" is answerable by looking at the screen instead of taking it on trust.

   Bump `id` and rewrite `notes` with every batch of changes. */
window.DH = window.DH || {};

DH.BUILD = {
  version: '1.2',
  id: 4,
  date: '10 August 2026',
  notes: [
    'Companions are yours to play — their turn hands you the action bar instead of running itself. Settings can hand them back to the AI.',
    'Death is permanent. A dead companion leaves the party for the Fallen list and only a Raise Dead (300gp of diamond dust) brings them back.',
    'Your own character dying ends the run — no level lost instead, no replacement a step behind.',
    'The Party screen lists what each member actually brings, race traits and class features together, and holds the revive button.',
    'Barrels, crates and bone piles stop offering once searched — that was the loop that kept saying "you have already been through this one".',
    'Every panel is an on-screen button now: Sheet, Inventory, Journal, Party, Pod, Menu / Save.',
    'Ending Action no longer requires your movement to be used up.',
    'Enemies no longer show exact hit points or AC — the bar and a word like "Bloodied" instead.',
    'Combat movement slowed from a slide to a walk.',
    'Held items suit the class: monks fight empty-handed, bards carry a lute, casters a staff.',
    'Kobolds lost Sunlight Sensitivity. "Armour" is spelt "armor" throughout.',
    '4d6-drop-lowest, the tagline under the title, and the Credits button are gone.',
    'Speakers have a portrait beside their words; the rolled die is a real d20.',
    'The party is Anvil, Umarion and the Ball Wizard.'
  ]
};
