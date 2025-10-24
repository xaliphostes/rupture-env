import { vec } from "@youwol/math";
import { Matrix33 } from "./math";
import { EvalFunction, parse } from "mathjs";

export class AndersonRemote {
    constructor(
        private SH_ = '0',
        private Sh_ = '0',
        private Sv_ = '1',
        private theta_ = 0,
        private attribute_ = 0,
        private attrName_ = 'A') {
    }

    set SH(a: string) { this.SH_ = a; this.dirty_ = true }
    set Sh(a: string) { this.Sh_ = a; this.dirty_ = true }
    set Sv(a: string) { this.Sv_ = a; this.dirty_ = true }
    set theta(a: number) { this.theta_ = a; this.dirty_ = true }
    set attribute(a: number) { this.attribute_ = a; this.dirty_ = true }

    stressAt(pos: vec.Vector3): Matrix33 {
        this.init()

        let stress = new Matrix33;
        const x = [0, 0, 0]

        for (let i = 0; i < 3; ++i) { // (dip, strike and nornal)
            let scope = { x: pos[0], y: pos[1], z: pos[2] }
            x[i] = this.parsers_[i].evaluate(scope);
        }

        let SH = x[0];
        let Sh = x[1];
        let Sv = x[2];

        stress.rot[0][0] = Sh;
        stress.rot[1][1] = SH;
        stress.rot[2][2] = Sv;
        rotateForward(this.rot, stress)

        return stress;
    }

    private init() {
        if (!this.dirty_) return;

        this.parsers_ = []  // ✓ Clear before adding
        this.parsers_.push(parse(this.SH_).compile())
        this.parsers_.push(parse(this.Sh_).compile())
        this.parsers_.push(parse(this.Sv_).compile())

        let ang = this.theta_ * Math.PI / 180.;
        let cos = Math.cos(ang);
        let sin = Math.sin(ang);

        this.rot.zeros();
        this.rot.rot[1][1] = this.rot.rot[0][0] = cos;
        this.rot.rot[0][1] = sin;
        this.rot.rot[1][0] = -this.rot.rot[0][1]
        this.rot.rot[2][2] = 1;
        this.dirty_ = false;
    }

    private dirty_ = true
    private parsers_: EvalFunction[] = []
    private rot = new Matrix33()
}

function rotateForward(m1: Matrix33, s: Matrix33) {
    const t = new Matrix33()

    // Operates: t = s.m1'
    t.rot[0][0] = s.rot[0][0] * m1.rot[0][0] + s.rot[0][1] * m1.rot[0][1] + s.rot[0][2] * m1.rot[0][2];
    t.rot[0][1] = s.rot[0][0] * m1.rot[1][0] + s.rot[0][1] * m1.rot[1][1] + s.rot[0][2] * m1.rot[1][2];
    t.rot[0][2] = s.rot[0][0] * m1.rot[2][0] + s.rot[0][1] * m1.rot[2][1] + s.rot[0][2] * m1.rot[2][2];
    t.rot[1][0] = s.rot[1][0] * m1.rot[0][0] + s.rot[1][1] * m1.rot[0][1] + s.rot[1][2] * m1.rot[0][2];
    t.rot[1][1] = s.rot[1][0] * m1.rot[1][0] + s.rot[1][1] * m1.rot[1][1] + s.rot[1][2] * m1.rot[1][2];
    t.rot[1][2] = s.rot[1][0] * m1.rot[2][0] + s.rot[1][1] * m1.rot[2][1] + s.rot[1][2] * m1.rot[2][2];
    t.rot[2][0] = s.rot[2][0] * m1.rot[0][0] + s.rot[2][1] * m1.rot[0][1] + s.rot[2][2] * m1.rot[0][2];
    t.rot[2][1] = s.rot[2][0] * m1.rot[1][0] + s.rot[2][1] * m1.rot[1][1] + s.rot[2][2] * m1.rot[1][2];
    t.rot[2][2] = s.rot[2][0] * m1.rot[2][0] + s.rot[2][1] * m1.rot[2][1] + s.rot[2][2] * m1.rot[2][2];

    // Operates: m1.t
    s.rot[0][0] = m1.rot[0][0] * t.rot[0][0] + m1.rot[0][1] * t.rot[1][0] + m1.rot[0][2] * t.rot[2][0];
    s.rot[0][1] = m1.rot[0][0] * t.rot[0][1] + m1.rot[0][1] * t.rot[1][1] + m1.rot[0][2] * t.rot[2][1];
    s.rot[0][2] = m1.rot[0][0] * t.rot[0][2] + m1.rot[0][1] * t.rot[1][2] + m1.rot[0][2] * t.rot[2][2];
    s.rot[1][0] = m1.rot[1][0] * t.rot[0][0] + m1.rot[1][1] * t.rot[1][0] + m1.rot[1][2] * t.rot[2][0];
    s.rot[1][1] = m1.rot[1][0] * t.rot[0][1] + m1.rot[1][1] * t.rot[1][1] + m1.rot[1][2] * t.rot[2][1];
    s.rot[1][2] = m1.rot[1][0] * t.rot[0][2] + m1.rot[1][1] * t.rot[1][2] + m1.rot[1][2] * t.rot[2][2];
    s.rot[2][0] = m1.rot[2][0] * t.rot[0][0] + m1.rot[2][1] * t.rot[1][0] + m1.rot[2][2] * t.rot[2][0];
    s.rot[2][1] = m1.rot[2][0] * t.rot[0][1] + m1.rot[2][1] * t.rot[1][1] + m1.rot[2][2] * t.rot[2][1];
    s.rot[2][2] = m1.rot[2][0] * t.rot[0][2] + m1.rot[2][1] * t.rot[1][2] + m1.rot[2][2] * t.rot[2][2];

    return s;
}