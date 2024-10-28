import quantityExtractor from './quantityExtractor.mjs';

const testCases = [
    {
        input: '10 000,01',
        expected: { amount: 10000.01, unitString: null },
    },
    {
        input: '10.000,01',
        expected: { amount: 10000.01, unitString: null },
    },
    {
        input: '10,000.01',
        expected: { amount: 10000.01, unitString: null },
    },
    {
        input: '10 000 000,01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '1,000,000',
        expected: { amount: 1000000, unitString: null },
    },
    {
        input: '10000000.01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '10000000,01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '10.000.000,01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '10,000,000.01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: "10'000'000.01",
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: "10'000'000·01",
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '10 000.01',
        expected: { amount: 10000.01, unitString: null },
    },
    {
        input: '10 000 000.01',
        expected: { amount: 10000000.01, unitString: null },
    },
    {
        input: '288.6',
        expected: { amount: 288.6, unitString: null },
    },
    {
        input: '288.6 meters',
        expected: { amount: 288.6, unitString: 'meters' },
    },
    {
        input: '305m',
        expected: { amount: 305, unitString: 'm' },
    },
    {
        input: 'USD 123.23',
        expected: { amount: 123.23, unitString: 'USD' },
        reasoning: 'units may preceide or follow the number',
    },
    {
        input: '190 000 Metrische Tonnen',
        expected: { amount: 190000, unitString: 'Metrische' },
        reasoning:
            'all sorts of spaceing might occour within numbers for formatting',
    },
    {
        input: '190 000 Metrische Tonnen',
        expected: { amount: 190000, unitString: 'Metrische' },
        reasoning:
            'all sorts of spaceing might occour within numbers for formatting',
    },
    {
        input: 'Höhe: 72,6 Meter',
        expected: { amount: 72.6, unitString: 'Meter' },
        reasoning: 'Other languages might used different decimal symbols',
    },
    {
        input: 'Speed: Warp 7',
        expected: { amount: 7, unitString: 'Warp' },
        reasoning: '"Warp" is the word closest to the number',
    },
    {
        input: 'Atmospheric pressure was 2 kilopascals above normal, 92% humidity, 32.1°C.',
        expected: { amount: 32.1, unitString: '°C.' },
        reasoning:
            '32.1 is the most noticeable number because it has the most digits (punctuation should be counted too)',
    },
    {
        input: 'Atmospheric pressure was 2 kilopascals above normal, 92% humidity.',
        expected: { amount: 92, unitString: '%' },
        reasoning:
            '92 is the most noticeable number because it has the most digits',
    },
    {
        input: 'Thirty-nine point one degrees Celsius. Like a Borg ship',
        expected: { amount: null, unitString: null },
        reasoning:
            "if the string doesn't contain numbers, nothing should be returned",
    },
    {
        input: '€9,99',
        expected: { amount: 9.99, unitString: '€' },
    },
    {
        input: '4½ Hours',
        expected: { amount: 4.5, unitString: 'Hours' },
    },
];

testCases.forEach(({ input, expected }, index) => {
    const Extractor = new quantityExtractor();
    const result = Extractor.extract(input);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    console.log(`Test Case ${index + 1}:`, passed ? 'PASSED' : 'FAILED');
    if (!passed) {
        console.log(`  Input:    "${input}"`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Got:      ${JSON.stringify(result)}`);
    }
});
