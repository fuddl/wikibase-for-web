import DateNormalizer from './DateNormalizer.mjs';

// Test cases
const testCases = [
    // Valid dates
    {
        input: '2024-08',
        expected: { time: '+2024-08-01T00:00:00Z', precision: 10 },
    },
    {
        input: '1999',
        expected: { time: '+1999-01-01T00:00:00Z', precision: 9 },
    },
    {
        input: '-0500-12-31',
        expected: { time: '-0500-12-31T00:00:00Z', precision: 11 },
    },
    {
        input: '+2023-02-28',
        expected: { time: '+2023-02-28T00:00:00Z', precision: 11 },
    },
    {
        input: '0001-01-01',
        expected: { time: '+0001-01-01T00:00:00Z', precision: 11 },
    },
    {
        input: '2021-4-1',
        expected: { time: '+2021-04-01T00:00:00Z', precision: 11 },
    },
    {
        input: '2021-4',
        expected: { time: '+2021-04-01T00:00:00Z', precision: 10 },
    },
    {
        input: '2021-04-1',
        expected: { time: '+2021-04-01T00:00:00Z', precision: 11 },
    },
    {
        input: '2021-4-01',
        expected: { time: '+2021-04-01T00:00:00Z', precision: 11 },
    },
    {
        input: '2021-04-01T23:22:11Z',
        expected: { time: '+2021-04-01T00:00:00Z', precision: 11 },
    },
    // Invalid dates
    { input: '2021-13', expected: false },
    { input: 'abcd-ef-gh', expected: false },
    { input: '2021-02-30', expected: false }, // Invalid day
    { input: '2021-04-31', expected: false }, // Invalid day
    { input: '2021-00', expected: false },
    { input: '2021-01-00', expected: false },
    { input: '', expected: false },
    { input: '20210', expected: false },
    { input: '99999', expected: false },
    { input: '2021-2-29', expected: false }, // Not a leap year
    { input: '2020-2-30', expected: false }, // Invalid day even in leap year
    { input: '2021-02-003', expected: false }, // Day with more than two digits
];

// Run tests
testCases.forEach(({ input, expected }, index) => {
    const result = DateNormalizer.normalizeDateString(input);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    console.log(`Test Case ${index + 1}:`, passed ? 'PASSED' : 'FAILED');
    if (!passed) {
        console.log(`  Input:    "${input}"`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Got:      ${JSON.stringify(result)}`);
    }
});
