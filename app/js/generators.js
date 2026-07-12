/* Random generators: fantasy names + full codex entries. */

import { state, newEntry } from './state.js';

/* ---------------- dice helpers ---------------- */

/* All randomness flows through a swappable source so map generation can be
   seeded and reproducible ("same seed, same world"). */
let R = Math.random;
export function setRandomSource(fn) { R = fn || Math.random; }

export function seededRandom(seedStr) {
  let h = 2166136261;
  const s = String(seedStr);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeedString() {
  const words = ['raven', 'ember', 'frost', 'thorn', 'gale', 'stone', 'wyrm', 'ash', 'moon', 'tide',
    'oak', 'rune', 'fen', 'brand', 'vale', 'storm'];
  return words[Math.floor(Math.random() * words.length)] + '-' + Math.floor(Math.random() * 900 + 100);
}

export const rnd = (a, b) => a + R() * (b - a);
export const randInt = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = (arr) => arr[Math.floor(R() * arr.length)];
export const chance = (p) => R() < p;

function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(R() * copy.length), 1)[0]);
  return out;
}

/* ---------------- name tables ---------------- */

const ADJ = ['Ashen', 'Sunken', 'Forgotten', 'Howling', 'Crimson', 'Silent', 'Shattered', 'Blighted',
  'Gilded', 'Frozen', 'Weeping', 'Nameless', 'Burning', 'Hollow', 'Verdant', 'Pale', 'Iron', 'Whispering',
  'Drowned', 'Eternal', 'Broken', 'Wandering', 'Veiled', 'Thorned'];
const NOUN = ['King', 'Queen', 'Serpent', 'Saint', 'Betrayer', 'Prophet', 'Wyrm', 'Legion', 'Crown',
  'Flame', 'Tide', 'Moon', 'Sun', 'Star', 'Blade', 'Rose', 'Raven', 'Wolf', 'Titan', 'Oath', 'Storm', 'Grave'];

const WORLD_A = ['Vael', 'Ar', 'Thal', 'Er', 'Kor', 'Myr', 'Aza', 'Bel', 'Cael', 'Dra', 'Eld', 'Fen',
  'Gal', 'Ith', 'Lor', 'Nor', 'Or', 'Sar', 'Tor', 'Zar', 'Quel', 'Ish'];
const WORLD_B = ['oria', 'andor', 'heim', 'aris', 'ethia', 'mar', 'gard', 'onia', 'ria', 'avel',
  'wyn', 'moor', 'reach', 'fell', 'una', 'ora', 'eth', 'akar'];

const TOWN_A = ['Oak', 'Stone', 'River', 'Wolf', 'Raven', 'Bright', 'Ash', 'Iron', 'Gold', 'Winter',
  'Elder', 'Black', 'White', 'Green', 'Silver', 'Mill', 'Fox', 'Thorn', 'Amber', 'Salt', 'Bell', 'Hawk'];
const TOWN_B = ['ford', 'haven', 'brook', 'field', 'stead', 'bury', 'gate', 'fall', 'crest', 'hollow',
  'market', 'watch', 'port', 'bridge', 'cross', 'glen', 'moor', 'vale', 'well', 'mere', 'cliff', 'landing'];

const DUNGEON_KIND = ['Crypt', 'Tomb', 'Halls', 'Caverns', 'Catacombs', 'Depths', 'Sanctum', 'Vault',
  'Lair', 'Maze', 'Warrens', 'Mines', 'Oubliette', 'Barrow'];

const FIRST_A = ['Al', 'Bran', 'Cor', 'Dain', 'El', 'Fen', 'Gar', 'Hal', 'Isol', 'Jor', 'Kae', 'Lys',
  'Mor', 'Nim', 'Or', 'Pell', 'Quin', 'Ro', 'Syl', 'Tam', 'Ul', 'Vex', 'Wren', 'Yor', 'Zan', 'Ash', 'Bri'];
const FIRST_B = ['a', 'ac', 'an', 'ara', 'dal', 'dor', 'dra', 'en', 'eth', 'ia', 'ic', 'iel', 'ien',
  'in', 'ira', 'is', 'on', 'or', 'ric', 'us', 'wen', 'wyn', 'na', 'th'];
