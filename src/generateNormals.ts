import { createEmptySerie, DataFrame, IArray } from '@youwol/dataframe'
import { vec } from '@youwol/math'
import { Surface, fromTriangleToNode } from '@youwol/geometry'

export function generateNormalsAndAreas(dataframe: DataFrame, atNode = true) {
    const surface = Surface.create(
        dataframe.series.positions,
        dataframe.series.indices,
    )

    const n = createEmptySerie({
        Type: Array,
        count: surface.nbFacets,
        itemSize: 3,
        shared: false,
    })

    const a = createEmptySerie({
        Type: Array,
        count: surface.nbFacets,
        itemSize: 1,
        shared: false,
    })

    surface.forEachFace((face, i) => {
        const ids = face.nodeIds
        const p1 = surface.nodes[ids[0]].pos
        const p2 = surface.nodes[ids[1]].pos
        const p3 = surface.nodes[ids[2]].pos
        const v1 = vector(p1, p2) //as vec.Vector3
        const v2 = vector(p1, p3) //as vec.Vector3
        n.setItemAt(i, vec.cross(v1, v2))
        a.setItemAt(i, triangleArea3D(p1, p2, p3))
    })

    if (atNode === true) {
        return {
            normals: fromTriangleToNode({
                positions: dataframe.series.positions,
                indices: dataframe.series.indices,
                serie: n,
            }),
            areas: a
        }
    }

    return {
        normals: n,
        areas: a
    }
}

// -------------------------------------------------------------

const vector = (p1: vec.Vector3, p2: vec.Vector3) => {
    const x = p2[0] - p1[0]
    const y = p2[1] - p1[1]
    const z = p2[2] - p1[2]
    const n = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
    return [x / n, y / n, z / n]
}

// Aire non signée d'un triangle 3D défini par A, B, C (arrays [x,y,z])
function triangleArea3D(A: vec.Vector3, B: vec.Vector3, C: vec.Vector3) {
    const abx = B[0] - A[0], aby = B[1] - A[1], abz = B[2] - A[2];
    const acx = C[0] - A[0], acy = C[1] - A[1], acz = C[2] - A[2];
    const cx = aby * acz - abz * acy;
    const cy = abz * acx - abx * acz;
    const cz = abx * acy - aby * acx;
    const area = 0.5 * Math.hypot(cx, cy, cz);
    return area; // non signée (>= 0)
}