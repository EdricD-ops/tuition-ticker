/** Minimal i18n: follows the browser unless the user picks a language (stored per device). */

const en = {
  onClass: 'ON CLASS',
  offClass: 'OFF CLASS',
  holiday: 'HOLIDAY',
  demo: 'Demo data',
  useMySchool: 'Use my school',
  fullscreen: 'Full screen',
  amountHidden: 'Amount hidden',
  privacy0: 'Privacy: showing all amounts. Click to hide tuition totals',
  privacy1: 'Privacy: tuition totals hidden. Click to hide every amount',
  privacy2: 'Privacy: every amount hidden. Click to show all',
  share: 'Share',
  language: 'Language',
  langAuto: 'Follow browser',
  theme: 'Theme',
  themeSystem: 'Follow system',
  themeLight: 'Light',
  themeDark: 'Dark',
  more: 'More',
  shareTitle: 'Share',
  shareCardTitle: 'Image card',
  ratioPost: '3:4 · Post',
  ratioStory: '9:16 · Story',
  hideAmounts: 'Hide amounts on the card',
  hideAmountsHint: 'Keeps only the cost per second and percentages.',
  downloadPng: 'Download PNG',
  exporting: 'Rendering…',
  exportFailed: 'Could not render the image. Try again.',
  shareLinkTitle: 'Share link',
  shareLinkHint: 'The link itself carries your whole setup (school, tuition, courses, holidays). Nothing is uploaded; anyone with the link can see it.',
  copyLink: 'Copy link',
  copied: 'Copied',
  shareLinkDemo: 'Set up your own school first to share a link.',
  sharedLoaded: 'Loaded from a shared link. Review it, then save to use it.',
  sharedInvalid: 'That share link is broken or incomplete.',
  dismiss: 'Dismiss',
  cardPerSecond: 'Per second',
  cardTuitionUsed: 'Tuition used',
  cardClassProgress: 'This class',
  cardClassesLeft: 'Classes left',
  miniView: 'Mini',
  miniViewHint: 'Compact view: this class, cost per second and progress',
  fullView: 'Full view',
  pipOpen: 'Pop out',
  pipOpenHint: 'Open a small window that stays on top of other windows',
  pipClose: 'Close pop-out',
  exitFullscreen: 'Exit full screen',
  spentThisClass: 'Spent this class',
  leftThisClass: 'Left this class',
  perSecond: 'Per second',
  elapsed: 'Elapsed',
  remaining: 'Remaining',
  overview: 'Tuition overview',
  overviewTag: 'To date',
  perClassTag: 'Per class',
  spentSoFar: 'Spent so far',
  tuitionLeft: 'Tuition left',
  avgPerClass: 'Average per class',
  classesLeft: 'Classes left',
  classesCount: '{n}',
  tuitionUsed: '{p} of tuition used',
  pickTitle: 'Which class are you in?',
  pickHint: 'Billing counts from the class start time.',
  happeningNow: 'Now',
  perClass: '/ class',
  cancelClass: 'Cancel this class',
  startsIn: 'Class starts in',
  classWorth: 'This class is worth',
  finishedTitle: 'Class over',
  finishedBody: 'This class cost',
  pickAnother: 'Pick another class',
  holidayToday: 'Today is {name}',
  holidayPublic: 'public holiday',
  holidaySchool: 'school holiday',
  holidayConfirmTitle: 'It’s a holiday today',
  holidayConfirmBody: 'Today is {name}. Start billing this class anyway?',
  confirmStart: 'Start class',
  cancel: 'Cancel',
  unconfiguredTitle: 'Almost there',
  unconfiguredBody:
    'Set the term start and give each course its days, a start and end time, and the number of weeks.',
  zeroTuition: 'Tuition is 0, so every amount shows as 0.',
  allDone: 'All classes are done. Every cent accounted for.',
  settings: 'Settings',
  termStart: 'Term start',
  termStartHint: 'The first day of week 1. Weeks are counted from here.',
  classDays: 'Days',
  wd1: 'Mon', wd2: 'Tue', wd3: 'Wed', wd4: 'Thu', wd5: 'Fri', wd6: 'Sat', wd7: 'Sun',
  errCourseDays: 'Pick at least one day.',
  errTermStart: 'Pick the first day of term.',
  openSettings: 'Open settings',
  importTimetable: 'Import timetable',
  importTitle: 'Import timetable',
  importIntro: 'Read courses from a file or text. Nothing leaves this browser.',
  importTabIcs: 'Calendar (.ics)',
  importTabCsv: 'Spreadsheet (CSV)',
  importTabText: 'Paste text',
  importIcsHint: 'Export your timetable as .ics from the school portal, Outlook, Google or Apple Calendar.',
  importCsvHint: 'Fill the template in Excel, Numbers or Google Sheets, save as CSV, then choose it here. You can also paste the cells straight into “Paste text”.',
  importTextHint: 'Paste lines like “FINA6001 Corporate Finance 周二 18:00-22:00”. Day headings such as “Monday” apply to the lines below.',
  downloadTemplate: 'Download template',
  chooseFile: 'Choose file',
  readText: 'Read text',
  importFound: '{n} courses found',
  weeksCount: '{n} wk',
  importNone: 'No courses found. Check that each class has a day and a time like 18:00-22:00.',
  importTermStart: 'Also set term start to {date} (Monday of the first class)',
  replaceCourses: 'Replace my courses',
  appendCourses: 'Add to my courses',
  setupTitle: 'Set up your ticker',
  setupIntro: 'Takes about a minute. Everything stays in this browser.',
  stepOf: 'Step {n} of {total}',
  stepSchool: 'School & tuition',
  stepCourses: 'Courses',
  stepExtras: 'Holidays & currency',
  back: 'Back',
  next: 'Next',
  finish: 'Start ticking',
  save: 'Save',
  close: 'Close',
  schoolName: 'School',
  schoolNamePlaceholder: 'Search or type, e.g. HKU or 港大',
  schoolNameHint: 'QS top 500 outside mainland China can be searched; type any other name directly.',
  schoolUseTyped: 'Use “{name}” (not in the list)',
  schoolLoading: 'Loading schools…',
  programme: 'Programme (optional)',
  programmePlaceholder: 'e.g. MSc Computer Science',
  region: 'Region',
  currency: 'Tuition currency',
  timeZone: 'School time zone',
  timeZoneHint: 'Class times are read in this time zone, wherever your laptop is.',
  tuition: 'Total tuition',
  tuitionHint: 'The whole programme, in the tuition currency.',
  coursesTitle: 'Courses',
  coursesHint: 'Each course meets on its days for the given weeks from term start, except on holidays. The rate is tuition ÷ total hours.',
  courseName: 'Course name',
  courseNamePlaceholder: 'e.g. Corporate Finance',
  startTime: 'Starts',
  endTime: 'Ends',
  weeks: 'Weeks',
  addCourse: 'Add course',
  removeCourse: 'Remove',
  totalHours: '{hours} h in {classes} classes',
  ratePreview: '≈ {rate} per second',
  holidaysTitle: 'Holidays',
  holidaysHint: 'Classes on a holiday are not held: they don’t count as spent, and tuition is spread over the other classes. Turn a public holiday’s reminder off if your school still has class that day.',
  skippedHolidays: ' ({n} on holidays excluded)',
  publicHolidays: 'Public holidays · {region}',
  noPublicHolidays: 'No built-in public holidays for this region yet.',
  showPast: 'Show past',
  hidePast: 'Hide past',
  remind: 'Remind',
  schoolHolidays: 'School holidays',
  holidayStart: 'From',
  holidayEnd: 'To (optional)',
  holidayName: 'Note',
  holidayNamePlaceholder: 'e.g. Reading week',
  addHoliday: 'Add holiday',
  fxTitle: 'Currency conversion',
  displayCurrency: 'Convert amounts to',
  displayCurrencyOff: 'Don’t convert',
  displayCurrencyHint: 'Daily reference rates (open.er-api.com), not live trading quotes.',
  fixedRate: 'Fixed rate (optional)',
  fixedRateHint: 'Leave empty to use the daily reference rate.',
  fixedRateCurrent: 'Reference rate now: 1 {from} ≈ {rate} {to} ({date}).',
  rateLine: '1 {from} ≈ {rate} {to}',
  rateReference: 'Reference rate, updated {date} · not a live quote',
  rateCached: 'Offline · using rates from {date}',
  rateFixed: 'Fixed rate',
  rateLoading: 'Loading exchange rate…',
  rateUnavailable: 'Exchange rate unavailable for {from} → {to}',
  dataTitle: 'Data',
  exportJson: 'Export JSON',
  importJson: 'Import JSON',
  importDone: 'Imported. Review and save.',
  importFailed: 'That file is not a Tuition Ticker config.',
  dataPrivacy:
    'Your config stays in this browser and is never uploaded. The site counts anonymous visits with GoatCounter (no cookies, no config data).',
  coffee: 'Buy me a coffee',
  resetData: 'Clear data and return to demo',
  resetBody:
    'This deletes the config saved in this browser (school, tuition, courses, holidays) and the class you picked. It can’t be undone, so export JSON first if you want to keep it. Language, theme and privacy settings stay.',
  resetConfirm: 'Clear data',
  errSchoolName: 'Enter a name.',
  errTuition: 'Enter a tuition above 0.',
  errCourses: 'Add at least one complete course.',
  errCourseTime: 'End must be after start (no overnight classes).',
  errCourseCount: 'Use whole numbers above 0.',
  errHolidayRange: 'End date must be after the start date.',
};

