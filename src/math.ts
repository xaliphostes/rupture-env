import { vec } from "@youwol/math";

export class Matrix33 {
    zeros() {
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                this.rot[i][j] = 0
            }
        }
    }

    rot = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
}

export function dot(v1: vec.Vector3, v2: vec.Vector3) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

export function sub(v1: vec.Vector3, v2: vec.Vector3): vec.Vector3 {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]
}

export function scale(v1: vec.Vector3, s: number): vec.Vector3 {
    return [v1[0] * s, v1[1] * s, v1[2] * s]
}

export function norm(v: vec.Vector3): number {
    return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
}