const SURNAME = ['Ashguard', 'Blackbriar', 'Coppervein', 'Duskwalker', 'Emberfall', 'Frostmane',
  'Grimward', 'Hollowbrook', 'Ironwood', 'Kestrel', 'Longstride', 'Mistvale', 'Nightriver', 'Oakhart',
  'Palerose', 'Quickwater', 'Ravenholt', 'Stormcaller', 'Thornfield', 'Umberfell', 'Vane', 'Windmere',
  'Wyrmbane', 'Saltmarsh', 'Greyfen'];

const FACTION_A = ['Order', 'Brotherhood', 'Circle', 'Covenant', 'Guild', 'League', 'Cult', 'Court',
  'Company', 'Wardens', 'Hand', 'Sons', 'Daughters', 'Knights', 'Choir', 'Syndicate'];
const ITEM_A = ['Blade', 'Crown', 'Ring', 'Amulet', 'Staff', 'Cloak', 'Gauntlets', 'Horn', 'Lantern',
  'Tome', 'Mask', 'Chalice', 'Bow', 'Hammer', 'Orb', 'Boots', 'Mirror', 'Key', 'Circlet', 'Dagger'];
const EVENT_A = ['War', 'Fall', 'Siege', 'Battle', 'Plague', 'Burning', 'Betrayal', 'Founding',
  'Crowning', 'Sundering', 'Exodus', 'Treaty', 'Night', 'Uprising', 'Vanishing'];
const CREATURE_A = ['Dire', 'Elder', 'Ashen', 'Frost', 'Blood', 'Shadow', 'Iron', 'Bog', 'Storm',
  'Grave', 'Dusk', 'Rot', 'Thorn', 'Ember'];
const CREATURE_B = ['Wolf', 'Serpent', 'Stalker', 'Wyrm', 'Fiend', 'Golem', 'Shade', 'Spider',
  'Boar', 'Drake', 'Hag', 'Revenant', 'Hound', 'Crawler', 'Wraith', 'Behemoth'];

export const adjNoun = () => `${pick(ADJ)} ${pick(NOUN)}`;
export const worldName = () => pick(WORLD_A) + pick(WORLD_B);
export const townName = () => pick(TOWN_A) + pick(TOWN_B);
export const personName = () => `${pick(FIRST_A)}${pick(FIRST_B)} ${pick(SURNAME)}`;
export const dungeonName = () => `${pick(DUNGEON_KIND)} of the ${adjNoun()}`;
export const factionName = () => `The ${pick(FACTION_A)} of the ${adjNoun()}`;
export const itemName = () => `${pick(ITEM_A)} of the ${adjNoun()}`;
export const eventName = () => `The ${pick(EVENT_A)} of ${chance(0.5) ? townName() : 'the ' + adjNoun()}`;
export const creatureName = () => `${pick(CREATURE_A)} ${pick(CREATURE_B)}`;
export const regionName = () => chance(0.5) ? `The ${pick(ADJ)} ${pick(['Marches', 'Reaches', 'Coast', 'Lowlands', 'Highlands', 'Expanse', 'Wilds', 'Frontier'])}` : worldName();

/* Link to a random existing entry of a category, or fall back to plain text. */
function linkTo(category, fallback) {
  const options = state.project.entries.filter((e) => e.category === category);
  if (options.length && chance(0.75)) return `[[${pick(options).title}]]`;
  return fallback;
}

/* ---------------- stat helpers ---------------- */

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const SKILLS = ['Perception', 'Stealth', 'Athletics', 'Arcana', 'Deception', 'Insight', 'Intimidation',
  'Survival', 'Persuasion', 'History', 'Medicine', 'Sleight of Hand'];
const LANGUAGES = ['Common', 'Elvish', 'Dwarvish', 'Orcish', 'Draconic', 'Infernal', 'Sylvan', 'Thieves\' Cant'];

function rollAbilities(stats, favor = []) {
  for (const a of ABILITIES) {
    let v = 8 + randInt(0, 8);
    if (favor.includes(a)) v = Math.min(20, v + randInt(2, 5));
    stats[a] = String(v);
  }
}

