// import { Parser } from '../src/envelope/Parser.ts'
import * as math from "mathjs"
import { evaluate } from "mathjs"

console.log(evaluate("1"))
console.log(evaluate("sin(pi/4) + 2^3"))

const node1 = math.parse('sqrt(3^2 + 4^2)')
console.log(node1.compile().evaluate()) // 5

let scope = { a: 3, b: 4 }
const node2 = math.parse('a * b') // 12
const code2 = node2.compile()

console.log(code2.evaluate(scope)) // 12

scope.a = 5
console.log(code2.evaluate(scope)) // 20
