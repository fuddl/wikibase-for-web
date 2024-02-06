export function objectGetFirst(obj) {
  // Ensure the input is an object and has at least one property
  if (typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0) {
    const firstKey = Object.keys(obj)[0]
    return obj[firstKey]
  } else {
    // Return undefined or throw an error if the input is not an object or is empty
    console.error("Input must be a non-empty object.")
    return undefined // or throw new Error("Input must be a non-empty object.");
  }
}