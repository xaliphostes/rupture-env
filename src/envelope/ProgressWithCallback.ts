import { Progress } from "./Progress";

// Extended Progress class with callback and cancellation support
export class ProgressWithCallback extends Progress {
    private callback: (current: number) => void;
    private lastReportedPercentage_ = -1;
    private reportInterval_ = 5; // Report every 5%

    constructor(max: number, prefix: string, callback: (current: number) => void, reportInterval: number = 5) {
        super(max, prefix);
        this.callback = callback;
        this.reportInterval_ = reportInterval;
    }

    tick(V: number = 1) {
        super.tick(V);
        
        const currentPercentage = Math.floor((this['cur_'] / this['max_']) * 100);
        
        // Only call callback if we've crossed a reportInterval threshold
        if (Math.floor(currentPercentage / this.reportInterval_) > Math.floor(this.lastReportedPercentage_ / this.reportInterval_)) {
            this.lastReportedPercentage_ = currentPercentage;
            this.callback(this['cur_']);
        }
        
        // Always report at 100%
        if (this['cur_'] >= this['max_']) {
            this.callback(this['cur_']);
        }
    }
}