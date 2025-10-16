import { Serie, DataFrame, createEmptySerie } from '@youwol/dataframe'
import { Surface } from '@youwol/geometry'
import { generateNormals } from './generateNormals'

export class RuptureEnvelop {
    private xAxis_ = "friction"
    private yAxis_ = "cohesion"
    private zAxis_ = "theta"

    private friction_ = 0;
    private cohesion_ = 0;
    private lambda_ = 0;
    private pressure_ = 0;
    private poisson_ = 0.25;
    private SH_ = "0";
    private Sh_ = "0";
    private Sv_ = "1";
    private theta_ = 0;

    private normals_ = createEmptySerie({
        Type: Array,
        count: 0,
        itemSize: 3,
        shared: false,
    })

    reset() {
        this.normals_ = createEmptySerie({
            Type: Array,
            count: 0,
            itemSize: 3,
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
        const snormals = generateNormals(dataframe, false) as Serie
        (this.normals_.array as Array<number>).concat(snormals.array as number[])
    }
}
