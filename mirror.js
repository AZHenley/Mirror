// This file includes the parser and the compiler/LLM classes.

// Compiler/LLM wrapper.
class MirrorCompiler {
    async callOpenAI(apiKey, prompt) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown error");
        }
        return data.choices[0].message.content;
    }
}


// Parser.
class MirrorParser {
    constructor(input) {
        this.tokens = input.match(/[\w]+|->|[.,:()\[\]{}]|"(?:\\"|[^"])*"|\d+|\S/g) || [];
        this.current = 0;
    }

    parse() {
        const program = [];
        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                program.push(stmt);
            }
        }
        return program;
    }

    parseStatement() {
        if (this.match('signature')) {
            return this.parseSignature();
        } else if (this.match('example')) {
            return this.parseExample();
        } else if (this.peekIdentifier()) {
            return this.parseExpression();
        } else {
            throw new Error(`Unexpected token: ${this.peek()}`);
        }
    }

    parseSignature() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const parameters = this.parseParameters();
        this.consume(')');
        this.consume('->');
        const returnType = this.parseType();
        return { type: 'signature', name, parameters, returnType };
    }

    parseParameters() {
        const parameters = [];
        if (!this.check(')')) { // Handle empty parameter lists
            do {
                const name = this.consumeIdentifier();
                this.consume(':');
                const paramType = this.parseType();
                parameters.push({ name, type: paramType });
            } while (this.match(','));
        }
        return parameters;
    }

    parseType() {
        if (this.match('string', 'number', 'bool')) {
            return this.previous();
        } else if (this.match('list')) {
            this.consume('[');
            const innerType = this.parseType();
            this.consume(']');
            return { type: 'list', innerType };
        } else if (this.match('dict')) {
            this.consume('['); // Changed from '{' to '['
            const keyType = this.parseType();
            this.consume(',');
            const valueType = this.parseType();
            this.consume(']');
            return { type: 'dict', keyType, valueType };
        } else {
            throw new Error(`Unexpected type: ${this.peek()}`);
        }
    }

    parseExample() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const literals = this.parseLiterals();
        this.consume(')');
        this.consume('=');
        const literal = this.parseLiteral();
        return { type: 'example', name, literals, result: literal };
    }

    parseLiterals() {
        const literals = [];
        if (!this.check(')')) { // Handle empty literals
            do {
                literals.push(this.parseLiteral());
            } while (this.match(','));
        }
        return literals;
    }

    parseLiteral() {
        if (this.match('true', 'false')) {
            return this.previous();
        } else if (this.matchNumber()) {
            return parseFloat(this.previous());
        } else if (this.matchString()) {
            return this.previous();
        } else if (this.match('[')) {
            const literals = [];
            if (!this.check(']')) { // Handle empty lists
                do {
                    literals.push(this.parseLiteral());
                } while (this.match(','));
            }
            this.consume(']');
            return { type: 'list', value: literals };
        } else if (this.match('{')) {
            const key = this.parseLiteral();
            this.consume(':');
            const value = this.parseLiteral();
            this.consume('}');
            return { type: 'dict', key, value };
        } else {
            throw new Error(`Unexpected literal: ${this.peek()}`);
        }
    }

    parseExpression() {
        const name = this.consumeIdentifier();
        this.consume('(');
        const mix = this.parseMix();
        this.consume(')');
        return { type: 'expression', name, mix };
    }

    parseMix() {
        const mix = [];
        if (!this.check(')')) { // Handle empty expressions
            do {
                if (this.peekIdentifier()) {
                    mix.push(this.parseExpression());
                } else {
                    mix.push(this.parseLiteral());
                }
            } while (this.match(','));
        }
        return mix;
    }

    // Helper methods

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    matchNumber() {
        const token = this.peek();
        if (/^\d+(\.\d+)?$/.test(token)) {
            this.advance();
            return true;
        }
        return false;
    }

    matchString() {
        const token = this.peek();
        if (/^".*"$/.test(token)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type) {
        if (this.check(type)) {
            return this.advance();
        }
        throw new Error(`Expected '${type}', but got '${this.peek()}'`);
    }

    consumeIdentifier() {
        if (this.peekIdentifier()) {
            return this.advance();
        }
        throw new Error(`Expected identifier, but got '${this.peek()}'`);
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek() === type;
    }

    peek() {
        return this.tokens[this.current];
    }

    peekIdentifier() {
        const token = this.peek();
        return /^[a-zA-Z_]\w*$/.test(token);
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }
}

// TODO: The public functions need to be refactored. There should be a single "compile" function that takes the raw code. Move that behavior from the playground to here.

function extractExpressions(ast) {
    return ast.filter(node => node.type === 'expression');
}

// TODO: We should do type checking on the expressions after parsing (before the LLM).

function groupSignaturesWithExamples(ast) {
    const signatures = ast.filter(node => node.type === 'signature');
    const examples = ast.filter(node => node.type === 'example');

    return signatures.map(signature => {
        const matchingExamples = examples.filter(example => example.name === signature.name);
        return {
            ...signature,
            examples: matchingExamples
        };
    });
}


// Example usage:

// const input = `
//     signature myFunc(a: string, b: number) -> bool
//     example test1("hello", 123) = true
//     myFunc("world", 456)
// `;

// const parser = new Mirror(input);
// const ast = parser.parse();
// console.log(JSON.stringify(ast, null, 2));

// const expressions = extractExpressions(ast);
// console.log(expressions);
// const signaturesWithExamples = groupSignaturesWithExamples(ast);
// console.log(signaturesWithExamples);

