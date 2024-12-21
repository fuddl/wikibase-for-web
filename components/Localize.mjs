import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';

const html = htm.bind(h);

const Localize = ({ message, placeholders }) => {
  // Fetch the localized message template
  const rawMessage = browser.i18n.getMessage(
    message,
    placeholders.map((e, i) => `$[${i}]$`),
  );

  // Split the message by placeholders (e.g., $ENTITY$)
  const parts = rawMessage.split(/\$(\[\w+\])\$/);

  // Render the message with placeholders interleaved
  return html`
    ${parts.map((part, index) => {
      // If the part matches a key in placeholders, replace it
      if (part.startsWith('[') && part.endsWith(']')) {
        return placeholders[parseInt(part.replace(/\[|\]/g, ''))];
      }
      // Otherwise, render the text part as is
      return part;
    })}
  `;
};

export default Localize;
