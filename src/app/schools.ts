import { toHans } from './hant';

/**
 * Candidate schools for the "School" box: QS top 500 outside mainland China
 * (`presets/schools.json`). Names only — programme and tuition are always the user's own.
 */
export interface School {
  id: string;
  /** Official English name. */
  name: string;
  /** Official name in the school's own script where it differs (香港大學, 東京大学, 서울대학교). */
  local?: string;
  /** Simplified Chinese name, for search and as a hint. */
  zh: string;
  /** Abbreviations and other names people search by (HKU, 港大, UCL…). */
  aliases?: string[];
  /** Region code, matching `src/app/regions.ts`. */
  country: string;
  /** IANA time zone of the main campus. */
  timeZone: string;
}

export interface SchoolList {
  source: string;
  updated: string;
  schools: School[];
}

/** How the school name is written into the config: local script first, then English. */
export const schoolDisplayName = (s: School): string => (s.local ? `${s.local} ${s.name}` : s.name);

/** Lower-case, accent-free, punctuation-free text for matching. */
export function normalize(text: string): string {
  // Traditional and Simplified spellings match each other (劍橋 finds 剑桥).
  return toHans(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[·・,.()'’"“”\-–—|&/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (text: string) => text.replace(/\s+/g, '');
const STOP = /^(the|university|of|universit[eéày]|universidad|universitat|universiteit|universiti|universitas|college|institute|de|di|del|der)$/;

interface Indexed {
  school: School;
  /** Normalised names: [display, English, local, zh, ...aliases]. */
  names: string[];
  /** Normalised aliases, matched exactly first. */
  aliases: string[];
  /** Order in the list (QS rank order), the final tie-breaker. */
  order: number;
}

export function indexSchools(schools: School[]): Indexed[] {
  return schools.map((school, order) => {
    const aliases = (school.aliases ?? []).map(normalize);
    const names = [school.name, school.local ?? '', school.zh].filter(Boolean).map(normalize);
    return { school, names: [...names, ...aliases], aliases, order };
  });
}

/**
 * Best matches for what the user typed: English, local script, simplified Chinese or an
 * abbreviation. Exact abbreviations rank first, then names that start with the query, then
 * names with a word starting with it, then any substring; ties keep QS order.
 */
export function searchSchools(index: Indexed[], query: string, limit = 8): School[] {
  const q = normalize(query);
  if (!q) return [];
  const qc = compact(q);
  const words = q.split(' ').filter((w) => !STOP.test(w));
  const scored: { s: School; score: number; order: number }[] = [];
  for (const item of index) {
    let score = Infinity;
    if (item.aliases.some((a) => a === q || compact(a) === qc)) score = 0;
    for (const name of item.names) {
      if (score <= 1) break;
      const nc = compact(name);
      if (name === q || nc === qc) score = Math.min(score, 0.5);
      else if (name.startsWith(q) || nc.startsWith(qc)) score = Math.min(score, 1);
      else if (name.split(' ').some((w) => w.startsWith(q))) score = Math.min(score, 2);
      else if (nc.includes(qc)) score = Math.min(score, 3);
      else if (words.length > 1 && words.every((w) => name.includes(w))) score = Math.min(score, 4);
    }
    if (score < Infinity) scored.push({ s: item.school, score, order: item.order });
  }
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, limit).map((x) => x.s);
}
