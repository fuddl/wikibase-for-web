export default class quantityExtractor {
  normalize(number) {
    // first let's remove all the spaces
    let output = number.replace(/\s+/g, '');
    output = this.convertFraction(output);
    let seperators = output.match(/['·,\.]/g);
    if (seperators && seperators.length > 0) {
      const allIdentical =
        seperators.length > 1 &&
        (arr => arr.every(v => v === arr[0]))(seperators);

      // if all non numbers are identical, they are probably not decimal seperators
      if (!allIdentical) {
        const last = seperators.at(-1);
        // if there is only one seperator it's proably the decimal seperator
        // let's replace it by our self-invented decimal seperator
        output = output.replace(new RegExp(`${last}([^${last}]+)$`), '✱$1');
      }
    }
    // remove all remaining non numbers and non-certified comma seperator
    output = output.replace(/[^\d✱]/g, '');
    output = output.replace('✱', '.');

    return output;
  }

  convertFraction(numberStr) {
    // Mapping of fraction Unicode characters to their decimal values
    const fractionMap = {
      '¼': 0.25,
      '½': 0.5,
      '¾': 0.75,
      '⅐': 1 / 7,
      '⅑': 1 / 9,
      '⅒': 0.1,
      '⅓': 1 / 3,
      '⅔': 2 / 3,
      '⅕': 0.2,
      '⅖': 0.4,
      '⅗': 0.6,
      '⅘': 0.8,
      '⅙': 1 / 6,
      '⅚': 5 / 6,
      '⅛': 0.125,
      '⅜': 0.375,
      '⅝': 0.625,
      '⅞': 0.875,
    };

    // Match integer part followed by a fraction character
    const match = numberStr.match(/^(\d+)([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
    if (match) {
      const integer = parseInt(match[1], 10);
      const fraction = fractionMap[match[2]] || 0;
      return (integer + fraction).toString(10);
    }

    // If no match, return the original number as a float
    return numberStr;
  }

  getAffixes(input, match) {
    const matchIndex = input.indexOf(match);

    // Extract word preceding the match
    const prefixMatch = input.slice(0, matchIndex).match(/[^\s]+/g);
    const prefix = prefixMatch
      ? prefixMatch[prefixMatch.length - 1].trim()
      : null;

    // Extract word following the match
    const suffixMatch = input
      .slice(matchIndex + match.length)
      .match(/^\s*([^\s]+)/);
    const suffix = suffixMatch ? suffixMatch[0].trim() : null;

    return [prefix, suffix];
  }

  extract(input) {
    const patterns = [
      // unicode fractions
      /(\d+)([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g,
      // floats with possible thousands separators
      /(?:\d{1,3}(?:[,'·\.\s ]\d{3})*|\d*)(?<=\d)(?:[.,·\s]\d+)/g,
      // integers
      /\d+/g,
    ];

    let mostNotable = { amount: null, unitString: null };
    let maxLength = 0;

    // Function to iterate over patterns and find the most notable match
    patterns.forEach(pattern => {
      let matches;
      while ((matches = pattern.exec(input)) !== null) {
        const [number] = matches;
        const normalized = this.normalize(number); // Normalize the number string

        // Calculate the "noticeability" based on the length of the normalized number string
        const numberLength = normalized.length;

        // Update the result if this match is more notable
        if (numberLength > maxLength) {
          mostNotable = {
            amountString: number,
            amount: parseFloat(normalized),
          };
          maxLength = numberLength;
        }
      }
    });

    if (mostNotable.amount) {
      const [prefix, suffix] = this.getAffixes(input, mostNotable.amountString);
      mostNotable.unitString =
        prefix === null
          ? suffix
          : suffix === null
            ? prefix
            : prefix.length < suffix.length
              ? prefix
              : suffix;
    }

    delete mostNotable.amountString;

    return mostNotable;
  }
}
