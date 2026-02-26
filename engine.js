// ============================================================
// Pihakansi Life-Cycle Analysis – Calculation Engine
// Implements: Carbonation, Frost Deterioration, Monte Carlo
// ============================================================

class SimulationEngine {
    constructor(params = DEFAULT_PARAMS) {
        this.params = JSON.parse(JSON.stringify(params));
        this.results = null;
    }

    // ---- Random number generators for Monte Carlo ----

    /** Box-Muller transform for normal distribution */
    static normalRandom(mean = 0, std = 1) {
        let u1 = Math.random();
        let u2 = Math.random();
        while (u1 === 0) u1 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + z * std;
    }

    /** Log-normal random (ensures positive values) */
    static lognormalRandom(mean, cov) {
        const variance = (cov * mean) ** 2;
        const mu = Math.log(mean ** 2 / Math.sqrt(variance + mean ** 2));
        const sigma = Math.sqrt(Math.log(1 + variance / mean ** 2));
        return Math.exp(SimulationEngine.normalRandom(mu, sigma));
    }

    // ---- Carbonation Model: two-phase dampened √t ----
    //
    // Phase 1 (t ≤ dampening_age): x = k × √t
    // Phase 2 (t > dampening_age): x = x(damp) + k × factor × √(t - damp_age)
    //
    // This models moisture saturation in wet concrete reducing CO₂ diffusion
    // after ~30 years of continuous exposure (Parrott 1987, fib MC 2010).

    /**
     * Calculate carbonation depth at time t (years from construction)
     * @param {number} k - carbonation coefficient (phase 1 rate)
     * @param {number} t - time in years from construction
     * @param {number} [dampAge] - age at which dampening begins (years)
     * @param {number} [dampFactor] - rate reduction factor after dampening (0–1)
     * @returns {number} carbonation depth in mm
     */
    static carbonationDepth(k, t, dampAge, dampFactor) {
        t = Math.max(0, t);
        if (t === 0 || k <= 0) return 0;
        if (!dampAge || dampAge <= 0 || dampFactor == null || dampFactor >= 1.0) {
            return k * Math.sqrt(t);
        }
        if (t <= dampAge) {
            return k * Math.sqrt(t);
        }
        // Two-phase: full rate up to dampAge, reduced rate after
        const phase1 = k * Math.sqrt(dampAge);
        const phase2 = k * dampFactor * Math.sqrt(t - dampAge);
        return phase1 + phase2;
    }

    /**
     * Inverse of carbonationDepth: find t such that depth(k, t) = targetDepth
     * Used for equivalent-age calculations in repair scenarios.
     */
    static carbonationInverseAge(k, targetDepth, dampAge, dampFactor) {
        if (targetDepth <= 0 || k <= 0) return 0;
        if (!dampAge || dampAge <= 0 || dampFactor == null || dampFactor >= 1.0) {
            return (targetDepth / k) ** 2;
        }
        const phase1Max = k * Math.sqrt(dampAge);
        if (targetDepth <= phase1Max) {
            return (targetDepth / k) ** 2;
        }
        // In phase 2: targetDepth = phase1Max + k*dampFactor*√(t - dampAge)
        const excess = targetDepth - phase1Max;
        const k2 = k * dampFactor;
        if (k2 <= 0) return Infinity;
        return dampAge + (excess / k2) ** 2;
    }

    /**
     * Calculate year when carbonation reaches rebar (with dampening)
     * @param {number} k - carbonation coefficient
     * @param {number} cover - concrete cover in mm
     * @param {number} [dampAge] - dampening age
     * @param {number} [dampFactor] - dampening factor
     * @returns {number} time in years from construction
     */
    static carbonationReachesRebar(k, cover, dampAge, dampFactor) {
        if (k <= 0) return Infinity;
        return SimulationEngine.carbonationInverseAge(k, cover, dampAge, dampFactor);
    }

    // ---- Frost Deterioration Model (by 32 / by 68) ----

