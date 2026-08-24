/**
 * Outline filter for the timer numerals.
 *
 * `-webkit-text-stroke` traces every contour a glyph is built from, so any
 * font whose digits are assembled from overlapping shapes shows the internal
 * seams as stray lines inside the number (Instrument Sans does this on 2, 4
 * and 5; Inter on 4). Deriving the outline instead of stroking it avoids the
 * problem entirely: erode the glyph's alpha, subtract it from the filled
 * glyph, and what remains is a clean ring around the shape's true silhouette —
 * independent of how many contours the glyph happens to use.
 */
export function SvgFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }} focusable="false">
      <defs>
        <filter id="numeral-outline" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="erode" radius="2.5" result="inner" />
          <feComposite in="SourceGraphic" in2="inner" operator="out" />
        </filter>
      </defs>
    </svg>
  )
}
