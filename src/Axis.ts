import { RuptureEnvelope } from "./RuptureEnvelop"

export class Axis {

    constructor(
        protected env_: RuptureEnvelope,
        private name_: string,
        private n_: number,
        private min_ = 0,
        private max_ = 1,
        private reverse_ = false) {
    }

    setSampling(n: number) {
        this.n_ = n
    }

    value(i: number): number {
        if (this.reverse_) {
            return this.min_ + (this.n_ - 1 - i) * (this.max_ - this.min_) / (this.n_ - 1);
        } else {
            return this.min_ + (i) * (this.max_ - this.min_) / (this.n_ - 1);
        }
    }

    update(i: number): void {
        // this.env_[this.name_] = this.value(i)
        (Reflect.set as any)(this.env_, this.name_, i);
    }
}