const WEAPONS = [
  { n: 'Dagger', d: '1d4', t: 'piercing' }, { n: 'Shortsword', d: '1d6', t: 'piercing' },
  { n: 'Longsword', d: '1d8', t: 'slashing' }, { n: 'Mace', d: '1d6', t: 'bludgeoning' },
  { n: 'Battleaxe', d: '1d8', t: 'slashing' }, { n: 'Quarterstaff', d: '1d6', t: 'bludgeoning' },
  { n: 'Rapier', d: '1d8', t: 'piercing' }, { n: 'Light Crossbow (range 80 ft)', d: '1d8', t: 'piercing' },
  { n: 'Shortbow (range 80 ft)', d: '1d6', t: 'piercing' }
];

function weaponAction(bonusMin, bonusMax, dmgBonus) {
  const w = pick(WEAPONS);
  return `${w.n}. +${randInt(bonusMin, bonusMax)} to hit, ${w.d}${dmgBonus > 0 ? '+' + dmgBonus : ''} ${w.t} damage.`;
}

/* ---------------- entry generators ---------------- */

function genNPC() {
  const e = newEntry('npc', personName());
  const race = pick(['Human', 'Human', 'Elf', 'Dwarf', 'Halfling', 'Half-Orc', 'Gnome', 'Tiefling', 'Half-Elf', 'Dragonborn']);
  const role = pick(['Innkeeper', 'Blacksmith', 'Sellsword', 'Court Wizard', 'Thief', 'Priest', 'Merchant',
    'Scholar', 'Captain of the Guard', 'Hedge Witch', 'Bard', 'Hunter', 'Alchemist', 'Noble', 'Spy',
    'Sailor', 'Gravedigger', 'Assassin', 'Healer', 'Beggar King', 'Ratcatcher', 'Fortune Teller']);
  e.fields['Race'] = race;
  e.fields['Role / Class'] = role;
  e.fields['Alignment'] = pick(['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE']);
  e.fields['Attitude (Friend / Foe)'] = pick(['Friend', 'Friend', 'Neutral', 'Neutral', 'Foe', 'Unpredictable']);
  e.fields['Affiliation'] = linkTo('faction', pick(['None', 'The local temple', 'A merchant guild', 'The city watch', 'An old adventuring party']));

  const lvl = randInt(1, 10);
  const caster = /Wizard|Witch|Priest|Alchemist|Fortune/.test(role);
  rollAbilities(e.stats, caster ? ['INT', 'WIS'] : ['STR', 'DEX']);
  e.stats['Armor Class'] = String(10 + randInt(0, 6));
  e.stats['Hit Points'] = String(lvl * (5 + randInt(1, 4)));
  e.stats['Speed'] = '30 ft';
  e.stats['Challenge / Level'] = 'Level ' + lvl;
  e.stats['Skills'] = pickN(SKILLS, 2).map((s) => `${s} +${randInt(2, 6)}`).join(', ');
  e.stats['Senses'] = 'Passive Perception ' + (10 + randInt(0, 5));
  e.stats['Languages'] = pickN(LANGUAGES, randInt(1, 3)).join(', ');
  e.stats['Actions & Attacks'] = weaponAction(2, 6, randInt(0, 3)) +
    (caster ? `\n${pick(['Fire Bolt', 'Ray of Frost', 'Eldritch Blast', 'Sacred Flame'])}. +${randInt(4, 7)} to hit, ${pick(['1d10 fire', '1d8 cold', '1d10 force', '1d8 radiant'])} damage.` : '');
  if (chance(0.5)) e.stats['Traits & Abilities'] = pick([
    'Silver Tongue. Advantage on Persuasion checks in their home town.',
    'Old Wound. Speed drops to 20 ft in cold weather.',
    'Keen Eyes. Advantage on Perception checks relying on sight.',
    'Underworld Contacts. Can find a buyer for anything within a day.',
    'Iron Will. Advantage on saves against being frightened.'
  ]);

  const looks = pick(['weathered', 'wiry', 'broad-shouldered', 'gaunt', 'round-faced', 'scarred', 'elegant', 'stooped']);
  const feature = pick(['a milky left eye', 'a braided beard threaded with rings', 'ink-stained fingers',
    'a brand hidden under one sleeve', 'a voice like gravel', 'an easy, dangerous smile',
    'a missing ear', 'immaculate clothes a decade out of fashion']);
  const manner = pick(['never sits with their back to a door', 'quotes dead poets mid-sentence',
    'taps the table when lying', 'feeds every stray animal they meet', 'laughs at the wrong moments',
    'collects debts and grudges with equal care', 'hums old war marches while working']);
  const secret = pick(['owes a debt to', 'is secretly working for', 'once betrayed', 'is hiding from',
    'is the last living witness of', 'stole something precious from']);
  const secretTarget = linkTo('faction', linkTo('npc', 'someone powerful'));
  e.body = `# Appearance\nA ${looks} ${race.toLowerCase()} with ${feature}.\n\n# Personality\n` +
    `${e.title.split(' ')[0]} ${manner}.\n\n# Secret\nThey ${secret} ${secretTarget}. ` +
    pick(['Nobody in town suspects a thing.', 'The truth would ruin them.', 'They will pay well to keep it quiet.', 'It is only a matter of time before it surfaces.']);
  return e;
}

