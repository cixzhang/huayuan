# wav-maker

Interactive TUI for browsing, previewing, tweaking, and saving sound parameters.

## Usage

```bash
npm run wav-maker
```

Or directly:

```bash
npx tsx tools/wav-maker.ts
```

## Controls

### Browse view

| Key | Action |
|-----|--------|
| `j` / `k` / arrows | Navigate sounds |
| `space` | Play selected sound |
| `enter` | Edit sound parameters |
| `q` | Quit |

### Edit view

| Key | Action |
|-----|--------|
| `j` / `k` / arrows | Navigate parameters |
| `h` / `l` / left / right | Coarse adjust |
| `H` / `L` | Fine adjust |
| `space` | Preview with current params |
| `s` | Save to `src/audio/soundParams.ts` |
| `esc` | Back to browse |
| `q` | Quit |

## Sounds

15 sounds in 3 categories:

- **ambient**: day_clear, day_rain, day_wind, day_cloudy, night_clear, night_rain, night_wind, night_cloudy
- **chirp**: robin, sparrow, duck, goose
- **sfx**: plant_sfx, water_sfx, harvest_sfx

Saving writes the updated parameters to `src/audio/soundParams.ts` (auto-generated, do not edit by hand).

Requires macOS (`afplay`) for playback.