    /**
     * Calculate cumulative frost damage at year t
     * Uses accelerating model: damage compounds because exposed surface degrades faster
     * @param {number} t - years of exposure (from critical saturation)
     * @param {number} baseRate - initial frost damage rate (mm/year)
     * @param {number} accelFactor - annual acceleration factor
     * @returns {number} cumulative frost damage depth in mm
     */
    static frostDamage(t, baseRate, accelFactor) {
        if (t <= 0) return 0;
        // Geometric series: sum = baseRate * (accelFactor^t - 1) / (accelFactor - 1)
        if (Math.abs(accelFactor - 1.0) < 1e-6) {
            return baseRate * t; // linear case
        }
        return (
            baseRate *
            (Math.pow(accelFactor, t) - 1) /
            (accelFactor - 1)
        );
    }

    /**
     * Calculate frost damage rate at a specific year
     * @param {number} t - years of exposure
     * @param {number} baseRate - initial rate
     * @param {number} accelFactor - acceleration factor
     * @returns {number} damage rate in mm/year at year t
     */
    static frostDamageRate(t, baseRate, accelFactor) {
        if (t <= 0) return 0;
        return baseRate * Math.pow(accelFactor, t - 1);
    }

    // ---- TT-Slab Support Surface Analysis ----

    /**
     * Calculate effective bearing length over time
     * @param {number} originalDepth - original bearing depth (mm)
     * @param {number} deteriorationRate - edge deterioration rate (mm/year)
     * @param {number} t - years of exposure
     * @param {number} edgeFactor - edge deterioration multiplier (1.0=one side, 2.0=both sides equal)
     * @returns {number} effective bearing length (mm)
     */
    static effectiveBearing(originalDepth, deteriorationRate, t, edgeFactor = 1.5) {
        const loss = edgeFactor * deteriorationRate * t;
        return Math.max(0, originalDepth - loss);
    }

    // ---- Monte Carlo Simulation ----

    /**
     * Run full Monte Carlo simulation for all scenarios
     * @returns {Object} simulation results
     */
    runSimulation() {
        const p = this.params;
        const N = p.monte_carlo_iterations;
        const years = [];
        for (let y = p.start_year; y <= p.end_year; y++) years.push(y);

        const results = {
            years,
            scenarios: {
                A: this._runScenario("A", N, years),
                B: this._runScenario("B", N, years),
                C: this._runScenario("C", N, years),
                D: this._runScenario("D", N, years),
            },
            element_analysis: this._runElementAnalysis(N),
            summary: {},
        };

        // Generate summary statistics
        results.summary = this._generateSummary(results);
        this.results = results;
        return results;
    }

