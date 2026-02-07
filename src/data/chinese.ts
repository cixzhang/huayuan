export interface VocabEntry {
  hanzi: string;
  pinyin: string;
  english: string;
}

export const VOCAB: Record<string, VocabEntry> = {
  '草': { hanzi: '草', pinyin: 'cǎo', english: 'grass' },
  '花': { hanzi: '花', pinyin: 'huā', english: 'flower' },
  '木': { hanzi: '木', pinyin: 'mù', english: 'tree' },
  '芽': { hanzi: '芽', pinyin: 'yá', english: 'sprout/bud' },
  '水': { hanzi: '水', pinyin: 'shuǐ', english: 'water' },
  '土': { hanzi: '土', pinyin: 'tǔ', english: 'soil/earth' },
  '种': { hanzi: '种', pinyin: 'zhòng', english: 'to plant/seed' },
  '园': { hanzi: '园', pinyin: 'yuán', english: 'garden' },
  '雨': { hanzi: '雨', pinyin: 'yǔ', english: 'rain' },
  '叶': { hanzi: '叶', pinyin: 'yè', english: 'leaf' },
  '晴': { hanzi: '晴', pinyin: 'qíng', english: 'clear/sunny' },
  '云': { hanzi: '云', pinyin: 'yún', english: 'cloud' },
  '风': { hanzi: '风', pinyin: 'fēng', english: 'wind' },
  '夜': { hanzi: '夜', pinyin: 'yè', english: 'night' },
  '阳': { hanzi: '阳', pinyin: 'yáng', english: 'sun/sunlight' },
  '雷': { hanzi: '雷', pinyin: 'léi', english: 'thunder' },
  '芳': { hanzi: '芳', pinyin: 'fāng', english: 'fragrant' },
  '苗': { hanzi: '苗', pinyin: 'miáo', english: 'seedling' },
  '果': { hanzi: '果', pinyin: 'guǒ', english: 'fruit' },
  '茶': { hanzi: '茶', pinyin: 'chá', english: 'tea' },
  '竹': { hanzi: '竹', pinyin: 'zhú', english: 'bamboo' },
  '桃': { hanzi: '桃', pinyin: 'táo', english: 'peach' },
  '菊': { hanzi: '菊', pinyin: 'jú', english: 'chrysanthemum' },
  '梅': { hanzi: '梅', pinyin: 'méi', english: 'plum blossom' },
  '蘭': { hanzi: '蘭', pinyin: 'lán', english: 'orchid' },
};

export function lookupChar(char: string): VocabEntry | undefined {
  return VOCAB[char];
}
