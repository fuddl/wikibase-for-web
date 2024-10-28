import dateExtractor from './dateExtractor.mjs';

const dictionary = [
  {
    string: 'September',
    type: 'month',
    ordinal: 9,
    lang: 'en',
  },
  {
    string: 'Sept',
    type: 'month',
    ordinal: 9,
    lang: 'en',
  },
  {
    string: 'Septembers',
    type: 'month',
    ordinal: 9,
    lang: 'en',
  },
  {
    string: '1st',
    type: 'day',
    ordinal: 1,
    lang: 'en',
  },
  {
    string: '2nd',
    type: 'day',
    ordinal: 2,
    lang: 'en',
  },
  {
    string: '3rd',
    type: 'day',
    ordinal: 3,
    lang: 'en',
  },
  {
    string: 'Dezember',
    type: 'month',
    ordinal: 12,
    lang: 'de',
  },
  {
    string: 'Dez.',
    type: 'month',
    ordinal: 12,
    lang: 'de',
  },
  {
    string: '10月',
    type: 'month',
    ordinal: 10,
    lang: 'ja',
  },
];

const testCases = [
  {
    lang: 'en',
    input: 'September 3rd 1996',
    expected: { time: '+1996-09-03T00:00:00Z', precision: 11 },
  },
  {
    lang: 'en',
    input: '13 September 3rd 1996 12',
    expected: { time: '+1996-09-03T00:00:00Z', precision: 11 },
  },
  {
    lang: 'en',
    input: 'Sept 1996',
    expected: { time: '+1996-09-01T00:00:00Z', precision: 10 },
  },
  {
    lang: 'en',
    input: '1/2/1996',
    expected: { time: '+1996-01-02T00:00:00Z', precision: 11 },
  },
  {
    lang: 'ja',
    input: '2024年10月23日',
    expected: { time: '+2024-10-23T00:00:00Z', precision: 11 },
  },
  {
    lang: 'de',
    input: '24.10.1991',
    expected: { time: '+1991-10-24T00:00:00Z', precision: 11 },
  },
  {
    lang: 'de',
    input: '24. Dezember 1991',
    expected: { time: '+1991-12-24T00:00:00Z', precision: 11 },
  },
  {
    lang: 'de',
    input: '24. Dez. 1991',
    expected: { time: '+1991-12-24T00:00:00Z', precision: 11 },
  },
  {
    lang: 'de',
    input: '24 1991 12',
    expected: { time: '+1991-12-24T00:00:00Z', precision: 11 },
  },
  {
    lang: 'de',
    input: '1 1991 2',
    expected: { time: '+1991-02-01T00:00:00Z', precision: 11 },
  },
  {
    lang: 'ja',
    input: '10月 1923',
    expected: { time: '+1923-10-01T00:00:00Z', precision: 10 },
  },
];

testCases.forEach(({ input, expected, lang }, index) => {
  const Extractor = new dateExtractor({ dictionary, lang });
  const result = Extractor.extract(input);
  const passed = JSON.stringify(result) === JSON.stringify(expected);
  console.log(`Test Case ${index + 1}:`, passed ? 'PASSED' : 'FAILED');
  if (!passed) {
    console.log(`  Input:    "${input}"`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Got:      ${JSON.stringify(result)}`);
  }
});