    /**
     * Run a single scenario simulation
     */
    _runScenario(scenario, N, years) {
        const p = this.params;
        const nYears = years.length;

        // Initialize result arrays
        const carbonation_depths = new Array(nYears).fill(null).map(() => []);
        const frost_damage = new Array(nYears).fill(null).map(() => []);
        const bearing_lengths = new Array(nYears).fill(null).map(() => []);
        const corrosion_initiated = new Array(nYears).fill(0);
        const collapse_risk = new Array(nYears).fill(0);

        // Track critical year distributions
        const corrosion_year_samples = [];
        const collapse_year_samples = [];
        const critical_frost_year_samples = [];

        // Bayesian conditioning: pre-estimate model corrosion rate at observation year
        const bc = p.bayesian_conditioning;
        let qCorr = 1.0; // acceptance probability for corroded samples (1.0 = no filtering)
        let bcTobs = 0;
        const dampAge_bc = p.carbonation.dampening_age;
        const dampFactor_bc = p.carbonation.dampening_factor;

        if (bc && bc.enabled && bc.observation_year) {
            bcTobs = bc.observation_year - p.start_year;
            const obsRate = bc.observed_corrosion?.scenario || 0.01;
            const surfaceFrac_pre = p.betonipeite.tt_ripa_pintaterakset_osuus || 0;
            const N_pre = 2000;
            let corrCount = 0;
            for (let j = 0; j < N_pre; j++) {
                const k_pre = SimulationEngine.lognormalRandom(p.carbonation.k_tt_laatat, p.carbonation.k_cov);
                let cov_pre;
                if (surfaceFrac_pre > 0 && Math.random() < surfaceFrac_pre) {
                    cov_pre = 0;
                } else {
                    cov_pre = SimulationEngine.normalRandom(
                        p.betonipeite.tt_ripa_alapinta.mean, p.betonipeite.tt_ripa_alapinta.std);
                }
                if (SimulationEngine.carbonationDepth(k_pre, bcTobs, dampAge_bc, dampFactor_bc) >= Math.max(0, cov_pre))
                    corrCount++;
            }
            const pModel = corrCount / N_pre;
            if (pModel > obsRate && pModel > 0) {
                qCorr = obsRate * (1 - pModel) / (pModel * (1 - obsRate));
                qCorr = Math.min(qCorr, 1.0);
            }
        }

        for (let i = 0; i < N; i++) {
            // Sample random parameters with Bayesian rejection
            let k_tt, cover_tt;
            const surfaceFrac = p.betonipeite.tt_ripa_pintaterakset_osuus || 0;
            let accepted = false;
            for (let attempt = 0; attempt < 200; attempt++) {
                k_tt = SimulationEngine.lognormalRandom(p.carbonation.k_tt_laatat, p.carbonation.k_cov);
                if (surfaceFrac > 0 && Math.random() < surfaceFrac) {
                    cover_tt = 0;
                } else {
                    cover_tt = SimulationEngine.normalRandom(
                        p.betonipeite.tt_ripa_alapinta.mean,
                        p.betonipeite.tt_ripa_alapinta.std
                    );
                }
                // Bayesian rejection: condition on 2024 observation
                if (qCorr < 1.0 && bcTobs > 0) {
                    const carbAtObs = SimulationEngine.carbonationDepth(k_tt, bcTobs, dampAge_bc, dampFactor_bc);
                    if (carbAtObs >= Math.max(0, cover_tt) && Math.random() > qCorr) {
                        continue; // reject — inconsistent with observation
                    }
                }
                accepted = true;
                break;
            }

            const frost_rate =
                SimulationEngine.lognormalRandom(p.frost.base_rate_mm_per_year, p.frost.rate_cov);
            const bearing_rate =
                SimulationEngine.lognormalRandom(
                    p.tukipinta.rapautuminen_reuna_mm_per_year,
                    p.tukipinta.rapautuminen_cov
                );
            const accel = p.frost.acceleration_factor;

            // Apply scenario modifications
            let effectiveFrostRate = frost_rate;
            let effectiveK = k_tt;
            let repairYear = Infinity;

            if (scenario === "B") {
                effectiveFrostRate *= 1 - p.light_repair.frost_rate_reduction;
                repairYear = p.current_year;
            } else if (scenario === "C" || scenario === "D") {
                effectiveFrostRate *= 1 - p.full_repair.frost_rate_reduction;
                effectiveK *= 1 - p.full_repair.carbonation_k_reduction;
                repairYear = p.current_year;
            }

            let corrosionYearFound = false;
            let collapseYearFound = false;
            let criticalFrostFound = false;

            for (let yi = 0; yi < nYears; yi++) {
                const year = years[yi];
                const t_total = year - p.start_year; // total age
                const t_frost = Math.max(0, year - p.frost.critical_saturation_year);

                // Frost damage (adjusted for repair)
                if (scenario !== "A" && year > repairYear) {
                    // After repair, frost damage rate is reduced but existing damage remains
                    const t_before = repairYear - p.frost.critical_saturation_year;
                    const t_after = year - repairYear;
                    const damageBefore = SimulationEngine.frostDamage(
                        t_before, frost_rate, accel
                    );
                    const damageAfter = SimulationEngine.frostDamage(
                        t_after, effectiveFrostRate, (scenario === "C" || scenario === "D") ? 1.0 : accel
                    );
                    frost_damage[yi].push(damageBefore + damageAfter);
                } else {
                    frost_damage[yi].push(
                        SimulationEngine.frostDamage(t_frost, frost_rate, accel)
                    );
                }

                // Carbonation depth (two-phase dampened model)
                const dampAge = p.carbonation.dampening_age;
                const dampFactor = p.carbonation.dampening_factor;
                let carbDepth;
                if (scenario === "B" && year > repairYear && year < repairYear + p.light_repair.carbonation_pause_years) {
                    // During pause: frozen at repair-year depth
                    carbDepth = SimulationEngine.carbonationDepth(k_tt, repairYear - p.start_year, dampAge, dampFactor);
                } else if (scenario === "B" && year >= repairYear + p.light_repair.carbonation_pause_years) {
                    // After pause: continues from paused depth (time shift by pause duration)
                    carbDepth = SimulationEngine.carbonationDepth(k_tt, t_total - p.light_repair.carbonation_pause_years, dampAge, dampFactor);
                } else if ((scenario === "C" || scenario === "D") && year > repairYear) {
                    // After full repair: equivalent age continuation with reduced k
                    const carbBefore = SimulationEngine.carbonationDepth(k_tt, repairYear - p.start_year, dampAge, dampFactor);
                    const t_equiv = effectiveK > 0 ? SimulationEngine.carbonationInverseAge(effectiveK, carbBefore, dampAge, dampFactor) : Infinity;
                    carbDepth = SimulationEngine.carbonationDepth(effectiveK, t_equiv + (year - repairYear), dampAge, dampFactor);
                } else {
                    // Scenario A (all years), or B/C before repair: original k
                    carbDepth = SimulationEngine.carbonationDepth(k_tt, t_total, dampAge, dampFactor);
                }
                carbonation_depths[yi].push(carbDepth);

                // Check corrosion initiation (cover can be 0 for surface rebars)
                if (carbDepth >= Math.max(0, cover_tt)) {
                    corrosion_initiated[yi]++;
                    if (!corrosionYearFound) {
                        corrosion_year_samples.push(year);
                        corrosionYearFound = true;
                    }
                }

                // Bearing length calculation
                const edgeFactor = p.tukipinta.reunakerroin || 1.5;
                let effectiveBearing;
                if (scenario !== "A" && year > repairYear) {
                    const lossBefore = edgeFactor * bearing_rate * (repairYear - p.frost.critical_saturation_year);
                    const reductionFactor = scenario === "B" ? p.light_repair.frost_rate_reduction : p.full_repair.frost_rate_reduction;
                    const lossAfter = edgeFactor * (bearing_rate * (1 - reductionFactor)) * (year - repairYear);
                    effectiveBearing = Math.max(0, p.tukipinta.original_depth_mm - lossBefore - lossAfter);
                } else {
                    effectiveBearing = SimulationEngine.effectiveBearing(
                        p.tukipinta.original_depth_mm, bearing_rate, t_frost, edgeFactor
                    );
                }
                bearing_lengths[yi].push(effectiveBearing);

                // Collapse risk check
                if (effectiveBearing < p.tukipinta.critical_min_mm) {
                    collapse_risk[yi]++;
                    if (!collapseYearFound) {
                        collapse_year_samples.push(year);
                        collapseYearFound = true;
                    }
                }

                // Critical frost damage
                const currentFrost = frost_damage[yi][frost_damage[yi].length - 1];
                if (currentFrost > p.frost.critical_damage_depth_mm && !criticalFrostFound) {
                    critical_frost_year_samples.push(year);
                    criticalFrostFound = true;
                }
            }
        }

        // Calculate statistics for each year
        const stats = years.map((_, yi) => ({
            carbonation: this._calcStats(carbonation_depths[yi]),
            frost: this._calcStats(frost_damage[yi]),
            bearing: this._calcStats(bearing_lengths[yi]),
            corrosion_probability: corrosion_initiated[yi] / N,
            collapse_probability: collapse_risk[yi] / N,
        }));

        return {
            stats,
            distributions: {
                corrosion_year: this._calcStats(corrosion_year_samples),
                collapse_year: this._calcStats(collapse_year_samples),
                critical_frost_year: this._calcStats(critical_frost_year_samples),
                corrosion_year_histogram: this._histogram(corrosion_year_samples, years[0], years[years.length - 1]),
                collapse_year_histogram: this._histogram(collapse_year_samples, years[0], years[years.length - 1]),
            },
        };
    }

