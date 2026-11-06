import markUrl from '../assets/zero-mark.svg';
import wordDark from '../assets/zero-word-dark.svg';
import wordLight from '../assets/zero-word-light.svg';
import { cx } from './ui';

export function ZeroMark({ size = 36, className }) {
  return <img src={markUrl} width={size} height={size} alt="" draggable="false" className={cx('select-none', className)} />;
}

/** ZERO wordmark that follows the system light/dark theme. */
export function ZeroWord({ height = 22, className }) {
  return (
    <span className={cx('inline-flex', className)} style={{ height }}>
      <img src={wordDark} alt="ZERO" draggable="false" className="h-full w-auto dark:hidden" />
      <img src={wordLight} alt="ZERO" draggable="false" className="hidden h-full w-auto dark:block" />
    </span>
  );
}

/** Inline SVG from ZERO often omits xmlns, which a standalone SVG image needs. */
export const withXmlns = (svg) => (svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));

/** An app's own mark (SVG from ZERO) as an image: SVG inside <img> can't run scripts. */
export function AppMark({ app, size = 44, className }) {
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withXmlns(app.mark || ''))}`;
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-2xl border border-line bg-card', className)} style={{ width: size, height: size }}>
      <img src={src} alt="" draggable="false" style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  );
}
