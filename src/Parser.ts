// Évaluateur d'expressions mathématiques sûr (sans eval/new Function).

export class Parser {
    private funcs: Readonly<{ [x: string]: Func; }>
    private consts: Readonly<{ [x: string]: number; }>
    private enabledOps: Readonly<{ "+": boolean; "-": boolean; "*": boolean; "/": boolean; "^": boolean; }>
    private rpn: RPNNode[] = []

    constructor(input: string, config: SafeMathConfig = {}) {
        // configs fusionnées
        this.funcs = Object.freeze({ ...DEFAULT_FUNCS, ...(config.funcs ?? {}) });
        this.consts = Object.freeze({ ...DEFAULT_CONSTS, ...(config.consts ?? {}) });

        const defaultOps: Record<Exclude<Op, 'u-'>, boolean> = { '+': true, '-': true, '*': true, '/': true, '^': true };
        this.enabledOps = Object.freeze({ ...defaultOps, ...(config.operators ?? {}) });

        // limites simples anti-DoS (optionnel)
        if (input.length > 100_000) {
            throw new Error('Expression trop longue');
        }

        this.setFunction(input)
    }

    setFunction(input: string) {
        const tokens = tokenize(input);
        this.rpn = toRPN(tokens, this.enabledOps);
    }

    eval(vars: Vars = {}): number {
        return evalRPN(this.rpn, vars, this.funcs, this.consts)
    }
}

// ---------- API principale ----------

function safeEval(
    input: string,
    vars: Vars = {},
    config: SafeMathConfig = {}
): number {
    // configs fusionnées
    const funcs = Object.freeze({ ...DEFAULT_FUNCS, ...(config.funcs ?? {}) });
    const consts = Object.freeze({ ...DEFAULT_CONSTS, ...(config.consts ?? {}) });

    const defaultOps: Record<Exclude<Op, 'u-'>, boolean> = { '+': true, '-': true, '*': true, '/': true, '^': true };
    const enabledOps = Object.freeze({ ...defaultOps, ...(config.operators ?? {}) });

    // limites simples anti-DoS (optionnel)
    if (input.length > 100_000) throw new Error('Expression trop longue');

    const tokens = tokenize(input);
    const rpn = toRPN(tokens, enabledOps);
    return evalRPN(rpn, vars, funcs, consts);
}

// ---------- Exemple d’utilisation ----------
// const v1 = safeEvalMath('sin(pi/4) + 2^3');          // ~8.7071
// const v2 = safeEvalMath('-(3 + x)*sqrt(4)', { x: 1 }); // -8
// const v3 = safeEvalMath('min(1,2,3)+max(4,5,6)');      // 7
// // Restreindre les opérateurs (désactiver '^'):
// const v4 = safeEvalMath('2^3', {}, { operators: { '^': false } }); // -> Error

// ==================================================================================

type Op = '+' | '-' | '*' | '/' | '^' | 'u-';
type OpBinary = Exclude<Op, 'u-'>;

const precedence: Record<OpBinary, number> = {
    '+': 1, '-': 1, '*': 2, '/': 2, '^': 3
};
const rightAssoc: Partial<Record<OpBinary, boolean>> = { '^': true };

export type Vars = Record<string, number>;

// type Op = '+' | '-' | '*' | '/' | '^' | 'u-'; // 'u-' = moins unaire

type RPNNode =
    | { type: 'num'; value: number }
    | { type: 'name'; value: string }
    | { type: 'op'; value: Op }
    | { type: 'call' };

type Func = (...args: number[]) => number;

export interface SafeMathConfig {
    funcs?: Readonly<Record<string, Func>>;
    consts?: Readonly<Record<string, number>>;
    // Activer/désactiver des opérateurs binaires
    operators?: Partial<Record<Exclude<Op, 'u-'>, boolean>>;
}

const DEFAULT_FUNCS: Readonly<Record<string, Func>> = Object.freeze({
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    sqrt: Math.sqrt,
    abs: Math.abs,
    log: Math.log, // ln
    exp: Math.exp,
    min: Math.min,
    max: Math.max,
});

const DEFAULT_CONSTS: Readonly<Record<string, number>> = Object.freeze({
    pi: Math.PI,
    e: Math.E,
});

// ---------- Tokenization ----------
function tokenize(input: string): string[] {
    const tokens: string[] = [];
    // ident | nombre (123, .5, 1.23) | symboles (,)(+ - * / ^)
    const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.\d+|\d+|[()+\-*/^,])\s*/gy;
    let m: RegExpExecArray | null;
    let idx = 0;

    while ((m = re.exec(input)) !== null) {
        if (m.index !== idx) throw new Error(`Jeton inattendu à la position ${idx}`);
        tokens.push(m[1]);
        idx = re.lastIndex;
    }
    if (idx !== input.length) {
        throw new Error(`Jeton inattendu à la position ${idx}`);
    }
    return tokens;
}

