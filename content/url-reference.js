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

function getMediaWikiGlobals() {
  const scripts = document.getElementsByTagName('script');

  for (let script of scripts) {
    if (script.textContent.includes('RLCONF')) {
      const match = /RLCONF\s*=\s*(\{[^;]*\})/.exec(script.textContent);

      if (match) {
        const correctedJson = match[1]
          .replace(/!0/g, 'true')
          .replace(/!1/g, 'false');

        try {
          // Extract values using regular expressions
          const extractValue = key => {
            const regex = new RegExp(
              `"${key}"\\s*:\\s*(".*?"|\\d+|true|false|null)`,
              'i',
            );
            const valueMatch = correctedJson.match(regex);
            return valueMatch ? JSON.parse(valueMatch[1]) : null;
          };

          const extractedData = {
            wgTitle: extractValue('wgTitle'),
            wgPageContentLanguage: extractValue('wgPageContentLanguage'),
            wgArticleId: extractValue('wgArticleId'),
            wgPageName: extractValue('wgPageName'),
            wgCurRevisionId: extractValue('wgCurRevisionId'),
            wgIsRedirect: extractValue('wgIsRedirect'),
            wgRevisionId: extractValue('wgRevisionId'),
          };

          return extractedData;
        } catch (e) {
          console.error('Error extracting data from script tag:', e);
        }
      }
    }
  }

  return null;
}

function createUrlReference(node) {
  const location = new URL(window.location.toString());

  const closestHeadline = getClosestHeadlineText(node);
  const section = getClosestIdentifier(node);
  if (section) {
    location.hash = section;
  }

  const wg = getMediaWikiGlobals();

  let title = document.title;

  if (wg) {
    if ('wgCurRevisionId' in wg && location.search === '') {
      location.search = `oldid=${wg.wgCurRevisionId}`;
    }
    if ('wgTitle' in wg) {
      title = wg.wgTitle;
    }
  }

  return {
    location: location.toString(),
    section:
      closestHeadline && title.includes(closestHeadline)
        ? null
        : closestHeadline,
    title: title,
    lang: document.documentElement.lang ?? 'und',
    wgArticleId: wg?.wgArticleId,
  };
}
