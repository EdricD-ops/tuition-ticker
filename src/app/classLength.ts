import { t } from './i18n';

/** "3 小时", "1.5 h", "50 min": hours when the length is a whole half hour of 1 h or more. */
export function classLength(minutes: number): string {
  if (minutes >= 60 && minutes % 30 === 0) return t('lenHours', { n: minutes / 60 });
  return t('lenMinutes', { n: Math.round(minutes) });
}