    /**
     * Run element-specific analysis
     */
    _runElementAnalysis(N) {
        const p = this.params;
        const elements = {};

        const elementConfigs = [
            { id: "pilarit", k: p.carbonation.k_pilarit, cover: p.betonipeite.pilarit },
            { id: "leukapalkit", k: p.carbonation.k_leukapalkit, cover: p.betonipeite.leukapalkit },
            { id: "tt_laatta_laippa", k: p.carbonation.k_tt_laatat, cover: p.betonipeite.tt_laatta_laippa },
            { id: "tt_ripa_alapinta", k: p.carbonation.k_tt_laatat, cover: p.betonipeite.tt_ripa_alapinta },
        ];

        // Bayesian conditioning parameters
        const bc = p.bayesian_conditioning;
        const bcTobs = (bc && bc.enabled && bc.observation_year)
            ? bc.observation_year - p.start_year : 0;
        const dampAge_ea = p.carbonation.dampening_age;
        const dampFactor_ea = p.carbonation.dampening_factor;

        for (const elem of elementConfigs) {
            const corrosionYears = [];
            const surfaceFrac = (elem.id === "tt_ripa_alapinta")
                ? (p.betonipeite.tt_ripa_pintaterakset_osuus || 0)
                : 0;

            // Pre-estimate model corrosion rate for this element
            let qCorrElem = 1.0;
            if (bcTobs > 0 && bc.observed_corrosion) {
                const obsRateElem = bc.observed_corrosion[elem.id] || 0.01;
                const N_pre = 2000;
                let corrCount = 0;
                for (let j = 0; j < N_pre; j++) {
                    const k_pre = SimulationEngine.lognormalRandom(elem.k, p.carbonation.k_cov);
                    let cov_pre;
                    if (surfaceFrac > 0 && Math.random() < surfaceFrac) {
                        cov_pre = 0;
                    } else {
                        cov_pre = SimulationEngine.normalRandom(elem.cover.mean, elem.cover.std);
                    }
                    if (SimulationEngine.carbonationDepth(k_pre, bcTobs, dampAge_ea, dampFactor_ea) >= Math.max(0, cov_pre))
                        corrCount++;
                }
                const pModelElem = corrCount / N_pre;
                if (pModelElem > obsRateElem && pModelElem > 0) {
                    qCorrElem = obsRateElem * (1 - pModelElem) / (pModelElem * (1 - obsRateElem));
                    qCorrElem = Math.min(qCorrElem, 1.0);
                }
            }

            for (let i = 0; i < N; i++) {
                let k, cover;
                // Sample with Bayesian rejection
                for (let attempt = 0; attempt < 200; attempt++) {
                    k = SimulationEngine.lognormalRandom(elem.k, p.carbonation.k_cov);
                    if (surfaceFrac > 0 && Math.random() < surfaceFrac) {
                        cover = 0;
                    } else {
                        cover = SimulationEngine.normalRandom(elem.cover.mean, elem.cover.std);
                    }
                    if (qCorrElem < 1.0 && bcTobs > 0) {
                        const carbAtObs = SimulationEngine.carbonationDepth(k, bcTobs, dampAge_ea, dampFactor_ea);
                        if (carbAtObs >= Math.max(0, cover) && Math.random() > qCorrElem) {
                            continue; // reject
                        }
                    }
                    break;
                }
                if (cover >= 0 && k > 0) {
                    const yearsToCorrosion = SimulationEngine.carbonationReachesRebar(
                        k, Math.max(0, cover),
                        p.carbonation.dampening_age, p.carbonation.dampening_factor
                    );
                    corrosionYears.push(p.start_year + yearsToCorrosion);
                }
            }
            elements[elem.id] = {
                corrosion_year: this._calcStats(corrosionYears),
                histogram: this._histogram(corrosionYears, p.start_year, p.end_year),
            };
        }

        return elements;
    }