function genLocation() {
  const type = pick(['City', 'Town', 'Village', 'Fortress', 'Ruin', 'Port', 'Monastery', 'Mining Camp', 'Hidden Enclave', 'Trading Post']);
  const name = type === 'Ruin' ? `Ruins of ${townName()}` : townName();
  const e = newEntry('location', name);
  e.fields['Type'] = type;
  e.fields['Population'] = type === 'Ruin' ? 'Abandoned' :
    String(randInt(1, 9) * (type === 'City' ? 1000 : type === 'Town' ? 100 : 10) * randInt(1, 9));
  e.fields['Ruler / Leader'] = type === 'Ruin' ? 'None' : personName();
  e.fields['Parent Region'] = linkTo('location', regionName());

  const known = pick(['its stubborn people', 'a yearly festival of lanterns', 'the finest ale for a hundred miles',
    'a curse nobody speaks of', 'its impossible bridges', 'the bells that ring at odd hours',
    'salt-crusted shipwrecks', 'a market where anything can be bought']);
  const trouble = pick(['Something has been taking livestock at night.', 'The old ' + pick(['mine', 'temple', 'well', 'lighthouse']) + ' has been sealed for a generation — until last week.',
    'Two families are one insult away from open bloodshed.', 'Taxes have tripled and nobody knows why.',
    'Travellers keep arriving. None of them leave.', 'The ruler has not been seen in months.']);
  e.body = `# Overview\n${name} is a ${type.toLowerCase()} known for ${known}.\n\n# Current Trouble\n${trouble}\n\n# Hook\n` +
    pick(['A generous reward is posted on the notice board.', 'A desperate letter reaches the party.',
      'The road passes straight through — there is no way around.', `${personName()} begs the party for help.`]);
  return e;
}

function genFaction() {
  const e = newEntry('faction', factionName());
  e.fields['Type'] = pick(['Knightly Order', 'Thieves\' Guild', 'Merchant Consortium', 'Cult', 'Mage Circle',
    'Mercenary Company', 'Rebel Movement', 'Noble House', 'Druidic Circle', 'Assassins\' Brotherhood', 'Secret Society']);
  e.fields['Leader'] = personName();
  e.fields['Headquarters'] = linkTo('location', townName());
  e.fields['Goal'] = pick(['Restore a deposed bloodline', 'Corner the trade in a rare good', 'Awaken something buried',
    'Protect the realm from what is coming', 'Erase a historical truth', 'Overthrow the current order',
    'Amass forbidden knowledge', 'Avenge a massacre the world forgot']);
  const method = pick(['blackmail and patience', 'coin and contracts', 'blades in the dark', 'sermons and fear',
    'ancient law twisted cleverly', 'genuine good works — mostly', 'smuggling routes and safe houses']);
  const rival = linkTo('faction', 'a rival power');
  e.body = `# Methods\nThey work through ${method}.\n\n# Relations\nOpenly at odds with ${rival}. ` +
    pick(['A truce holds, barely.', 'Blood has already been spilled.', 'Both sides court the same patron.', 'Neither can afford open war.']) +
    `\n\n# Rumor\n` + pick(['Initiates are marked somewhere hidden.', 'Their leader answers to someone else entirely.',
      'They know every secret worth knowing in the capital.', 'Half their membership does not know the true goal.']);
  return e;
}

