import jsYaml from '../importmap/js-yaml/dist/js-yaml.mjs';

class Logger {
  constructor(prefix = 'wikibase-for-web') {
    this.prefix = prefix;
  }

  // Helper function to check if a string is valid JSON
  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Recursive function to process the dump object
  processDump(dump) {
    if (typeof dump === 'string' && this.isJSON(dump)) {
      // If it's a valid JSON string, parse it
      return JSON.parse(dump);
    } else if (typeof dump === 'object' && dump !== null) {
      // If it's an object or array, process its properties/elements
      for (let key in dump) {
        if (dump.hasOwnProperty(key)) {
          dump[key] = this.processDump(dump[key]);
        }
      }
    }
    return dump;
  }

  log(message, dump = false, type = 'info') {
    if (!dump) {
      console[type](`${this.prefix}: ${message}`);
    } else {
      // Process the dump recursively
      const processedDump = this.processDump(structuredClone(dump));
      console.group(`${this.prefix}: ${message}`);
      console[type](jsYaml.dump(processedDump));
      console.groupEnd();
    }
  }
}

export default Logger;
