type TokenPositionFrom = number;
type TokenPositionTo = number;

type TokenIndex = number;
type TokenType = string;
type TokenValue = string;
type TokenPosition = [TokenPositionFrom, TokenPositionTo];

type KnownRegexPatterns = TokenizeLetter | TokenizeMark | TokenizeSeparator | TokenizeSymbol | TokenizeNumber | TokenizePunctuation | TokenizeOther | TokenizeWord;

type TokenizerRule = Record<TokenType, KnownRegexPatterns | RegExp>

interface PositionalTokenizer {
    tokenize: (text: string) => Token[];
    update: (rules: TokenizerBakedRule[]) => PositionalTokenizer;
}

type TokenJSON = {
    index: TokenIndex,
    type: TokenType,
    value: TokenValue,
    position: TokenPosition
}

enum TokenizeLetter {
    ALL = "L",
    LOWERCASE = "Ll",
    UPPERCASE = "Lu",
    TITLECASE = "Lt",
    CASED = "L&",
    OTHER = "Lm",
    MODIFIER = "Lo"
}

enum TokenizeMark {
    ALL = "M",
    NON_SPACING = "Mn",
    SPACING_COMBINING = "Mc",
    ENCLOSING = "Me"
}

enum TokenizeSeparator {
    ALL = "Z",
    SPACE = "Zs",
    LINE = "Zl",
    PARAGRAPH = "Zp"
}

enum TokenizeSymbol {
    ALL = "S",
    MATH = "Sm",
    CURRENCY = "Sc",
    MODIFIER = "Sk",
    OTHER = "So"
}

enum TokenizeNumber {
    ALL = "N",
    DECIMAL_DIGIT = "Nd",
    LETTER = "Nl",
    OTHER = "No"
}

enum TokenizePunctuation {
    ALL = "P",
    DASH = "Pd",
    OPEN = "Ps",
    CLOSE = "Pe",
    INITIAL = "Pi",
    FINAL = "Pf",
    CONNECTOR = "Pc",
    OTHER = "Po"
}

enum TokenizeOther {
    ALL = "C",
    CONTROL = "Cc",
    FORMAT = "Cf",
    SURROGATE = "Cs",
    PRIVATE_USE = "Co",
    UNASSIGNED = "Cn"
}

enum TokenizeWord {
    SIMPLE = "L",
    COMPLEX = "[\\p{L}\\p{Pd}']",
}

export class Token {
    private readonly i: TokenIndex;
    private readonly t: TokenType;
    private readonly v: TokenValue;
    private readonly p: TokenPosition;

    constructor(i: TokenIndex, type: TokenType, value: TokenValue, position: TokenPosition) {
        this.i = i;
        this.t = type;
        this.v = value;
        this.p = position;
    }

    get index(): TokenIndex {
        return this.i;
    };

    get type(): TokenType {
        return this.t;
    };

    get value(): TokenValue {
        return this.v;
    };

    get position(): TokenPosition {
        return this.p;
    };

    toString(): string {
        return `${this.v}`;
    }

    toJSON(): TokenJSON {
        return {
            index: this.i,
            type: this.t,
            value: this.v,
            position: this.p
        }
    }
}

class TokenizerBakedRule {
    r: RegExp;
    t: TokenType;
    m: boolean;

    constructor(rule: TokenizerRule, captureMulti?: boolean){
        const keys = Object.keys(rule);

        if (!keys.length) throw new Error("Omitting the rule that has no type");

        const ruleType = keys[0];
        const regex = rule[ruleType];

        if (!regex) throw new Error("Omitting the rule that has no value");

        this.t = ruleType;
        this.r = TokenizerBakedRule.toRegex(regex);
        this.m = captureMulti || false;
    }

    private static toRegex = (regex: KnownRegexPatterns | RegExp): RegExp => {
        if (regex instanceof RegExp) return regex;
        const pattern = regex === TokenizeWord.COMPLEX ? TokenizeWord.COMPLEX : `\\p{${regex}}`;
        return new RegExp(pattern, "u");
    }

    get regex(): RegExp {
        return this.r;
    };

    get type(): TokenType {
        return this.t;
    };

    get shouldCaptureMulti(): boolean {
        return this.m;
    };
}

export class Tokenizer implements PositionalTokenizer {
    private r: TokenizerBakedRule[];

    constructor(rules?: Array<TokenizerBakedRule|null>) {
        const rulesToApply = rules || Tokenizer.getDefaultRules();
        this.r = rulesToApply.filter(r => Boolean(r)) as TokenizerBakedRule[];
    }

    private get rules(): TokenizerBakedRule[] {
        return this.r;
    }

    private static isString(text: any): boolean {
        return typeof text === 'string' || text instanceof String;
    }

    private static getDefaultRules(): Array<TokenizerBakedRule | null> {
        return [
            Tokenizer.ruleMulti({ word: TokenizeLetter.ALL }),
            Tokenizer.ruleMono({ space: TokenizeSeparator.ALL }),
            Tokenizer.ruleMono({ punctuation: TokenizePunctuation.ALL }),
            Tokenizer.ruleMulti({ number: TokenizeNumber.ALL }),
            Tokenizer.ruleMulti({ symbol: TokenizeSymbol.ALL })
        ];
    }

    public static ruleMono(rule: TokenizerRule): TokenizerBakedRule | null {
        try {
            return new TokenizerBakedRule(rule);
        } catch (e) {
            console.warn(e);
            return null;
        }
    }

    public static ruleMulti(rule: TokenizerRule): TokenizerBakedRule | null {
        try {
            return new TokenizerBakedRule(rule, true);
        } catch (e) {
            console.warn(e);
            return null;
        }
    }

    update(rules: Array<TokenizerBakedRule|null>): PositionalTokenizer {
        this.r = rules.filter(r => Boolean(r)) as TokenizerBakedRule[];
        return this;
    }

    tokenize(text: string): Token[] {
        if (!Tokenizer.isString(text)) {
            return [];
        }
        const tokens: Token[] = [];
        const size: number = text.length;
        const rulesAmount: number = this.rules.length;

        for (let cursor = 0; cursor < size; cursor++) {
            const char = text[cursor];

            for (let i = 0; i < rulesAmount; i++) {
                const rule = this.rules[i];

                if (rule.regex.test(char)) {
                    let value: TokenValue = char;
                    let position: TokenPosition = [cursor, cursor + 1];
                    const type: TokenType = rule.type;

                    if (rule.shouldCaptureMulti) {
                        let end = cursor + 1;
                        while (end < size) {
                            const nextChar = text[end];
                            if (rule.regex.test(nextChar)) {
                                value += nextChar;
                                end++;
                            } else {
                                break;
                            }
                        }
                        position = [cursor, end];
                        cursor = end - 1;
                    }

                    tokens.push(new Token(tokens.length, type, value, position));
                    break;
                }
            }
        }

        return tokens;
    }
}

export {TokenizeLetter, TokenizeSeparator, TokenizeMark, TokenizeOther, TokenizeNumber, TokenizeSymbol, TokenizePunctuation, TokenizeWord};
