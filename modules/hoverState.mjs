import { createContext, h } from '../importmap/preact/src/index.js';
import { useState } from '../importmap/preact/hooks/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

const html = htm.bind(h);

export const HoverContext = createContext(null);

export function HoverProvider({ children }) {
  const [hoveredOrdinal, setHoveredOrdinal] = useState(null);

  return html`
    <${HoverContext.Provider} value=${[hoveredOrdinal, setHoveredOrdinal]}>
      ${children}
    </${HoverContext.Provider}>
  `;
} 