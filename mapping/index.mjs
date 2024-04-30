import { metaToEdits } from './meta.mjs';
import { ldToEdits } from './ld.mjs';
import { urlReference } from './urlReference.mjs';
import { constraintsToEdits } from './constraints.mjs';

function removeDuplicates(arr) {
  const seen = new Set();
  const uniqueObjects = [];

  // Loop through the array and add JSON string of each object to the Set if not already present
  for (const obj of arr) {
    const normalizedObj = { ...obj };
    normalizedObj.signature = '';

    const jsonString = JSON.stringify(normalizedObj);
    if (!seen.has(jsonString)) {
      seen.add(jsonString);
      uniqueObjects.push(obj);
    }
  }

  return uniqueObjects;
}

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
    } else if (!['signature'].includes(key)) {
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
      const identicalDatatypes =
        edit1?.claim?.mainsnak?.datatype === edit2?.claim?.mainsnak?.datatype;

      if (identicalActions && identicalDatatypes) {
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

        if (edit1.signature && edit2.signature) {
          mergedEdit.signature = [edit1.signature, edit2.signature]
            .sort()
            .join('|');
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

  return removeDuplicates(reconciledEdits);
}

export async function suggestedEdits(property, metadata, wikibase) {
  const references = urlReference(metadata, wikibase);

  const constraintEdits = await constraintsToEdits(property, wikibase);

  const metaEdits = await metaToEdits({
    meta: metadata.meta,
    wikibase: wikibase,
    metadata: metadata,
    references: references,
  });

  const constraintAndMetaEdits = reconcileEditSets(constraintEdits, metaEdits);

  const linkedDataEdits = await ldToEdits({
    ld: metadata.linkData,
    wikibase: wikibase,
    metadata: metadata,
    references: references,
  });

  return reconcileEditSets(constraintAndMetaEdits, linkedDataEdits);
}
