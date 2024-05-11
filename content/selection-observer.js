const submitSelection = e => {
  (async () => {
    let text = document.getSelection().toString().trim();
    if (e.target.type === 'textarea') {
      text = e.target.value
        .substring(e.target.selectionStart, e.target.selectionEnd)
        .trim();
    }
    if (text) {
      await browser.runtime.sendMessage({
        type: 'text_selected',
        value: text,
      });
    }
  })();
};

document.addEventListener('selectionchange', submitSelection);
for (const inputElement of document.querySelectorAll('textarea')) {
  inputElement.addEventListener('selectionchange', submitSelection);
}
