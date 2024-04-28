class OptionsHistoryAPI {
    constructor() {
        this.storageKeyPrefix = 'optionsHistory_'; // Prefix for localStorage keys
    }

    hashOptions(options) {
        // Create a simple hash from an array of options
        return options.sort().join('|').hashCode();
    }

    updateOptionPick(options, pickedOption) {
        const hash = this.hashOptions(options);
        const key = this.storageKeyPrefix + hash;
        const optionsHistory = this.getOptionsHistory(key);

        // Update the timestamp for the picked option
        optionsHistory[pickedOption] = Date.now();
        localStorage.setItem(key, JSON.stringify(optionsHistory));
    }

    getOptionsHistory(key) {
        const optionsHistory = localStorage.getItem(key);
        return optionsHistory ? JSON.parse(optionsHistory) : {};
    }

    getSortedOptions(options) {
        const hash = this.hashOptions(options);
        const key = this.storageKeyPrefix + hash;
        const optionsHistory = this.getOptionsHistory(key);

        // Sort options by last picked timestamp, from most recent to never picked
        return options.sort((a, b) => {
            const timeA = optionsHistory[a] || 0;
            const timeB = optionsHistory[b] || 0;
            return timeB - timeA; // Descending order
        });
    }
}

// Adding a simple hash code function to String prototype
String.prototype.hashCode = function () {
    let hash = 0,
        i,
        chr;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

export default OptionsHistoryAPI;