type Messages = typeof en;

const zh: Messages = {
  onClass: 'ON CLASS',
  offClass: 'OFF CLASS',
  holiday: 'HOLIDAY',
  demo: '演示数据',
  useMySchool: '换成我的学校',
  fullscreen: '全屏',
  amountHidden: '金额已隐藏',
  privacy0: '隐私：显示全部金额。点一下遮住学费总额',
  privacy1: '隐私：已遮住学费总额。点一下遮住所有金额',
  privacy2: '隐私：已遮住所有金额。点一下全部显示',
  share: '分享',
  language: '语言',
  langAuto: '跟随浏览器',
  theme: '主题',
  themeSystem: '跟随系统',
  themeLight: '浅色',
  themeDark: '深色',
  more: '更多',
  shareTitle: '分享',
  shareCardTitle: '分享卡片',
  ratioPost: '3:4 · 小红书',
  ratioStory: '9:16 · Story',
  hideAmounts: '卡片上隐藏具体金额',
  hideAmountsHint: '只保留每秒成本和百分比。',
  downloadPng: '下载 PNG',
  exporting: '正在生成…',
  exportFailed: '图片生成失败，请重试。',
  shareLinkTitle: '分享链接',
  shareLinkHint: '链接本身就包含你的整份配置（学校、学费、课程、假日），不会上传到任何服务器；拿到链接的人都能看到这些信息。',
  copyLink: '复制链接',
  copied: '已复制',
  shareLinkDemo: '先换成你自己的学校，才能分享链接。',
  sharedLoaded: '已从分享链接载入，确认无误后保存即可使用。',
  sharedInvalid: '这个分享链接已损坏或不完整。',
  dismiss: '关闭',
  cardPerSecond: '每秒成本',
  cardTuitionUsed: '已用学费',
  cardClassProgress: '本节进度',
  cardClassesLeft: '剩余课节',
  miniView: '迷你',
  miniViewHint: '迷你模式：只看本节消耗、每秒成本和进度',
  fullView: '完整看板',
  pipOpen: '置顶小窗',
  pipOpenHint: '弹出一个始终在其他窗口上方的小窗',
  pipClose: '关闭小窗',
  exitFullscreen: '退出全屏',
  spentThisClass: '本节已消耗',
  leftThisClass: '本节剩余',
  perSecond: '每秒成本',
  elapsed: '已上',
  remaining: '剩余',
  overview: '学费总览',
  overviewTag: '截至目前',
  perClassTag: '每节价格',
  spentSoFar: '开学至今已消耗',
  tuitionLeft: '剩余学费',
  avgPerClass: '平均每节课',
  classesLeft: '剩余课节数',
  classesCount: '{n} 节',
  tuitionUsed: '已用学费 {p}',
  pickTitle: '现在在上哪门课？',
  pickHint: '从这门课的开始时间算起。',
  happeningNow: '正在上',
  perClass: '/ 节',
  cancelClass: '取消本节',
  startsIn: '距离上课还有',
  classWorth: '这节课价值',
  finishedTitle: '本节已结束',
  finishedBody: '这节课花了',
  pickAnother: '选择其他课程',
  holidayToday: '今天是{name}',
  holidayPublic: '公众假期',
  holidaySchool: '学校假日',
  holidayConfirmTitle: '今天是假日',
  holidayConfirmBody: '今天是{name}，确定要上课吗？',
  confirmStart: '确定上课',
  cancel: '取消',
  unconfiguredTitle: '还差一点配置',
  unconfiguredBody: '请在设置里填写开学日期，并为每门课选好上课日、开始和结束时间、周数。',
  zeroTuition: '学费为 0，所有金额都会显示为 0。',
  allDone: '课程已全部上完，学费花得明明白白。',
  settings: '设置',
  termStart: '开学日期',
  termStartHint: '第 1 周的第一天，周数从这天开始算。',
  classDays: '上课日',
  wd1: '一', wd2: '二', wd3: '三', wd4: '四', wd5: '五', wd6: '六', wd7: '日',
  errCourseDays: '至少选一天。',
  errTermStart: '请选择开学日期。',
  openSettings: '打开设置',
  importTimetable: '导入课程表',
  importTitle: '导入课程表',
  importIntro: '从文件或文本读取课程，内容不会离开这个浏览器。',
  importTabIcs: '日历文件 .ics',
  importTabCsv: '表格 CSV',
  importTabText: '粘贴文本',
  importIcsHint: '从学校系统、Outlook、Google 或 Apple 日历导出 .ics 文件后选择它。',
  importCsvHint: '用 Excel / Numbers / Google 表格填好模板，另存为 CSV 后选择它。也可以直接把表格单元格复制到「粘贴文本」。',
  importTextHint: '每行一门课，例如「FINA6001 Corporate Finance 周二 18:00-22:00」。单独一行的「周一」「Monday」会用于它下面的几行。',
  downloadTemplate: '下载模板',
  chooseFile: '选择文件',
  readText: '识别文本',
  importFound: '识别到 {n} 门课',
  weeksCount: '{n} 周',
  importNone: '没有识别到课程。请确认每门课都有星期几和类似 18:00-22:00 的时间。',
  importTermStart: '同时把开学日期设为 {date}（第一节课所在周的周一）',
  replaceCourses: '替换现有课程',
  appendCourses: '追加到现有课程',
  setupTitle: '设置你的学费计时器',
  setupIntro: '大约一分钟。所有内容只保存在这个浏览器里。',
  stepOf: '第 {n} / {total} 步',
  stepSchool: '学校与学费',
  stepCourses: '课程',
  stepExtras: '假日与换算',
  back: '上一步',
  next: '下一步',
  finish: '开始计时',
  save: '保存',
  close: '关闭',
  schoolName: '学校',
  schoolNamePlaceholder: '搜索或输入，例如 港大 / HKU',
  schoolNameHint: 'QS 前 500 名（不含内地高校）可直接搜索；不在列表里的直接输入即可。',
  schoolUseTyped: '使用「{name}」（不在列表中）',
  schoolLoading: '正在载入学校列表…',
  programme: '就读项目（可选）',
  programmePlaceholder: '例如 MSc Computer Science',
  region: '地区',
  currency: '学费货币',
  timeZone: '学校时区',
  timeZoneHint: '课程时间按这个时区计算，不受你电脑所在时区影响。',
  tuition: '总学费',
  tuitionHint: '整个项目的学费，以学费货币计。',
  coursesTitle: '课程',
  coursesHint: '每门课从开学日期起，按上课日上满所填周数（假日除外）。每秒成本 = 总学费 ÷ 总课时。',
  courseName: '课程名',
  courseNamePlaceholder: '例如 Corporate Finance',
  startTime: '开始',
  endTime: '结束',
  weeks: '周数',
  addCourse: '添加课程',
  removeCourse: '删除',
  totalHours: '共 {hours} 小时 · {classes} 节课',
  ratePreview: '约每秒 {rate}',
  holidaysTitle: '假日',
  holidaysHint: '假日当天的课视为不上：不计入已消耗，学费分摊到其他课节上。如果学校那天照常上课，把这个公众假期的提醒关掉即可。',
  skippedHolidays: '（已扣除 {n} 节假日的课）',
  publicHolidays: '公众假期 · {region}',
  noPublicHolidays: '这个地区暂时没有内置的公众假期。',
  showPast: '显示已过去的',
  hidePast: '隐藏已过去的',
  remind: '提醒',
  schoolHolidays: '学校假日',
  holidayStart: '开始日期',
  holidayEnd: '结束日期（可选）',
  holidayName: '备注',
  holidayNamePlaceholder: '例如 阅读周',
  addHoliday: '添加假日',
  fxTitle: '汇率换算',
  displayCurrency: '换算成',
  displayCurrencyOff: '不换算',
  displayCurrencyHint: '使用每日参考汇率（open.er-api.com），不是实时交易牌价。',
  fixedRate: '固定汇率（可选）',
  fixedRateHint: '留空则使用每日参考汇率。',
  fixedRateCurrent: '当前参考汇率：1 {from} ≈ {rate} {to}（{date}）。',
  rateLine: '1 {from} ≈ {rate} {to}',
  rateReference: '参考汇率，更新于 {date} · 非实时牌价',
  rateCached: '离线 · 使用 {date} 的缓存汇率',
  rateFixed: '手动固定汇率',
  rateLoading: '正在获取汇率…',
  rateUnavailable: '暂时获取不到 {from} → {to} 的汇率',
  dataTitle: '数据',
  exportJson: '导出 JSON',
  importJson: '导入 JSON',
  importDone: '已导入，确认无误后保存。',
  importFailed: '这个文件不是 Tuition Ticker 的配置。',
  dataPrivacy: '配置只保存在这个浏览器里，不会上传。网站用 GoatCounter 统计匿名访问量（不用 cookie，不含配置内容）。',
  coffee: '请我喝杯咖啡',
  resetData: '清除数据，回到演示',
  resetBody:
    '会删除这个浏览器里保存的配置（学校、学费、课程、假日）和当前选中的课，无法撤销；想保留的话先导出 JSON。语言、主题和打码设置不受影响。',
  resetConfirm: '确认清除',
  errSchoolName: '请填写名称。',
  errTuition: '学费需要大于 0。',
  errCourses: '至少添加一门填写完整的课程。',
  errCourseTime: '结束时间要晚于开始时间（不支持跨午夜）。',
  errCourseCount: '请填写大于 0 的整数。',
  errHolidayRange: '结束日期要晚于开始日期。',
};

