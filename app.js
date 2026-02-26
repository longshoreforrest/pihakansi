// ============================================================
// Pihakansi Life-Cycle Analysis – Main Application
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    ChartManager.setDefaults();
    const chartManager = new ChartManager();
    let currentResults = null;

    /** Set element textContent by id (shared helper) */
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // ---- Parameter binding ----
    const paramInputs = {
        iterations: document.getElementById("param-iterations"),
        bayesian_enabled: document.getElementById("param-bayesian-enabled"),
        k_pilarit: document.getElementById("param-k-pilarit"),
        k_leukapalkit: document.getElementById("param-k-leukapalkit"),
        k_tt: document.getElementById("param-k-tt"),
        k_cov: document.getElementById("param-k-cov"),
        surface_rebar_frac: document.getElementById("param-surface-rebar-frac"),
        dampening_age: document.getElementById("param-dampening-age"),
        dampening_factor: document.getElementById("param-dampening-factor"),
        frost_rate: document.getElementById("param-frost-rate"),
        frost_accel: document.getElementById("param-frost-accel"),
        frost_rate_cov: document.getElementById("param-frost-rate-cov"),
        bearing_original: document.getElementById("param-bearing-original"),
        bearing_critical: document.getElementById("param-bearing-critical"),
        bearing_rate: document.getElementById("param-bearing-rate"),
        bearing_edge_factor: document.getElementById("param-bearing-edge-factor"),
        bearing_cov: document.getElementById("param-bearing-cov"),
        light_frost_red: document.getElementById("param-light-frost-red"),
        light_cost: document.getElementById("param-light-cost"),
        full_frost_red: document.getElementById("param-full-frost-red"),
        full_k_red: document.getElementById("param-full-k-red"),
        full_life: document.getElementById("param-full-life"),
        full_cost: document.getElementById("param-full-cost"),
    };

    // Initialize form values from defaults
    function initParams() {
        const p = DEFAULT_PARAMS;
        if (paramInputs.iterations) paramInputs.iterations.value = p.monte_carlo_iterations;
        if (paramInputs.bayesian_enabled) paramInputs.bayesian_enabled.checked = p.bayesian_conditioning?.enabled !== false;
        if (paramInputs.k_pilarit) paramInputs.k_pilarit.value = p.carbonation.k_pilarit;
        if (paramInputs.k_leukapalkit) paramInputs.k_leukapalkit.value = p.carbonation.k_leukapalkit;
        if (paramInputs.k_tt) paramInputs.k_tt.value = p.carbonation.k_tt_laatat;
        if (paramInputs.k_cov) paramInputs.k_cov.value = p.carbonation.k_cov;
        if (paramInputs.surface_rebar_frac) paramInputs.surface_rebar_frac.value = p.betonipeite.tt_ripa_pintaterakset_osuus;
        if (paramInputs.dampening_age) paramInputs.dampening_age.value = p.carbonation.dampening_age;
        if (paramInputs.dampening_factor) paramInputs.dampening_factor.value = p.carbonation.dampening_factor;
        if (paramInputs.frost_rate) paramInputs.frost_rate.value = p.frost.base_rate_mm_per_year;
        if (paramInputs.frost_accel) paramInputs.frost_accel.value = p.frost.acceleration_factor;
        if (paramInputs.frost_rate_cov) paramInputs.frost_rate_cov.value = p.frost.rate_cov;
        if (paramInputs.bearing_original) paramInputs.bearing_original.value = p.tukipinta.original_depth_mm;
        if (paramInputs.bearing_critical) paramInputs.bearing_critical.value = p.tukipinta.critical_min_mm;
        if (paramInputs.bearing_rate) paramInputs.bearing_rate.value = p.tukipinta.rapautuminen_reuna_mm_per_year;
        if (paramInputs.bearing_edge_factor) paramInputs.bearing_edge_factor.value = p.tukipinta.reunakerroin;
        if (paramInputs.bearing_cov) paramInputs.bearing_cov.value = p.tukipinta.rapautuminen_cov;
        if (paramInputs.light_frost_red) paramInputs.light_frost_red.value = p.light_repair.frost_rate_reduction * 100;
        if (paramInputs.light_cost) paramInputs.light_cost.value = (p.light_repair.cost_total_max_eur / 1000).toFixed(0);
        if (paramInputs.full_frost_red) paramInputs.full_frost_red.value = p.full_repair.frost_rate_reduction * 100;
        if (paramInputs.full_k_red) paramInputs.full_k_red.value = p.full_repair.carbonation_k_reduction * 100;
        if (paramInputs.full_life) paramInputs.full_life.value = p.full_repair.extended_life_years;
        if (paramInputs.full_cost) paramInputs.full_cost.value = p.full_repair.cost_eur_per_m2;
    }

    function readParams() {
        const p = JSON.parse(JSON.stringify(DEFAULT_PARAMS));
        const v = (el) => (el ? parseFloat(el.value) : null);

        if (v(paramInputs.iterations)) p.monte_carlo_iterations = Math.max(100, Math.min(50000, v(paramInputs.iterations)));
        if (paramInputs.bayesian_enabled) p.bayesian_conditioning.enabled = paramInputs.bayesian_enabled.checked;
        if (v(paramInputs.k_pilarit)) p.carbonation.k_pilarit = v(paramInputs.k_pilarit);
        if (v(paramInputs.k_leukapalkit)) p.carbonation.k_leukapalkit = v(paramInputs.k_leukapalkit);
        if (v(paramInputs.k_tt)) p.carbonation.k_tt_laatat = v(paramInputs.k_tt);
        if (v(paramInputs.k_cov) != null) p.carbonation.k_cov = v(paramInputs.k_cov);
        if (v(paramInputs.surface_rebar_frac) != null) p.betonipeite.tt_ripa_pintaterakset_osuus = v(paramInputs.surface_rebar_frac);
        if (v(paramInputs.dampening_age) != null) p.carbonation.dampening_age = v(paramInputs.dampening_age);
        if (v(paramInputs.dampening_factor) != null) p.carbonation.dampening_factor = v(paramInputs.dampening_factor);
        if (v(paramInputs.frost_rate)) p.frost.base_rate_mm_per_year = v(paramInputs.frost_rate);
        if (v(paramInputs.frost_accel)) p.frost.acceleration_factor = v(paramInputs.frost_accel);
        if (v(paramInputs.frost_rate_cov) != null) p.frost.rate_cov = v(paramInputs.frost_rate_cov);
        if (v(paramInputs.bearing_original)) p.tukipinta.original_depth_mm = v(paramInputs.bearing_original);
        if (v(paramInputs.bearing_critical)) p.tukipinta.critical_min_mm = v(paramInputs.bearing_critical);
        if (v(paramInputs.bearing_rate)) p.tukipinta.rapautuminen_reuna_mm_per_year = v(paramInputs.bearing_rate);
        if (v(paramInputs.bearing_edge_factor)) p.tukipinta.reunakerroin = v(paramInputs.bearing_edge_factor);
        if (v(paramInputs.bearing_cov) != null) p.tukipinta.rapautuminen_cov = v(paramInputs.bearing_cov);
        if (v(paramInputs.light_frost_red) != null) p.light_repair.frost_rate_reduction = v(paramInputs.light_frost_red) / 100;
        if (v(paramInputs.light_cost)) p.light_repair.cost_total_max_eur = v(paramInputs.light_cost) * 1000;
        if (v(paramInputs.full_frost_red) != null) p.full_repair.frost_rate_reduction = v(paramInputs.full_frost_red) / 100;
        if (v(paramInputs.full_k_red) != null) p.full_repair.carbonation_k_reduction = v(paramInputs.full_k_red) / 100;
        if (v(paramInputs.full_life)) p.full_repair.extended_life_years = v(paramInputs.full_life);
        if (v(paramInputs.full_cost)) p.full_repair.cost_eur_per_m2 = v(paramInputs.full_cost);

        return p;
    }

    // ---- Run simulation ----
    function runSimulation() {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) loadingOverlay.classList.add("active");

        // Use requestAnimationFrame + setTimeout to let the UI update
        requestAnimationFrame(() => {
            setTimeout(() => {
                try {
                    const params = readParams();
                    const engine = new SimulationEngine(params);
                    currentResults = engine.runSimulation();

                    renderAllCharts();
                    updateSummaryCards();
                    updateDataTable();
                    updateScenarioTab();

                    // Show results section
                    document.getElementById("results-section").classList.add("visible");

                    // Enable report buttons
                    const rptBtn = document.getElementById("btn-generate-report");
                    if (rptBtn) rptBtn.disabled = false;
                    const rptBtnIntro = document.getElementById("btn-generate-report-intro");
                    if (rptBtnIntro) rptBtnIntro.disabled = false;
                } catch (err) {
                    console.error("Simulation error:", err);
                    alert("Simulaatiovirhe: " + err.message);
                } finally {
                    if (loadingOverlay) loadingOverlay.classList.remove("active");
                }
            }, 50);
        });
    }

    // ---- Render all charts ----
    function renderAllCharts() {
        if (!currentResults) return;
        chartManager.renderCarbonationChart("chart-carbonation", currentResults);
        chartManager.renderFrostChart("chart-frost", currentResults);
        chartManager.renderBearingChart("chart-bearing", currentResults);
        chartManager.renderCollapseProbChart("chart-collapse-prob", currentResults);
        chartManager.renderCorrosionProbChart("chart-corrosion-prob", currentResults);
        chartManager.renderElementHistogram("chart-element-histogram", currentResults);
        chartManager.renderCollapseHistogram("chart-collapse-histogram", currentResults);
        chartManager.renderRadarChart("chart-radar", currentResults);
        // Risk tab (unique canvas IDs)
        chartManager.renderCollapseProbChart("chart-risk-collapse-prob2", currentResults);
        chartManager.renderRadarChart("chart-risk-radar2", currentResults);
    }

    // ---- Update summary cards ----
    function updateSummaryCards() {
        if (!currentResults) return;
        const s = currentResults.summary;
        const params = readParams();

        for (const scId of ["A", "B", "C", "D"]) {
            const sc = s[scId];
            if (!sc) continue;

            const el = (id) => document.getElementById(id);
            const totalN = params.monte_carlo_iterations;

            // Collapse year
            const collapseEl = el(`sc${scId}-collapse-year`);
            if (collapseEl) {
                const year = sc.collapse_risk_year.median;
                const n = sc.collapse_risk_year.n || 0;
                // If fewer than 50% of iterations collapsed, median is not meaningful
                if (isNaN(year) || n < totalN * 0.5) {
                    collapseEl.textContent = n > 0 ? `> ${params.end_year || 2126}` : "Ei riskiä";
                    collapseEl.classList.remove("danger");
                    collapseEl.classList.add("success");
                } else {
                    collapseEl.textContent = Math.round(year);
                    collapseEl.classList.remove("success");
                }
            }

            // Corrosion year (show median only when ≥10% of iterations triggered)
            const corrosionEl = el(`sc${scId}-corrosion-year`);
            if (corrosionEl) {
                const year = sc.corrosion_initiation_year.median;
                const nCorr = sc.corrosion_initiation_year.n || 0;
                if (isNaN(year) || nCorr < totalN * 0.1) {
                    corrosionEl.textContent = nCorr > 0 ? `> ${params.end_year || 2126}` : "Ei riskiä";
                } else {
                    corrosionEl.textContent = Math.round(year);
                }
            }

            // Frost critical year (show median only when ≥10% of iterations triggered)
            const frostEl = el(`sc${scId}-frost-year`);
            if (frostEl) {
                const year = sc.critical_frost_year.median;
                const nFrost = sc.critical_frost_year.n || 0;
                if (isNaN(year) || nFrost < totalN * 0.1) {
                    frostEl.textContent = nFrost > 0 ? `> ${params.end_year || 2126}` : "Ei riskiä";
                } else {
                    frostEl.textContent = Math.round(year);
                }
            }

            // Risk probabilities at checkpoints
            const risk2035 = el(`sc${scId}-risk-2035`);
            if (risk2035) risk2035.textContent = ((sc.collapse_prob_2035 || 0) * 100).toFixed(1) + "%";

            const risk2050 = el(`sc${scId}-risk-2050`);
            if (risk2050) risk2050.textContent = ((sc.collapse_prob_2050 || 0) * 100).toFixed(1) + "%";

            const risk2075 = el(`sc${scId}-risk-2075`);
            if (risk2075) risk2075.textContent = ((sc.collapse_prob_2075 || 0) * 100).toFixed(1) + "%";

            const risk2100 = el(`sc${scId}-risk-2100`);
            if (risk2100) risk2100.textContent = ((sc.collapse_prob_2100 || 0) * 100).toFixed(1) + "%";

            // Confidence interval
            const confEl = el(`sc${scId}-conf-interval`);
            const nCollapse = sc.collapse_risk_year.n || 0;
            if (confEl) {
                if (nCollapse < totalN * 0.1) {
                    confEl.textContent = `${((nCollapse / totalN) * 100).toFixed(1)}% iteraatioista`;
                } else if (!isNaN(sc.collapse_risk_year.p5)) {
                    confEl.textContent = `${Math.round(sc.collapse_risk_year.p5)} – ${Math.round(sc.collapse_risk_year.p95)}`;
                } else {
                    confEl.textContent = "N/A";
                }
            }
        }

        // Inspection data cards
        updateInspectionCards();
    }

    function updateInspectionCards() {
        const data = INPUT_DATA;

        // 2006 data
        setVal("data-2006-strength", data.kohde_tiedot.betonin_suunnittelulujuus + " (≈ " + data.kohde_tiedot.betonin_suunnittelulujuus_mpa + " MPa)");
        setVal("data-2006-carb-pilarit", data.mittaustiedot_2006.karbonatisaatio_ka_mm.pilarit + " mm");
        setVal("data-2006-carb-leukapalkit", data.mittaustiedot_2006.karbonatisaatio_ka_mm.leukapalkit + " mm");
        setVal("data-2006-carb-tt", data.mittaustiedot_2006.karbonatisaatio_ka_mm.tt_laatat + " mm");
        setVal("data-2006-cover-pilarit", data.mittaustiedot_2006.betonipeite_ka_mm.pilarit + " mm");
        setVal("data-2006-cover-leukapalkit", data.mittaustiedot_2006.betonipeite_ka_mm.leukapalkit + " mm");
        setVal("data-2006-cover-tt", data.mittaustiedot_2006.betonipeite_ka_mm.tt_ripa_alapinta + " mm");
        setVal("data-2006-tukipinta", data.mittaustiedot_2006.tukipinta.tt_tukipinta_leukapalkilla_mm + " mm (leuka " + data.mittaustiedot_2006.tukipinta.leukapalkin_leuka_mm + " mm)");
        setVal("data-2006-frost", data.mittaustiedot_2006.pakkasrapautuminen);
        setVal("data-2006-pintaterakset", data.mittaustiedot_2006.pintaterakset);

        // 2024 data — kenttä / ohuthie karbonatisaatio rinnakkain
        const m24 = data.mittaustiedot_2024;
        const oh = m24.karbonatisaatio_ohuthie_ka_mm;
        setVal("data-2024-carb-pilarit", m24.karbonatisaatio_ka_mm.pilarit + " / " + oh.pilarit + " mm");
        setVal("data-2024-carb-laippa", m24.karbonatisaatio_ka_mm.tt_laatta_laippa + " / " + oh.tt_laatta_laippa + " mm");
        setVal("data-2024-carb-ripa", m24.karbonatisaatio_ka_mm.tt_laatta_ripa + " / " + oh.tt_laatta_ripa + " mm");
        setVal("data-2024-cover-pilarit", m24.betonipeite_ka_mm.pilarit + " mm");
        setVal("data-2024-cover-laippa", m24.betonipeite_ka_mm.tt_laatta_laippa + " mm");
        setVal("data-2024-cover-ripa", m24.betonipeite_ka_mm.tt_laatta_ripa + " mm");

        // Corrosion percentages
        const corr = m24.korroosioaste_prosenttia;
        setVal("data-2024-corrosion",
            "Pilarit " + corr.pilarit + " %, laippa " + corr.tt_laatta_laippa + " %, ripa " + corr.tt_laatta_ripa + " %");

        setVal("data-2024-tensile", m24.vetolujuus_mpa.join(", ") + " MPa");

        // Thin section observations (now object, not string)
        const thin = m24.ohuthie_havainnot;
        setVal("data-2024-thin-laippa", thin.tt_laatta_laippa);
        setVal("data-2024-thin-ripa", thin.tt_laatta_ripa);
        setVal("data-2024-thin-pilarit", thin.pilarit);
        setVal("data-2024-pintaterakset", m24.pintaterakset);

        // Corrosion inspection info-boxes (Analyysit + Rakenneosakohtainen tabs)
        updateCorrosionInfoBoxes(data);
    }

    function updateCorrosionInfoBoxes(data) {
        const m24 = data.mittaustiedot_2024;
        const corr = m24.korroosioaste_prosenttia;
        const oh = m24.karbonatisaatio_ohuthie_ka_mm;
        const cov = m24.betonipeite_ka_mm;

        const corrText = `pilarit ${corr.pilarit} %, TT-laippa ${corr.tt_laatta_laippa} %, TT-ripa ${corr.tt_laatta_ripa} %`;
        const carbText = `pilarit ${oh.pilarit} mm, TT-laippa ${oh.tt_laatta_laippa} mm, TT-ripa ${oh.tt_laatta_ripa} mm`;
        const coverText = `pilarit ${cov.pilarit} mm, TT-laippa ${cov.tt_laatta_laippa} mm, TT-ripa ${cov.tt_laatta_ripa} mm`;
        const clText = `< 0,01 % (alle m\u00e4\u00e4ritysrajan)`;

        // Analyysit tab box
        setVal("corr-box-corrosion-rate", corrText);
        setVal("corr-box-carbonation", carbText);
        setVal("corr-box-cover", coverText);
        setVal("corr-box-chlorides", clText);

        // Rakenneosakohtainen tab box
        setVal("elem-box-corrosion-rate", corrText);
        setVal("elem-box-carbonation", carbText);
        setVal("elem-box-cover", coverText);
        setVal("elem-box-chlorides", clText);
    }

    // ---- Update data table ----
    function updateDataTable() {
        if (!currentResults) return;
        const tbody = document.getElementById("results-table-body");
        if (!tbody) return;

        tbody.innerHTML = "";

        const checkpoints = [2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060, 2065, 2070, 2075, 2080, 2090, 2100, 2110, 2126];

        for (const year of checkpoints) {
            const yi = currentResults.years.indexOf(year);
            if (yi < 0) continue;

            const row = document.createElement("tr");

            // Year
            const tdYear = document.createElement("td");
            tdYear.textContent = year;
            tdYear.style.fontWeight = "600";
            row.appendChild(tdYear);

            for (const scId of ["A", "B", "C", "D"]) {
                const stats = currentResults.scenarios[scId].stats[yi];

                // Frost damage
                const tdFrost = document.createElement("td");
                tdFrost.textContent = stats.frost.median.toFixed(1);
                if (stats.frost.median > 30) tdFrost.classList.add("danger-cell");
                else if (stats.frost.median > 15) tdFrost.classList.add("warning-cell");
                row.appendChild(tdFrost);

                // Bearing length
                const tdBear = document.createElement("td");
                tdBear.textContent = stats.bearing.median.toFixed(0);
                if (stats.bearing.median < DEFAULT_PARAMS.tukipinta.critical_min_mm) tdBear.classList.add("danger-cell");
                else if (stats.bearing.median < DEFAULT_PARAMS.tukipinta.critical_min_mm * 1.3) tdBear.classList.add("warning-cell");
                row.appendChild(tdBear);

                // Collapse probability
                const tdCollapse = document.createElement("td");
                const prob = (stats.collapse_probability * 100).toFixed(1);
                tdCollapse.textContent = prob + "%";
                if (stats.collapse_probability > 0.10) tdCollapse.classList.add("danger-cell");
                else if (stats.collapse_probability > 0.02) tdCollapse.classList.add("warning-cell");
                row.appendChild(tdCollapse);
            }

            tbody.appendChild(row);
        }
    }

    // ---- Update scenario detail tab ----
    function updateScenarioTab() {
        const p = readParams();
        const area = INPUT_DATA.kohde_tiedot.pinta_ala_m2;

        // Scenario A params (model assumptions)
        setVal("sc-a-frost-rate", p.frost.base_rate_mm_per_year);
        setVal("sc-a-frost-accel", p.frost.acceleration_factor.toFixed(2));
        setVal("sc-a-k-tt", p.carbonation.k_tt_laatat);
        setVal("sc-a-k-cov", p.carbonation.k_cov);
        setVal("sc-a-bearing-rate", p.tukipinta.rapautuminen_reuna_mm_per_year);
        setVal("sc-a-edge-factor", (p.tukipinta.reunakerroin || 1.5).toFixed(1));
        setVal("sc-a-bearing-orig", p.tukipinta.original_depth_mm);
        setVal("sc-a-bearing-crit", p.tukipinta.critical_min_mm);
        setVal("sc-a-cover-tt", p.betonipeite.tt_ripa_alapinta.mean);
        setVal("sc-a-cover-tt-std", p.betonipeite.tt_ripa_alapinta.std);
        setVal("sc-a-surface-rebar", ((p.betonipeite.tt_ripa_pintaterakset_osuus || 0) * 100).toFixed(0));

        // Scenario B params
        setVal("sc-b-frost-red", (p.light_repair.frost_rate_reduction * 100).toFixed(0));
        setVal("sc-b-cost", (p.light_repair.cost_total_min_eur / 1000).toFixed(0) + "\u2013" + (p.light_repair.cost_total_max_eur / 1000).toFixed(0));
        setVal("sc-b-total-cost", "");

        // Scenario C params
        setVal("sc-c-frost-red", (p.full_repair.frost_rate_reduction * 100).toFixed(0));
        setVal("sc-c-k-red", (p.full_repair.carbonation_k_reduction * 100).toFixed(0));
        setVal("sc-c-life-ext", p.full_repair.extended_life_years);
        setVal("sc-c-cost", p.full_repair.cost_eur_per_m2);
        setVal("sc-c-total-cost", (p.full_repair.cost_eur_per_m2 * area).toLocaleString("fi-FI"));

        // Scenario D params (same tech as C, ~10% less cost)
        const dAreaFactor = (area - 156) / area;
        setVal("sc-d-frost-red", (p.full_repair.frost_rate_reduction * 100).toFixed(0));
        setVal("sc-d-k-red", (p.full_repair.carbonation_k_reduction * 100).toFixed(0));
        setVal("sc-d-life-ext", p.full_repair.extended_life_years);
        setVal("sc-d-total-cost", Math.round(p.full_repair.cost_eur_per_m2 * area * dAreaFactor).toLocaleString("fi-FI"));

        // Comparison table static params
        setVal("sc-comp-b-frost", (p.light_repair.frost_rate_reduction * 100).toFixed(0) + " %");
        setVal("sc-comp-c-frost", (p.full_repair.frost_rate_reduction * 100).toFixed(0) + " %");
        setVal("sc-comp-d-frost", (p.full_repair.frost_rate_reduction * 100).toFixed(0) + " %");
        setVal("sc-comp-c-carb", "k \u2212" + (p.full_repair.carbonation_k_reduction * 100).toFixed(0) + " %");
        setVal("sc-comp-d-carb", "k \u2212" + (p.full_repair.carbonation_k_reduction * 100).toFixed(0) + " %");
        setVal("sc-comp-c-life", "+" + p.full_repair.extended_life_years + " v");
        setVal("sc-comp-d-life", "+" + p.full_repair.extended_life_years + " v");
        setVal("sc-comp-b-cost", p.light_repair.cost_eur_per_m2 + " \u20ac/m\u00b2");
        setVal("sc-comp-c-cost", p.full_repair.cost_eur_per_m2 + " \u20ac/m\u00b2");
        setVal("sc-comp-d-cost", Math.round(p.full_repair.cost_eur_per_m2 * dAreaFactor) + " \u20ac/m\u00b2");
        setVal("sc-comp-b-total", (p.light_repair.cost_eur_per_m2 * area).toLocaleString("fi-FI") + " \u20ac");
        setVal("sc-comp-c-total", (p.full_repair.cost_eur_per_m2 * area).toLocaleString("fi-FI") + " \u20ac");
        setVal("sc-comp-d-total", Math.round(p.full_repair.cost_eur_per_m2 * area * dAreaFactor).toLocaleString("fi-FI") + " \u20ac");

        // CO2 section (deterministic, not dependent on simulation)
        updateCO2Section();

        // Comparison table dynamic risk values (from simulation results)
        if (currentResults && currentResults.summary) {
            const s = currentResults.summary;
            for (const [scId, prefix] of [["A", "a"], ["B", "b"], ["C", "c"], ["D", "d"]]) {
                const sc = s[scId];
                if (!sc) continue;
                setVal(`sc-comp-${prefix}-risk2035`, ((sc.collapse_prob_2035 || 0) * 100).toFixed(1) + " %");
                setVal(`sc-comp-${prefix}-risk2050`, ((sc.collapse_prob_2050 || 0) * 100).toFixed(1) + " %");
                setVal(`sc-comp-${prefix}-risk2075`, ((sc.collapse_prob_2075 || 0) * 100).toFixed(1) + " %");
                setVal(`sc-comp-${prefix}-risk2100`, ((sc.collapse_prob_2100 || 0) * 100).toFixed(1) + " %");
            }

            // Waiting statement: how long can the housing association safely wait?
            const waitingEl = document.getElementById("waiting-statement-text");
            const waitingBox = document.getElementById("waiting-statement");
            if (waitingEl) {
                const years = currentResults.years;
                const statsA = currentResults.scenarios.A.stats;

                // Find year when collapse probability exceeds 5%
                let collapseYear5 = null;
                for (let i = 0; i < years.length; i++) {
                    if (statsA[i].collapse_probability >= 0.05) {
                        collapseYear5 = years[i];
                        break;
                    }
                }

                // Find year when corrosion probability exceeds 10%
                let corrYear10 = null;
                for (let i = 0; i < years.length; i++) {
                    if (statsA[i].corrosion_probability >= 0.10) {
                        corrYear10 = years[i];
                        break;
                    }
                }

                const safeUntil = collapseYear5 || years[years.length - 1];
                const safeYears = safeUntil - 2026;
                const corrRisk2050 = ((s.A.corrosion_prob_2050 || 0) * 100).toFixed(1);
                const collapseRisk2075 = ((s.A.collapse_prob_2075 || 0) * 100).toFixed(1);
                const collapseRisk2100 = ((s.A.collapse_prob_2100 || 0) * 100).toFixed(1);

                const isSafe = !collapseYear5 || safeYears >= 30;

                if (waitingBox) {
                    waitingBox.style.borderLeftColor = isSafe ? "var(--accent-emerald)" : "var(--danger)";
                    waitingBox.style.background = isSafe
                        ? "rgba(5, 150, 105, 0.08)"
                        : "rgba(220, 38, 38, 0.06)";
                }

                if (isSafe) {
                    waitingEl.innerHTML =
                        `<strong style="font-size: 1.1em; color: var(--accent-emerald);">` +
                        `Rakenne kest\u00e4\u00e4 turvallisesti v\u00e4hint\u00e4\u00e4n ${safeYears} vuotta ilman toimenpiteit\u00e4</strong><br>` +
                        `<span style="color: var(--text-secondary);">` +
                        `EC2-raja (${DEFAULT_PARAMS.tukipinta.critical_min_mm}\u00a0mm, uudet rakenteet) pysyy yli 95\u00a0% todenn\u00e4k\u00f6isyydell\u00e4 vuoteen ${safeUntil} asti. ` +
                        `Korroosion depasivointitodenn\u00e4k\u00f6isyys on ${corrRisk2050}\u00a0% vuonna 2050` +
                        (corrYear10 ? ` ja ylitt\u00e4\u00e4 10\u00a0% vuonna ${corrYear10}` : "") + `. ` +
                        `EC2-rajan alitustodenn\u00e4k\u00f6isyys on ${collapseRisk2075}\u00a0% vuonna 2075 ja ${collapseRisk2100}\u00a0% vuonna 2100. ` +
                        `Rakenteen kunto heikkenee hitaasti \u2014 korjaustoimenpiteill\u00e4 ei ole kiire.</span>`;
                } else {
                    waitingEl.innerHTML =
                        `<strong style="color: var(--danger);">` +
                        `Rakenne kest\u00e4\u00e4 ilman toimenpiteit\u00e4 enint\u00e4\u00e4n noin ${safeYears} vuotta (vuoteen ${safeUntil})</strong><br>` +
                        `<span style="color: var(--text-secondary);">` +
                        `EC2-rajan (${DEFAULT_PARAMS.tukipinta.critical_min_mm}\u00a0mm) alitustodenn\u00e4k\u00f6isyys ylitt\u00e4\u00e4 5\u00a0% vuonna ${safeUntil}. ` +
                        `Alitustodenn\u00e4k\u00f6isyys on ${collapseRisk2075}\u00a0% vuonna 2075 ja ${collapseRisk2100}\u00a0% vuonna 2100. ` +
                        `Korjaustoimenpiteisiin ryhtyminen on perusteltua.</span>`;
                }
            }
        }
    }

    // ---- Update CO2 section ----
    function updateCO2Section() {
        const co2 = calculateCO2Emissions(INPUT_DATA);

        // Summary cards
        function formatT(val) {
            if (val < 0) return `${val.toFixed(1)} t`;
            if (val === 0) return "0 t";
            return `~${val.toFixed(0)} t`;
        }

        setVal("co2-a-netto", formatT(co2.A.netto_t));
        setVal("co2-a-rak", "0 t");
        setVal("co2-a-puusto", `\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t`);

        setVal("co2-b-netto", formatT(co2.B.netto_t));
        setVal("co2-b-rak", `~${(co2.B.rakentaminen_kg / 1000).toFixed(0)} t`);
        setVal("co2-b-puusto", `\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t`);

        setVal("co2-c-netto", formatT(co2.C.netto_t));
        setVal("co2-c-rak", `~${(co2.C.rakentaminen_kg / 1000).toFixed(0)} t`);
        setVal("co2-c-puusto", `+${(co2.C.puusto_kg / 1000).toFixed(1)} t`);

        setVal("co2-d-netto", formatT(co2.D.netto_t));
        setVal("co2-d-rak", `~${(co2.D.rakentaminen_kg / 1000).toFixed(0)} t`);
        setVal("co2-d-puusto", `\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t`);

        // Comparison table
        const tbody = document.getElementById("co2-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        const rows = [
            {
                label: "Nettop\u00e4\u00e4st\u00f6t (30 v)",
                a: formatT(co2.A.netto_t),
                b: formatT(co2.B.netto_t),
                c: formatT(co2.C.netto_t),
                d: formatT(co2.D.netto_t),
            },
            {
                label: "Helsinki\u2013Pariisi-lennot",
                a: "\u2014",
                b: `\u2248 ${co2.B.vertaukset.lennot_hki_pariisi} lentoa`,
                c: `\u2248 ${co2.C.vertaukset.lennot_hki_pariisi} lentoa`,
                d: `\u2248 ${co2.D.vertaukset.lennot_hki_pariisi} lentoa`,
            },
            {
                label: "Henkil\u00f6auton ajokilometrit",
                a: "\u2014",
                b: `\u2248 ${(co2.B.vertaukset.autoilu_km / 1000).toFixed(0)} 000 km`,
                c: `\u2248 ${(co2.C.vertaukset.autoilu_km / 1000).toFixed(0)} 000 km`,
                d: `\u2248 ${(co2.D.vertaukset.autoilu_km / 1000).toFixed(0)} 000 km`,
            },
            {
                label: "Keskivertosuomalaisen autoiluvuodet",
                a: "\u2014",
                b: `\u2248 ${co2.B.vertaukset.autoilu_vuodet} v`,
                c: `\u2248 ${co2.C.vertaukset.autoilu_vuodet} v`,
                d: `\u2248 ${co2.D.vertaukset.autoilu_vuodet} v`,
            },
        ];

        for (const r of rows) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td><strong>${r.label}</strong></td><td>${r.a}</td><td>${r.b}</td><td>${r.c}</td><td>${r.d}</td>`;
            tbody.appendChild(tr);
        }
    }

    // ---- Tab navigation ----
    function initTabs() {
        const tabBtns = document.querySelectorAll(".tab-btn");
        const tabPanels = document.querySelectorAll(".tab-panel");

        tabBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = btn.dataset.tab;

                tabBtns.forEach((b) => b.classList.remove("active"));
                tabPanels.forEach((p) => p.classList.remove("active"));

                btn.classList.add("active");
                const panel = document.getElementById(`tab-${target}`);
                if (panel) panel.classList.add("active");

                // Re-render charts when switching tabs (fixes sizing issues)
                setTimeout(() => renderAllCharts(), 100);
            });
        });
    }

    // ---- Sidebar toggle ----
    function initSidebar() {
        const toggle = document.getElementById("sidebar-toggle");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-overlay");

        function isMobile() {
            return window.matchMedia("(max-width: 900px)").matches;
        }

        function closeSidebar() {
            sidebar.classList.add("collapsed");
            if (overlay) overlay.classList.remove("active");
        }

        function openSidebar() {
            sidebar.classList.remove("collapsed");
            if (isMobile() && overlay) overlay.classList.add("active");
        }

        // Start collapsed on mobile
        if (isMobile() && sidebar) {
            sidebar.classList.add("collapsed");
        }

        if (toggle && sidebar) {
            toggle.addEventListener("click", () => {
                if (sidebar.classList.contains("collapsed")) {
                    openSidebar();
                } else {
                    closeSidebar();
                }
            });
        }

        // Close sidebar when clicking the overlay
        if (overlay) {
            overlay.addEventListener("click", closeSidebar);
        }

        // Auto-collapse sidebar when resizing to mobile
        window.addEventListener("resize", () => {
            if (isMobile()) {
                closeSidebar();
            } else {
                if (overlay) overlay.classList.remove("active");
            }
        });
    }

    // ---- Parameter accordion ----
    function initAccordions() {
        document.querySelectorAll(".accordion-header").forEach((header) => {
            header.addEventListener("click", () => {
                const content = header.nextElementSibling;
                const isOpen = header.classList.contains("open");
                header.classList.toggle("open");
                if (content) {
                    content.style.maxHeight = isOpen ? "0" : content.scrollHeight + "px";
                }
            });
        });
    }

    // ---- Report generation ----
    function generateReport() {
        if (!currentResults) {
            alert("Aja ensin simulaatio ennen raportin luomista.");
            return;
        }

        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
            loadingOverlay.querySelector(".loading-text").textContent = "Raporttia luodaan...";
            loadingOverlay.classList.add("active");
        }

        // Temporarily show all tab panels so charts render at correct size
        const tabPanels = document.querySelectorAll(".tab-panel");
        const originalStates = [];
        tabPanels.forEach((panel) => {
            originalStates.push(panel.classList.contains("active"));
            panel.style.display = "block";
            panel.style.position = "absolute";
            panel.style.visibility = "hidden";
            panel.classList.add("active");
        });

        // Re-render all charts at visible size, then capture
        requestAnimationFrame(() => {
            renderAllCharts();

            setTimeout(() => {
                // Capture all chart canvases as PNG data URLs
                const chartImages = {};
                document.querySelectorAll('canvas[id^="chart-"]').forEach((canvas) => {
                    try {
                        chartImages[canvas.id] = canvas.toDataURL("image/png");
                    } catch (e) {
                        console.warn("Could not capture chart:", canvas.id, e);
                    }
                });

                // Restore original tab panel states
                tabPanels.forEach((panel, i) => {
                    panel.style.display = "";
                    panel.style.position = "";
                    panel.style.visibility = "";
                    if (!originalStates[i]) {
                        panel.classList.remove("active");
                    }
                });

                // Re-render charts at correct panel sizes
                setTimeout(() => renderAllCharts(), 50);

                // Generate report
                try {
                    const params = readParams();
                    ReportGenerator.generate(
                        currentResults,
                        params,
                        chartImages,
                        INPUT_DATA,
                        STRUCTURAL_ELEMENTS
                    );
                } catch (err) {
                    console.error("Report generation error:", err);
                    alert("Raportin luominen epäonnistui: " + err.message);
                } finally {
                    if (loadingOverlay) {
                        loadingOverlay.querySelector(".loading-text").textContent = "Monte Carlo -simulaatiota ajetaan...";
                        loadingOverlay.classList.remove("active");
                    }
                }
            }, 400);
        });
    }

    // ---- Event listeners ----
    const runBtn = document.getElementById("btn-run-simulation");
    if (runBtn) {
        runBtn.addEventListener("click", runSimulation);
    }

    const reportBtn = document.getElementById("btn-generate-report");
    if (reportBtn) {
        reportBtn.addEventListener("click", generateReport);
    }

    const reportBtnIntro = document.getElementById("btn-generate-report-intro");
    if (reportBtnIntro) {
        reportBtnIntro.addEventListener("click", generateReport);
    }

    const resetBtn = document.getElementById("btn-reset-params");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            initParams();
        });
    }

    // ---- Initialize ----
    initParams();
    initTabs();
    initSidebar();
    initAccordions();
    updateScenarioTab();

    // Auto-run initial simulation
    setTimeout(() => runSimulation(), 300);
});
