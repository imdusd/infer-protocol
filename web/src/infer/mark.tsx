import favicon from "../../public/favicon.svg?raw";

/** The site mark: the favicon's own pixels (public/favicon.svg), drawn in the text colour so it
 * follows the theme. Read from the file at build time, so the two can never drift apart. */
const MARK =
  favicon.match(/<g style="fill:var\(--text\)">(.*?)<\/g>/)?.[1] ?? "";
export function Mark() {
  return (
    <svg
      className="infer-mark-glyph"
      viewBox="0 0 16 16"
      width="26"
      height="26"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor" dangerouslySetInnerHTML={{ __html: MARK }} />
    </svg>
  );
}
