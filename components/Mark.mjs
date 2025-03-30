import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import { useEffect, useContext } from '../importmap/preact/hooks/src/index.js';
import { requireStylesheet } from '../modules/requireStylesheet.mjs';
import { HoverContext } from '../modules/hoverState.mjs';

const html = htm.bind(h);

function Mark({ ordinal }) {
  useEffect(() => {
    requireStylesheet(browser.runtime.getURL('/components/mark.css'));
  }, []);

  const [hoveredOrdinal, setHoveredOrdinal] = useContext(HoverContext);
  const isHovered = hoveredOrdinal === ordinal;

  return html`
    <span 
      class="mark ${isHovered ? 'mark--hovered' : ''}"
      onMouseEnter=${() => setHoveredOrdinal(ordinal)}
      onMouseLeave=${() => setHoveredOrdinal(null)}
    >${ordinal}</span>
  `;
}

export default Mark; 