export type MessageKey = keyof Messages;

export type Lang = 'zh' | 'en';
/** The user's choice; `auto` follows the browser. Stored per device, never in the config. */
export type LangPref = 'auto' | Lang;

const LANG_KEY = 'tuition-ticker:lang';
const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
const browserIsZh = browserLang.toLowerCase().startsWith('zh');

function readPref(): LangPref {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'zh' || v === 'en' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function resolve(pref: LangPref): { lang: Lang; locale: string } {
  const lang: Lang = pref === 'auto' ? (browserIsZh ? 'zh' : 'en') : pref;
  // Keep the browser's regional variant (zh-HK, en-GB …) when it matches the language.
  const locale = (lang === 'zh') === browserIsZh ? browserLang : lang === 'zh' ? 'zh-CN' : 'en-US';
  return { lang, locale };
}

let pref: LangPref = readPref();
/** Current UI language. A live binding: re-read it on each render. */
export let lang: Lang = resolve(pref).lang;
/** Locale for number formatting, matching `lang`. */
export let locale: string = resolve(pref).locale;
let messages = lang === 'zh' ? zh : en;

const listeners = new Set<() => void>();

function apply(): void {
  ({ lang, locale } = resolve(pref));
  messages = lang === 'zh' ? zh : en;
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}
apply();

export const getLangPref = (): LangPref => pref;

/** Switches the UI language and remembers the choice on this device. */
export function setLangPref(next: LangPref): void {
  pref = next;
  try {
    if (next === 'auto') localStorage.removeItem(LANG_KEY);
    else localStorage.setItem(LANG_KEY, next);
  } catch {
    // Blocked storage: the switch still applies until reload.
  }
  apply();
  listeners.forEach((fn) => fn());
}

/** For useSyncExternalStore: re-render the app when the language changes. */
export function subscribeLang(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
const LATIN = /[A-Za-z0-9]/;

/**
 * Fills `{name}` placeholders. With `spaceCjk`, a value starting or ending with a Latin
 * letter or digit gets a space where it meets a Chinese character ("今天是 Reading Week").
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
  spaceCjk: boolean,
): string {
  return template.replace(/\{(\w+)\}/g, (match: string, k: string, offset: number) => {
    let v = String(vars[k] ?? '');
    if (spaceCjk && v) {
      const before = template[offset - 1];
      const after = template[offset + match.length];
      if (before && CJK.test(before) && LATIN.test(v[0]!)) v = ` ${v}`;
      if (after && CJK.test(after) && LATIN.test(v[v.length - 1]!)) v = `${v} `;
    }
    return v;
  });
}

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  return interpolate(messages[key], vars, lang === 'zh');
}
