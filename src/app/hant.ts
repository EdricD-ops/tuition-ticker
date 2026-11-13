/**
 * Simplified → Traditional Chinese for the bundled data (region and holiday names, school
 * names, quips), which is stored in Simplified only. Interface text has its own hand-written
 * Traditional messages in i18n.ts.
 *
 * The table covers the characters the data uses; anything else passes through unchanged. Add
 * pairs here when new data brings new characters.
 */

const PAIRS =
  '万萬与與业業东東个個丽麗义義乌烏乔喬买買争爭亚亞产產亲親会會伦倫储儲兰蘭兹茲内內农農凯凱' +
  '别別剑劍动動劳勞区區医醫华華卢盧卧臥卫衛历歷双雙听聽国國图圖圣聖复復奥奧学學宁寧宾賓尔爾属屬' +
  '岗崗岛島峡峽师師广廣庆慶库庫应應庞龐开開彻徹怀懷无無时時术術机機来來桥橋槟檳欧歐汉漢泽澤济濟' +
  '温溫湾灣滨濱灵靈热熱爱愛玛瑪盖蓋着著矶磯矿礦礼禮稣穌筑築筹籌约約纪紀纳納纽紐经經结結维維罗羅' +
  '联聯脑腦腊臘节節苏蘇莱萊萨薩补補计計认認讲講设設诞誕语語诸諸诺諾课課谊誼谢謝贝貝贤賢账賬费費' +
  '赛賽转轉达達迈邁还還这這逊遜邓鄧钟鐘铁鐵门門问問阳陽际際陆陸难難韦韋韩韓页頁项項顿頓题題额額' +
  '馆館马馬鲁魯鲍鮑鸿鴻麦麥齐齊齿齒龙龍于於后後';

/** Words where the character-by-character choice is wrong. */
const WORDS: [string, string][] = [
  ['于默奥', '于默奧'],
  ['农历', '農曆'],
  ['师范', '師範'],
  ['皇后', '皇后'],
];

const TO_HANT = new Map<string, string>();
const TO_HANS = new Map<string, string>();
for (let i = 0; i < PAIRS.length; i += 2) {
  TO_HANT.set(PAIRS[i]!, PAIRS[i + 1]!);
  TO_HANS.set(PAIRS[i + 1]!, PAIRS[i]!);
}
// Traditional variants people may type that the table above doesn't produce.
for (const [t, s] of [
  ['裡', '里'],
  ['裏', '里'],
  ['週', '周'],
  ['臺', '台'],
  ['範', '范'],
  ['曆', '历'],
  ['於', '于'],
] as const) {
  TO_HANS.set(t, s);
}

const mapChars = (text: string, table: Map<string, string>) =>
  Array.from(text, (c) => table.get(c) ?? c).join('');

/** Simplified → Traditional. Latin text and unknown characters are left alone. */
export function toHant(text: string): string {
  let out = text;
  const keep: string[] = [];
  for (const [s, t] of WORDS) {
    out = out.split(s).join(`\u0000${keep.length}\u0000`);
    keep.push(t);
  }
  out = mapChars(out, TO_HANT);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => keep[Number(i)]!);
}

/** Traditional → Simplified, for matching typed text against Simplified data. */
export function toHans(text: string): string {
  return mapChars(text, TO_HANS);
}

/** Characters that have a Traditional form here, for tests that check data coverage. */
export const hantChars = (): Set<string> => new Set(TO_HANT.keys());