function genItem() {
  const e = newEntry('item', itemName());
  const kind = pick(['Weapon', 'Weapon', 'Armor', 'Wondrous Item', 'Staff', 'Potion', 'Tome', 'Artifact']);
  const rarity = pick(['Common', 'Common', 'Uncommon', 'Uncommon', 'Rare', 'Rare', 'Very Rare', 'Legendary']);
  e.fields['Type'] = kind;
  e.fields['Rarity'] = rarity;
  e.fields['Value'] = { Common: randInt(5, 50), Uncommon: randInt(50, 500), Rare: randInt(500, 5000), 'Very Rare': randInt(5000, 50000), Legendary: 'Priceless' }[rarity] + (rarity === 'Legendary' ? '' : ' gp');
  e.fields['Current Owner'] = linkTo('npc', pick(['Unknown', 'Lost', personName()]));

  if (kind === 'Weapon') {
    const w = pick(WEAPONS);
    const plus = rarity === 'Common' ? 0 : rarity === 'Uncommon' ? 1 : randInt(1, 3);
    e.stats['Damage'] = `${w.d}${plus ? '+' + plus : ''} ${w.t}`;
    if (/range/.test(w.n)) e.stats['Range'] = '80/320 ft';
    e.stats['Weight'] = randInt(1, 6) + ' lb';
  } else if (kind === 'Armor') {
    e.stats['Armor Bonus'] = 'AC ' + randInt(12, 18);
    e.stats['Weight'] = randInt(8, 55) + ' lb';
  } else {
    e.stats['Charges'] = String(randInt(1, 7));
    e.stats['Weight'] = randInt(1, 4) + ' lb';
  }
  e.stats['Attunement'] = chance(0.5) ? 'Required' : 'No';
  e.stats['Properties & Effects'] = pickN([
    'Glows faintly when undead are within 60 ft.',
    'The bearer can speak and understand one extra language of their choice at dawn.',
    'Once per day, reroll a failed saving throw.',
    'Whispers the name of the last person to touch it.',
    'Cannot be dropped against the bearer\'s will.',
    'Grows cold near lies spoken aloud.',
    'Advantage on initiative rolls.',
    'The wielder\'s shadow moves a half-second late.'
  ], randInt(1, 3)).join('\n');

  e.body = `# History\nForged ${pick(['in a forgotten age', 'by a master long dead', 'as one of a matched pair', 'as payment for an unpayable debt'])}, ` +
    `it last surfaced during ${linkTo('event', 'a war nobody remembers')}.\n\n# Whereabouts\n` +
    pick(['Collectors would kill for it — some already have.', 'It changes hands every few years, always violently.',
      'Its current resting place is guarded by more than locks.', 'It wants to be found.']);
  return e;
}

function genEvent() {
  const e = newEntry('event', eventName());
  e.fields['Date / Era'] = `Year ${randInt(80, 1400)} of the ${pick(['Third Age', 'Sundered Era', 'Age of Ash', 'Dawn Years', 'Old Calendar', 'Empire'])}`;
  e.fields['Location'] = linkTo('location', townName());
  e.fields['Participants'] = `${linkTo('faction', factionName())} against ${linkTo('faction', 'a coalition of free towns')}`;
  e.fields['Outcome'] = pick(['Decisive victory', 'Pyrrhic victory', 'Stalemate and treaty', 'Total collapse', 'Disappearance — no bodies were found', 'Both leaders slain']);
  e.body = `# What Happened\n` +
    pick(['It began with a wedding and ended with a burning fleet.', 'Three armies met; only one marched home.',
      'A single broken promise unmade fifty years of peace.', 'To this day nobody agrees who struck first.']) +
    `\n\n# Consequences\n` +
    pick(['Borders drawn that day still stand.', 'The victors wrote the histories — badly.',
      'A bloodline ended, and another quietly began.', 'The land itself has never fully healed.']) +
    `\n\n# Legacy\nVeterans ${pick(['still refuse to speak of it', 'gather every year in silence', 'are dying off — and their secret with them', 'swear something else was on that field'])}.`;
  return e;
}

