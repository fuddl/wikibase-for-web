class Logger {
    constructor(prefix = 'wikibase-for-web') {
        this.prefix = prefix;
    }

    log(message) {
        console.log(`${this.prefix}: ${message}`);
    }

    debug(message) {
        console.debug(`${this.prefix}: ${message}`);
    }

    info(message) {
        console.info(`${this.prefix}: ${message}`);
    }

    error(message) {
        console.error(`${this.prefix}: ${message}`);
    }

    group(title) {
        console.group(`${this.prefix}: ${title}`);
    }

    groupEnd() {
        console.groupEnd();
    }
}

export default Logger;
