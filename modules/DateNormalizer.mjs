class DateNormalizer {
  static normalizeDateString(dateStr) {
    const patterns = [
      { regex: /^([+-]?\d{1,4})-(\d{1,2})-(\d{1,2})/, precision: 11 }, // Year-Month-Day
      { regex: /^([+-]?\d{1,4})-(\d{1,2})$/, precision: 10 }, // Year-Month
      { regex: /^([+-]?\d{1,4})$/, precision: 9 }, // Year
    ];

    for (const { regex, precision } of patterns) {
      const match = dateStr.trim().match(regex);
      if (match) {
        let yearStr, monthStr, dayStr;
        let sign = '+';

        // Assign variables based on precision
        if (precision === 11) {
          yearStr = match[1];
          monthStr = match[2];
          dayStr = match[3];
        } else if (precision === 10) {
          yearStr = match[1];
          monthStr = match[2];
          dayStr = '01';
        } else if (precision === 9) {
          yearStr = match[1];
          monthStr = '01';
          dayStr = '01';
        }

        // Handle the sign
        if (yearStr.startsWith('-')) {
          sign = '-';
          yearStr = yearStr.slice(1);
        } else if (yearStr.startsWith('+')) {
          yearStr = yearStr.slice(1);
        }

        // Validate and pad the year
        if (!/^\d{1,4}$/.test(yearStr)) return false;
        yearStr = yearStr.padStart(4, '0');

        // Validate and pad month
        if (precision >= 10) {
          if (!/^\d{1,2}$/.test(monthStr)) return false;
          if (parseInt(monthStr, 10) < 1 || parseInt(monthStr, 10) > 12)
            return false;
          monthStr = monthStr.padStart(2, '0');
        } else {
          monthStr = '01';
        }

        // Validate and pad day
        if (precision === 11) {
          if (!/^\d{1,2}$/.test(dayStr)) return false;
          if (!this.isValidDay(sign + yearStr, monthStr, dayStr)) return false;
          dayStr = dayStr.padStart(2, '0');
        } else {
          dayStr = '01';
        }

        const time = `${sign}${yearStr}-${monthStr}-${dayStr}T00:00:00Z`;
        return { time, precision };
      }
    }

    // If no pattern matched, return false
    return false;
  }

  static isValidDay(yearStr, monthStr, dayStr) {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (day < 1) return false;

    const daysInMonth = [
      31,
      this.isLeapYear(year) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    if (month < 1 || month > 12) return false;

    return day <= daysInMonth[month - 1];
  }

  static isLeapYear(year) {
    // Leap year calculation
    if (year % 4 !== 0) return false;
    if (year % 100 !== 0) return true;
    if (year % 400 !== 0) return false;
    return true;
  }
}

export default DateNormalizer;
