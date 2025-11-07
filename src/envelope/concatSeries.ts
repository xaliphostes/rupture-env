import { Serie } from '@youwol/dataframe'

/**
 * Concatenate two Series into a new one (immutable).
 * Both Series must have the same itemSize and compatible array types.
 * @example
 * ```ts
 * const s1 = Serie.create({ array: new Float32Array([0,1, 2,3]), itemSize: 2, name: 'uv' })
 * const s2 = Serie.create({ array: new Float32Array([4,5, 6,7]), itemSize: 2 })
 * const s = concatSerie(s1, s2)   // -> itemSize: 2, array: [0,1,2,3,4,5,6,7]
 * ```
 */
export function concatSeries(a: Serie, b: Serie, name?: string): Serie {
    if (a.itemSize !== b.itemSize) {
        throw new Error(`itemSize mismatch: ${a.itemSize} vs ${b.itemSize}`)
    }

    const A = a.array as ArrayLike<number> & { constructor: any; length: number }
    const B = b.array as ArrayLike<number> & { constructor: any; length: number }

    // If array types differ, choose a "wider" type (simple rule: Float64 > Float32 > Int32 > Int16 > Int8)
    const ctor = pickCommonCtor(A.constructor, B.constructor)

    const out = new (ctor as any)(A.length + B.length)
    out.set(A as any, 0)
    out.set(B as any, A.length)

    return Serie.create({
        array: out,
        itemSize: a.itemSize
    })
}

/** Append b to a (alias) */
export const appendSeries = concatSeries

function pickCommonCtor(c1: any, c2: any): any {
    if (c1 === c2) return c1

    const rank = new Map<any, number>([
        [Float64Array, 5],
        [Float32Array, 4],
        [Int32Array, 3],
        [Int16Array, 2],
        [Int8Array, 1],
        [Array, 0], // fallback
    ])

    // prefer the "widest" of the two
    const r1 = rank.get(c1) ?? 0
    const r2 = rank.get(c2) ?? 0
    return r1 >= r2 ? c1 : c2
}