    /**
     * Generate summary of results
     */
    _generateSummary(results) {
        const summary = {};
        for (const [scId, scData] of Object.entries(results.scenarios)) {
            const scenarioName =
                scId === "A"
                    ? "Passiivinen (ei korjauksia)"
                    : scId === "B"
                        ? "Kevyt korjaus"
                        : scId === "C"
                            ? "Täyskorjaus"
                            : "Täyskorjaus (puut säilyttäen)";

            summary[scId] = {
                name: scenarioName,
                corrosion_initiation_year: scData.distributions.corrosion_year,
                collapse_risk_year: scData.distributions.collapse_year,
                critical_frost_year: scData.distributions.critical_frost_year,

                // Probability at specific checkpoints
                collapse_prob_2030: this._getProbAtYear(results.years, scData.stats, 2030, "collapse_probability"),
                collapse_prob_2035: this._getProbAtYear(results.years, scData.stats, 2035, "collapse_probability"),
                collapse_prob_2040: this._getProbAtYear(results.years, scData.stats, 2040, "collapse_probability"),
                collapse_prob_2050: this._getProbAtYear(results.years, scData.stats, 2050, "collapse_probability"),
                collapse_prob_2075: this._getProbAtYear(results.years, scData.stats, 2075, "collapse_probability"),
                collapse_prob_2100: this._getProbAtYear(results.years, scData.stats, 2100, "collapse_probability"),

                corrosion_prob_2030: this._getProbAtYear(results.years, scData.stats, 2030, "corrosion_probability"),
                corrosion_prob_2035: this._getProbAtYear(results.years, scData.stats, 2035, "corrosion_probability"),
                corrosion_prob_2040: this._getProbAtYear(results.years, scData.stats, 2040, "corrosion_probability"),
                corrosion_prob_2050: this._getProbAtYear(results.years, scData.stats, 2050, "corrosion_probability"),
                corrosion_prob_2075: this._getProbAtYear(results.years, scData.stats, 2075, "corrosion_probability"),
                corrosion_prob_2100: this._getProbAtYear(results.years, scData.stats, 2100, "corrosion_probability"),
            };
        }
        return summary;
    }

