function getClosestIdentifier(element) {
  // Helper function to check if the element or its parent is a headline
  function isHeadlineOrChildOfHeadline(el) {
    if (!el) return false;
    const tagName = el.tagName?.toLowerCase();
    return (
      (tagName &&
        tagName.startsWith('h') &&
        tagName.length === 2 &&
        !isNaN(tagName[1])) ||
      (el.parentElement && /^h[1-6]$/i.test(el.parentElement.tagName))
    );
  }

  // Helper function to check descendants for id or name
  function findInDescendants(element) {
    if ((element.id || element.name) && isHeadlineOrChildOfHeadline(element)) {
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
    // First, check if currentElement is an element and has id or name
    if (
      currentElement.nodeType === Node.ELEMENT_NODE &&
      (currentElement.id || currentElement.name) &&
      isHeadlineOrChildOfHeadline(currentElement)
    ) {
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

  // If the initial element is a text node, use its parent for the closest() call
  const closestElement = (
    element.nodeType === Node.ELEMENT_NODE ? element : element.parentElement
  )?.closest('[id], [name]');
  if (closestElement) {
    return closestElement.id || closestElement.name;
  }

  return null;
}

function getClosestHeadlineText(element) {
  // Helper function to check descendants for headline elements
  function findInDescendants(element) {
    if (/^H[1-6]$/.test(element.tagName)) {
      return getHeadlineTextWithoutEdit(element);
    }
    let children = element.children;
    for (let i = 0; i < children.length; i++) {
      let result = findInDescendants(children[i]);
      if (result) return result;
    }
    return null;
  }

  // Helper function to extract the headline text while ignoring "edit" sections
  function getHeadlineTextWithoutEdit(headlineElement) {
    // Clone the headline element to avoid modifying the original
    let clonedHeadline = headlineElement.cloneNode(true);

    // Remove any child elements that have the class 'mw-editsection'
    let editSection = clonedHeadline.querySelector('.mw-editsection');
    if (editSection) {
      editSection.remove();
    }

    // Return the cleaned-up text content
    return clonedHeadline.textContent.trim();
  }

  // Traverse up through the ancestors
  let currentElement = element;
  while (currentElement) {
    // First, check the element itself if it is a headline
    if (/^H[1-6]$/.test(currentElement.tagName)) {
      return getHeadlineTextWithoutEdit(currentElement);
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
    let closestHeadline = getClosestHeadlineText(selection.focusNode);
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
          section:
            closestHeadline && document.title.includes(closestHeadline)
              ? null
              : closestHeadline,
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
