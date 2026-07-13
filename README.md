# RPG Dungeon Desk

A desktop RPG map maker and world builder — think Inkarnate crossed with World Anvil.
Draw world maps, towns and dungeons, then flesh out the lore behind every place with a
built-in World Codex, and connect the two with lore pins.

## ⬇️ Download

**[Download the Windows installer (v2.0.0)](https://github.com/a44kaliburll/RPG-DungeonDesk/releases/latest)** — no build tools needed.

The installer is unsigned, so Windows SmartScreen will warn on first run: click
**More info → Run anyway**. Installs per-user (no admin rights) with desktop and
Start-menu shortcuts.

## Features

**Map making**
- Four map types: **World**, **Region**, **Town** and **Dungeon**
- Terrain painting with 17 textured biome brushes (grass, forest, jungle, taiga, desert, snow, ice, swamp, shallows, deep ocean, ashlands…)
- **120+ hand-drawn stamps**, filtered per map type — including map dressing (compass roses, scale bars, title cartouches), waterfalls, oases, krakens, shipwrecks, wizard towers, war camps, mimics, summoning circles, and more
- **Tint any stamp** (hue / color / light sliders) and **import your own PNG images** as stamps — they're saved inside the project file
- **Power editing**: box-select & multi-select, group move, copy/paste (even across maps), select-all, layer visibility toggles, freehand path drawing, hex grid overlay, and map-wide themes (Aged Parchment, Grimdark, Vibrant)
- Label fonts, rotation, and full custom color pickers
- Path tools: roads, rivers, walls, borders, **trade routes**, **hazard routes** and travel routes (smoothed, styled per type)
- Dungeon tile brush with stone/wood/carpet floors, automatic walls, doors that orient themselves, water/lava/pits, grid snapping
- **Random map generation 2.0** (🎲 Generate): fractal-noise worlds with real coastlines (inked, with shallow-water rims), elevation-aware rivers that flow downhill to the sea, climate-driven biome placement, kingdom borders with tinted territories, pathfinding roads that route around mountains and water, settlement hierarchies (capital → ports → villages), sea & mountain-range names. **Presets** (Archipelago, Lone Continent, Inland Sea, Frozen North, Desert World), **sliders** (land, mountains, forests, rivers, settlements) and **seeds** — the same seed always rebuilds the same map.
- **Town generator**: curved main streets with branches, districts (market, temple, smithy, inn), optional river with auto-placed bridges, walls with gatehouses, four town presets from fishing village to walled capital.
- **Dungeon generator**: four algorithms — Rooms & Corridors, **Natural Caves** (cellular automata), **Catacombs Maze**, and symmetric **Sunken Temple** — with secret doors, treasure/trap dials, numbered rooms, and **multi-level dungeons** generated as linked maps.
- **Weave into codex**: one checkbox makes the generator write location entries + lore pins for every settlement, and full **room-key entries** describing every numbered dungeon room.
- All generated content is ordinary editable stamps/paths/tiles/labels — and fully undoable.
- Text labels with halo lettering, scatter stamping for natural forests
- Pan / zoom / fit, undo & redo, duplicate, z-ordering, per-map background styles
- Export any map as a **PNG**

**World building (Codex)**
- Entry categories with templates: Locations, NPCs, Factions, Items, History, Creatures, Notes
- **Stat blocks** on NPCs, Creatures and Items: AC/HP/Speed/Challenge, six ability scores with auto-calculated modifiers, skills/senses/languages/resistances, traits and actions — items get damage/range/weight/charges/attunement. Rendered as a formatted block in preview and in the HTML export
- **Random entry generator** (🎲 Random Entry): rolls complete NPCs, Locations, Factions, Items, History events and Creatures — fantasy names, filled template fields, full stat blocks, and lore that automatically cross-links to entries you already have
- Markdown-ish lore text: `# headings`, `**bold**`, `*italic*`, `- lists`
- `[[Cross Links]]` between entries — click a missing link to create the entry on the spot
- Automatic **backlinks** ("Mentioned in") and **map references** ("On the map")
- **Lore pins**: drop a pin on any map and link it to a codex entry; double-click the pin to read it
- Export the whole world (all maps + all lore, cross-linked) as a single **HTML handout** for players

**Projects**
- Everything saves into a single `.rpgworld` file (File → Save, Ctrl+S)
- Crash-recovery autosave restores your session on restart

## Shortcuts

| Key | Action |
|---|---|
| V / H / B / S / P / T / I | Select / Pan / Brush / Stamps / Paths / Labels / Pins |
| Space + drag, middle-drag | Pan |
| Mouse wheel | Zoom |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Ctrl+D | Duplicate selection |
| Del | Delete selection |
| Enter / Esc | Finish / cancel path |
| Ctrl+S / Ctrl+O / Ctrl+E | Save / Open / Export PNG |

## Development

```bash
npm install
npm start            # run the desktop app
node tools/dev-server.js 8123   # optional: UI-only in a browser
```

## Building the installer

```bash
npm run dist
```

Produces `dist/RPG Dungeon Desk Setup 1.0.0.exe` — an NSIS installer with desktop and
start-menu shortcuts. The installer is unsigned, so Windows SmartScreen will ask for
confirmation the first time you run it ("More info" → "Run anyway").

## Tech

Electron + vanilla JS + HTML5 Canvas. No runtime dependencies, no assets — all map
art is drawn procedurally in code. Project files are plain JSON.
