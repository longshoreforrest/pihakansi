// Baseline capture script — run with: node baseline.mjs > before.json
// (or > after.json for post-change comparison)

import { readFileSync } from 'fs';
import vm from 'vm';

// Shared context for data.js and engine.js globals
const ctx = vm.createContext({ Math, console, JSON, Infinity, NaN, parseInt, parseFloat, isNaN, Array, Object });

const dataCode = readFileSync(new URL('./data.js', import.meta.url), 'utf-8');
const engineCode = readFileSync(new URL('./engine.js', import.meta.url), 'utf-8');

vm.runInContext(dataCode, ctx);
vm.runInContext(engineCode, ctx);

// Seed Math.random for reproducibility (Mulberry32)
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
ctx.Math.random = mulberry32(42);

const runCode = `
const engine = new SimulationEngine(DEFAULT_PARAMS);
const results = engine.runSimulation();

const checkpoints = [2030, 2035, 2040, 2050, 2075, 2100];
const output = {};

for (const scId of ['A', 'B', 'C']) {
    const sc = results.scenarios[scId];
    const scOut = {};

    for (const year of checkpoints) {
        const yi = results.years.indexOf(year);
        if (yi < 0) continue;
        const st = sc.stats[yi];
        scOut[year] = {
            collapse_prob: +st.collapse_probability.toFixed(4),
            corrosion_prob: +st.corrosion_probability.toFixed(4),
            frost_median: +st.frost.median.toFixed(2),
            bearing_median: +st.bearing.median.toFixed(2),
        };
    }

    scOut.distributions = {
        corrosion_year_median: +(sc.distributions.corrosion_year.median || NaN).toFixed(1),
        collapse_year_median: +(sc.distributions.collapse_year.median || NaN).toFixed(1),
        critical_frost_year_median: +(sc.distributions.critical_frost_year.median || NaN).toFixed(1),
    };

    output[scId] = scOut;
}

JSON.stringify(output, null, 2);
`;

const jsonOutput = vm.runInContext(runCode, ctx);
console.log(jsonOutput);
