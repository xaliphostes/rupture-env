import { RuptureEnvelope } from './RuptureEnvelope';
import { Progress } from './Progress';

/**
 * Async wrapper that runs computation in chunks to allow UI updates
 */
export class AsyncRuptureEnvelope {
    constructor(private envelope: RuptureEnvelope) { }

    async run2DAsync(progress: Progress, chunkSize: number = 10): Promise<void> {
        const n = this.envelope['n_'];
        let l = 0;
        const total = Math.pow(n, 2.0);

        this.envelope['square_'] = {
            dimX: n,
            dimY: n,
            domain: new Array<number>(total)
        };

        progress.reset(total);
        this.envelope.setSampling(n);

        for (let i = 0; i < n; ++i) {
            this.envelope['xAxis_'].update(i);

            for (let j = 0; j < n; ++j) {
                // Check for cancellation
                if (progress.isCancelled()) {
                    console.log('Computation cancelled by user');
                    throw new Error('Computation cancelled');
                }

                this.envelope['yAxis_'].update(j);
                this.envelope['square_'].domain[l++] = this.envelope['energy']();
                progress.tick();

                // Yield to UI every chunkSize iterations
                if (l % chunkSize === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }
    }

    async run3DAsync(progress: Progress, chunkSize: number = 10): Promise<void> {
        const n = this.envelope['n_'];
        let l = 0;
        const total = Math.pow(n, 3.0);

        this.envelope['cube_'] = {
            dimX: n,
            dimY: n,
            dimZ: n,
            domain: new Array<number>(total)
        };

        progress.reset(total);
        this.envelope.setSampling(n);

        let MIN = Number.POSITIVE_INFINITY;
        let MAX = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < n; ++i) {
            this.envelope['xAxis_'].update(i);

            for (let j = 0; j < n; ++j) {
                this.envelope['yAxis_'].update(j);

                for (let k = 0; k < n; ++k) {
                    // Check for cancellation
                    if (progress.isCancelled()) {
                        console.log('Computation cancelled by user');
                        throw new Error('Computation cancelled');
                    }

                    this.envelope['zAxis_'].update(k);
                    const e = this.envelope['energy']();
                    this.envelope['cube_'].domain[l++] = e;
                    if (e < MIN) MIN = e;
                    if (e > MAX) MAX = e;
                    progress.tick();

                    // Yield to UI every chunkSize iterations
                    if (l % chunkSize === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }
        }

        console.log(`Min = ${MIN}, Max = ${MAX}`);
    }
}