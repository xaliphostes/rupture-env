import { Serie, DataFrame, createEmptySerie, forEach } from '@youwol/dataframe'
import { generateNormalsAndAreas, NormalsAndAreas } from './generateNormals'
import { Axis } from './Axis';
import { Progress } from './Progress';
import { AndersonRemote } from './AndersonRemote';
import { normalAndShearStress } from './utils';
import { norm } from './math';

export type Cube = {
    domain: number[],
    dimX: number,
    dimY: number,
    dimZ: number
}

export type Square = {
    domain: number[],
    dimX: number,
    dimY: number
}

export class RuptureEnvelope {
    cube() {
        return this.cube_
    }

    square() {
        return this.square_
    }

    reset() {
        this.normals_ = createEmptySerie({
            Type: Array,
            count: 0,
            itemSize: 3,
            shared: false,
        })
        this.areas_ = createEmptySerie({
            Type: Array,
            count: 0,
            itemSize: 1,
            shared: false,
        })
    }

    addFault(positions: Serie, indices: Serie) {
        const dataframe = DataFrame.create({
            series: {
                positions,
                indices
            }
        })

        const result: NormalsAndAreas = generateNormalsAndAreas(dataframe, false);
        (this.normals_.array as number[]).concat(result.normals.array as number[]);
        (this.areas_.array as number[]).concat(result.areas.array as number[]);
    }

    setAxis(axe: string, name: string, min: number, max: number, reverse: boolean) {
        const axis = new Axis(this, name, this.n_, min, max, reverse)
        const a = axe.toLowerCase()
        switch (axe) {
            case 'x': this.xAxis_ = axis; break
            case 'y': this.yAxis_ = axis; break
            case 'z': this.zAxis_ = axis; break
            default: throw `Unknown axis name ${axe} for ${name}. Must be either x, y or z`
        }
    }

    setSampling(n: number) {
        this.n_ = n;
        if (this.xAxis_)
            this.xAxis_.setSampling(n);
        if (this.yAxis_)
            this.yAxis_.setSampling(n);
        if (this.zAxis_)
            this.zAxis_.setSampling(n);
    }

    run2D(progress: Progress) {
        let l = 0
        let total = Math.pow(this.n_, 2.0)
        this.square_ = {
            dimX: this.n_,
            dimY: this.n_,
            domain: new Array<number>(total)
        }
        progress.reset(total)
        this.setSampling(this.n_)

        for (let i = 0; i < this.n_; ++i) {
            this.xAxis_.update(i)
            for (let j = 0; j < this.n_; ++j) {
                this.yAxis_.update(j)
                this.square_.domain[l++] = this.energy();
                progress.tick();
            }
        }
    }

    run3D(progress: Progress) {
        let l = 0
        let total = Math.pow(this.n_, 3.0)
        this.cube_ = {
            dimX: this.n_,
            dimY: this.n_,
            dimZ: this.n_,
            domain: new Array<number>(total)
        }
        progress.reset(total)
        this.setSampling(this.n_)

        for (let i = 0; i < this.n_; ++i) {
            this.xAxis_.update(i)
            for (let j = 0; j < this.n_; ++j) {
                this.yAxis_.update(j)
                for (let k = 0; k < this.n_; ++k) {
                    this.zAxis_.update(k)
                    this.cube_.domain[l++] = this.energy();
                    progress.tick();
                }
            }
        }
    }

    get friction() { return this.friction_ }
    set friction(a: number) { this.friction_ = a }

    get cohesion() { return this.cohesion_ }
    set cohesion(a: number) { this.cohesion_ = a }

    get pressure() { return this.pressure_ }
    set pressure(a: number) { this.pressure_ = a }

    get poisson() { return this.poisson_ }
    set poisson(a: number) { this.poisson_ = a }

    get SH() { return this.SH_ }
    set SH(a: string) { this.SH_ = a; this.dirtyStress_ = true }

    get Sh() { return this.Sh_ }
    set Sh(a: string) { this.Sh_ = a; this.dirtyStress_ = true }

    get Sv() { return this.Sv_ }
    set Sv(a: string) { this.Sv_ = a; this.dirtyStress_ = true }

    get R() { return this.R_ }
    set R(a: number) { throw 'todo according to SH, Sh, Sv' }

    get theta() { return this.theta_ }
    set theta(a: number) { this.theta_ = a }

    get lambda() { return this.lambda_ }
    set lambda(a: number) { this.lambda_ = a }

    // ----------------------------------------------------------------

    private energy() {
        this.updateRemote() // if necessary...

        let W = 0;
        let mu = this.friction
        let Co = this.cohesion
        let La = this.lambda
        let Po = this.poisson
        let Pr = this.pressure

        // TODO: use the center (x,y,z) of each point

        let i = 0;
        forEach([this.normals_, this.areas_], ([normal, area]: [[number, number, number], [number]]) => {
            const s = this.remote_.stressAt([0, 0, 0] /*t.center()*/) // stress at triangle-center
            const { tn, ts } = normalAndShearStress(s, normal) // shear and normal stresses
            let tts = norm(ts);
            let ttn = norm(tn);
            let C = (ttn - Pr) * mu * (1. - La) + Co;
            if (tts > C) {
                let Teff = (1. + Po) * Math.pow(tts - C, 2.); // Distortional Eff
                let Seff = (1. - 2. * Po) * Math.pow(La * ttn, 2.); // Volumetric Eff
                W += (Teff + Seff) * area[0] / this.max_area_; // Total energy weighted by the area
            }
        })

        return W;
    }

    private updateRemote() {
        if (this.dirtyStress_) {
            this.remote_.SH = this.SH_
            this.remote_.Sh = this.Sh_
            this.remote_.Sv = this.Sv_
            this.remote_.theta = this.theta_
            this.dirtyStress_ = false;
        }
    }

    // -----------------------------------------------------------

    private xAxis_ = new Axis(this, 'R', 10, 0, 3)
    private yAxis_ = new Axis(this, 'theta', 10, 0, 180)
    private zAxis_ = new Axis(this, 'friction', 10, 0, 1)
    private n_ = 10

    private friction_ = 0;
    private cohesion_ = 0;
    private lambda_ = 0;
    private pressure_ = 0;
    private poisson_ = 0.25;
    private R_ = 0
    private SH_ = '0';
    private Sh_ = '0';
    private Sv_ = '1';
    private theta_ = 0;
    private dirtyStress_ = true

    private max_area_ = 0
    private remote_ = new AndersonRemote()

    private normals_ = createEmptySerie({
        Type: Array,
        count: 0,
        itemSize: 3,
        shared: false,
    })
    private areas_ = createEmptySerie({
        Type: Array,
        count: 0,
        itemSize: 1,
        shared: false,
    })

    private cube_: Cube = { domain: [], dimX: 10, dimY: 10, dimZ: 10 }
    private square_: Square = { domain: [], dimX: 10, dimY: 10 }
}

