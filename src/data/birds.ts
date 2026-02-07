import { BirdType, WeatherType } from '../types.js';
import type { DialogTree, GameState } from '../types.js';
import { HYBRID_SPECIES } from './hybrids.js';

// === Bird Type Definitions ===

export interface BirdTypeDef {
  type: BirdType;
  name: string;
  hanzi: string;
  pinyin: string;
  color256: number;
  isWaterBird: boolean;    // duck & goose can land on water
  art: string[];           // 4-line ASCII art for dialog
  artOnWater: string[];    // variant art when resting on water (water birds only)
}

export const BIRD_TYPES: BirdTypeDef[] = [
  {
    type: BirdType.Robin,
    name: 'Robin',
    hanzi: '知更鸟',
    pinyin: 'zhīgēngniǎo',
    color256: 196,
    isWaterBird: false,
    // 9 chars wide × 4 lines
    art: [
      '  ⌠      ',
      ' <∙▓     ',
      '  ⁑░▒▓╱  ',
      '   ⸔⸔    ',
    ],
    artOnWater: [],
  },
  {
    type: BirdType.Sparrow,
    name: 'Sparrow',
    hanzi: '麻雀',
    pinyin: 'máquè',
    color256: 172,
    isWaterBird: false,
    art: [
      '  ᴗ      ',
      " '∙'     ",
      '  ░▒▓ᗕ   ',
      '   ╯╯    ',
    ],
    artOnWater: [],
  },
  {
    type: BirdType.Duck,
    name: 'Duck',
    hanzi: '鸭子',
    pinyin: 'yāzi',
    color256: 159,
    isWaterBird: true,
    art: [
      '   ◞     ',
      ' <∘@     ',
      '   ░░▒▓◸ ',
      '    ><    ',
    ],
    artOnWater: [
      '   ◞     ',
      ' <∘@     ',
      '   ░░▒▓◸ ',
      '~ ~≈~~≈≈~',
    ],
  },
  {
    type: BirdType.Goose,
    name: 'Goose',
    hanzi: '鹅',
    pinyin: 'é',
    color256: 220,
    isWaterBird: true,
    art: [
      ' ⸦∙▓     ',
      '   ░     ',
      '   ░▒▓▓◜ ',
      '    ᨓ    ',
    ],
    artOnWater: [
      ' ⸦∙▓     ',
      '   ░     ',
      '   ░▒▓▓◜ ',
      '~ ≈~~ ≈~~',
    ],
  },
];

export function getBirdTypeDef(type: BirdType): BirdTypeDef {
  return BIRD_TYPES[type];
}

// === Map Characters ===
// Flying left: alternates ◤ and ◣
// Flying right: alternates ◥ and ◢
// Resting: ◆

export function birdMapChar(birdState: 'flying' | 'resting' | 'leaving', direction: 'left' | 'right', animFrame: number): string {
  if (birdState === 'resting') return '◆';
  const flap = animFrame % 2;
  if (direction === 'left') {
    return flap === 0 ? '◤' : '◣';
  }
  return flap === 0 ? '◥' : '◢';
}

// === Dialog Pool ===

