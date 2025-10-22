import { vec } from "@youwol/math";
import { Matrix33, dot, scale, sub } from "./math";

export function normalAndShearStress(stress: Matrix33, n: vec.Vector3) {
    const t = [
        stress.rot[0][0] * n[0] + stress.rot[0][1] * n[1] + stress.rot[0][2] * n[2],
        stress.rot[0][1] * n[0] + stress.rot[1][1] * n[1] + stress.rot[1][2] * n[2],
        stress.rot[0][2] * n[0] + stress.rot[1][2] * n[1] + stress.rot[2][2] * n[2]
    ] as vec.Vector3

    const tn = scale(n, dot(n, t))
    const ts = sub(t, tn)

    return {
        tn,
        ts
    }
}
