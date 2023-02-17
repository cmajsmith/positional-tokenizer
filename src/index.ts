type TokenIndex = number;
type TokenPosition = [number, number];
type TokenType = string;
type TokenValue = string;

type KnownRegexPatterns = TokenizeLetter | TokenizeMark | TokenizeSeparator | TokenizeSymbol | TokenizeNumber | TokenizePunctuation | TokenizeOther | TokenizeWord;

interface TokenizerInstruction {
    [type: TokenType]: KnownRegexPatterns | RegExp;
}

interface ITokenizer {
    tokenize: (text: string) => Token[];
    update: (rules: Rule[]) => ITokenizer;
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
    readonly i: TokenIndex;
    readonly t: TokenType;
    readonly v: TokenValue;
    readonly p: TokenPosition;

    constructor(i: TokenIndex, type: TokenType, value: TokenValue, position: TokenPosition) {
        this.i = i;
        this.t = type;
        this.v = value;
        this.p = position;
    }

    get position(): TokenPosition {
        return this.p;
    };
    get type(): TokenType {
        return this.t;
    };
    get value(): TokenValue {
        return this.v;
    };
    get index(): TokenIndex {
        return this.i;
    };

    toString() {
        return `${this.v}`;
    }

    toJSON() {
        return {
            type: this.t,
            value: this.v,
            position: this.p,
            index: this.i
        }
    }
}

class Rule {
    r: RegExp;
    t: TokenType;
    g: boolean;

    constructor(type: TokenType, regex: KnownRegexPatterns | RegExp, captureAsAGroup?: boolean) {
        this.r = regex instanceof RegExp ? regex : Rule.toRegex(regex);
        this.t = type;
        this.g = captureAsAGroup || false;
    }

    private static toRegex = (patternStr: KnownRegexPatterns) => {
        const pattern = patternStr === TokenizeWord.COMPLEX ? TokenizeWord.COMPLEX : `\\p{${patternStr}}`;
        return new RegExp(pattern, "u");
    }

    get regex(): RegExp {
        return this.r;
    };
    get type(): TokenType {
        return this.t;
    };
    get shouldCaptureGroup(): boolean {
        return this.g;
    };
}

export class Tokenizer implements ITokenizer {
    r: Rule[];

    constructor(rules?: Rule[]) {
        this.r = rules ? rules : [
            Tokenizer.captureGroup({ word: TokenizeLetter.ALL }),
            Tokenizer.captureGroup({ number: TokenizeNumber.ALL }),
            Tokenizer.captureMono({ space: TokenizeSeparator.ALL }),
            Tokenizer.captureMono({ punctuation: TokenizePunctuation.ALL }),
            Tokenizer.captureGroup({ symbol: TokenizeSymbol.ALL }),
        ];
    }

    public static captureMono(instruction: TokenizerInstruction): Rule {
        const type = Object.keys(instruction)[0];
        return new Rule(type, instruction[type]);
    }

    public static captureGroup(instruction: TokenizerInstruction): Rule {
        const type = Object.keys(instruction)[0];
        return new Rule(type, instruction[type], true);
    }

    get _rules(): Rule[] {
        return this.r;
    }

    update(rules: Rule[]) {
        this.r = rules;
        return this;
    }

    isString(text: any): boolean {
        return typeof text === 'string' || text instanceof String;
    }

    tokenize(text: string): Token[] {
        if (!this.isString(text)) {
            return [];
        }
        const tokens: Token[] = [];
        const size = text.length;

        for (let cursor = 0; cursor < size; cursor++) {
            const char = text[cursor];

            for (const rule of this._rules) {
                if (rule.regex.test(char)) {

                    let value: string = char;
                    let position: TokenPosition = [cursor, cursor + 1];

                    const type: string = rule.type;

                    if (rule.shouldCaptureGroup) {
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
