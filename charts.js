// ============================================================
// Pihakansi Life-Cycle Analysis – Chart Rendering
// Uses Chart.js for all visualizations
// ============================================================

class ChartManager {
    constructor() {
        this.charts = {};
        this.colorScheme = {
            A: { main: "#f43f5e", light: "rgba(244, 63, 94, 0.15)", fill: "rgba(244, 63, 94, 0.08)" },
            B: { main: "#f59e0b", light: "rgba(245, 158, 11, 0.15)", fill: "rgba(245, 158, 11, 0.08)" },
            C: { main: "#10b981", light: "rgba(16, 185, 129, 0.15)", fill: "rgba(16, 185, 129, 0.08)" },
            D: { main: "#6366f1", light: "rgba(99, 102, 241, 0.15)", fill: "rgba(99, 102, 241, 0.08)" },
        };
        this.elementColors = {
            pilarit: "#6366f1",
            leukapalkit: "#8b5cf6",
            tt_laatta_laippa: "#ec4899",
            tt_ripa_alapinta: "#f43f5e",
        };
    }

    destroyAll() {
        Object.values(this.charts).forEach((c) => {
            if (c && typeof c.destroy === "function") c.destroy();
        });
        this.charts = {};
    }

    // ---- Global Chart.js defaults ----
    static setDefaults() {
        Chart.defaults.color = "#334155";
        Chart.defaults.borderColor = "rgba(148, 163, 184, 0.3)";
        Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 16;
        Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.9)";
        Chart.defaults.plugins.tooltip.titleFont = { weight: "bold", size: 13 };
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.animation.duration = 800;
        Chart.defaults.animation.easing = "easeOutQuart";
    }

    // ===========================================================
    // 1. Carbonation depth over time (all scenarios)
    // ===========================================================
    renderCarbonationChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const years = results.years;
        const datasets = [];

        for (const [scId, color] of Object.entries(this.colorScheme)) {
            const scData = results.scenarios[scId].stats;
            datasets.push({
                label: `Skenaario ${scId} (mediaani)`,
                data: scData.map((s) => s.carbonation.median),
                borderColor: color.main,
                backgroundColor: color.fill,
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
            datasets.push({
                label: `Skenaario ${scId} (P5-P95)`,
                data: scData.map((s) => s.carbonation.p95),
                borderColor: "transparent",
                backgroundColor: color.light,
                borderWidth: 0,
                pointRadius: 0,
                fill: "+1",
                tension: 0.3,
            });
            datasets.push({
                label: `_hide_${scId}_lower`,
                data: scData.map((s) => s.carbonation.p5),
                borderColor: "transparent",
                backgroundColor: "transparent",
                borderWidth: 0,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
        }

        // Add concrete cover reference line (TT-ripa mean)
        datasets.push({
            label: "Betonipeite (TT-ripa ka.)",
            data: years.map(() => DEFAULT_PARAMS.betonipeite.tt_ripa_alapinta.mean),
            borderColor: "rgba(251, 191, 36, 0.7)",
            borderWidth: 2,
            borderDash: [8, 4],
            pointRadius: 0,
            fill: false,
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: { labels: years, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        labels: {
                            filter: (item) => !item.text.startsWith("_hide_"),
                        },
                    },
                    title: { display: true, text: "Karbonatisaation eteneminen (TT-ripa)", font: { size: 15, weight: 600 } },
                    annotation: {
                        annotations: {
                            currentYear: {
                                type: "line",
                                xMin: 2026,
                                xMax: 2026,
                                borderColor: "rgba(148, 163, 184, 0.5)",
                                borderWidth: 1,
                                borderDash: [4, 4],
                                label: { display: true, content: "2026", position: "start", font: { size: 10 } },
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: "Vuosi" },
                        ticks: { maxTicksLimit: 20 },
                    },
                    y: {
                        title: { display: true, text: "Karbonatisaatiosyvyys (mm)" },
                        min: 0,
                    },
                },
            },
        });
    }

    // ===========================================================
    // 2. Frost damage over time
    // ===========================================================
    renderFrostChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const years = results.years;
        const datasets = [];

        for (const [scId, color] of Object.entries(this.colorScheme)) {
            const scData = results.scenarios[scId].stats;
            datasets.push({
                label: `Skenaario ${scId} (mediaani)`,
                data: scData.map((s) => s.frost.median),
                borderColor: color.main,
                backgroundColor: color.fill,
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
            // Confidence band
            datasets.push({
                label: `Skenaario ${scId} (P5-P95)`,
                data: scData.map((s) => s.frost.p95),
                borderColor: "transparent",
                backgroundColor: color.light,
                borderWidth: 0,
                pointRadius: 0,
                fill: "+1",
                tension: 0.3,
            });
            datasets.push({
                label: `_hide_${scId}_lower`,
                data: scData.map((s) => s.frost.p5),
                borderColor: "transparent",
                backgroundColor: "transparent",
                borderWidth: 0,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
        }

        // Critical frost damage line
        datasets.push({
            label: "Kriittinen vauriosyvyys (30 mm)",
            data: years.map(() => 30),
            borderColor: "rgba(239, 68, 68, 0.7)",
            borderWidth: 2,
            borderDash: [8, 4],
            pointRadius: 0,
            fill: false,
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: { labels: years, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { labels: { filter: (item) => !item.text.startsWith("_hide_") } },
                    title: { display: true, text: "Pakkasrapautumisen kertymä", font: { size: 15, weight: 600 } },
                },
                scales: {
                    x: { title: { display: true, text: "Vuosi" }, ticks: { maxTicksLimit: 20 } },
                    y: { title: { display: true, text: "Rapautumissyvyys (mm)" }, min: 0 },
                },
            },
        });
    }

    // ===========================================================
    // 3. TT-slab bearing length
    // ===========================================================
    renderBearingChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const years = results.years;
        const datasets = [];

        for (const [scId, color] of Object.entries(this.colorScheme)) {
            const scData = results.scenarios[scId].stats;
            datasets.push({
                label: `Skenaario ${scId} (mediaani)`,
                data: scData.map((s) => s.bearing.median),
                borderColor: color.main,
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
            datasets.push({
                label: `Skenaario ${scId} (P25-P75)`,
                data: scData.map((s) => s.bearing.p75),
                borderColor: "transparent",
                backgroundColor: color.light,
                borderWidth: 0,
                pointRadius: 0,
                fill: "+1",
                tension: 0.3,
            });
            datasets.push({
                label: `_hide_${scId}_lower`,
                data: scData.map((s) => s.bearing.p25),
                borderColor: "transparent",
                backgroundColor: "transparent",
                borderWidth: 0,
                pointRadius: 0,
                fill: false,
                tension: 0.3,
            });
        }

        // Critical minimum line
        datasets.push({
            label: `Kriittinen minimi (${DEFAULT_PARAMS.tukipinta.critical_min_mm} mm)`,
            data: years.map(() => DEFAULT_PARAMS.tukipinta.critical_min_mm),
            borderColor: "rgba(239, 68, 68, 0.8)",
            borderWidth: 2,
            borderDash: [8, 4],
            pointRadius: 0,
            fill: false,
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: { labels: years, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { labels: { filter: (item) => !item.text.startsWith("_hide_") } },
                    title: { display: true, text: "TT-laatan tukipinnan tehollinen pituus", font: { size: 15, weight: 600 } },
                },
                scales: {
                    x: { title: { display: true, text: "Vuosi" }, ticks: { maxTicksLimit: 20 } },
                    y: { title: { display: true, text: "Tehollinen tukipinta (mm)" }, min: 0, max: 160 },
                },
            },
        });
    }

    // ===========================================================
    // 4. Collapse probability over time
    // ===========================================================
    renderCollapseProbChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const years = results.years;
        const datasets = [];

        for (const [scId, color] of Object.entries(this.colorScheme)) {
            const scData = results.scenarios[scId].stats;
            datasets.push({
                label: `Skenaario ${scId}`,
                data: scData.map((s) => (s.collapse_probability * 100).toFixed(1)),
                borderColor: color.main,
                backgroundColor: color.fill,
                borderWidth: 2.5,
                pointRadius: 0,
                fill: true,
                tension: 0.3,
            });
        }

        // 5% risk threshold
        datasets.push({
            label: "Hyväksyttävä riskitaso (5%)",
            data: years.map(() => 5),
            borderColor: "rgba(251, 191, 36, 0.7)",
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 0,
            fill: false,
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: { labels: years, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    title: { display: true, text: "EC2-vähimmäistukipinnan alituksen todennäköisyys", font: { size: 15, weight: 600 } },
                },
                scales: {
                    x: { title: { display: true, text: "Vuosi" }, ticks: { maxTicksLimit: 20 } },
                    y: { title: { display: true, text: "Todennäköisyys (%)" }, min: 0, max: 100 },
                },
            },
        });
    }

    // ===========================================================
    // 5. Corrosion probability over time
    // ===========================================================
    renderCorrosionProbChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const years = results.years;
        const datasets = [];

        for (const [scId, color] of Object.entries(this.colorScheme)) {
            const scData = results.scenarios[scId].stats;
            datasets.push({
                label: `Skenaario ${scId}`,
                data: scData.map((s) => (s.corrosion_probability * 100).toFixed(1)),
                borderColor: color.main,
                backgroundColor: color.fill,
                borderWidth: 2.5,
                pointRadius: 0,
                fill: true,
                tension: 0.3,
            });
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: { labels: years, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    title: { display: true, text: "Korroosion todennäköisyys (TT-ripa)", font: { size: 15, weight: 600 } },
                },
                scales: {
                    x: { title: { display: true, text: "Vuosi" }, ticks: { maxTicksLimit: 20 } },
                    y: { title: { display: true, text: "Todennäköisyys (%)" }, min: 0, max: 100 },
                },
            },
        });
    }

    // ===========================================================
    // 6. Element-wise corrosion year histogram
    // ===========================================================
    renderElementHistogram(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const datasets = [];
        const elementNames = {
            pilarit: "Pilarit",
            leukapalkit: "Leukapalkit",
            tt_laatta_laippa: "TT-laippa",
            tt_ripa_alapinta: "TT-ripa",
        };

        let labels = null;
        for (const [elemId, elemData] of Object.entries(results.element_analysis)) {
            const hist = elemData.histogram;
            if (!labels) labels = hist.bins.map((b) => Math.round(b));
            datasets.push({
                label: elementNames[elemId] || elemId,
                data: hist.probs.map((p) => (p * 100).toFixed(2)),
                backgroundColor: this.elementColors[elemId] + "80",
                borderColor: this.elementColors[elemId],
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            });
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Korroosion alkamisvuoden jakauma rakenneosittain",
                        font: { size: 15, weight: 600 },
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: "Vuosi" },
                        ticks: { maxTicksLimit: 15 },
                        stacked: false,
                    },
                    y: {
                        title: { display: true, text: "Todennäköisyys (%)" },
                        min: 0,
                    },
                },
            },
        });
    }

    // ===========================================================
    // 7. Scenario collapse year histogram
    // ===========================================================
    renderCollapseHistogram(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const datasets = [];
        let labels = null;

        for (const [scId, scData] of Object.entries(results.scenarios)) {
            const hist = scData.distributions.collapse_year_histogram;
            if (!labels && hist.bins.length > 0) {
                labels = hist.bins.map((b) => Math.round(b));
            }
            if (hist.bins.length > 0) {
                datasets.push({
                    label: `Skenaario ${scId}`,
                    data: hist.probs.map((p) => (p * 100).toFixed(2)),
                    backgroundColor: this.colorScheme[scId].main + "60",
                    borderColor: this.colorScheme[scId].main,
                    borderWidth: 1.5,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0,
                });
            }
        }

        if (!labels) labels = [];

        this.charts[canvasId] = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "EC2-rajan alitusajankohdan jakauma",
                        font: { size: 15, weight: 600 },
                    },
                },
                scales: {
                    x: { title: { display: true, text: "Vuosi" }, ticks: { maxTicksLimit: 15 } },
                    y: { title: { display: true, text: "Todennäköisyys (%)" }, min: 0 },
                },
            },
        });
    }

    // ===========================================================
    // 8. Radar chart comparing scenarios
    // ===========================================================
    renderRadarChart(canvasId, results) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (this.charts[canvasId]) this.charts[canvasId].destroy();

        const labels = [
            "EC2-raja 2035",
            "EC2-raja 2050",
            "Korroosio 2035",
            "Korroosio 2050",
            "Käyttöikä jäljellä",
        ];

        const datasets = [];
        for (const [scId, summary] of Object.entries(results.summary)) {
            const collapseYear = summary.collapse_risk_year.median || 2126;
            const remainingLife = Math.max(0, (collapseYear - 2026) / 50 * 100); // normalize to 0-100

            datasets.push({
                label: `Skenaario ${scId}`,
                data: [
                    (summary.collapse_prob_2035 || 0) * 100,
                    (summary.collapse_prob_2050 || 0) * 100,
                    (summary.corrosion_prob_2035 || 0) * 100,
                    (summary.corrosion_prob_2050 || 0) * 100,
                    remainingLife,
                ],
                borderColor: this.colorScheme[scId].main,
                backgroundColor: this.colorScheme[scId].light,
                borderWidth: 2,
                pointBackgroundColor: this.colorScheme[scId].main,
            });
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: "radar",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: "Skenaarioiden vertailu", font: { size: 15, weight: 600 } },
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20, backdropColor: "transparent" },
                        grid: { color: "rgba(100, 116, 139, 0.15)" },
                        angleLines: { color: "rgba(100, 116, 139, 0.15)" },
                        pointLabels: { font: { size: 11 } },
                    },
                },
            },
        });
    }
}
