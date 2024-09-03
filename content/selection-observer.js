function getClosestIdentifier(element) {
  // Helper function to check descendants for id or name
  function findInDescendants(element) {
    if (element.id || element.name) {
      return element.id || element.name;
    }
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
      let result = findInDescendants(children[i]);
      if (result) return result;
    }
    return null;
  }

  // Traverse up through the ancestors
  let currentElement = element;
  while (currentElement) {
    // First, check the element itself
    if (currentElement.id || currentElement.name) {
      return currentElement.id || currentElement.name;
    }

    // Check preceding siblings and their descendants
    let sibling = currentElement.previousElementSibling;
    while (sibling) {
      let result = findInDescendants(sibling);
      if (result) return result;
      sibling = sibling.previousElementSibling;
    }

    // Move to the parent element
    currentElement = currentElement.parentElement;
  }
  return null;
}

function getClosestHeadlineText(element) {
  // Helper function to check descendants for headline elements
  function findInDescendants(element) {
    if (/^H[1-6]$/.test(element.tagName)) {
      return element.textContent.trim();
    }
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
      let result = findInDescendants(children[i]);
      if (result) return result;
    }
    return null;
  }

  // Traverse up through the ancestors
  let currentElement = element;
  while (currentElement) {
    // First, check the element itself if it is a headline
    if (/^H[1-6]$/.test(currentElement.tagName)) {
      return currentElement.textContent.trim();
    }

    // Check preceding siblings and their descendants
    let sibling = currentElement.previousElementSibling;
    while (sibling) {
      let result = findInDescendants(sibling);
      if (result) return result;
      sibling = sibling.previousElementSibling;
    }

    // Move to the parent element
    currentElement = currentElement.parentElement;
  }
  return null;
}

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
      const section = getClosestIdentifier(selection.focusNode);
      await browser.runtime.sendMessage({
        type: 'text_selected',
        value: text,
        lang: lang,
        source: {
          location: `${window.location.toString()}${section ? `#${section}` : ''}`,
          section: getClosestHeadlineText(selection.focusNode),
          title: document.title,
          lang: document.documentElement.lang ?? 'und',
        },
      });
    }
  })();
};

document.addEventListener('selectionchange', submitSelection);
for (const inputElement of document.querySelectorAll('textarea')) {
  inputElement.addEventListener('selectionchange', submitSelection);
}