function genCreature() {
  const e = newEntry('creature', creatureName());
  const type = pick(['Beast', 'Undead', 'Dragon', 'Fiend', 'Aberration', 'Construct', 'Elemental', 'Fey', 'Giant', 'Monstrosity', 'Ooze', 'Plant']);
  const tier = randInt(1, 5);
  const tierName = ['Low', 'Moderate', 'Dangerous', 'Deadly', 'Legendary'][tier - 1];
  e.fields['Type'] = type;
  e.fields['Threat Level'] = tierName;
  e.fields['Habitat'] = pick(['Deep forest', 'Sewers and cellars', 'Ruined temples', 'High mountain passes',
    'Coastal caves', 'Cursed marshland', 'Anywhere the dead are buried', 'Old battlefields', 'Underground lakes', 'Frozen wastes']);
  e.fields['Weakness'] = pick(['Fire', 'Silvered weapons', 'Sunlight', 'Cold iron', 'Radiant magic', 'Loud noise', 'Running water', 'None known']);
  e.fields['Attitude (Friend / Foe)'] = pick(['Foe', 'Foe', 'Foe', 'Territorial', 'Neutral if unprovoked']);

  rollAbilities(e.stats, tier >= 3 ? ['STR', 'CON'] : []);
  e.stats['Armor Class'] = String(10 + tier + randInt(0, 3));
  e.stats['Hit Points'] = String([randInt(10, 30), randInt(30, 60), randInt(60, 120), randInt(120, 200), randInt(200, 320)][tier - 1]);
  e.stats['Speed'] = pick(['30 ft', '40 ft', '30 ft, climb 30 ft', '30 ft, fly 60 ft', '20 ft, swim 40 ft', '50 ft']);
  e.stats['Challenge / Level'] = 'CR ' + [randInt(0, 1), randInt(2, 4), randInt(5, 8), randInt(9, 14), randInt(15, 22)][tier - 1];
  e.stats['Senses'] = pick(['Darkvision 60 ft', 'Darkvision 120 ft', 'Blindsight 30 ft', 'Tremorsense 60 ft']) + ', Passive Perception ' + (10 + tier + randInt(0, 3));
  e.stats['Resistances / Immunities'] = tier >= 3 ? pick(['Nonmagical weapons', 'Poison; charmed', 'Cold and necrotic', 'Fire', 'Psychic; frightened']) : '';
  const hit = 3 + tier + randInt(0, 2);
  const dmgBonus = tier + randInt(0, 3);
  e.stats['Actions & Attacks'] =
    `${pick(['Bite', 'Claw', 'Slam', 'Gore', 'Tail Lash'])}. +${hit} to hit, ${tier}d${pick([6, 8, 10])}+${dmgBonus} ${pick(['piercing', 'slashing', 'bludgeoning'])} damage.` +
    (tier >= 2 ? `\n${pick(['Poison Spit', 'Fear Howl', 'Acid Breath', 'Grave Chill', 'Web Snare'])} (recharge 5–6). ${tier}d6 ${pick(['poison', 'psychic', 'acid', 'necrotic', 'cold'])} damage in a ${pick(['15 ft cone', '20 ft line', '10 ft radius'])}, DC ${10 + tier + 2} save for half.` : '');
  e.stats['Traits & Abilities'] = pick([
    'Ambusher. Advantage on attack rolls against surprised creatures.',
    'Pack Tactics. Advantage when an ally is within 5 ft of the target.',
    'Regeneration. Recovers ' + tier * 5 + ' HP at the start of its turn unless burned.',
    'Unnerving Stillness. Indistinguishable from a statue/corpse/plant while motionless.',
    'Burrower. Can move through loose earth, leaving a tunnel.'
  ]);

  e.body = `# Description\n` +
    pick(['It moves wrong — too many joints, or too few.', 'Larger than the stories say, and quieter.',
      'Its hide is scarred by weapons that clearly failed.', 'You smell it long before you see it.']) +
    `\n\n# Behavior\n` +
    pick(['Hunts alone, eats alone, hoards alone.', 'Herds its prey for days before striking.',
      'Mimics the cries of the wounded.', 'Marks its territory with careful, deliberate ruin.', 'Serves something older that sleeps below.']) +
    `\n\n# Lore\n${pick(['Local hunters', 'The old songs', 'Survivors — both of them', 'Village elders'])} say ` +
    pick(['it cannot cross running water.', 'it was human once.', 'killing it only makes another.',
      'it answers to a name, if you dare speak it.', 'its hoard holds ' + `[[${itemName()}]].`]);
  return e;
}

/* ---------------- map-weaving helpers ---------------- */

/* A location entry for a settlement the map generator placed. */
export function locationEntryFor(name, type) {
  const e = genLocation();
  e.title = name;
  e.fields['Type'] = type;
  if (type === 'Capital' || type === 'City') {
    e.fields['Population'] = String(randInt(4, 30) * 1000);
  } else if (type === 'Village' || type === 'Watchtower') {
    e.fields['Population'] = String(randInt(4, 60) * 10);
  }
  return e;
}

