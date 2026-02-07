import { WeatherType } from '../types.js';
import type { DialogTree } from '../types.js';

// === Dialog Pool ===

export const DIALOG_POOL: DialogTree[] = [
  // --- Weather dialogs ---
  {
    id: 'weather_rain',
    conditions: { weather: WeatherType.Rain },
    lines: [
      { text: '今天下雨了，我的羽毛都湿了！', pinyin: 'jīntiān xiàyǔ le, wǒ de yǔmáo dōu shī le!' },
      { text: '你有伞吗？', pinyin: 'nǐ yǒu sǎn ma?' },
    ],
    question: { text: '下雨的时候，植物会怎么样？', pinyin: 'xiàyǔ de shíhou, zhíwù huì zěnmeyàng?' },
    options: [
      { text: '植物会得到水分', pinyin: 'zhíwù huì dédào shuǐfèn', english: 'Plants get water', isCorrect: true },
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
      { text: '我喜欢在太阳下飞翔。', pinyin: 'wǒ xǐhuan zài tàiyáng xià fēixiáng.' },
    ],
    question: { text: '晴天的时候，天上有什么？', pinyin: 'qíngtiān de shíhou, tiānshàng yǒu shénme?' },
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
      { text: '水', pinyin: 'shuǐ', english: 'Water', isCorrect: false },
      { text: '风', pinyin: 'fēng', english: 'Wind', isCorrect: true },
      { text: '火', pinyin: 'huǒ', english: 'Fire', isCorrect: false },
    ],
    followup: { text: '对！风有时候很大，有时候很小。', pinyin: 'duì! fēng yǒu shíhou hěn dà, yǒu shíhou hěn xiǎo.' },
    seedReward: 'grass',
  },
  {
    id: 'weather_cloudy',
    conditions: { weather: WeatherType.Cloudy },
    lines: [
      { text: '天上有很多云。', pinyin: 'tiānshàng yǒu hěn duō yún.' },
      { text: '也许一会儿要下雨了。', pinyin: 'yěxǔ yīhuìr yào xiàyǔ le.' },
    ],
    question: { text: '云通常是什么颜色的？', pinyin: 'yún tōngcháng shì shénme yánsè de?' },
    options: [
      { text: '红色的', pinyin: 'hóngsè de', english: 'Red', isCorrect: false },
      { text: '白色或灰色的', pinyin: 'báisè huò huīsè de', english: 'White or gray', isCorrect: true },
      { text: '绿色的', pinyin: 'lǜsè de', english: 'Green', isCorrect: false },
    ],
    followup: { text: '对了！云有时白有时灰。', pinyin: 'duì le! yún yǒu shí bái yǒu shí huī.' },
    seedReward: 'random_base',
  },
  {
    id: 'weather_thunder',
    conditions: { weather: WeatherType.Rain },
    lines: [
      { text: '刚才打雷了，你害怕吗？', pinyin: 'gāngcái dǎléi le, nǐ hàipà ma?' },
      { text: '我喜欢看闪电，但是不喜欢听打雷的声音。', pinyin: 'wǒ xǐhuan kàn shǎndiàn, dànshì bù xǐhuan tīng dǎléi de shēngyīn.' },
    ],
    question: { text: '打雷的时候，你应该怎么做？', pinyin: 'dǎléi de shíhou, nǐ yīnggāi zěnme zuò?' },
    options: [
      { text: '站在树下', pinyin: 'zhàn zài shù xià', english: 'Stand under a tree', isCorrect: false },
      { text: '待在房子里', pinyin: 'dāi zài fángzi lǐ', english: 'Stay inside a house', isCorrect: true },
      { text: '继续在外面玩', pinyin: 'jìxù zài wàimiàn wán', english: 'Keep playing outside', isCorrect: false },
    ],
    followup: { text: '对了，打雷的时候待在房子里最安全。', pinyin: 'duì le, dǎléi de shíhou dāi zài fángzi lǐ zuì ānquán.' },
    seedReward: 'random_base',
  },
  {
    id: 'weather_fog',
    conditions: { weather: WeatherType.Cloudy },
    lines: [
      { text: '今天有雾，我看不清楚远处的东西。', pinyin: 'jīntiān yǒu wù, wǒ kàn bù qīngchǔ yuǎnchù de dōngxi.' },
      { text: '雾让花园看起来像仙境一样。', pinyin: 'wù ràng huāyuán kàn qǐlái xiàng xiānjìng yīyàng.' },
    ],
    question: { text: '有雾的时候，为什么看不清楚？', pinyin: 'yǒu wù de shíhou, wèishénme kàn bù qīngchǔ?' },
    options: [
      { text: '因为天太亮了', pinyin: 'yīnwèi tiān tài liàng le', english: 'Because it\'s too bright', isCorrect: false },
      { text: '因为空气中有小水滴', pinyin: 'yīnwèi kōngqì zhōng yǒu xiǎo shuǐdī', english: 'Because there are tiny water drops in the air', isCorrect: true },
      { text: '因为我的眼睛不好', pinyin: 'yīnwèi wǒ de yǎnjīng bù hǎo', english: 'Because my eyes are bad', isCorrect: false },
    ],
    followup: { text: '对，雾是由很多小水滴组成的。', pinyin: 'duì, wù shì yóu hěn duō xiǎo shuǐdī zǔchéng de.' },
    seedReward: 'random_base',
  },
  {
    id: 'weather_after_rain',
    conditions: { weather: WeatherType.Clear },
    lines: [
      { text: '雨停了，空气变得很清新。', pinyin: 'yǔ tíng le, kōngqì biàn de hěn qīngxīn.' },
      { text: '看，天上出现了一道彩虹！', pinyin: 'kàn, tiānshàng chūxiàn le yī dào cǎihóng!' },
    ],
    question: { text: '彩虹通常在什么时候出现？', pinyin: 'cǎihóng tōngcháng zài shénme shíhou chūxiàn?' },
    options: [
      { text: '下雨前', pinyin: 'xiàyǔ qián', english: 'Before rain', isCorrect: false },
      { text: '下雨后', pinyin: 'xiàyǔ hòu', english: 'After rain', isCorrect: true },
      { text: '下雪时', pinyin: 'xiàxuě shí', english: 'When snowing', isCorrect: false },
    ],
    followup: { text: '没错，雨后出太阳时常常能看到彩虹。', pinyin: 'méi cuò, yǔ hòu chū tàiyáng shí chángcháng néng kàndào cǎihóng.' },
    seedReward: 'random_base',
  },

  // --- Garden assessment ---
  {
    id: 'garden_big',
    conditions: { minPlants: 10 },
    lines: [
      { text: '哇，你的花园好大啊！', pinyin: 'wā, nǐ de huāyuán hǎo dà a!' },
      { text: '你种了好多植物。', pinyin: 'nǐ zhòng le hǎo duō zhíwù.' },
    ],
    question: { text: '"花园"是什么意思？', pinyin: '"huāyuán" shì shénme yìsi?' },
    options: [
      { text: '花园 = 花园', pinyin: 'huāyuán = garden', english: 'Garden', isCorrect: true },
      { text: '花园 = 学校', pinyin: 'huāyuán = xuéxiào', english: 'School', isCorrect: false },
      { text: '花园 = 厨房', pinyin: 'huāyuán = chúfáng', english: 'Kitchen', isCorrect: false },
    ],
    followup: { text: '你的花园越来越漂亮了！', pinyin: 'nǐ de huāyuán yuèláiyuè piàoliang le!' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'garden_small',
    conditions: { maxPlants: 3 },
    lines: [
      { text: '花园里还很空呢。', pinyin: 'huāyuán lǐ hái hěn kōng ne.' },
      { text: '你应该多种一些植物！', pinyin: 'nǐ yīnggāi duō zhòng yīxiē zhíwù!' },
    ],
    question: { text: '"种"是什么意思？', pinyin: '"zhòng" shì shénme yìsi?' },
    options: [
      { text: '', pinyin: '', english: 'To eat', isCorrect: false },
      { text: '', pinyin: '', english: 'To plant', isCorrect: true },
      { text: '', pinyin: '', english: 'To fly', isCorrect: false },
    ],
    followup: { text: '对！快去种更多的植物吧。', pinyin: 'duì! kuài qù zhòng gèng duō de zhíwù ba.' },
    seedReward: 'random_base',
  },
  {
    id: 'garden_diverse',
    conditions: { minPlants: 5 },
    lines: [
      { text: '这里有很多不同的植物呢！', pinyin: 'zhèlǐ yǒu hěn duō bùtóng de zhíwù ne!' },
      { text: '草、花、还有树，真好看。', pinyin: 'cǎo、huā、hái yǒu shù, zhēn hǎokàn.' },
    ],
    question: { text: '下面哪个是植物？', pinyin: 'xiàmiàn nǎge shì zhíwù?' },
    options: [
      { text: '花 (flower)', pinyin: 'huā', english: 'Flower', isCorrect: true },
      { text: '鸟 (bird)', pinyin: 'niǎo', english: 'Bird', isCorrect: false },
      { text: '石头 (stone)', pinyin: 'shítou', english: 'Stone', isCorrect: false },
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
    followup: { text: '对了！别忘了给植物浇水哦。', pinyin: 'duì le! bié wàng le gěi zhíwù jiāo shuǐ ó.' },
    seedReward: 'random_base',
  },
  {
    id: 'garden_healthy',
    conditions: { minPlants: 6 },
    lines: [
      { text: '你的植物看起来都很健康呢。', pinyin: 'nǐ de zhíwù kàn qǐlái dōu hěn jiànkāng ne.' },
      { text: '叶子绿绿的，花也开得很漂亮。', pinyin: 'yèzi lǜ lǜ de, huā yě kāi de hěn piàoliang.' },
    ],
    question: { text: '怎么知道植物很健康？', pinyin: 'zěnme zhīdào zhíwù hěn jiànkāng?' },
    options: [
      { text: '叶子是黄色的', pinyin: 'yèzi shì huángsè de', english: 'Leaves are yellow', isCorrect: false },
      { text: '叶子绿绿的', pinyin: 'yèzi lǜ lǜ de', english: 'Leaves are green', isCorrect: true },
      { text: '植物长得很快', pinyin: 'zhíwù zhǎng de hěn kuài', english: 'Plants grow very fast', isCorrect: false },
    ],
    followup: { text: '对，健康的植物叶子是绿色的。', pinyin: 'duì, jiànkāng de zhíwù yèzi shì lǜsè de.' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'garden_needs_care',
    conditions: { maxPlants: 5 },
    lines: [
      { text: '有些植物看起来需要照顾呢。', pinyin: 'yǒuxiē zhíwù kàn qǐlái xūyào zhàogù ne.' },
      { text: '你是不是忘了给它们浇水？', pinyin: 'nǐ shì bùshì wàng le gěi tāmen jiāo shuǐ?' },
    ],
    question: { text: '植物需要什么照顾？', pinyin: 'zhíwù xūyào shénme zhàogù?' },
    options: [
      { text: '只需要太阳', pinyin: 'zhǐ xūyào tàiyáng', english: 'Only needs sun', isCorrect: false },
      { text: '浇水和晒太阳', pinyin: 'jiāo shuǐ hé shài tàiyáng', english: 'Watering and sunlight', isCorrect: true },
      { text: '只需要音乐', pinyin: 'zhǐ xūyào yīnyuè', english: 'Only needs music', isCorrect: false },
    ],
    followup: { text: '植物和人一样，需要照顾才能长得更好。', pinyin: 'zhíwù hé rén yīyàng, xūyào zhàogù cái néng zhǎng de gèng hǎo.' },
    seedReward: 'random_base',
  },
  {
    id: 'garden_insects',
    conditions: { minPlants: 8 },
    lines: [
      { text: '我发现花园里有一些小昆虫。', pinyin: 'wǒ fāxiàn huāyuán lǐ yǒu yīxiē xiǎo kūnchóng.' },
      { text: '别担心，有些昆虫对植物有好处呢。', pinyin: 'bié dānxīn, yǒuxiē kūnchóng duì zhíwù yǒu hǎochù ne.' },
    ],
    question: { text: '为什么有些昆虫对植物有好处？', pinyin: 'wèishénme yǒuxiē kūnchóng duì zhíwù yǒu hǎochù?' },
    options: [
      { text: '它们吃植物的叶子', pinyin: 'tāmen chī zhíwù de yèzi', english: 'They eat plant leaves', isCorrect: false },
      { text: '它们帮助传播花粉', pinyin: 'tāmen bāngzhù chuánbō huāfěn', english: 'They help spread pollen', isCorrect: true },
      { text: '它们长得很好看', pinyin: 'tāmen zhǎng de hěn hǎokàn', english: 'They look pretty', isCorrect: false },
    ],
    followup: { text: '蜜蜂就是这样，它们帮助花朵结果。', pinyin: 'mìfēng jiùshì zhèyàng, tāmen bāngzhù huāduǒ jiēguǒ.' },
    seedReward: 'flower',
  },

  // --- Time of day ---
  {
    id: 'time_night',
    conditions: { isNight: true },
    lines: [
      { text: '天黑了，我想找个地方睡觉。', pinyin: 'tiān hēi le, wǒ xiǎng zhǎo gè dìfang shuìjiào.' },
      { text: '月亮出来了，真漂亮。', pinyin: 'yuèliang chūlái le, zhēn piàoliang.' },
    ],
    question: { text: '"天黑了"是什么意思？', pinyin: '"tiān hēi le" shì shénme yìsi?' },
    options: [
       { text: '', pinyin: '', english: 'It got bright', isCorrect: false },
       { text: '', pinyin: '', english: 'It got dark', isCorrect: true },
       { text: '', pinyin: '', english: 'It rained', isCorrect: false },
    ],
    followup: { text: '对！晚上植物也在休息呢。', pinyin: 'duì! wǎnshàng zhíwù yě zài xiūxi ne.' },
    seedReward: 'tree',
  },
  {
    id: 'time_day',
    conditions: { isNight: false },
    lines: [
      { text: '白天是种花的好时候！', pinyin: 'báitiān shì zhòng huā de hǎo shíhou!' },
      { text: '你今天想种什么呀？', pinyin: 'nǐ jīntiān xiǎng zhòng shénme ya?' },
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
  {
    id: 'time_afternoon',
    conditions: { isNight: false },
    lines: [
      { text: '现在是下午，太阳没那么热了。', pinyin: 'xiànzài shì xiàwǔ, tàiyáng méi nàme rè le.' },
      { text: '下午是给植物浇水的好时间。', pinyin: 'xiàwǔ shì gěi zhíwù jiāo shuǐ de hǎo shíjiān.' },
    ],
    question: { text: '一天可以分成几个部分？', pinyin: 'yī tiān kěyǐ fēn chéng jǐ gè bùfen?' },
    options: [
      { text: '只有一个部分', pinyin: 'zhǐ yǒu yī gè bùfen', english: 'Only one part', isCorrect: false },
      { text: '两个部分：白天和晚上', pinyin: 'liǎng gè bùfen: báitiān hé wǎnshàng', english: 'Two parts: day and night', isCorrect: false },
      { text: '很多部分：早上、中午、下午、晚上', pinyin: 'hěn duō bùfen: zǎoshang, zhōngwǔ, xiàwǔ, wǎnshàng', english: 'Many parts: morning, noon, afternoon, evening', isCorrect: true },
    ],
    followup: { text: '对，一天可以分成不同的时段。', pinyin: 'duì, yī tiān kěyǐ fēn chéng bùtóng de shíduàn.' },
    seedReward: 'grass',
  },
  {
    id: 'time_seasons',
    lines: [
      { text: '一年有四个季节，你知道吗？', pinyin: 'yī nián yǒu sì gè jìjié, nǐ zhīdào ma?' },
      { text: '春天花开，夏天很热，秋天叶子黄，冬天下雪。', pinyin: 'chūntiān huā kāi, xiàtiān hěn rè, qiūtiān yèzi huáng, dōngtiān xià xuě.' },
    ],
    question: { text: '下面哪个季节花会开？', pinyin: 'xiàmiàn nǎge jìjié huā huì kāi?' },
    options: [
      { text: '春天', pinyin: 'chūntiān', english: 'Spring', isCorrect: true },
      { text: '夏天', pinyin: 'xiàtiān', english: 'Summer', isCorrect: false },
      { text: '秋天', pinyin: 'qiūtiān', english: 'Autumn', isCorrect: false },
    ],
    followup: { text: '春天是万物生长的季节。', pinyin: 'chūntiān shì wànwù shēngzhǎng de jìjié.' },
    seedReward: 'flower',
  },

  // --- Bird life ---
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
    followup: { text: '对！鸟最喜欢飞翔了。', pinyin: 'duì! niǎo zuì xǐhuan fēixiáng le.' },
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
      { text: '我有很多朋友，都是鸟呢。', pinyin: 'wǒ yǒu hěn duō péngyou, dōu shì niǎo ne.' },
      { text: '我们一起在天上飞翔。', pinyin: 'wǒmen yīqǐ zài tiānshàng fēixiáng.' },
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
  {
    id: 'bird_migration',
    lines: [
      { text: '冬天快到了，我要飞到南方去。', pinyin: 'dōngtiān kuài dào le, wǒ yào fēi dào nánfāng qù.' },
      { text: '南方比较暖和，可以在那里过冬。', pinyin: 'nánfāng bǐjiào nuǎnhuo, kěyǐ zài nàlǐ guòdōng.' },
    ],
    question: { text: '鸟为什么冬天要飞到南方？', pinyin: 'niǎo wèishénme dōngtiān yào fēi dào nánfāng?' },
    options: [
      { text: '因为南方有更多食物', pinyin: 'yīnwèi nánfāng yǒu gèng duō shíwù', english: 'Because there\'s more food in the south', isCorrect: true },
      { text: '因为南方有很多朋友', pinyin: 'yīnwèi nánfāng yǒu hěn duō péngyou', english: 'Because there are many friends in the south', isCorrect: false },
      { text: '因为喜欢旅行', pinyin: 'yīnwèi xǐhuan lǚxíng', english: 'Because they like traveling', isCorrect: false },
    ],
    followup: { text: '对，很多鸟冬天会迁徙到暖和的地方。', pinyin: 'duì, hěn duō niǎo dōngtiān huì qiānxǐ dào nuǎnhuo de dìfang.' },
    seedReward: 'random_base',
  },
  {
    id: 'bird_singing',
    lines: [
      { text: '你听过鸟唱歌吗？', pinyin: 'nǐ tīngguò niǎo chànggē ma?' },
      { text: '早上，很多鸟一起唱歌，声音很好听。', pinyin: 'zǎoshang, hěn duō niǎo yīqǐ chànggē, shēngyīn hěn hǎotīng.' },
    ],
    question: { text: '鸟什么时候最喜欢唱歌？', pinyin: 'niǎo shénme shíhou zuì xǐhuan chànggē?' },
    options: [
      { text: '晚上', pinyin: 'wǎnshàng', english: 'Evening', isCorrect: false },
      { text: '早上', pinyin: 'zǎoshang', english: 'Morning', isCorrect: true },
      { text: '中午', pinyin: 'zhōngwǔ', english: 'Noon', isCorrect: false },
    ],
    followup: { text: '鸟的歌声是自然中最美的音乐。', pinyin: 'niǎo de gēshēng shì zìrán zhōng zuì měi de yīnyuè.' },
    seedReward: 'random_base',
  },
  {
    id: 'bird_colors',
    lines: [
      { text: '你看我的羽毛，有很多颜色呢。', pinyin: 'nǐ kàn wǒ de yǔmáo, yǒu hěn duō yánsè ne.' },
      { text: '有些鸟是黑色的，有些是白色的，还有彩色的。', pinyin: 'yǒuxiē niǎo shì hēisè de, yǒuxiē shì báisè de, hái yǒu cǎisè de.' },
    ],
    question: { text: '下面哪个词可以描述颜色很多？', pinyin: 'xiàmiàn nǎge cí kěyǐ miáoshù yánsè hěn duō?' },
    options: [
      { text: '黑色', pinyin: 'hēisè', english: 'Black', isCorrect: false },
      { text: '彩色', pinyin: 'cǎisè', english: 'Colorful', isCorrect: true },
      { text: '白色', pinyin: 'báisè', english: 'White', isCorrect: false },
    ],
    followup: { text: '自然界的颜色总是让我感到惊喜。', pinyin: 'zìránjiè de yánsè zǒngshì ràng wǒ gǎndào jīngxǐ.' },
    seedReward: 'random_hybrid',
  },

  // --- Plant knowledge ---
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
      { text: '一天可以长很多呢。', pinyin: 'yītiān kěyǐ zhǎng hěn duō ne.' },
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
      { text: '花有很多颜色呢。', pinyin: 'huā yǒu hěn duō yánsè ne.' },
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
  {
    id: 'plant_fruits',
    lines: [
      { text: '很多植物会结果子呢。', pinyin: 'hěn duō zhíwù huì jiē guǒzi ne.' },
      { text: '苹果、橘子、香蕉，都是水果。', pinyin: 'píngguǒ, júzi, xiāngjiāo, dōu shì shuǐguǒ.' },
    ],
    question: { text: '下面哪个不是水果？', pinyin: 'xiàmiàn nǎge bù shì shuǐguǒ?' },
    options: [
      { text: '苹果', pinyin: 'píngguǒ', english: 'Apple', isCorrect: false },
      { text: '香蕉', pinyin: 'xiāngjiāo', english: 'Banana', isCorrect: false },
      { text: '土豆', pinyin: 'tǔdòu', english: 'Potato', isCorrect: true },
    ],
    followup: { text: '土豆是蔬菜，不是水果。', pinyin: 'tǔdòu shì shūcài, bù shì shuǐguǒ.' },
    seedReward: 'random_base',
  },
  {
    id: 'plant_vegetables',
    lines: [
      { text: '除了水果，我们还有蔬菜呢。', pinyin: 'chúle shuǐguǒ, wǒmen hái yǒu shūcài ne.' },
      { text: '西红柿、黄瓜、胡萝卜，都很有营养。', pinyin: 'xīhóngshì, huángguā, húluóbo, dōu hěn yǒu yíngyǎng.' },
    ],
    question: { text: '蔬菜通常长在哪里？', pinyin: 'shūcài tōngcháng zhǎng zài nǎlǐ?' },
    options: [
      { text: '树上', pinyin: 'shù shàng', english: 'On trees', isCorrect: false },
      { text: '地里', pinyin: 'dì lǐ', english: 'In the ground', isCorrect: true },
      { text: '水里', pinyin: 'shuǐ lǐ', english: 'In water', isCorrect: false },
    ],
    followup: { text: '大部分蔬菜都是地里种的植物。', pinyin: 'dà bùfen shūcài dōu shì dì lǐ zhòng de zhíwù.' },
    seedReward: 'random_base',
  },

  // --- Special plant rewards ---
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
      { text: '在天上', pinyin: 'zài tiānshàng', english: 'In the sky', isCorrect: false },
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
      { text: '苔藓喜欢潮湿阴凉的地方。', pinyin: 'táixiǎn xǐhuan cháoshī yīnliáng de dìfang.' },
    ],
    question: { text: '苔藓喜欢长在什么旁边？', pinyin: 'táixiǎn xǐhuan zhǎng zài shénme pángbiān?' },
    options: [
      { text: '河里', pinyin: 'hé lǐ', english: 'In the river', isCorrect: false },
      { text: '大树旁边', pinyin: 'dà shù pángbiān', english: 'Next to big trees', isCorrect: true },
      { text: '天上', pinyin: 'tiānshàng', english: 'In the sky', isCorrect: false },
    ],
    followup: { text: '对！苔藓要种在大树旁边哦。', pinyin: 'duì! táixiǎn yào zhòng zài dà shù pángbiān ó.' },
    seedReward: 'moss',
  },
  {
    id: 'special_orchid',
    conditions: { minPlants: 4 },
    lines: [
      { text: '兰花是一种很特别的花。', pinyin: 'lánhuā shì yī zhǒng hěn tèbié de huā.' },
      { text: '它不喜欢太多阳光，喜欢阴凉的地方。', pinyin: 'tā bù xǐhuan tài duō yángguāng, xǐhuan yīnliáng de dìfang.' },
    ],
    question: { text: '兰花喜欢什么样的地方？', pinyin: 'lánhuā xǐhuan shénmeyàng de dìfang?' },
    options: [
      { text: '很热的地方', pinyin: 'hěn rè de dìfang', english: 'Very hot places', isCorrect: false },
      { text: '阴凉的地方', pinyin: 'yīnliáng de dìfang', english: 'Shady places', isCorrect: true },
      { text: '很干的地方', pinyin: 'hěn gān de dìfang', english: 'Very dry places', isCorrect: false },
    ],
    followup: { text: '对，兰花需要细心照顾才能开花。', pinyin: 'duì, lánhuā xūyào xìxīn zhàogù cái néng kāihuā.' },
    seedReward: 'orchid',
  },
  {
    id: 'special_maple',
    conditions: { weather: WeatherType.Clear },
    lines: [
      { text: '秋天的枫树特别漂亮。', pinyin: 'qiūtiān de fēngshù tèbié piàoliang.' },
      { text: '叶子变成红色，像火一样。', pinyin: 'yèzi biàn chéng hóngsè, xiàng huǒ yīyàng.' },
    ],
    question: { text: '枫树的叶子什么时候变红？', pinyin: 'fēngshù de yèzi shénme shíhou biàn hóng?' },
    options: [
      { text: '春天', pinyin: 'chūntiān', english: 'Spring', isCorrect: false },
      { text: '夏天', pinyin: 'xiàtiān', english: 'Summer', isCorrect: false },
      { text: '秋天', pinyin: 'qiūtiān', english: 'Autumn', isCorrect: true },
    ],
    followup: { text: '给你一颗枫树种子，秋天它会很美丽。', pinyin: 'gěi nǐ yī kē fēngshù zhǒngzi, qiūtiān tā huì hěn měilì.' },
    seedReward: 'maple',
  },

  // --- Philosophy/nature ---
  {
    id: 'philosophy_grow',
    lines: [
      { text: '种子很小，但是它可以长成大树。', pinyin: 'zhǒngzi hěn xiǎo, dànshì tā kěyǐ zhǎng chéng dà shù.' },
      { text: '每天一点点，慢慢长大。', pinyin: 'měi tiān yīdiǎndiǎn, mànmàn zhǎngdà.' },
      { text: '花园和人一样，都需要时间。', pinyin: 'huāyuán hé rén yīyàng, dōu xūyào shíjiān.' },
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
  {
    id: 'philosophy_patience',
    lines: [
      { text: '种植物需要耐心。', pinyin: 'zhòng zhíwù xūyào nàixīn.' },
      { text: '不能今天种，明天就希望它开花。', pinyin: 'bù néng jīntiān zhòng, míngtiān jiù xīwàng tā kāihuā.' },
    ],
    question: { text: '种植物需要什么？', pinyin: 'zhòng zhíwù xūyào shénme?' },
    options: [
      { text: '只需要水', pinyin: 'zhǐ xūyào shuǐ', english: 'Only needs water', isCorrect: false },
      { text: '耐心和时间', pinyin: 'nàixīn hé shíjiān', english: 'Patience and time', isCorrect: true },
      { text: '很多钱', pinyin: 'hěn duō qián', english: 'A lot of money', isCorrect: false },
    ],
    followup: { text: '对，耐心是种植的重要部分。', pinyin: 'duì, nàixīn shì zhòngzhí de zhòngyào bùfen.' },
    seedReward: 'random_hybrid',
  },
  {
    id: 'philosophy_balance',
    lines: [
      { text: '花园里，每种植物都有自己的位置。', pinyin: 'huāyuán lǐ, měi zhǒng zhíwù dōu yǒu zìjǐ de wèizhì.' },
      { text: '高的树，矮的花，它们在一起很平衡。', pinyin: 'gāo de shù, ǎi de huā, tāmen zài yīqǐ hěn pínghéng.' },
    ],
    question: { text: '"平衡"是什么意思？', pinyin: '"pínghéng" shì shénme yìsi?' },
    options: [
      { text: '不平衡', pinyin: 'bù pínghéng', english: 'Imbalance', isCorrect: false },
      { text: '平衡', pinyin: 'pínghéng', english: 'Balance', isCorrect: true },
      { text: '困惑', pinyin: 'kùnhuò', english: 'Confusion', isCorrect: false },
    ],
    followup: { text: '自然总是能找到平衡的方式。', pinyin: 'zìrán zǒngshì néng zhǎodào pínghéng de fāngshì.' },
    seedReward: 'random_hybrid',
  },
];
