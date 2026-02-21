# 花 园 Huayuan

A terminal garden game for learning Chinese and Vim.

```
  ⌠           ᴗ          ◞        ⸦∙▓
 <∙▓         '∙'        <∘@         ░
  ⁑░▒▓╱      ░▒▓ᗕ       ░░▒▓◸     ░▒▓▓◜
   ⸔⸔         ╯╯       ~ ~≈~~≈≈~   ᨓ
 Robin      Sparrow      Duck      Goose
 知更鸟       麻雀        鸭子       鹅
```

Grow plants, talk to birds, learn characters. Huayuan is a quiet little game
where you tend a garden using Vim keybindings while picking up Chinese
vocabulary along the way. Plants start as sprouts and grow into hanzi --
cross-pollinate them to discover hybrids with increasingly complex characters.
Birds visit your garden and quiz you in Mandarin.

```
 ◦ → 芽 → ⚜ → ❀ → 花     seed to flower
 ◦ → 芽 → ↟ → ♣ → 木     seed to tree
 花 × 木 → 果              hybridize for new species
 果 × _ → 桃 → ... → 蘭    keep going
```

It's a niche thing -- if you're learning both Vim and Chinese, or just want
a calm terminal game with some character recognition practice, this might be
for you.

## Screenshots

![Title screen](https://raw.githubusercontent.com/cixzhang/huayuan/main/screenshots/title.png)

![A mature garden](https://raw.githubusercontent.com/cixzhang/huayuan/main/screenshots/garden.png)

![Lake map](https://raw.githubusercontent.com/cixzhang/huayuan/main/screenshots/lake.png)

## Install

```bash
npm install -g huayuan
huayuan
```

Or run without installing:

```bash
npx huayuan
```

Or clone and run from source:

```bash
git clone https://github.com/cixzhang/huayuan.git
cd huayuan
npm install
npm start
```

Requires Node.js 18+ and a terminal that supports Unicode and 256 colors.

## How to Play

Movement and actions use Vim keybindings:

| Key | Action |
|-----|--------|
| `h` `j` `k` `l` | Move cursor |
| `w` `b` | Jump right / left |
| `space` | Use current tool |
| `tab` | Cycle tools (plant / water / harvest) |
| `s` | Switch seed type |
| `v` | Enter visual mode (select region) |
| `t` | Talk to a nearby bird |
| `?` | Help |
| `:w` | Save |
| `:q` | Quit |

### Tools

- **Plant** -- place a seed on soil
- **Water** -- water the ground (plants need water to grow)
- **Harvest** -- collect seeds from mature plants

### Growing Plants

Plants progress through stages: seed `◦` → sprout `芽` → growing → flowering → hanzi.
Each species ends as a Chinese character -- grass becomes `草`, flowers become `花`,
trees become `木`.

### Cross-Pollination

Place two different mature plants next to each other and harvest to get hybrid seeds.
There are 4 tiers of hybrids, culminating in the orchid `蘭`.

| Hybrid | Parents | Character |
|--------|---------|-----------|
| fang (fragrant) | grass + flower | 芳 |
| miao (seedling) | grass + tree | 苗 |
| guo (fruit) | flower + tree | 果 |
| cha (tea) | fang + any | 茶 |
| zhu (bamboo) | miao + any | 竹 |
| tao (peach) | guo + any | 桃 |
| ju (chrysanthemum) | cha + any | 菊 |
| mei (plum blossom) | tao + any | 梅 |
| lan (orchid) | ju + any | 蘭 |

### Birds

Four bird species visit your garden. Walk next to one and press `t` to
start a conversation -- they'll quiz you in Chinese (HSK 3 level).
Answer correctly to earn seeds.

### Maps

When starting a new game, choose from three maps:

- **Beach** -- ocean shore with a river delta and sandy beach
- **Lake** -- large central lake with an island
- **River** -- winding river with a forest (the classic)

### Terrain

Use `:terraform soil`, `:terraform sand`, or `:terraform river` to change
terrain. In visual mode, select a region first then terraform to change
the whole area.

## Settings

Settings are available from the title screen (press `2`):

- **Sound** -- toggle ambient sounds and bird chirps
- **Weather FX** -- toggle rain/wind particle effects
- **Pinyin** -- show or hide pinyin in dialog answers

### Custom Dialog

If you set the `ANTHROPIC_API_KEY` environment variable, you can generate
custom bird dialog at different HSK levels and topics from the settings menu.

## Data

All user data is stored in your home directory:

- `~/.huayuan-save.json` -- game save
- `~/.huayuan-settings.json` -- settings
- `~/.huayuan-dialog.json` -- generated dialog (if any)

## License

ISC
