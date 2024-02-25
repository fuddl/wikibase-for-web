export function objectGetFirst(obj) {
  // Ensure the input is an object and has at least one property
  if (typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0) {
    const firstKey = Object.keys(obj)[0];
    return obj[firstKey];
  } else {
    // Return empty if the input is not an object or is empty
    return {};
  }
}
