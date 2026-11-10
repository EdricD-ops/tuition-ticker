import { useEffect, useState, useSyncExternalStore } from 'react';
import { getLangPref, setLangPref, subscribeLang, t } from '../app/i18n';
import { getThemePref, setThemePref, subscribeTheme } from '../app/theme';
import { RateNote } from './Fx';
import { track } from '../app/analytics';
import { COFFEE_URL } from '../app/site';
import { CoffeeIcon, FullscreenIcon, GlobeIcon, MiniIcon, MoonIcon } from './icons';
import { IconButton, PopMenu } from './PopMenu';
import { Quip } from './views';

/**
 * Bottom bar: device preferences on the left (language, theme) plus the coffee link, the quip and rate note in
 * the middle, view controls on the right (mini, full screen). On phones the text sits on
 * its own row above the two icon groups.
 */
export function Footer({ onMini }: { onMini: () => void }) {
  const langPref = useSyncExternalStore(subscribeLang, getLangPref);
  const themePref = useSyncExternalStore(subscribeTheme, getThemePref);

  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  const fullscreenLabel = fullscreen ? t('exitFullscreen') : t('fullscreen');

  return (
    <footer className="px-5 pt-2 pb-3 sm:px-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 items-end gap-x-4 gap-y-2 [grid-template-areas:'text_text''left_right'] sm:grid-cols-[1fr_auto_1fr] sm:[grid-template-areas:'left_text_right']">
        <div className="flex items-center gap-1 [grid-area:left]">
          <PopMenu
            label={t('language')}
            icon={<GlobeIcon />}
            items={[
              { label: t('langAuto'), selected: langPref === 'auto', onSelect: () => setLangPref('auto') },
              { label: '中文', selected: langPref === 'zh', onSelect: () => setLangPref('zh') },
              { label: 'English', selected: langPref === 'en', onSelect: () => setLangPref('en') },
            ]}
          />
          <PopMenu
            label={t('theme')}
            icon={<MoonIcon />}
            items={[
              { label: t('themeSystem'), selected: themePref === 'system', onSelect: () => setThemePref('system') },
              { label: t('themeLight'), selected: themePref === 'light', onSelect: () => setThemePref('light') },
              { label: t('themeDark'), selected: themePref === 'dark', onSelect: () => setThemePref('dark') },
            ]}
          />
          {COFFEE_URL && (
            <a
              href={COFFEE_URL}
              target="_blank"
              rel="noopener"
              title={t('coffee')}
              aria-label={t('coffee')}
              onClick={() => track('coffee')}
              className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-200 hover:bg-raised hover:text-fg"
            >
              <CoffeeIcon />
            </a>
          )}
        </div>
        <div className="min-w-0 [grid-area:text]">
          <Quip />
          <RateNote className="mt-1.5 text-center" />
        </div>
        <div className="flex items-center justify-end gap-1 [grid-area:right]">
          <IconButton label={t('miniViewHint')} onClick={onMini}>
            <MiniIcon />
          </IconButton>
          {canFullscreen && (
            <IconButton
              label={fullscreenLabel}
              onClick={() =>
                fullscreen ? void document.exitFullscreen() : void document.documentElement.requestFullscreen()
              }
            >
              <FullscreenIcon exit={fullscreen} />
            </IconButton>
          )}
        </div>
      </div>
    </footer>
  );
}
