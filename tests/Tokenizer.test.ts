import {
    Token,
    TokenizeLetter,
    TokenizePunctuation,
    Tokenizer,
    TokenizeSeparator,
    TokenizeWord
} from '../src';

test('Sanity One', () => {
    const tokenizer = new Tokenizer();
    const text_1 = "";
    const text_2 = undefined;
    const text_3 = 42;
    const text_4 = {};
    const text_5 = null;

    const badInputs = [text_1, text_2, text_3, text_4, text_5];
    badInputs.map((input, idx) => {
        // ts error is there, that's good, but we still supress to check the bad input
        //@ts-ignore
        const tokens = tokenizer.tokenize(input);
        expect(tokens).toStrictEqual([]);
    });
});
test('Sanity Two', () => {
    const tokenizer = new Tokenizer();
    const text = "Mary had a little lamb."

    const rules_1 = [
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL}),
        Tokenizer.ruleMulti({word: TokenizeLetter.ALL})
    ];
    const rules_2 = [
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMulti({word: TokenizeWord.SIMPLE})
    ];
    const rules_3 = [
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL}),
        Tokenizer.ruleMulti({word: TokenizeWord.SIMPLE}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
    ];
    const rules_4 = [
        Tokenizer.ruleMulti({word: TokenizeWord.SIMPLE}),
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
    ];
    const rules_5 = [
        Tokenizer.ruleMulti({word: TokenizeWord.SIMPLE}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL}),
    ];

    const ruleRoulette = [rules_1, rules_3, rules_2, rules_5, rules_4];
    const allResults: Token[][] = ruleRoulette.map(rules => tokenizer.update(rules).tokenize(text));
    const someTokens: Token[] = allResults[0];

    expect(someTokens).toHaveLength(10);
    someTokens.forEach((token: Token) => {
        expect(token.index).toBe(allResults[1][token.index].index);
        expect(token.index).toBe(allResults[2][token.index].index);
        expect(token.index).toBe(allResults[3][token.index].index);
        expect(token.index).toBe(allResults[4][token.index].index);
    })
});
test('Hyphenated Words: devil-grass', () => {
    const tokenizer = new Tokenizer([
        Tokenizer.ruleMulti({word: TokenizeWord.COMPLEX}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMono({punct: TokenizePunctuation.ALL})
    ]);
    const text = "...and the devil-grass which brought sweet dreams,"
    const tokens = tokenizer.tokenize(text);
    const devilGrass = tokens[7];
    expect(devilGrass.value).toBe('devil-grass');
});
test('Default Apostrophes', () => {
    const tokenizer = new Tokenizer();
    const text = "John's son has mother's eyes"
    const tokens = tokenizer.tokenize(text);
    const tokenTypes = tokens.map(token => token.type);
    expect(tokenTypes).toStrictEqual([
        'word', "punctuation", "word", "space", "word", "space", "word", "space", "word", "punctuation", "word", "space", "word",
    ])
});
test('Word Contractions', () => {
    const tokenizer = new Tokenizer([
        Tokenizer.ruleMulti({word: TokenizeWord.COMPLEX}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMono({punctuation: TokenizePunctuation.ALL})
    ]);
    const text = "He'll stay so I'll stay.";
    const tokens = tokenizer.tokenize(text);
    const tokenTypes = tokens.map(token => token.type);
    expect(tokenTypes).toStrictEqual([
        'word', 'space',
        'word', 'space',
        'word', 'space',
        'word', 'space',
        'word', 'punctuation'
    ]);
});
test('With Umlaut', () => {
    const tokenizer = new Tokenizer([
        Tokenizer.ruleMulti({word: TokenizeWord.COMPLEX}),
        Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
        Tokenizer.ruleMono({punctuation: TokenizePunctuation.ALL})
    ]);
    const text = "Möbius strip.";
    const tokens = tokenizer.tokenize(text);
    const tokenTypes = tokens.map(token => token.type);
    expect(tokenTypes).toStrictEqual([
        'word', 'space', 'word', 'punctuation'
    ]);
})
test('With Custom Regex', () => {
    const tokenizer = new Tokenizer([
        Tokenizer.ruleMono({period: new RegExp('\\.')}),
        Tokenizer.ruleMono({umlaut: new RegExp('[öüä]')}),
    ]);
    const text = "Des Teufels liebstes Möbelstück ist die lange Bank.";
    const tokens = tokenizer.tokenize(text);

    const umlauts = tokens.filter(token => token.type === 'umlaut');
    const periods = tokens.filter(token => token.type === 'period');

    expect(periods).toHaveLength(1);
    expect(umlauts).toHaveLength(2);
})