// ---------- Shunting-yard vers RPN ----------
function toRPN(tokens: string[], enabledOps: Readonly<Record<Exclude<Op, 'u-'>, boolean>>): RPNNode[] {
    const out: RPNNode[] = [];
    const ops: string[] = [];

    const precedence: Record<Exclude<Op, 'u-'>, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    const rightAssoc: Partial<Record<Exclude<Op, 'u-'>, boolean>> = { '^': true };
    const isOp = (t: string): t is Exclude<Op, 'u-'> => (t in precedence) && !!enabledOps[t as Exclude<Op, 'u-'>];

    const isBinaryOp = (x: string): x is OpBinary => (x === '+' || x === '-' || x === '*' || x === '/' || x === '^') && !!enabledOps[x];

    let prev: string | undefined;

    for (let t of tokens) {
        if (/^\d/.test(t)) {
            out.push({ type: 'num', value: Number(t) });
        } else if (/^[A-Za-z_]/.test(t)) {
            out.push({ type: 'name', value: t });
        } else if (t === ',') {
            while (ops.length && ops[ops.length - 1] !== '(') {
                out.push({ type: 'op', value: ops.pop() as Op });
            }
            if (!ops.length) throw new Error('Virgule mal placée (parenthèses manquantes)');
        } else if (isBinaryOp(t)) {
            // on travaille avec une copie typée
            let op: Op = t;

            // détection du moins unaire
            if (
                op === '-' &&
                (prev === undefined || prev === '(' || isBinaryOp(prev) || prev === ',')
            ) {
                op = 'u-';
            }

            if (op !== 'u-') {
                // ici, `op` est OpBinary => OK pour indexer precedence/rightAssoc
                while (ops.length) {
                    const top = ops[ops.length - 1];
                    if (
                        isBinaryOp(top) && (
                            (!rightAssoc[op] && precedence[op] <= precedence[top]) ||
                            (rightAssoc[op] && precedence[op] < precedence[top])
                        )
                    ) {
                        out.push({ type: 'op', value: ops.pop() as Op });
                    } else break;
                }
            }
        } else if (t === '(') {
            ops.push(t);
        } else if (t === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') {
                out.push({ type: 'op', value: ops.pop() as Op });
            }
            if (!ops.length) throw new Error('Parenthèses non appariées');
            ops.pop(); // retirer '('
            // Si on vient de fermer un appel de fonction: le nom a été émis juste avant
            const last = out[out.length - 1];
            if (last && last.type === 'name') {
                out.push({ type: 'call' });
            }
        } else {
            throw new Error(`Symbole inconnu "${t}"`);
        }
        prev = t;
    }

    while (ops.length) {
        const op = ops.pop()!;
        if (op === '(') throw new Error('Parenthèses non appariées');
        out.push({ type: 'op', value: op as Op });
    }
    return out;
}

// ---------- Évaluation RPN ----------
function isFiniteNumber(n: unknown): n is number {
    return typeof n === 'number' && Number.isFinite(n);
}

function evalRPN(
    rpn: RPNNode[],
    vars: Vars,
    funcs: Readonly<Record<string, Func>>,
    consts: Readonly<Record<string, number>>
): number {
    // Marqueur interne pour début d'appel de fonction (nom de la fonction)
    type FuncMarker = { __func__: string };
    const stack: Array<number | FuncMarker> = [];

    for (const node of rpn) {
        if (node.type === 'num') {
            stack.push(node.value);
        } else if (node.type === 'name') {
            const name = node.value;
            if (Object.prototype.hasOwnProperty.call(consts, name)) {
                stack.push(consts[name]);
            } else if (Object.prototype.hasOwnProperty.call(vars, name)) {
                const v = vars[name];
                if (!isFiniteNumber(v)) throw new Error(`Variable invalide: ${name}`);
                stack.push(v);
            } else if (Object.prototype.hasOwnProperty.call(funcs, name)) {
                stack.push({ __func__: name });
            } else {
                throw new Error(`Identifiant inconnu: ${name}`);
            }
        } else if (node.type === 'call') {
            const args: number[] = [];
            // Empiler jusqu'au marqueur de fonction
            // (on reconstituera l'ordre original ensuite)
            while (stack.length) {
                const top = stack.pop()!;
                if (typeof top === 'object') {
                    const fn = funcs[(top as FuncMarker).__func__];
                    const val = fn(...args.reverse());
                    if (!isFiniteNumber(val)) throw new Error('Résultat non fini (NaN/Inf)');
                    stack.push(val);
                    break;
                }
                if (!isFiniteNumber(top)) throw new Error('Argument de fonction invalide');
                args.push(top);
            }
            // Si on n’a pas trouvé de marqueur
            if (!stack.length || typeof stack[stack.length - 1] === 'number') {
                throw new Error('Appel de fonction mal formé');
            }
        } else if (node.type === 'op') {
            if (node.value === 'u-') {
                const a = stack.pop();
                if (!isFiniteNumber(a)) throw new Error('Expression unaire invalide');
                stack.push(-a);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                if (!isFiniteNumber(a) || !isFiniteNumber(b)) throw new Error('Expression binaire invalide');
                switch (node.value) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': stack.push(a / b); break;
                    case '^': stack.push(Math.pow(a, b)); break;
                    default: throw new Error(`Opérateur inconnu: ${node.value satisfies never}`);
                }
            }
        } else {
            const _exhaustive: never = node;
            throw new Error(`Noeud RPN inconnu: ${_exhaustive}`);
        }
    }

    if (stack.length !== 1 || !isFiniteNumber(stack[0])) {
        throw new Error('Expression mal formée');
    }
    const result = stack[0];
    if (!Number.isFinite(result)) throw new Error('Résultat non fini (NaN/Inf)');
    return result;
}
