export class Progress {
    private max_ = 1
    private cur_ = 0
    private n_ = 10
    private digits_ = 2
    private displayc_ = true
    private prefix_ = 'Realized'
    private cancelled_ = false

    constructor(max: number, prefix?: string) {
        this.max_ = max
        this.prefix_ = prefix ?? "Realized"
    }

    reset(max: number) {
        this.max_ = max
        this.cur_ = 0
        this.cancelled_ = false
    }

    cancel() {
        this.cancelled_ = true
    }

    isCancelled(): boolean {
        return this.cancelled_
    }

    tick(V: number = 1) {
        let prepos = this.pos()
        this.cur_ += V;
        let curpos = this.pos()
        if (this.cur_ >= this.max_) {
            this.cur_ = this.max_
            if (this.displayc_) {
                this.display()
                console.log()
                return;
            }
        }
        if (prepos != curpos && this.displayc_) {
            this.display();
        }
    }

    private pos(): number {
        return Math.round(this.cur_ / this.max_ * 100 / this.n_)
    }

    private display() {
        const v = this.value(true);
        console.log(`\r ${this.prefix_} ${v * 100}%`)
    }

    /**
     * Get the current value in percent or not.
     * The percent is in [0,1]
     */
    private value(percent = true) {
        if (percent) {
            return this.cur_ / this.max_
        }
        return this.cur_
    }

}