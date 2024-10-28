export default class dateExtractor {
  constructor({ dictionary, lang }) {
    this.dictionary = dictionary;
    if (lang) {
      this.lang = lang;
      this.orderInLang = new Intl.DateTimeFormat(lang)
        .formatToParts(new Date())
        .map(part => part.type)
        .filter(type => ['year', 'month', 'day'].includes(type));
    } else {
      // Default date order
      this.orderInLang = ['year', 'month', 'day'];
    }
  }

  extractNumbers(input) {
    const numbers = [];
    const numberRegex = /\d+/g;
    let match;
    while ((match = numberRegex.exec(input)) !== null) {
      numbers.push({
        value: parseInt(match[0], 10),
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return numbers;
  }

  searchDictionary(input) {
    const findings = [];
    let remaining = input;
    for (const key in this.dictionary) {
      const entry = this.dictionary[key];
      if (this?.lang !== entry.lang) {
        continue;
      }
      if (input.includes(entry.string)) {
        findings.push(entry);
        remaining = input.replace(entry.string, '');
      }
    }
    return {
      remaining: remaining,
      findings: findings,
    };
  }

  extract(input) {
    const { remaining, findings } = this.searchDictionary(input);

    // Assign date components based on dictionary matches
    let identifiedYear = null;
    let identifiedMonth = null;
    let identifiedDay = null;

    for (const entry of findings) {
      if (entry.type === 'year') {
        identifiedYear = entry.ordinal;
      } else if (entry.type === 'month') {
        identifiedMonth = entry.ordinal;
      } else if (entry.type === 'day') {
        identifiedDay = entry.ordinal;
      }
    }

    // Extract numbers from the modified input string
    const numbers = this.extractNumbers(remaining);

    // Assign date components based on numbers
    const possibleYears = numbers
      .filter(num => num.value >= 1000 && num.value <= 9999)
      .map(num => num.value);
    const possibleMonths = numbers
      .filter(num => num.value >= 1 && num.value <= 12)
      .map(num => num.value);
    const possibleDays = numbers
      .filter(num => num.value >= 1 && num.value <= 31)
      .map(num => num.value);

    let year =
      identifiedYear || (possibleYears.length === 1 ? possibleYears[0] : null);
    let month =
      identifiedMonth ||
      (possibleMonths.length === 1 ? possibleMonths[0] : null);
    let day =
      identifiedDay || (possibleDays.length === 1 ? possibleDays[0] : null);

    // Handle ambiguous cases based on date order
    if (!year || !month || !day) {
      const dateOrder = this.orderInLang.slice();
      const unassignedNumbers = numbers.map(num => num.value);

      // Remove already identified components
      const identifiedValues = [year, month, day].filter(v => v !== null);
      const remainingNumbers = unassignedNumbers.filter(
        num => !identifiedValues.includes(num),
      );

      if (remainingNumbers.length >= 1) {
        for (const component of dateOrder) {
          if (component === 'year' && !year) {
            const num = remainingNumbers.find(num => num >= 1000);
            if (num) {
              year = num;
              remainingNumbers.splice(remainingNumbers.indexOf(num), 1);
            }
          } else if (component === 'month' && !month) {
            const num = remainingNumbers.find(num => num >= 1 && num <= 12);
            if (num) {
              month = num;
              remainingNumbers.splice(remainingNumbers.indexOf(num), 1);
            }
          } else if (component === 'day' && !day) {
            const num = remainingNumbers.find(num => num >= 1 && num <= 31);
            if (num) {
              day = num;
              remainingNumbers.splice(remainingNumbers.indexOf(num), 1);
            }
          }
        }
      }
    }

    // Determine precision
    let precision;
    if (year && month && day) {
      precision = 11; // Day-level precision
    } else if (year && month) {
      precision = 10; // Month-level precision
      day = 1; // Default day
    } else if (year) {
      precision = 9; // Year-level precision
      month = 1; // Default month
      day = 1; // Default day
    } else {
      // Unable to extract a date
      return null;
    }

    // Assign to 'this' properties
    this.year = year;
    this.month = month;
    this.day = day;

    // Build the final time string
    const time = [
      '+',
      this.year.toString(10).padStart(4, '0'),
      '-',
      this.month.toString(10).padStart(2, '0'),
      '-',
      this.day.toString(10).padStart(2, '0'),
      'T00:00:00Z',
    ].join('');

    return {
      time,
      precision,
    };
  }
}
