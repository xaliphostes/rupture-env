import { generateRectangle } from '@youwol/geometry'
import { Progress } from '../src/Progress'
import { RuptureEnvelope } from '../src/RuptureEnvelop'

const steps = 50
const r = new RuptureEnvelope()

let df = generateRectangle({ a: 20, b: 15, na: 30, nb: 30 })
r.addFault(df.series.positions, df.series.indices)
r.setAxis("x", "friction", 0, 1, false)
r.setAxis("y", "cohesion", 0, 1, false)
r.setAxis("z", "lambda", 0, 1, false)
r.setSampling(50)

const progress = new Progress(steps)
r.run3D(progress)

const cube = r.cube()

// Then:
//   1. Compute iso-surfaces
//   2. Display with three.js