    _getProbAtYear(years, stats, targetYear, field) {
        const idx = years.indexOf(targetYear);
        if (idx < 0) return null;
        return stats[idx][field];
    }

    // ---- Statistics helpers ----

    _calcStats(arr) {
        if (!arr || arr.length === 0) return { mean: NaN, median: NaN, p5: NaN, p25: NaN, p75: NaN, p95: NaN, std: NaN, n: 0 };
        const sorted = [...arr].sort((a, b) => a - b);
        const n = sorted.length;
        const mean = sorted.reduce((a, b) => a + b, 0) / n;
        const variance = sorted.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;

        return {
            mean,
            median: sorted[Math.floor(n * 0.5)],
            p5: sorted[Math.floor(n * 0.05)],
            p25: sorted[Math.floor(n * 0.25)],
            p75: sorted[Math.floor(n * 0.75)],
            p95: sorted[Math.floor(n * 0.95)],
            std: Math.sqrt(variance),
            min: sorted[0],
            max: sorted[n - 1],
            n,
        };
    }

    _histogram(arr, minVal, maxVal, bins = 50) {
        if (!arr || arr.length === 0) return { bins: [], counts: [], edges: [] };
        const range = maxVal - minVal;
        const binWidth = range / bins;
        const counts = new Array(bins).fill(0);
        const edges = [];
        const binCenters = [];

        for (let i = 0; i <= bins; i++) {
            edges.push(minVal + i * binWidth);
        }
        for (let i = 0; i < bins; i++) {
            binCenters.push((edges[i] + edges[i + 1]) / 2);
        }

        for (const val of arr) {
            const idx = Math.min(bins - 1, Math.max(0, Math.floor((val - minVal) / binWidth)));
            counts[idx]++;
        }

        // Normalize to probability
        const total = arr.length;
        const probs = counts.map((c) => c / total);

        return { bins: binCenters, counts, probs, edges };
    }
}
