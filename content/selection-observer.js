function selectionGetLang(selection) {
  if (!selection || selection.rangeCount === 0) {
    return null; // No selection or empty selection
  }

  const selectedNode = selection.anchorNode;
  if (!selectedNode) {
    return null; // No selected node
  }

  // Get the element associated with the selected node
  const element =
    selectedNode.nodeType === Node.TEXT_NODE
      ? selectedNode.parentElement
      : selectedNode;

  // Use closest to find the nearest ancestor with a lang attribute
  const langElement = element.closest('[lang]');
  return langElement ? langElement.lang : null;
}

const submitSelection = e => {
  (async () => {
    const selection = document.getSelection();
    let lang = selectionGetLang(selection);
    let text = selection.toString().trim();

    if (e.target.type === 'textarea') {
      text = e.target.value
        .substring(e.target.selectionStart, e.target.selectionEnd)
        .trim();
    }
    if (text) {
      await browser.runtime.sendMessage({
        type: 'text_selected',
        value: text,
        lang: lang,
        source: createUrlReference(selection.focusNode),
      });
    }
  })();
};

document.addEventListener('selectionchange', submitSelection);
for (const inputElement of document.querySelectorAll('textarea')) {
  inputElement.addEventListener('selectionchange', submitSelection);
}
