import { metaToEdits } from './meta.mjs';
import { ldToEdits } from './ld.mjs';
import { urlReference } from './urlReference.mjs';

// Utility function to find the intersection of two arrays
const intersectArrays = (arr1, arr2) =>
  arr1.filter(item => arr2.includes(item));

// Utility function to merge and deduplicate arrays
const mergeAndDeduplicateArrays = (arr1, arr2) => [
  ...new Set([...arr1, ...arr2]),
];

// Function to merge two edits with a preference for non-null values
function mergeEditsWithNonNullPreference(edit1, edit2) {
  let mergedEdit = {};

  // Get a unique list of keys from both edits
  let allKeys = new Set([...Object.keys(edit1), ...Object.keys(edit2)]);

  allKeys.forEach(key => {
    if (edit1[key] !== null && edit2[key] === null) {
      // Prefer non-null edit1[key]
      mergedEdit[key] = edit1[key];
    } else if (edit1[key] === null && edit2[key] !== null) {
      // Prefer non-null edit2[key]
      mergedEdit[key] = edit2[key];
    } else if (key === 'propertyOptions' && edit1[key] && edit2[key]) {
      // Intersect propertyOptions arrays
      mergedEdit[key] = intersectArrays(edit1[key], edit2[key]);
    } else if (key === 'references' && edit1[key] && edit2[key]) {
      // Merge and deduplicate references arrays
      mergedEdit[key] = mergeAndDeduplicateArrays(edit1[key], edit2[key]);
    } else {
      // For all other keys or non-null scenarios, prefer edit2's value
      mergedEdit[key] = edit2[key] !== undefined ? edit2[key] : edit1[key];
    }
  });

  return mergedEdit;
}

// Function to reconcile two sets of edits based on rules
function reconcileEditSets(editSet1, editSet2) {
  let reconciledEdits = [];
  let processedIndices = new Set();

  editSet1.forEach((edit1, index1) => {
    let foundMatch = false;

    editSet2.forEach((edit2, index2) => {
      const identicalActions = edit1.action === edit2.action;
      const identicalValues =
        JSON.stringify(edit1.datavalue) === JSON.stringify(edit2.datavalue);
      if (identicalActions && identicalValues) {
        foundMatch = true;
        processedIndices.add(index2);

        // Merge edits based on rules
        let mergedEdit = mergeEditsWithNonNullPreference(edit1, edit2);

        if (edit1.propertyOptions && edit2.propertyOptions) {
          mergedEdit.propertyOptions = intersectArrays(
            edit1.propertyOptions,
            edit2.propertyOptions,
          );
        }

        if (edit1.references && edit2.references) {
          mergedEdit.references = mergeAndDeduplicateArrays(
            edit1.references,
            edit2.references,
          );
        }

        // Add more reconciliation rules here

        reconciledEdits.push(mergedEdit);
      }
    });

    // If no match was found for this edit in editSet1, add it to the reconciled set
    if (!foundMatch) {
      reconciledEdits.push(edit1);
    }
  });

  // Add remaining edits from editSet2 that were not processed
  editSet2.forEach((edit, index) => {
    if (!processedIndices.has(index)) {
      reconciledEdits.push(edit);
    }
  });

  return reconciledEdits;
}

export async function suggestedEdits(metadata, wikibase) {
  const references = urlReference(metadata, wikibase);

  const metaEdits = await metaToEdits({
    meta: metadata.meta,
    wikibase: wikibase,
    lang: metadata?.lang,
    references: references,
  });
  const linkedDataEdits = await ldToEdits({
    ld: metadata.linkData,
    wikibase: wikibase,
    metadata: metadata,
    references: references,
  });

  return reconcileEditSets(metaEdits, linkedDataEdits);
}