export const DIALOG_POOL: DialogTree[] = [
  // --- Weather dialogs (4) ---
  {
    id: 'weather_rain',
    conditions: { weather: WeatherType.Rain },
    lines: [
      { text: '今天下雨了，我的羽毛都湿了！', pinyin: 'jīntiān xiàyǔ le, wǒ de yǔmáo dōu shī le!' },
      { text: '你有伞吗？', pinyin: 'nǐ yǒu sǎn ma?' },
    ],
    question: { text: '下雨的时候，植物会怎么样？', pinyin: 'xiàyǔ de shíhou, zhíwù huì zěnmeyàng?' },
    options: [
      { text: '植物会得到水', pinyin: 'zhíwù huì dédào shuǐ', english: 'Plants get water', isCorrect: true },
      { text: '植物会飞走', pinyin: 'zhíwù huì fēi zǒu', english: 'Plants fly away', isCorrect: false },
      { text: '植物会说话', pinyin: 'zhíwù huì shuōhuà', english: 'Plants talk', isCorrect: false },
    ],
    followup: { text: '对了！雨水让花园长得更好。', pinyin: 'duì le! yǔshuǐ ràng huāyuán zhǎng de gèng hǎo.' },
    seedReward: 'random_base',
  },
  {
    id: 'weather_sun',
    conditions: { weather: WeatherType.Clear },
    lines: [
      { text: '今天天气真好！阳光很温暖。', pinyin: 'jīntiān tiānqì zhēn hǎo! yángguāng hěn wēnnuǎn.' },
      { text: '我喜欢在太阳下飞。', pinyin: 'wǒ xǐhuan zài tàiyáng xià fēi.' },
    ],
    question: { text: '晴天的时候，天上有什么？', pinyin: 'qíngtiān de shíhou, tiān shàng yǒu shénme?' },
    options: [
      { text: '有雨', pinyin: 'yǒu yǔ', english: 'Rain', isCorrect: false },
      { text: '有太阳', pinyin: 'yǒu tàiyáng', english: 'Sun', isCorrect: true },
      { text: '有雪', pinyin: 'yǒu xuě', english: 'Snow', isCorrect: false },
    ],
    followup: { text: '没错！太阳让一切都很美。', pinyin: 'méi cuò! tàiyáng ràng yīqiè dōu hěn měi.' },
    seedReward: 'flower',
  },
  {
    id: 'weather_wind',
    conditions: { weather: WeatherType.Wind },
    lines: [
      { text: '风好大！我差点飞不动了。', pinyin: 'fēng hǎo dà! wǒ chàdiǎn fēi bù dòng le.' },
      { text: '你不觉得冷吗？', pinyin: 'nǐ bù juéde lěng ma?' },
    ],
    question: { text: '"风"是什么意思？', pinyin: '"fēng" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'Water', isCorrect: false },
      { text: '', pinyin: '', english: 'Wind', isCorrect: true },
      { text: '', pinyin: '', english: 'Fire', isCorrect: false },
    ],
    followup: { text: '对！风有时候很大，有时候很小。', pinyin: 'duì! fēng yǒu shíhou hěn dà, yǒu shíhou hěn xiǎo.' },
    seedReward: 'grass',
  },
  {
    id: 'weather_cloudy',
    conditions: { weather: WeatherType.Cloudy },
    lines: [
      { text: '天上有很多云。', pinyin: 'tiān shàng yǒu hěn duō yún.' },
      { text: '也许一会儿要下雨了。', pinyin: 'yěxǔ yīhuìr yào xiàyǔ le.' },
    ],
    question: { text: '云是什么颜色的？', pinyin: 'yún shì shénme yánsè de?' },
    options: [
      { text: '红色的', pinyin: 'hóngsè de', english: 'Red', isCorrect: false },
      { text: '白色或灰色的', pinyin: 'báisè huò huīsè de', english: 'White or gray', isCorrect: true },
      { text: '绿色的', pinyin: 'lǜsè de', english: 'Green', isCorrect: false },
    ],
    followup: { text: '对了！云有时白有时灰。', pinyin: 'duì le! yún yǒu shí bái yǒu shí huī.' },
    seedReward: 'random_base',
  },

  // --- Garden assessment (4) ---
  {
    id: 'garden_big',
    conditions: { minPlants: 10 },
    lines: [
      { text: '哇，你的花园好大！', pinyin: 'wā, nǐ de huāyuán hǎo dà!' },
      { text: '你种了很多植物。', pinyin: 'nǐ zhòng le hěn duō zhíwù.' },
    ],
    question: { text: '"花园"是什么意思？', pinyin: '"huāyuán" shì shénme yìsi?' },
    options: [
      { text: '花园 = garden', pinyin: 'huāyuán = garden', english: 'Garden', isCorrect: true },
      { text: '花园 = school', pinyin: 'huāyuán = school', english: 'School', isCorrect: false },
      { text: '花园 = kitchen', pinyin: 'huāyuán = kitchen', english: 'Kitchen', isCorrect: false },
    ],
    followup: { text: '你的花园越来越漂亮了！', pinyin: 'nǐ de huāyuán yuèláiyuè piàoliang le!' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'garden_small',
    conditions: { maxPlants: 3 },
    lines: [
      { text: '花园里还很空。', pinyin: 'huāyuán lǐ hái hěn kōng.' },
      { text: '你应该多种一些植物！', pinyin: 'nǐ yīnggāi duō zhòng yīxiē zhíwù!' },
    ],
    question: { text: '"种"是什么意思？', pinyin: '"zhòng" shì shénme yìsi?' },
    options: [
      { text: '吃 (to eat)', pinyin: 'chī', english: 'To eat', isCorrect: false },
      { text: '种 (to plant)', pinyin: 'zhòng', english: 'To plant', isCorrect: true },
      { text: '飞 (to fly)', pinyin: 'fēi', english: 'To fly', isCorrect: false },
    ],
    followup: { text: '对！快去种更多的植物吧。', pinyin: 'duì! kuài qù zhòng gèng duō de zhíwù ba.' },
    seedReward: 'random_base',
  },
  {
    id: 'garden_diverse',
    conditions: { minPlants: 5 },
    lines: [
      { text: '这里有很多不同的植物！', pinyin: 'zhèlǐ yǒu hěn duō bùtóng de zhíwù!' },
      { text: '草、花、还有树，真好看。', pinyin: 'cǎo、huā、hái yǒu shù, zhēn hǎokàn.' },
    ],
    question: { text: '下面哪个是植物？', pinyin: 'xiàmiàn nǎge shì zhíwù?' },
    options: [
      { text: '花 (flower)', pinyin: 'huā', english: 'Flower', isCorrect: true },
      { text: '鸟 (bird)', pinyin: 'niǎo', english: 'Bird', isCorrect: false },
      { text: '石 (stone)', pinyin: 'shí', english: 'Stone', isCorrect: false },
    ],
    followup: { text: '没错！花是很美丽的植物。', pinyin: 'méi cuò! huā shì hěn měilì de zhíwù.' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'garden_water',
    lines: [
      { text: '河边的植物长得最快。', pinyin: 'hé biān de zhíwù zhǎng de zuì kuài.' },
      { text: '水对植物很重要。', pinyin: 'shuǐ duì zhíwù hěn zhòngyào.' },
    ],
    question: { text: '植物需要什么才能长大？', pinyin: 'zhíwù xūyào shénme cái néng zhǎngdà?' },
    options: [
      { text: '水和阳光', pinyin: 'shuǐ hé yángguāng', english: 'Water and sunlight', isCorrect: true },
      { text: '糖和盐', pinyin: 'táng hé yán', english: 'Sugar and salt', isCorrect: false },
      { text: '风和云', pinyin: 'fēng hé yún', english: 'Wind and clouds', isCorrect: false },
    ],
    followup: { text: '对了！别忘了给植物浇水。', pinyin: 'duì le! bié wàng le gěi zhíwù jiāo shuǐ.' },
    seedReward: 'random_base',
  },

  // --- Time of day (3) ---
  {
    id: 'time_night',
    conditions: { isNight: true },
    lines: [
      { text: '天黑了，我想找一个地方睡觉。', pinyin: 'tiān hēi le, wǒ xiǎng zhǎo yīgè dìfang shuìjiào.' },
      { text: '月亮出来了，真漂亮。', pinyin: 'yuèliang chūlái le, zhēn piàoliang.' },
    ],
    question: { text: '"天黑了"是什么意思？', pinyin: '"tiān hēi le" shì shénme yìsi?' },
    options: [
      { text: '天亮了', pinyin: 'tiān liàng le', english: 'It got bright', isCorrect: false },
      { text: '天黑了', pinyin: 'tiān hēi le', english: 'It got dark', isCorrect: true },
      { text: '下雨了', pinyin: 'xiàyǔ le', english: 'It rained', isCorrect: false },
    ],
    followup: { text: '对！晚上植物也在休息。', pinyin: 'duì! wǎnshàng zhíwù yě zài xiūxi.' },
    seedReward: 'tree',
  },
  {
    id: 'time_day',
    conditions: { isNight: false },
    lines: [
      { text: '白天是种花的好时候！', pinyin: 'báitiān shì zhòng huā de hǎo shíhou!' },
      { text: '你今天想种什么？', pinyin: 'nǐ jīntiān xiǎng zhòng shénme?' },
    ],
    question: { text: '"白天"的反义词是什么？', pinyin: '"báitiān" de fǎnyìcí shì shénme?' },
    options: [
      { text: '晚上', pinyin: 'wǎnshàng', english: 'Night/evening', isCorrect: true },
      { text: '早上', pinyin: 'zǎoshang', english: 'Morning', isCorrect: false },
      { text: '中午', pinyin: 'zhōngwǔ', english: 'Noon', isCorrect: false },
    ],
    followup: { text: '没错！白天和晚上，一天有两半。', pinyin: 'méi cuò! báitiān hé wǎnshàng, yītiān yǒu liǎng bàn.' },
    seedReward: 'flower',
  },
  {
    id: 'time_dawn',
    lines: [
      { text: '早上好！今天又是新的一天。', pinyin: 'zǎoshang hǎo! jīntiān yòu shì xīn de yītiān.' },
      { text: '花园里的花开了吗？', pinyin: 'huāyuán lǐ de huā kāi le ma?' },
    ],
    question: { text: '"早上好"是什么时候说的？', pinyin: '"zǎoshang hǎo" shì shénme shíhou shuō de?' },
    options: [
      { text: '晚上', pinyin: 'wǎnshàng', english: 'Evening', isCorrect: false },
      { text: '中午', pinyin: 'zhōngwǔ', english: 'Noon', isCorrect: false },
      { text: '早上', pinyin: 'zǎoshang', english: 'Morning', isCorrect: true },
    ],
    followup: { text: '对！每天早上都是一个新的开始。', pinyin: 'duì! měi tiān zǎoshang dōu shì yīgè xīn de kāishǐ.' },
    seedReward: 'grass',
  },

  // --- Bird life (4) ---
  {
    id: 'bird_travel',
    lines: [
      { text: '我今天从很远的地方飞来的。', pinyin: 'wǒ jīntiān cóng hěn yuǎn de dìfang fēi lái de.' },
      { text: '你的花园是我见过最美的！', pinyin: 'nǐ de huāyuán shì wǒ jiànguò zuì měi de!' },
    ],
    question: { text: '"飞"是什么意思？', pinyin: '"fēi" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'To walk', isCorrect: false },
      { text: '', pinyin: '', english: 'To fly', isCorrect: true },
      { text: '', pinyin: '', english: 'To run', isCorrect: false },
    ],
    followup: { text: '对！鸟最喜欢飞了。', pinyin: 'duì! niǎo zuì xǐhuan fēi le.' },
    seedReward: 'random_base',
  },
  {
    id: 'bird_hungry',
    lines: [
      { text: '飞了一天，我好饿啊！', pinyin: 'fēi le yītiān, wǒ hǎo è a!' },
      { text: '花园里有没有好吃的？', pinyin: 'huāyuán lǐ yǒu méiyǒu hǎochī de?' },
    ],
    question: { text: '"饿"是什么意思？', pinyin: '"è" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'Happy', isCorrect: false },
      { text: '', pinyin: '', english: 'Hungry', isCorrect: true },
      { text: '', pinyin: '', english: 'Tired', isCorrect: false },
    ],
    followup: { text: '谢谢你！吃饱了，我很开心。', pinyin: 'xièxie nǐ! chī bǎo le, wǒ hěn kāixīn.' },
    seedReward: 'random_base',
  },
  {
    id: 'bird_friends',
    lines: [
      { text: '我有很多朋友，都是鸟。', pinyin: 'wǒ yǒu hěn duō péngyou, dōu shì niǎo.' },
      { text: '我们一起在天上飞。', pinyin: 'wǒmen yīqǐ zài tiān shàng fēi.' },
    ],
    question: { text: '"朋友"是什么意思？', pinyin: '"péngyou" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'Teacher', isCorrect: false },
      { text: '', pinyin: '', english: 'Friend', isCorrect: true },
      { text: '', pinyin: '', english: 'Student', isCorrect: false },
    ],
    followup: { text: '你也是我的朋友！', pinyin: 'nǐ yě shì wǒ de péngyou!' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'bird_nest',
    lines: [
      { text: '我的家在一棵大树上。', pinyin: 'wǒ de jiā zài yī kē dà shù shàng.' },
      { text: '树上有我的鸟巢。', pinyin: 'shù shàng yǒu wǒ de niǎocháo.' },
    ],
    question: { text: '鸟的家在哪里？', pinyin: 'niǎo de jiā zài nǎlǐ?' },
    options: [
      { text: '在水里', pinyin: 'zài shuǐ lǐ', english: 'In the water', isCorrect: false },
      { text: '在地下', pinyin: 'zài dìxià', english: 'Underground', isCorrect: false },
      { text: '在树上', pinyin: 'zài shù shàng', english: 'In a tree', isCorrect: true },
    ],
    followup: { text: '对！鸟巢在高高的树上很安全。', pinyin: 'duì! niǎocháo zài gāogāo de shù shàng hěn ānquán.' },
    seedReward: 'tree',
  },

  // --- Plant knowledge (3) ---
  {
    id: 'plant_tea',
    lines: [
      { text: '你知道吗？茶是很特别的植物。', pinyin: 'nǐ zhīdào ma? chá shì hěn tèbié de zhíwù.' },
      { text: '中国人很喜欢喝茶。', pinyin: 'zhōngguó rén hěn xǐhuan hē chá.' },
    ],
    question: { text: '"喝茶"是什么意思？', pinyin: '"hē chá" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'Eat food', isCorrect: false },
      { text: '', pinyin: '', english: 'Drink tea', isCorrect: true },
      { text: '', pinyin: '', english: 'Read books', isCorrect: false },
    ],
    followup: { text: '对！茶文化在中国很重要。', pinyin: 'duì! chá wénhuà zài zhōngguó hěn zhòngyào.' },
    seedReward: 'cha',
  },
  {
    id: 'plant_bamboo',
    lines: [
      { text: '竹子长得非常快！', pinyin: 'zhúzi zhǎng de fēicháng kuài!' },
      { text: '一天可以长很多。', pinyin: 'yītiān kěyǐ zhǎng hěn duō.' },
    ],
    question: { text: '"快"的反义词是什么？', pinyin: '"kuài" de fǎnyìcí shì shénme?' },
    options: [
      { text: '慢', pinyin: 'màn', english: 'Slow', isCorrect: true },
      { text: '大', pinyin: 'dà', english: 'Big', isCorrect: false },
      { text: '高', pinyin: 'gāo', english: 'Tall', isCorrect: false },
    ],
    followup: { text: '对！快和慢是反义词。', pinyin: 'duì! kuài hé màn shì fǎnyìcí.' },
    seedReward: 'zhu',
  },
  {
    id: 'plant_flower',
    lines: [
      { text: '花有很多颜色。', pinyin: 'huā yǒu hěn duō yánsè.' },
      { text: '红色、黄色、白色……', pinyin: 'hóngsè、huángsè、báisè……' },
    ],
    question: { text: '下面哪个是颜色？', pinyin: 'xiàmiàn nǎge shì yánsè?' },
    options: [
      { text: '大 (big)', pinyin: 'dà', english: 'Big', isCorrect: false },
      { text: '红 (red)', pinyin: 'hóng', english: 'Red', isCorrect: true },
      { text: '好 (good)', pinyin: 'hǎo', english: 'Good', isCorrect: false },
    ],
    followup: { text: '没错！你最喜欢什么颜色的花？', pinyin: 'méi cuò! nǐ zuì xǐhuan shénme yánsè de huā?' },
    seedReward: 'flower',
  },

  // --- Special plant rewards (3) ---
  {
    id: 'special_lotus',
    lines: [
      { text: '你见过莲花吗？它长在水里。', pinyin: 'nǐ jiànguò liánhuā ma? tā zhǎng zài shuǐ lǐ.' },
      { text: '莲花很美丽，出淤泥而不染。', pinyin: 'liánhuā hěn měilì, chū yūní ér bù rǎn.' },
    ],
    question: { text: '莲花长在哪里？', pinyin: 'liánhuā zhǎng zài nǎlǐ?' },
    options: [
      { text: '在水里', pinyin: 'zài shuǐ lǐ', english: 'In the water', isCorrect: true },
      { text: '在山上', pinyin: 'zài shān shàng', english: 'On a mountain', isCorrect: false },
      { text: '在天上', pinyin: 'zài tiān shàng', english: 'In the sky', isCorrect: false },
    ],
    followup: { text: '对！给你一颗莲花种子，种在河里吧。', pinyin: 'duì! gěi nǐ yī kē liánhuā zhǒngzi, zhòng zài hé lǐ ba.' },
    seedReward: 'lotus',
  },
  {
    id: 'special_cactus',
    conditions: { weather: WeatherType.Clear },
    lines: [
      { text: '沙漠里有一种植物叫仙人掌。', pinyin: 'shāmò lǐ yǒu yī zhǒng zhíwù jiào xiānrénzhǎng.' },
      { text: '它不需要很多水就能活。', pinyin: 'tā bù xūyào hěn duō shuǐ jiù néng huó.' },
    ],
    question: { text: '仙人掌需要很多水吗？', pinyin: 'xiānrénzhǎng xūyào hěn duō shuǐ ma?' },
    options: [
      { text: '需要很多水', pinyin: 'xūyào hěn duō shuǐ', english: 'Needs lots of water', isCorrect: false },
      { text: '不需要很多水', pinyin: 'bù xūyào hěn duō shuǐ', english: 'Doesn\'t need much water', isCorrect: true },
      { text: '不需要阳光', pinyin: 'bù xūyào yángguāng', english: 'Doesn\'t need sunlight', isCorrect: false },
    ],
    followup: { text: '没错！这颗仙人掌种子送给你。', pinyin: 'méi cuò! zhè kē xiānrénzhǎng zhǒngzi sòng gěi nǐ.' },
    seedReward: 'cactus',
  },
  {
    id: 'special_moss',
    conditions: { minPlants: 3 },
    lines: [
      { text: '大树旁边常常有苔藓。', pinyin: 'dà shù pángbiān chángcháng yǒu táixiǎn.' },
      { text: '苔喜欢潮湿阴凉的地方。', pinyin: 'tái xǐhuan cháoshī yīnliáng de dìfang.' },
    ],
    question: { text: '苔喜欢长在什么旁边？', pinyin: 'tái xǐhuan zhǎng zài shénme pángbiān?' },
    options: [
      { text: '河里', pinyin: 'hé lǐ', english: 'In the river', isCorrect: false },
      { text: '大树旁边', pinyin: 'dà shù pángbiān', english: 'Next to big trees', isCorrect: true },
      { text: '天上', pinyin: 'tiān shàng', english: 'In the sky', isCorrect: false },
    ],
    followup: { text: '对！苔要种在大树旁边哦。', pinyin: 'duì! tái yào zhòng zài dà shù pángbiān ó.' },
    seedReward: 'moss',
  },

  // --- Philosophy/nature (2) ---
  {
    id: 'philosophy_grow',
    lines: [
      { text: '种子很小，但是它可以变成大树。', pinyin: 'zhǒngzi hěn xiǎo, dànshì tā kěyǐ biànchéng dà shù.' },
      { text: '每天一点点，慢慢长大。', pinyin: 'měi tiān yīdiǎndiǎn, mànmàn zhǎngdà.' },
      { text: '花园和人一样，需要时间。', pinyin: 'huāyuán hé rén yīyàng, xūyào shíjiān.' },
    ],
    question: { text: '种子可以变成什么？', pinyin: 'zhǒngzi kěyǐ biànchéng shénme?' },
    options: [
      { text: '石头', pinyin: 'shítou', english: 'Stone', isCorrect: false },
      { text: '大树', pinyin: 'dà shù', english: 'Big tree', isCorrect: true },
      { text: '小鸟', pinyin: 'xiǎo niǎo', english: 'Small bird', isCorrect: false },
    ],
    followup: { text: '对！每一棵大树都曾经是一颗小种子。', pinyin: 'duì! měi yī kē dà shù dōu céngjīng shì yī kē xiǎo zhǒngzi.' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'philosophy_harmony',
    lines: [
      { text: '花园里有草、有花、有树。', pinyin: 'huāyuán lǐ yǒu cǎo、yǒu huā、yǒu shù.' },
      { text: '它们在一起很和谐。', pinyin: 'tāmen zài yīqǐ hěn héxié.' },
      { text: '大自然是最好的老师。', pinyin: 'dà zìrán shì zuì hǎo de lǎoshī.' },
    ],
    question: { text: '"大自然"是什么意思？', pinyin: '"dà zìrán" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'Classroom', isCorrect: false },
      { text: '', pinyin: '', english: 'Nature', isCorrect: true },
      { text: '', pinyin: '', english: 'City', isCorrect: false },
    ],
    followup: { text: '对！花园就是小小的大自然。', pinyin: 'duì! huāyuán jiùshì xiǎoxiǎo de dà zìrán.' },
    seedReward: 'random_hybrid',
  },
];

// === Dialog Filtering ===

function countPlants(state: GameState): number {
  let count = 0;
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      if (state.grid[r][c].plant) count++;
    }
  }
  return count;
}

export function getValidDialogs(state: GameState): DialogTree[] {
  const plantCount = countPlants(state);
  return DIALOG_POOL.filter(d => {
    if (!d.conditions) return true;
    if (d.conditions.weather !== undefined && d.conditions.weather !== state.weather.current) return false;
    if (d.conditions.isNight !== undefined && d.conditions.isNight !== state.weather.isNight) return false;
    if (d.conditions.minPlants !== undefined && plantCount < d.conditions.minPlants) return false;
    if (d.conditions.maxPlants !== undefined && plantCount > d.conditions.maxPlants) return false;
    return true;
  });
}

export function getDialogById(id: string): DialogTree | undefined {
  return DIALOG_POOL.find(d => d.id === id);
}

// === Seed Reward Resolution ===

export function resolveSeedReward(rewardType: string, state: GameState): string {
  if (rewardType === 'random_base') {
    const bases = ['grass', 'flower', 'tree'];
    return bases[Math.floor(Math.random() * bases.length)];
  }

  if (rewardType === 'random_hybrid') {
    // Find hybrid or special species the player hasn't discovered yet
    const specials = ['lotus', 'cactus', 'moss'];
    const allOptions = [...Object.keys(HYBRID_SPECIES), ...specials];
    const undiscovered = allOptions.filter(id => {
      const count = state.inventory.seeds[id] || 0;
      return count === 0;
    });
    if (undiscovered.length > 0) {
      return undiscovered[Math.floor(Math.random() * undiscovered.length)];
    }
    // Fall back to random base
    const bases = ['grass', 'flower', 'tree'];
    return bases[Math.floor(Math.random() * bases.length)];
  }

  // Specific species ID
  return rewardType;
}
