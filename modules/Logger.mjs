class Logger {
  constructor(prefix = 'wikibase-for-web') {
    this.prefix = prefix;
  }

  // Format arguments to always include the prefix
  _formatArgs(args) {
    if (typeof args[0] === 'string') {
      return [`${this.prefix}: ${args[0]}`, ...args.slice(1)];
    }
    return [`${this.prefix}:`, ...args];
  }

  info(...args) {
    console.info(...this._formatArgs(args));
  }

  warn(...args) {
    console.warn(...this._formatArgs(args));
  }

  error(...args) {
    console.error(...this._formatArgs(args));
  }

  debug(...args) {
    console.debug(...this._formatArgs(args));
  }

  // Alias log to info for general usages
  log(...args) {
    console.info(...this._formatArgs(args));
  }
}

export default Logger;