const ROOM_TITLES = {
  entry: 'Entrance', throne: 'Throne Room', crypt: 'Crypt', storage: 'Storeroom',
  library: 'Library', shrine: 'Shrine', prison: 'Cells', lair: 'Lair',
  quarters: 'Living Quarters', hall: 'Great Hall', flooded: 'Flooded Chamber',
  cavern: 'Cavern', grotto: 'Grotto', pool: 'Underground Pool', nave: 'Nave',
  apse: 'Sanctum', chapel: 'Side Chapel', alcove: 'Burial Alcove'
};

const ROOM_DESC = {
  entry: ['Dust, old footprints, and the last daylight your party will see for a while.',
    'Rubble half-blocks the way in. Something cleared a path through it recently.'],
  throne: ['A cold seat of power. Whatever ruled here may not have left.',
    'Tattered banners still hang above the dais.'],
  crypt: ['Stone lids lie askew. Not all of these graves are still occupied.',
    'The air is dry and tastes of old incense.'],
  storage: ['Barrels and crates, mostly rotted. Mostly.',
    'Supplies for a garrison that never returned.'],
  library: ['Swollen books and one desk that has clearly been used recently.',
    'Shelves lean like drunks. A few volumes may still be legible.'],
  shrine: ['An altar to something the locals no longer name.',
    'Offerings lie fresh on the altar. Someone still comes here.'],
  prison: ['Rusted cages. One door hangs open from the inside.',
    'Scratches on the wall count days — hundreds of them.'],
  lair: ['Bones, ash, and a nest of torn bedding. Occupied.',
    'The smell announces the occupant before the light does.'],
  quarters: ['Someone lived here once — someone with simple taste and a heavy lock.',
    'A bed, a table, and the sense of being watched.'],
  hall: ['Echoes carry far here. So does torchlight.',
    'Pillars march into the dark.'],
  flooded: ['Black water, knee-deep and cold. The floor beneath is uneven.',
    'Drips echo. Something moved the surface just now.'],
  cavern: ['The ceiling vanishes into darkness overhead.',
    'Natural stone, worked by nothing but time and water.'],
  grotto: ['Pale fungi light the walls with a faint glow.',
    'A hidden pocket of the underworld, strangely peaceful.'],
  pool: ['Still, dark water of unknown depth.',
    'The pool reflects your torches — and briefly, something else.'],
  nave: ['A processional hall built for worship at scale.',
    'Faded frescoes cover the vaulted walls.'],
  apse: ['The holiest ground in this place, and the most defended.',
    'The altar here has been used more recently than the dust suggests.'],
  chapel: ['A small shrine off the main hall.',
    'A side chamber for private devotions — or private meetings.'],
  alcove: ['Burial niches line the walls, floor to ceiling.',
    'Name-plates worn too smooth to read.']
};

const ROOM_HOOKS = [
  'A successful Perception check reveals a loose flagstone hiding a small cache.',
  'Tracks here are fresher than they should be.',
  'One of the walls sounds hollow when tapped.',
  'Anyone lingering hears faint chanting through the stone.',
  'A dropped journal page hints at what happened here.',
  'Disturbing anything here has a chance of waking the neighbors.'
];

/* Markdown room key for a generated dungeon. */
export function roomKeyBody(dungeonTitle, rooms) {
  let out = `The keyed rooms of **${dungeonTitle}**.\n`;
  for (const r of rooms) {
    const title = ROOM_TITLES[r.theme] || 'Chamber';
    const desc = pick(ROOM_DESC[r.theme] || ROOM_DESC.hall);
    out += `\n# ${r.n}. ${title}\n${desc}`;
    if (chance(0.4)) out += ` ${pick(ROOM_HOOKS)}`;
    out += '\n';
  }
  return out;
}

export function generateEntry(category) {
  switch (category) {
    case 'npc': return genNPC();
    case 'location': return genLocation();
    case 'faction': return genFaction();
    case 'item': return genItem();
    case 'event': return genEvent();
    case 'creature': return genCreature();
    default: return generateEntry(pick(['npc', 'location', 'faction', 'item', 'event', 'creature']));
  }
}
