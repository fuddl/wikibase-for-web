const toRomanNumeral = num => {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = [
    'M',
    'CM',
    'D',
    'CD',
    'C',
    'XC',
    'L',
    'XL',
    'X',
    'IX',
    'V',
    'IV',
    'I',
  ];

  let roman = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      roman += numerals[i];
      num -= values[i];
    }
  }
  return roman;
};

export { toRomanNumeral };
