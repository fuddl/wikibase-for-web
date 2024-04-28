const submitSelection = e => {
  (async () => {
    const text = document.getSelection().toString().trim();
    if (text) {
      await browser.runtime.sendMessage({
        type: 'text_selected',
        value: text,
      });
    }
  })();
};

document.addEventListener('selectionchange', submitSelection);
for (const inputElement of document.querySelectorAll('input, textarea')) {
  inputElement.addEventListener('selectionchange', submitSelection);
}
