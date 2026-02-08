# Dialog Guidelines

Best practices for writing bird dialog trees in `src/data/dialog.ts`.

## Answer Options

- When asking "what does X mean?", show **only English translations** in answer options. Leave the `text` field empty and put the English in `english`.
- Do **not** put the answer in the question text. For example, don't ask "早上好 is said when?" where "早上" is an answer option.
- Incorrect options should be plausible but clearly wrong to someone who knows the vocabulary.

## Question Structures

Vary the types of questions used:

- **Meaning**: "X是什么意思？" — options show English only
- **Antonym**: "X的反义词是什么？" — options show Chinese + pinyin
- **Fill-in**: "植物需要什么？" — options show Chinese + pinyin
- **Situational**: "打雷的时候应该怎么做？" — options show Chinese + pinyin

## Vocabulary Level

- Target HSK 3 vocabulary
- Include pinyin on all Chinese text in `lines`, `question`, and `options` fields
- Use common everyday words and scenarios

## Text Length

- Keep speech lines under 24 characters to minimize wrapping in the dialog box
- Question text should fit within one or two lines
- Answer options should be concise (under 20 characters)

## Seed Rewards

- Use the `SeedRewardType` union type for `seedReward`
- Use `'random_base'` for generic rewards (grass, flower, tree)
- Use `'random_hybrid'` for rarer rewards when answering harder questions
- Use specific species IDs (e.g. `'lotus'`, `'cha'`) when thematically appropriate

## Dialog Structure

Each dialog tree has:
1. `lines` — 1-3 speech lines the bird says before the question
2. `question` — the quiz question
3. `options` — exactly 3 answer choices, one correct
4. `followup` — text shown after a correct answer
5. `seedReward` — the seed type awarded for correct answers

## Conditions

Use `conditions` to make dialogs context-sensitive:
- `weather` — only show during specific weather
- `isNight` — only show during day or night
- `minPlants` / `maxPlants` — based on garden size
