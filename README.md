# Positional Tokenizer
---
[![npm version](https://badge.fury.io/js/positional-tokenizer.svg)](https://badge.fury.io/js/positional-tokenizer)

Turns a text like `Mary had a little lamb.` into an array of tokens:
```typescript
[
    { position: [ 0, 4 ], index: 0, type: 'word', value: 'Mary' },
    { position: [ 4, 5 ], index: 1, type: 'space', value: ' ' },
    { position: [ 5, 8 ], index: 2, type: 'word', value: 'had' },
    { position: [ 8, 9 ], index: 3, type: 'space', value: ' ' },
    { position: [ 9, 10 ], index: 4, type: 'word', value: 'a' },
    { position: [ 10, 11 ], index: 5, type: 'space', value: ' ' },
    { position: [ 11, 17 ], index: 6, type: 'word', value: 'little' },
    { position: [ 17, 18 ], index: 7, type: 'space', value: ' ' },
    { position: [ 18, 22 ], index: 8, type: 'word', value: 'lamb' },
    { position: [ 22, 23 ], index: 9, type: 'punctuation', value: '.' }
]
```
## Installation
```bash
npm install positional-tokenizer --save
```

## Usage
Positional tokenizer is preconfigured to tokenize **words**, **spaces**, **punctuation** and **symbols**.

```typescript
import {Tokenizer, Token} from 'positional-tokenizer';

const text = "Mary had a little lamb.";

const tokenizer = new Tokenizer();
const tokens: Token[] = tokenizer.tokenize(text);
```

### Configuration
#### Use with predefined Regex Patterns
```typescript
import {Tokenizer, TokenizeSeparator, TokenizeLetter} from 'positional-tokenizer';

// Define tokenization rules to capture words and spaces only
const rules = [
    // Tokenize a single occurence of separator as spaaace
    Tokenizer.ruleMono({spaaace: TokenizeSeparator.ALL}),
    // Tokenize a consecutive sequence of letters as wooord
    Tokenizer.ruleMulti({wooord: TokenizeLetter.ALL})
];

// Pass the rules to the tokenizer constructor
const tokenizer = new Tokenizer(rules);
```

##### Compose rules
Tokenizer exposes `static` methods `.ruleMono()` and `.ruleMulti()` to compose the rules.

- `Tokenizer.ruleMono()` will capture **a single occurrence** of a token type
- `Tokenizer.ruleMulti()` will capture **a group of consecutive occurrences** of a token type

Both methods accept a **key-value pair** of a token **type** and tokenization **pattern** to apply.

A rule can be described with the following interface:

```typescript
type TokenizerRule = Record<TokenType, KnownRegexPatterns | RegExp>
```

##### Use predefined regex patterns available under `Tokenize` namespace:

```typescript 
type KnownRegexPatterns = 
    TokenizeLetter | 
    TokenizeMark | 
    TokenizeSeparator | 
    TokenizeSymbol | 
    TokenizeNumber | 
    TokenizePunctuation | 
    TokenizeOther | 
    TokenizeWord;
```

Each category comes with a set of predefined regex patterns. The [categories described here](https://www.regular-expressions.info/unicode.html) are implemented with the corresponding unicode character sequences + have `.ALL` prop for capturing all.

##### `TokenizeWord` for words 
- `TokenizeWord.SIMPLE` matches a sequence of letters only (identical to `TokenizeLetter.ALL`), capturing words like `I'm`, `don't` and `devil-grass` as three tokens each
- `TokenizeWord.COMPLEX` matches a sequence of **letters**, **dashes** and **apostrophes** capturing words like `I'm`, `don't` and `devil-grass` as a single token

##### Default rules
```typescript
// somewhere inside the tokenizer code
const DEFAULT_RULES = [
    Tokenizer.ruleMulti({ word: TokenizeLetter.ALL }),
    Tokenizer.ruleMono({ space: TokenizeSeparator.ALL }),
    Tokenizer.ruleMono({ punctuation: TokenizePunctuation.ALL }),
    Tokenizer.ruleMulti({ number: TokenizeNumber.ALL }),
    Tokenizer.ruleMulti({ symbol: TokenizeSymbol.ALL })
];
```

#### Use with custom Regex Patterns
You may compose rules using the regular expression of your choice.

```typescript
import {Tokenizer, Token} from 'positional-tokenizer';

const text = "Des Teufels liebstes Möbelstück ist die lange Bank.";

const tokenizer = new Tokenizer([
    Tokenizer.ruleMono({period: new RegExp('\\.')}),
    Tokenizer.ruleMono({umlaut: new RegExp('[öüä]')}),
]);

const tokens: Token[] = tokenizer.tokenize(text);
```
### Examples
#### Tokenize a text into words and spaces

```typescript
import {Tokenizer, Token, TokenizeSeparator, TokenizeLetter} from 'positional-tokenizer';

const text = "Mary had a little lamb.";

const tokenizer = new Tokenizer([
    Tokenizer.ruleMulti({word: TokenizeLetter.ALL}),
    Tokenizer.ruleMono({space: TokenizeSeparator.ALL})
]);
const tokens: Token[] = tokenizer.tokenize(text);
```

#### Tokenize a text into numbers
```typescript
import {Tokenizer, Token, TokenizeNumber} from 'positional-tokenizer';

const text = "Mary had 12 little lambs.";

const tokenizer = new Tokenizer([
    Tokenizer.ruleMulti({number: TokenizeNumber.ALL})
]);
const tokens: Token[] = tokenizer.tokenize(text);
```
#### Tokenize a text into words (w/a hyphens and apostrophes), spaces and punctuation
```typescript
import {Tokenizer, Token, TokenizeSeparator, TokenizeWord, TokenizePunctuation} from 'positional-tokenizer';

const text = "Mary's had a little-beetle.";

const tokenizer = new Tokenizer([
    Tokenizer.ruleMulti({word: TokenizeWord.SIMPLE}),
    Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
    Tokenizer.ruleMono({punct: TokenizePunctuation.ALL})
]);
const tokens: Token[] = tokenizer.tokenize(text); // tokens.length === 12
```

#### Tokenize a text into words (with hyphens and apostrophes), spaces and punctuation
```typescript
import {Tokenizer, Token, TokenizeSeparator, TokenizeWord, TokenizePunctuation} from 'positional-tokenizer';

const text = "Mary's had a little-beetle.";

const tokenizer = new Tokenizer([
    Tokenizer.ruleMulti({word: TokenizeWord.COMPLEX}),
    Tokenizer.ruleMono({space: TokenizeSeparator.ALL}),
    Tokenizer.ruleMono({punct: TokenizePunctuation.ALL})
]);
const tokens: Token[] = tokenizer.tokenize(text); // tokens.length === 8
```
### API
#### Tokenizer
##### `constructor(rules?: TokenizerRule[])`
Creates a new instance of tokenizer with optional rules.

##### `tokenize(text: string): Token[]`
Tokenizes a text into an array of tokens.

---

#### Token
##### `position: [number, number]`
Position of the token in the text.

##### `index: number`
Index of the token in the text.

##### `type: TokenType`
Type of the token.

##### `value: string`
Value of the token.

##### `toString(): string`
Returns a string representation of the token.

##### `toJSON(): TokenJSON`
Returns a JSON representation of the token.

---
