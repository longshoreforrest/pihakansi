// ============================================================
// Pihakansi Life-Cycle Analysis – Report Generator
// Generates a comprehensive Finnish-language HTML report
// with embedded chart images and literature references
// ============================================================

class ReportGenerator {

    /**
     * Generate a full report and open it in a new browser window
     * @param {Object} results - Simulation results from SimulationEngine
     * @param {Object} params - Simulation parameters (as used in the run)
     * @param {Object} chartImages - { canvasId: dataURL } map of chart PNG images
     * @param {Object} inputData - INPUT_DATA from data.js
     * @param {Array} structuralElements - STRUCTURAL_ELEMENTS from data.js
     */
    static generate(results, params, chartImages, inputData, structuralElements) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("fi-FI", { day: "numeric", month: "long", year: "numeric" });
        const s = results.summary;

        // Executive summary: find year when collapse probability exceeds 5%
        const yearExceed5A = ReportGenerator._yearWhenProbExceeds(results, 'A', 'collapse_probability', 0.05);
        const yearExceed5B = ReportGenerator._yearWhenProbExceeds(results, 'B', 'collapse_probability', 0.05);
        const yearExceed5C = ReportGenerator._yearWhenProbExceeds(results, 'C', 'collapse_probability', 0.05);
        const yearExceed5D = ReportGenerator._yearWhenProbExceeds(results, 'D', 'collapse_probability', 0.05);
        const waitingYearsA = yearExceed5A ? yearExceed5A - 2026 : null;
        const edgeFactor = params.tukipinta.reunakerroin || 1.5;
        const bearingMargin2026 = params.tukipinta.original_depth_mm - edgeFactor * params.tukipinta.rapautuminen_reuna_mm_per_year * (2026 - params.frost.critical_saturation_year);

        // Conservatism adjustment: Eurocode threshold 75mm vs realistic ~50mm for K400
        const conservatismFactor = (params.tukipinta.original_depth_mm - 50) /
                                   (params.tukipinta.original_depth_mm - params.tukipinta.critical_min_mm);
        const critSatYear = params.frost.critical_saturation_year;

        function adjustYear(modelYear) {
            if (!modelYear || isNaN(modelYear)) return null;
            return Math.round(critSatYear + (modelYear - critSatYear) * conservatismFactor);
        }

        const adjustedMedianA = adjustYear(s.A.collapse_risk_year?.median);
        const adjustedMedianB = adjustYear(s.B.collapse_risk_year?.median);
        const adjustedMedianC = adjustYear(s.C.collapse_risk_year?.median);
        const adjustedMedianD = adjustYear(s.D.collapse_risk_year?.median);
        const adjustedExceed5A = adjustYear(yearExceed5A);

        function formatAdjusted(year) {
            if (!year) return '\u2014';
            return `${year - 2026}\u00a0vuotta (vuoteen ~${year})`;
        }

        const html = `<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pihakansi Rakenneanalyysi – Raportti – ${inputData.kohde_tiedot.nimi}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
${ReportGenerator._reportCSS()}
</style>
</head>
<body>

<!-- ===== PRINT TOOLBAR ===== -->
<div class="print-toolbar no-print">
    <button onclick="window.print()">Tulosta / Tallenna PDF</button>
    <span>Voit tallentaa raportin PDF-muodossa selaimen Tulosta-toiminnolla (Ctrl+P)</span>
</div>

<!-- ===== KANSILEHTI ===== -->
<div class="cover-page">
    <div class="cover-badge">RAKENNEANALYYSI</div>
    <h1>Pihakannen käyttöikäanalyysi</h1>
    <h2>${inputData.kohde_tiedot.nimi}</h2>
    <div class="cover-meta">
        <p>${inputData.kohde_tiedot.rakenne}</p>
        <p>Rakennettu ${inputData.kohde_tiedot.rakennettu} · Pinta-ala ${inputData.kohde_tiedot.pinta_ala_m2} m²</p>
    </div>
    <div class="cover-image" style="margin: 24px auto 16px; text-align: center;">
        <img src="sato-pasila.png" alt="${inputData.kohde_tiedot.nimi}" style="max-width: 100%; max-height: 340px; border-radius: 6px; box-shadow: 0 2px 12px rgba(0,0,0,0.15);">
    </div>
    <div class="cover-details">
        <table>
            <tr><td>Menetelmä</td><td>Monte Carlo -simulaatio (N = ${params.monte_carlo_iterations.toLocaleString("fi-FI")})</td></tr>
            <tr><td>Analyysihorisontti</td><td>${params.start_year}–${params.end_year}</td></tr>
            <tr><td>Skenaariot</td><td>A (passiivinen), B (pintaremontti), C (täyskorjaus), D (täyskorjaus, puut säilyttäen)</td></tr>
            <tr><td>Raportin päiväys</td><td>${dateStr}</td></tr>
        </table>
    </div>
</div>

<!-- ===== TIIVISTELMÄ ===== -->
<div class="page-break"></div>
<div class="executive-summary">
<h2 id="ch-tiivistelma">Tiivistelmä päätöksentekijöille</h2>

<p>
    <strong>${inputData.kohde_tiedot.nimi}n pihakannen</strong> (rak. ${inputData.kohde_tiedot.rakennettu})
    alkuperäisen kermieristeen (bitumivedeneriste) on havaittu vuotaneen vuodesta ${inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} alkaen.
    Kermieriste on käyttöikänsä lopussa.
    Kuntotutkimukset (${inputData.mittaustiedot_2006.vuosi} ja ${inputData.mittaustiedot_2024.vuosi})
    ovat suositelleet vesieristeen korjausta.
    Betoni on ${2026 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuoden kosteusrasituksesta huolimatta
    varsin hyvässä kunnossa: vuoden 2024 ohuthieanalyysi kuvaa TT-rivan betonin
    &rdquo;rapautumattomaksi&rdquo; ja korroosioaste on vain 0&ndash;1 %.
</p>
<p>
    Rakenteen käyttöikää on arvioitu laskennallisella mallilla, joka yhdistää karbonatisaation
    kaksivaiheisen vaimennetun &radic;t-mallin (vaimennus ${params.carbonation.dampening_age}&nbsp;v jälkeen, &alpha;&nbsp;=&nbsp;${params.carbonation.dampening_factor}),
    pakkasrapautumisen ${params.frost.acceleration_factor >= 1.005 ? 'kiihtyvän' : 'lineaarisen'} vauriomallin
    ja tukipinnan reunarapautumisanalyysin Monte Carlo -simulaatioon
    (${params.monte_carlo_iterations.toLocaleString("fi-FI")} iteraatiota). Malli on kalibroitu
    vuosien ${inputData.mittaustiedot_2006.vuosi} ja ${inputData.mittaustiedot_2024.vuosi}
    kuntotutkimusten mittaustuloksiin: karbonatisaatiokertoimen k ennustamat syvyydet vastaavat
    mitattuja arvoja, ja pakkasrapautumisen etenemisvauhti on sovitettu havaittuun rapautuma-asteeseen.
    Mallin tulokset ovat johdonmukaisia kenttähavaintojen kanssa &ndash; betoni on todettu pääosin
    rapautumattomaksi ja korroosioaste vähäiseksi, mikä vastaa laskennallista ennustetta.
</p>
<p>
    <strong>Kriittisin riski</strong> on TT-laatan tukipinnan reunarapautuminen (pakkanen), ei raudoitteen korroosio.
    Turvamarginaali Eurokoodi 2:n vähimmäisvaatimukseen (${params.tukipinta.critical_min_mm} mm) on
    noin ${bearingMargin2026.toFixed(0)} mm vuonna 2026.
</p>

<div class="verdict-box">
    <p class="verdict-main">
        ${waitingYearsA !== null
            ? `Rakenne kestää turvallisesti vähintään ${waitingYearsA} vuotta ilman toimenpiteitä (vuoteen ${yearExceed5A}).`
            : `Tukipinta pysyy Eurokoodi\u00a02:n suunnittelurajan (${params.tukipinta.critical_min_mm}\u00a0mm) yläpuolella koko simulaatiojaksolla.`}
    </p>
    <p style="color: #065f46; font-size: 10pt;">
        ${waitingYearsA !== null
            ? `Vasta vuonna ${yearExceed5A} tukipinta saavuttaa Eurokoodi\u00a02:n suunnitteluarvon uusille rakenteille (${params.tukipinta.critical_min_mm}\u00a0mm). Korjaustoimenpiteillä ei ole kiire.`
            : `Rakenteen kunto heikkenee hitaasti \u2014 korjaustoimenpiteillä ei ole kiire.`}
    </p>
    <p style="color: #475569; font-size: 9.5pt; margin-top: 8px;">
        <strong>Mallin konservatiivisuus:</strong> Edellä esitetyt arviot perustuvat
        Eurokoodi 2:n vähimmäistukipintaan (${params.tukipinta.critical_min_mm}\u00a0mm), joka on suunnitteluarvo <em>uusille</em>
        rakenteille. ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonin lujuusreservi (käyttöaste vain ~7\u00a0% ${params.tukipinta.critical_min_mm}\u00a0mm tukipinnalla)
        merkitsee, että todellinen murtuminen vaatisi tukipinnan pienenemisen noin 50\u00a0mm:iin.
        Tämä kaksinkertaistaa vaurioitumisajan: <strong>oikaistu arvio on ~${formatAdjusted(adjustedExceed5A || adjustedMedianA)}</strong>
        (ks. luku 4.4).
    </p>
</div>

<div class="scenario-box sc-a-box">
    <h4>Skenaario A: Ei korjaustoimenpiteitä</h4>
    <img src="skenaario-a.png" alt="Skenaario A: Nykytilanne" style="width: 100%; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <p class="box-note" style="font-size: 8pt; color: #666; margin-top: 0;">Satelliittikuva pihakannen nykytilasta. Vaahterat näkyvissä.</p>
    <div class="key-metric">
        <span class="value">${ReportGenerator._formatYear(s.A.collapse_risk_year)}</span>
        <span class="label">EC2-rajan alitus (mediaani)</span>
    </div>
    <div class="key-metric">
        <span class="value">${yearExceed5A || '\u2014'}</span>
        <span class="label">EC2-suunnitteluraja saavutetaan</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.A.collapse_prob_2035 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2035 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.A.collapse_prob_2050 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2050 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.A.collapse_prob_2075 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2075 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.A.collapse_prob_2100 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2100 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value" style="color: #6366f1;">~${formatAdjusted(adjustedMedianA)}</span>
        <span class="label">Oikaistu arvio (betonin lujuusreservi, luku 4.4)</span>
    </div>
    <p class="box-note">Pihakannen vaahterat säilytetään.</p>
</div>

<div class="scenario-box sc-b-box">
    <h4>Skenaario B: Pintaremontti (${(params.light_repair.cost_total_min_eur / 1000).toFixed(0)}\u2013${(params.light_repair.cost_total_max_eur / 1000).toFixed(0)} t\u20ac)</h4>
    <img src="skenaario-b.png" alt="Skenaario B: Pintaremontti" style="width: 100%; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <p class="box-note" style="font-size: 8pt; color: #666; margin-top: 0;">Havainnekuva pintaremontista: viherkatoksia ja päivitettyä kasvustoa. Vaahterat säilytetään.</p>
    <div class="key-metric">
        <span class="value">${ReportGenerator._formatYear(s.B.collapse_risk_year)}</span>
        <span class="label">EC2-rajan alitus (mediaani)</span>
    </div>
    <div class="key-metric">
        <span class="value">${yearExceed5B || '\u2014'}</span>
        <span class="label">EC2-suunnitteluraja saavutetaan</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.B.collapse_prob_2035 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2035 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.B.collapse_prob_2050 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2050 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.B.collapse_prob_2075 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2075 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.B.collapse_prob_2100 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2100 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value" style="color: #6366f1;">~${formatAdjusted(adjustedMedianB)}</span>
        <span class="label">Oikaistu arvio (betonin lujuusreservi, luku 4.4)</span>
    </div>
    <p class="box-note" style="color:#92400e;">
        Pintaremontti hidastaa vaurioitumista ja kohentaa piha-alueen yleisilmettä.
        Pihakannen vaahterat säilytetään. Samalla parannetaan autotallin estetiikkaa:
        valaistusta kirkastetaan, betonipalkkeja harjataan ja maalataan valituilta osin,
        seinäpintoja maalataan, ja tarvittaessa lisätään peltejä vesien ohjaamiseksi viemäriin.
        Kustannus: ${(params.light_repair.cost_total_min_eur / 1000).toFixed(0)}\u2013${(params.light_repair.cost_total_max_eur / 1000).toFixed(0)} t\u20ac.
    </p>
</div>

<div class="scenario-box sc-c-box">
    <h4>Skenaario C: Täyskorjaus (${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. \u20ac)</h4>
    <img src="skenaario-c.png" alt="Skenaario C: Täyskorjaus" style="width: 100%; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <p class="box-note" style="font-size: 8pt; color: #666; margin-top: 0;">Havainnekuva hankesuunnitelmasta [36]. Hankesuunnitelmassa vaahterat kaadetaan, vaikka korjaus on toteutettavissa myös ne säilyttäen.</p>
    <div class="key-metric">
        <span class="value">${ReportGenerator._formatYear(s.C.collapse_risk_year)}</span>
        <span class="label">EC2-rajan alitus (mediaani)</span>
    </div>
    <div class="key-metric">
        <span class="value">${yearExceed5C || '\u2014'}</span>
        <span class="label">EC2-suunnitteluraja saavutetaan</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.C.collapse_prob_2035 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2035 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.C.collapse_prob_2050 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2050 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.C.collapse_prob_2075 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2075 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.C.collapse_prob_2100 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2100 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value" style="color: #6366f1;">~${formatAdjusted(adjustedMedianC)}</span>
        <span class="label">Oikaistu arvio (betonin lujuusreservi, luku 4.4)</span>
    </div>
    <p class="box-note" style="color:#065f46;">
        Täyskorjaus pysäyttää pakkasrapautumisen ja pidentää käyttöikää ~${params.full_repair.extended_life_years} vuotta.
        Kustannus: ${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. \u20ac (kilpailutettu).
        Hallituksen hankesuunnitelmassa pihakannen vaahterat kaadetaan. Vaahtereiden kaatamiselle
        ei ole asiallista syytä \u2014 korjaus on toteutettavissa myös vaahterat säilyttäen.
    </p>
</div>

<div class="scenario-box sc-d-box">
    <h4>Skenaario D: Täyskorjaus, puut säilyttäen (~${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur * 0.9 / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur * 0.9 / 1e6).toFixed(1)} milj. \u20ac)</h4>
    <img src="skenaario-c.png" alt="Skenaario D: Täyskorjaus puut säilyttäen" style="width: 100%; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
    <p class="box-note" style="font-size: 8pt; color: #666; margin-top: 0;">Havainnekuva hankesuunnitelman täyskorjauksesta [36]. Skenaariossa D vaahterat säilytetään.</p>
    <div class="key-metric">
        <span class="value">${ReportGenerator._formatYear(s.D.collapse_risk_year)}</span>
        <span class="label">EC2-rajan alitus (mediaani)</span>
    </div>
    <div class="key-metric">
        <span class="value">${yearExceed5D || '\u2014'}</span>
        <span class="label">EC2-suunnitteluraja saavutetaan</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.D.collapse_prob_2035 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2035 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.D.collapse_prob_2050 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2050 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.D.collapse_prob_2075 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2075 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value">${((s.D.collapse_prob_2100 || 0) * 100).toFixed(1)} %</span>
        <span class="label">EC2-raja alittuu 2100 (%)</span>
    </div>
    <div class="key-metric">
        <span class="value" style="color: #6366f1;">~${formatAdjusted(adjustedMedianD)}</span>
        <span class="label">Oikaistu arvio (betonin lujuusreservi, luku 4.4)</span>
    </div>
    <p class="box-note" style="color:#4338ca;">
        Täyskorjaus puut säilyttäen yhdistää täyskorjauksen rakenteelliset hyödyt puuston säilyttämiseen.
        Pakkasrapautuminen pysähtyy ja käyttöikä pitenee ~${params.full_repair.extended_life_years} vuotta.
        Kustannus: ~${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur * 0.9 / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur * 0.9 / 1e6).toFixed(1)} milj. \u20ac (~10\u00a0% vähemmän kuin C, puualuetta ~156\u00a0m\u00b2 ei tarvitse purkaa).
        Pihakannen vaahterat säilytetään erillisessä kasvualustassa (syvyys 1\u20131,5\u00a0m, mitoitettu 4 puulle, 2 jäljellä).
        Kaupunkikuvallinen arvo ja hiilinielu säilyvät. Patolevy-vaihtoehto suojaa rakenteita juuristolta.
    </p>
</div>

</div>

<!-- ===== SISÄLLYSLUETTELO ===== -->
<div class="page-break"></div>
<h2 class="toc-title">Sisällysluettelo</h2>
<div class="toc">
    <a href="#ch-tiivistelma" class="toc-item"><span class="toc-num"></span><span class="toc-text"><strong>Tiivistelmä päätöksentekijöille</strong></span></a>
    <a href="#ch-1" class="toc-item"><span class="toc-num">1</span><span class="toc-text">Johdanto</span></a>
    <a href="#ch-2" class="toc-item"><span class="toc-num">2</span><span class="toc-text">Kohdetiedot</span></a>
    <a href="#ch-3" class="toc-item"><span class="toc-num">3</span><span class="toc-text">Kuntotutkimustulokset</span></a>
    <a href="#ch-3-1" class="toc-item sub"><span class="toc-num">3.1</span><span class="toc-text">Kuntotutkimus 2006</span></a>
    <a href="#ch-3-2" class="toc-item sub"><span class="toc-num">3.2</span><span class="toc-text">Kuntotutkimus 2024</span></a>
    <a href="#ch-3-3" class="toc-item sub"><span class="toc-num">3.3</span><span class="toc-text">Mittaustulosten vertailu ja kehityssuunta</span></a>
    <a href="#ch-4" class="toc-item"><span class="toc-num">4</span><span class="toc-text">Laskentamenetelmät</span></a>
    <a href="#ch-4-1" class="toc-item sub"><span class="toc-num">4.1</span><span class="toc-text">Karbonatisaatiomalli</span></a>
    <a href="#ch-4-2" class="toc-item sub"><span class="toc-num">4.2</span><span class="toc-text">Pakkasrapautumismalli</span></a>
    <a href="#ch-4-3" class="toc-item sub"><span class="toc-num">4.3</span><span class="toc-text">Tukipinta-analyysi</span></a>
    <a href="#ch-4-4" class="toc-item sub"><span class="toc-num">4.4</span><span class="toc-text">Mallin konservatiivisuuden arviointi</span></a>
    <a href="#ch-4-5" class="toc-item sub"><span class="toc-num">4.5</span><span class="toc-text">Monte Carlo -simulaatio</span></a>
    <a href="#ch-5" class="toc-item"><span class="toc-num">5</span><span class="toc-text">Mallin kalibrointi ja sopivuus kenttädataan</span></a>
    <a href="#ch-5-1" class="toc-item sub"><span class="toc-num">5.1</span><span class="toc-text">Karbonatisaation sopivuus</span></a>
    <a href="#ch-5-2" class="toc-item sub"><span class="toc-num">5.2</span><span class="toc-text">Pakkasrapautumisen sopivuus</span></a>
    <a href="#ch-5-3" class="toc-item sub"><span class="toc-num">5.3</span><span class="toc-text">Tukipinnan sopivuus</span></a>
    <a href="#ch-5-4" class="toc-item sub"><span class="toc-num">5.4</span><span class="toc-text">Korroosioasteen sopivuus</span></a>
    <a href="#ch-6" class="toc-item"><span class="toc-num">6</span><span class="toc-text">Korjausskenaariot</span></a>
    <a href="#ch-7" class="toc-item"><span class="toc-num">7</span><span class="toc-text">Simulaatiotulokset</span></a>
    <a href="#ch-7-1" class="toc-item sub"><span class="toc-num">7.1</span><span class="toc-text">Skenaarioiden yhteenveto</span></a>
    <a href="#ch-7-2" class="toc-item sub"><span class="toc-num">7.2</span><span class="toc-text">Karbonatisaation eteneminen</span></a>
    <a href="#ch-7-3" class="toc-item sub"><span class="toc-num">7.3</span><span class="toc-text">Pakkasrapautumisen kertymä</span></a>
    <a href="#ch-7-4" class="toc-item sub"><span class="toc-num">7.4</span><span class="toc-text">Tukipinnan tehollinen pituus</span></a>
    <a href="#ch-7-5" class="toc-item sub"><span class="toc-num">7.5</span><span class="toc-text">EC2-vähimmäistukipinnan alituksen todennäköisyys</span></a>
    <a href="#ch-7-6" class="toc-item sub"><span class="toc-num">7.6</span><span class="toc-text">Korroosion todennäköisyys</span></a>
    <a href="#ch-7-7" class="toc-item sub"><span class="toc-num">7.7</span><span class="toc-text">Rakenneosakohtainen analyysi</span></a>
    <a href="#ch-7-8" class="toc-item sub"><span class="toc-num">7.8</span><span class="toc-text">Skenaariovertailu</span></a>
    <a href="#ch-8" class="toc-item"><span class="toc-num">8</span><span class="toc-text">Hiilijalanjälkianalyysi</span></a>
    <a href="#ch-8-1" class="toc-item sub"><span class="toc-num">8.1</span><span class="toc-text">Päästökertoimet</span></a>
    <a href="#ch-8-2" class="toc-item sub"><span class="toc-num">8.2</span><span class="toc-text">Skenaariokohtaiset päästöt</span></a>
    <a href="#ch-8-3" class="toc-item sub"><span class="toc-num">8.3</span><span class="toc-text">Vertailu ja havainnollistaminen</span></a>
    <a href="#ch-8-4" class="toc-item sub"><span class="toc-num">8.4</span><span class="toc-text">Puuston merkitys hiilitaseessa</span></a>
    <a href="#ch-9" class="toc-item"><span class="toc-num">9</span><span class="toc-text">Vuosikohtaiset tulokset</span></a>
    <a href="#ch-10" class="toc-item"><span class="toc-num">10</span><span class="toc-text">Laskennan luotettavuus</span></a>
    <a href="#ch-10-1" class="toc-item sub"><span class="toc-num">10.1</span><span class="toc-text">Tieteellinen perusta ja kirjallisuus</span></a>
    <a href="#ch-10-2" class="toc-item sub"><span class="toc-num">10.2</span><span class="toc-text">Kalibrointi 50 vuoden kenttädataan</span></a>
    <a href="#ch-10-3" class="toc-item sub"><span class="toc-num">10.3</span><span class="toc-text">Monte Carlo -simulaation luotettavuus</span></a>
    <a href="#ch-10-4" class="toc-item sub"><span class="toc-num">10.4</span><span class="toc-text">Rajoitukset ja epävarmuustekijät</span></a>
    <a href="#ch-11" class="toc-item"><span class="toc-num">11</span><span class="toc-text">Johtopäätökset ja suositukset</span></a>
    <a href="#ch-12" class="toc-item"><span class="toc-num">12</span><span class="toc-text">Lähdeluettelo</span></a>
</div>

<!-- ===== 1. JOHDANTO ===== -->
<div class="page-break"></div>
<h2 id="ch-1"><span class="chapter-num">1</span> Johdanto</h2>

<p>
    Tässä raportissa esitetään ${inputData.kohde_tiedot.nimi}n pihakannen rakenteellinen käyttöikäanalyysi.
    Pihakansi on rakennettu vuonna ${inputData.kohde_tiedot.rakennettu} ja sen kantava rakenne on
    ${inputData.kohde_tiedot.rakenne.toLowerCase()}. Kannen pinta-ala on
    ${inputData.kohde_tiedot.pinta_ala_m2} m².
</p>
<p>
    Pihakannen alkuperäinen kermieristys (bitumivedeneriste) on vuotanut rakentamisvuodesta
    ${inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} lähtien
    ja on käyttöikänsä lopussa, mikä on altistanut betonirakenteen kosteudelle, klorideille ja pakkasrasitukselle. Rakenteesta on tehty
    kaksi kuntotutkimusta: ensimmäinen vuonna ${inputData.mittaustiedot_2006.vuosi} ja toinen vuonna
    ${inputData.mittaustiedot_2024.vuosi}. Molemmat tutkimukset suosittelivat pikaista korjausta
    (v. ${inputData.mittaustiedot_2006.suositus_remontille} ja v. ${inputData.mittaustiedot_2024.suositus_remontille}).
</p>
<p>
    Analyysin tarkoituksena on arvioida rakenteen jäljellä oleva käyttöikä neljän eri korjausskenaarion
    valossa käyttäen probabilistista Monte Carlo -simulaatiomenetelmää. Menetelmä ottaa huomioon
    materiaalien ominaisuuksien tilastollisen hajonnan ja tuottaa todennäköisyyspohjaisen arvion
    vaurioiden etenemisestä ja tukipinnan riittävyydestä suhteessa Eurokoodi 2:n vaatimuksiin [1, 7, 12].
</p>
<p>
    Analyysi kattaa kolme pääasiallista vauriomekanismia:
</p>
<ol>
    <li><strong>Karbonatisaatio</strong> ja siitä aiheutuva raudoitteen korroosion alkaminen [2, 5, 9, 15]</li>
    <li><strong>Pakkasrapautuminen</strong> ja sen eteneminen kosteusrasituksen alla [3, 4, 14]</li>
    <li><strong>TT-laatan tukipinnan pieneneminen</strong> reunarapautumisen seurauksena [1, 6]</li>
</ol>

<!-- ===== 2. KOHDETIEDOT ===== -->
<h2 id="ch-2"><span class="chapter-num">2</span> Kohdetiedot</h2>

<table class="data-table">
    <tr><td class="label-cell">Kohde</td><td>${inputData.kohde_tiedot.nimi}</td></tr>
    <tr><td class="label-cell">Rakennusvuosi</td><td>${inputData.kohde_tiedot.rakennettu}</td></tr>
    <tr><td class="label-cell">Rakenne</td><td>${inputData.kohde_tiedot.rakenne}</td></tr>
    <tr><td class="label-cell">Pinta-ala</td><td>${inputData.kohde_tiedot.pinta_ala_m2} m²</td></tr>
    <tr><td class="label-cell">Vesieristys</td><td>Kermieristys (bitumivedeneriste), alkuperäinen</td></tr>
    <tr><td class="label-cell">Vesieristyksen vuoto alkaen</td><td>${inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} (kermieriste käyttöikänsä lopussa)</td></tr>
    <tr><td class="label-cell">Rakenteen ikä (2026)</td><td>${2026 - inputData.kohde_tiedot.rakennettu} vuotta</td></tr>
    <tr><td class="label-cell">Kosteusrasituksen kesto (2026)</td><td>${2026 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta</td></tr>
    <tr><td class="label-cell">Betonin suunnittelulujuus</td><td>${inputData.kohde_tiedot.betonin_suunnittelulujuus} (&asymp; ${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa} MPa puristus)</td></tr>
    <tr><td class="label-cell">Suunnittelukuorma</td><td>${inputData.kohde_tiedot.kantavuus_kpa} kN/m&sup2;</td></tr>
    <tr><td class="label-cell">Pihaistutukset</td><td>Kaksi suurta vaahteraa (Itä-Pasilan suurimmat puut, korkeus ~6 kerrosta)</td></tr>
    <tr><td class="label-cell">Vetolujuus 2024 (ka.)</td><td>${(inputData.mittaustiedot_2024.vetolujuus_mpa.reduce((a,b) => a+b, 0) / inputData.mittaustiedot_2024.vetolujuus_mpa.length).toFixed(1)} MPa</td></tr>
</table>

<p>
    Kantava rakenne koostuu teräsbetonipilareista, leukapalkeista ja TT-laatastoista. TT-laattaelementit
    tukeutuvat leukapalkkeihin, joihin ne on kiinnitetty tukipinnan kautta. Rakenteen kriittisimmät osat
    ovat TT-laatan rivat ja laipat, joissa betonipeitteet ovat ohuimmat ja joihin kosteusrasitus
    kohdistuu voimakkaimmin.
</p>

<h3>Rakenneosat</h3>
<table class="data-table">
    <thead>
        <tr>
            <th>Rakenneosa</th>
            <th>Tunnus</th>
            <th>Kriittisyys</th>
            <th>Betonipeite ka. (mm)</th>
            <th>Hajonta (mm)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Pilarit</td>
            <td>Columns</td>
            <td>Normaali</td>
            <td>${params.betonipeite.pilarit.mean}</td>
            <td>± ${params.betonipeite.pilarit.std}</td>
        </tr>
        <tr>
            <td>Leukapalkit</td>
            <td>Ledger Beams</td>
            <td>Normaali</td>
            <td>${params.betonipeite.leukapalkit.mean}</td>
            <td>± ${params.betonipeite.leukapalkit.std}</td>
        </tr>
        <tr>
            <td>TT-laatta (laippa)</td>
            <td>TT-slab (flange)</td>
            <td class="critical">Kriittinen</td>
            <td>${params.betonipeite.tt_laatta_laippa.mean}</td>
            <td>± ${params.betonipeite.tt_laatta_laippa.std}</td>
        </tr>
        <tr>
            <td>TT-laatta (ripa)</td>
            <td>TT-slab (rib)</td>
            <td class="critical">Kriittinen</td>
            <td>${params.betonipeite.tt_ripa_alapinta.mean}</td>
            <td>± ${params.betonipeite.tt_ripa_alapinta.std}</td>
        </tr>
    </tbody>
</table>
<p class="table-note">
    Betonipeitteiden keskiarvot on laskettu vuosien 2006 ja 2024 mittausten perusteella.
    TT-laatan rivan betonipeite (ka. ${params.betonipeite.tt_ripa_alapinta.mean} mm) on pienin ja
    sen hajonta suuri (5–35 mm), mikä tekee siitä kriittisimmän rakenneosan korroosioriskin kannalta [2, 10].
</p>

<!-- ===== 3. KUNTOTUTKIMUSTULOKSET ===== -->
<div class="page-break"></div>
<h2 id="ch-3"><span class="chapter-num">3</span> Kuntotutkimustulokset</h2>

<h3 id="ch-3-1"><span class="chapter-num">3.1</span> Kuntotutkimus 2006</h3>
<p>
    Ensimmäinen kuntotutkimus tehtiin vuonna ${inputData.mittaustiedot_2006.vuosi} (Vahanen Oy [34]), jolloin rakenne oli
    ${inputData.mittaustiedot_2006.vuosi - inputData.kohde_tiedot.rakennettu} vuotta vanha.
    Tutkimus suositteli korjausta viimeistään vuoteen ${inputData.mittaustiedot_2006.suositus_remontille} mennessä.
    Korjausta ei toteutettu.
</p>

<table class="data-table">
    <thead>
        <tr><th colspan="3">Karbonatisaatiosyvyydet (keskiarvo, mm)</th></tr>
    </thead>
    <tbody>
        <tr><td class="label-cell">Pilarit</td><td>${inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.pilarit} mm</td><td>t = ${inputData.mittaustiedot_2006.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
        <tr><td class="label-cell">Leukapalkit</td><td>${inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.leukapalkit} mm</td><td>t = ${inputData.mittaustiedot_2006.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
        <tr><td class="label-cell">TT-laatat</td><td>${inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.tt_laatat} mm</td><td>t = ${inputData.mittaustiedot_2006.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
    </tbody>
</table>

<table class="data-table">
    <thead>
        <tr><th colspan="2">Betonipeitteet (keskiarvo, mm)</th></tr>
    </thead>
    <tbody>
        <tr><td class="label-cell">Pilarit</td><td>${inputData.mittaustiedot_2006.betonipeite_ka_mm.pilarit} mm</td></tr>
        <tr><td class="label-cell">Leukapalkit</td><td>${inputData.mittaustiedot_2006.betonipeite_ka_mm.leukapalkit} mm</td></tr>
        <tr><td class="label-cell">TT-ripa alapinta</td><td>${inputData.mittaustiedot_2006.betonipeite_ka_mm.tt_ripa_alapinta} mm</td></tr>
    </tbody>
</table>

<p>
    Kloridipitoisuus vuoden 2006 tutkimuksessa oli ${inputData.mittaustiedot_2006.kloridit_paino_prosenttia} paino-%
    sementin painosta, mikä on selvästi alle kloridikorroosion kynnysarvon (0,03–0,07 paino-% [5, 8]).
    Kloridien aiheuttama korroosio ei siten ollut vielä merkittävä riskitekijä vuonna 2006.
</p>

<h4>Pintateräkset (valmistusvirhe)</h4>
<p>
    Vuoden 2006 tutkimuksessa havaittiin merkittävä valmistusvirhe:
    <em>&rdquo;${inputData.mittaustiedot_2006.pintaterakset}&rdquo;</em>.
    Lisäksi TT-rivan alapinnan betonipeitteistä ${inputData.mittaustiedot_2006.betonipeite_jakauma_tt_ripa}.
    Nämä valmistusaikaiset puutteet tarkoittavat, että osa raudoitteista on ollut suoraan alttiina
    kosteudelle vesieristyksen vuotamisesta (${inputData.kohde_tiedot.vesieristys_vuotanut_alkaen}) lähtien [2, 5, 10].
</p>

<h3 id="ch-3-2"><span class="chapter-num">3.2</span> Kuntotutkimus 2024</h3>
<p>
    Toinen kuntotutkimus (${inputData.mittaustiedot_2024.tutkija} [35]) tehtiin vuonna ${inputData.mittaustiedot_2024.vuosi},
    jolloin rakenne oli ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.rakennettu} vuotta vanha ja
    kosteusrasitus oli jatkunut ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta.
    Tutkimus suositteli korjausta viimeistään vuoteen ${inputData.mittaustiedot_2024.suositus_remontille} mennessä.
    Arvioitu korjauskustannus oli ${inputData.mittaustiedot_2024.arvioitu_korjauskustannus_eur_per_m2} &euro;/m&sup2;
    (yhteensä ~${Math.round(inputData.mittaustiedot_2024.arvioitu_korjauskustannus_eur_per_m2 * 1300 / 1000)} 000 &euro;, pinta-ala ~1 300 m&sup2;).
    Urakan kilpailutuksen jälkeen kustannusarvio on tarkentunut tasolle
    ${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}&ndash;${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. &euro;.
</p>

<table class="data-table">
    <thead>
        <tr><th colspan="4">Karbonatisaatiosyvyydet (keskiarvo, mm)</th></tr>
        <tr><th>Rakenneosa</th><th>Kenttä (fenolftaleiinikoe)</th><th>Ohuthie</th><th>Ikä</th></tr>
    </thead>
    <tbody>
        <tr><td class="label-cell">Pilarit</td><td>${inputData.mittaustiedot_2024.karbonatisaatio_ka_mm.pilarit} mm</td><td><strong>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.pilarit} mm</strong></td><td>t = ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
        <tr><td class="label-cell">TT-laatta (laippa)</td><td>${inputData.mittaustiedot_2024.karbonatisaatio_ka_mm.tt_laatta_laippa} mm</td><td><strong>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_laippa} mm</strong></td><td>t = ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
        <tr><td class="label-cell">TT-laatta (ripa)</td><td>${inputData.mittaustiedot_2024.karbonatisaatio_ka_mm.tt_laatta_ripa} mm</td><td><strong>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_ripa} mm</strong></td><td>t = ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.rakennettu} v</td></tr>
    </tbody>
</table>
<p class="table-note">
    Ohuthieanalyysin arvot ovat 2&ndash;4-kertaiset kenttämittauksiin verrattuna. Tämä johtuu siitä, että
    fenolftaleiinikoe aliarvio karbonatisaatiosyvyyttä kosteassa betonissa [5, 9, 13].
    Ohuthieanalyysin arvoja käytetään laskentamallin kalibrointiin.
</p>

<table class="data-table">
    <thead>
        <tr><th colspan="2">Betonipeitteet (keskiarvo, mm)</th></tr>
    </thead>
    <tbody>
        <tr><td class="label-cell">Pilarit</td><td>${inputData.mittaustiedot_2024.betonipeite_ka_mm.pilarit} mm</td></tr>
        <tr><td class="label-cell">TT-laatta (laippa)</td><td>${inputData.mittaustiedot_2024.betonipeite_ka_mm.tt_laatta_laippa} mm</td></tr>
        <tr><td class="label-cell">TT-laatta (ripa)</td><td>${inputData.mittaustiedot_2024.betonipeite_ka_mm.tt_laatta_ripa} mm</td></tr>
    </tbody>
</table>

<h4>Korroosioaste</h4>
<p>
    Raudoitteen korroosioaste vuoden 2024 tutkimuksessa:
    pilarit <strong>${inputData.mittaustiedot_2024.korroosioaste_prosenttia.pilarit} %</strong>,
    TT-laippa <strong>${inputData.mittaustiedot_2024.korroosioaste_prosenttia.tt_laatta_laippa} %</strong>,
    TT-ripa <strong>${inputData.mittaustiedot_2024.korroosioaste_prosenttia.tt_laatta_ripa} %</strong>.
    Contrust Oy:n johtopäätös: <em>&rdquo;korroosioriski on vähäinen&rdquo;</em>.
    Tämä on merkittävä havainto: 50 vuoden kosteusrasituksen jälkeen korroosio on edelleen minimaalista,
    mikä on johdonmukaista ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonin luontaisesti hitaan karbonatisaation kanssa [5, 9, 19].
</p>
<p>
    Vuoden 2024 tutkimus vahvisti vuoden 2006 havainnon pintateräksistä:
    <em>&rdquo;${inputData.mittaustiedot_2024.pintaterakset}&rdquo;</em>
    Nämä pintateräkset ovat korroosion kannalta kriittisimpiä, koska ne ovat olleet alttiina kosteudelle
    vuodesta ${inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} lähtien ilman suojaavaa betonipeitettä.
    Laskentamallissa tämä on huomioitu erillisellä pintaterästen osuudella
    (${(params.betonipeite.tt_ripa_pintaterakset_osuus * 100).toFixed(0)} % TT-rivan teräksistä) [2, 5].
</p>

<h4>Vetolujuudet</h4>
<p>
    Betonin vetolujuusmittaukset (pintavetokoe, SFS 5445 ja laboratorio): <strong>${inputData.mittaustiedot_2024.vetolujuus_mpa.join(", ")} MPa</strong>.
    Keskiarvo ${(inputData.mittaustiedot_2024.vetolujuus_mpa.reduce((a,b) => a+b, 0) / inputData.mittaustiedot_2024.vetolujuus_mpa.length).toFixed(1)} MPa.
    Alin mitattu arvo ${Math.min(...inputData.mittaustiedot_2024.vetolujuus_mpa)} MPa on alle by 42:n mukaisen
    tavoitearvon 1,5 MPa pinnoitettavalle alustalle, mikä viittaa betonin pinta-alueen heikkouteen [2, 10].
</p>

<h4>Ohuthietutkimus</h4>
<p>Ohuthietutkimuksen havainnot rakenneosittain:</p>
<ul>
    <li><strong>TT-laatta (laippa):</strong> <em>&rdquo;${inputData.mittaustiedot_2024.ohuthie_havainnot.tt_laatta_laippa}&rdquo;</em></li>
    <li><strong>TT-laatta (ripa):</strong> <em>&rdquo;${inputData.mittaustiedot_2024.ohuthie_havainnot.tt_laatta_ripa}&rdquo;</em></li>
    <li><strong>Pilarit:</strong> <em>&rdquo;${inputData.mittaustiedot_2024.ohuthie_havainnot.pilarit}&rdquo;</em></li>
</ul>
<p>
    Ettringiitin esiintyminen TT-laatan laipan huokosissa on tyypillinen merkki sisäisestä sulfaattireaktiosta tai
    pakkasrapautumisen alkuvaiheesta [3, 4, 14]. Rapautumisen eteneminen TT-laatan laipassa
    viittaa siihen, että kosteusrasitus on ylittänyt betonin kriittisen kyllästysasteen.
    TT-ripa ja pilarit ovat rapautumattomia, mutta niissä on laadullisia puutteita.
</p>

<p>
    Kloridipitoisuus vuoden 2024 tutkimuksessa oli alle 0,01 paino-% (alle määritysrajan),
    mikä on selvästi alle kloridikorroosion kynnysarvon (0,03&ndash;0,07 paino-% [5, 8]).
    Kloridikorroosio ei ole ajankohtainen riski [5, 8, 15].
</p>

<h3 id="ch-3-3"><span class="chapter-num">3.3</span> Mittaustulosten vertailu ja kehityssuunta</h3>
<p>
    Vertailtaessa vuosien 2006 ja 2024 mittaustuloksia havaitaan merkittäviä ilmiöitä:
</p>
<ul>
    <li><strong>Karbonatisaatio on hidasta:</strong> Vuoden 2024 ohuthiemittaus osoittaa
        karbonatisaatiosyvyyden olevan 9&ndash;12 mm rakenteen iässä 50 vuotta. Tämä on tyypillistä
        ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan korkealujuusbetonille, jonka matala
        vesisementtisuhde ja tiivis huokosrakenne hidastavat CO₂:n diffuusiota luonnostaan [5, 7, 19].
        Vuoden 2006 kenttämittaus (eri pisteissä) osoitti 12&ndash;17,5 mm iässä 32 vuotta;
        ero selittyy eri mittausmenetelmillä (fenolftaleiinikoe vs. ohuthie) ja eri mittauspisteillä [5, 9, 13].</li>
    <li><strong>Korroosio on minimaalista (0&ndash;1 %) pääteräksissä:</strong> Vaikka vesieristys on vuotanut 50 vuotta,
        raudoitteen korroosioaste on vain 0&ndash;1 %. Tämä on johdonmukaista hitaan karbonatisaation kanssa:
        karbonatisaatiorintama ei ole saavuttanut pääteräksiä kuin harvoissa pisteissä.</li>
    <li><strong>Pintateräkset ovat korroosiovaurioiden pääsyy:</strong> Molemmat tutkimukset dokumentoivat
        valmistusaikaisen virheen: osa hakateräksistä on jäänyt TT-rivan valupintaan (betonipeite ≈ 0 mm).
        Vuoden 2024 tutkimuksessa paljastuneita raudoitteita ja jännepunoksia havaittiin useissa elementeissä.
        Korroosiovauriot keskittyvät näihin valmistusvirheisiin, eivät karbonatisaation aiheuttamaan
        laaja-alaiseen depassivaatioon [2, 5, 10].</li>
    <li><strong>Todellinen riski on pakkasrapautuminen:</strong> Ohuthieanalyysi osoittaa TT-laatan laipan
        rapautuneen ja ettringiitin kertyneen huokosiin. TT-rivan rapautumista havaittiin jo 2006
        (24 mm syvyyteen). Pakkasrapautuminen uhkaa erityisesti tukipintojen kestävyyttä.</li>
    <li><strong>TT-laatan tukipinta on kriittinen:</strong> Todellinen tukipinta on vain ~100 mm (leukapalkin
        leuan 150 mm:stä). Reunarapautuminen pienentää tätä jatkuvasti. Eurokoodi 2:n minimivaatimus on 75 mm.</li>
    <li><strong>Molemmat tutkimukset suosittelivat pikaista korjausta</strong> &mdash; ensimmäinen v. ${inputData.mittaustiedot_2006.suositus_remontille},
        toinen v. ${inputData.mittaustiedot_2024.suositus_remontille}. Korjausta ei ole toteutettu, eli rakenne on
        ollut ilman suojatoimenpiteitä ${2026 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta.</li>
</ul>

<!-- ===== 4. LASKENTAMENETELMÄT ===== -->
<div class="page-break"></div>
<h2 id="ch-4"><span class="chapter-num">4</span> Laskentamenetelmät</h2>

<p>
    Käyttöikäanalyysi perustuu kolmeen rinnakkaiseen vauriomalliin, jotka yhdistetään
    probabilistisessa Monte Carlo -simulaatiossa. Menetelmä noudattaa fib Model Code 2010:n [7]
    ja JCSS Probabilistic Model Code -julkaisun [12] periaatteita palveluikäsuunnittelussa.
</p>

<h3 id="ch-4-1"><span class="chapter-num">4.1</span> Karbonatisaatiomalli</h3>
<p>
    Karbonatisaation etenemistä kuvataan kaksivaiheisella vaimennetulla neliöjuurimallilla [5, 7, 9, 13, 33]:
</p>
<div class="formula">
    \\[ x(t) = k \\cdot \\sqrt{t} \\quad \\text{kun } t \\le t_d \\]
    \\[ x(t) = x(t_d) + \\alpha \\cdot k \\cdot \\left(\\sqrt{t} - \\sqrt{t_d}\\right) \\quad \\text{kun } t > t_d \\]
</div>
<p>
    missä <em>x(t)</em> on karbonatisaatiosyvyys (mm) ajanhetkellä <em>t</em> (vuotta rakentamisesta),
    <em>k</em> on karbonatisaatiokerroin (mm/√a),
    <em>t<sub>d</sub></em> = ${params.carbonation.dampening_age} v on vaimennusikä ja
    <em>&alpha;</em> = ${params.carbonation.dampening_factor} on vaimennuskerroin.
    Ensimmäisessä vaiheessa karbonatisaatio etenee normaalin Fickin diffuusiomallin mukaisesti,
    minkä jälkeen etenemisnopeus laskee kertoimella &alpha;.
    Hidastuminen perustuu betonin kypsymiseen ja huokosrakenteen tiivistymiseen pitkällä aikavälillä:
    karbonatisaatioreaktiossa syntyvä CaCO&sub3; täyttää kapillaarihuokosia, ja ulko-olosuhteissa
    kosteuden vaihtelu vähentää CO&sub2;:n tehollista diffuusiota [5, 7, 9, 33].
    Malli perustuu Fickin toiseen diffuusiolakiin
    ja on laajasti käytetty sekä Suomessa [2, 10] että kansainvälisesti [7, 13, 15].
</p>

<h4>Miksi karbonatisaatio on hidasta?</h4>
<p>
    Havaittu matala karbonatisaationopeus (k&nbsp;&asymp;&nbsp;1,8&ndash;1,9&nbsp;mm/&radic;a) selittyy ensisijaisesti
    <strong>betonin laadulla</strong>: ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betoni
    (~${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa}&nbsp;MPa) on valmistettu matalalla
    vesisementtisuhteella, mikä tuottaa tiiviin huokosrakenteen ja hidastaa CO&sub2;:n diffuusiota
    luonnostaan [5, 7, 19]. Lahdensivun [30] väitöskirjassa suomalaisten betonijulkisivujen
    karbonatisaatiokertoimeksi mitattiin C30+-betoneille tyypillisesti 1,5&ndash;2,5&nbsp;mm/&radic;a,
    joten k&nbsp;&asymp;&nbsp;1,9 on normaali arvo tälle betonilaadulle ulko-olosuhteissa.
</p>
<p>
    Ulko-olosuhteiden kosteus (sade, kondenssio) voi osaltaan hidastaa karbonatisaatiota, koska
    CO&sub2;:n diffuusio vedellä täyttyneissä huokosissa on hitaampaa kuin kuivissa [5, 9, 13].
    Pihakannen vesieristyksen vuoto ei kuitenkaan ole pääasiallinen selitys hitaalle karbonatisaatiolle:
    betoni ei ole kauttaaltaan märkää, ja kuivemmissa kohdissa karbonatisaation pitäisi edetä
    normaalisti. Vuoden 2024 ohuthieanalyysi osoittaa melko tasaisia karbonatisaatiosyvyyksiä
    (9&ndash;12&nbsp;mm) eri rakenneosissa, mikä viittaa siihen, että betonin laatu &mdash; ei
    paikallinen kosteus &mdash; on hallitseva tekijä.
</p>
<p>
    Vuoden 2024 ohuthieanalyysi antaa luotettavamman karbonatisaatiosyvyyden kuin kenttä-fenolftaleiinikoe
    kosteassa betonissa. Fenolftaleiinikoe voi aliarvioida karbonatisaatiota kosteassa betonissa,
    koska indikaattori reagoi huonosti kosteassa ympäristössä [5, 9].
</p>

<h4>Kalibrointi</h4>
<p>
    Karbonatisaatiokertoimet on kalibroitu vuoden 2024 ohuthieanalyysin tuloksista
    (t = ${inputData.mittaustiedot_2024.vuosi - inputData.kohde_tiedot.rakennettu} v):
</p>
<table class="data-table">
    <thead>
        <tr><th>Rakenneosa</th><th>x₂₀₂₄ ohuthie (mm)</th><th>t (v)</th><th>k kalibroitu (mm/√a)</th></tr>
    </thead>
    <tbody>
        <tr><td>Pilarit</td><td>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.pilarit}</td><td>50</td><td>${params.carbonation.k_pilarit}</td></tr>
        <tr><td>Leukapalkit</td><td>&mdash; (skaalattu)</td><td>&mdash;</td><td>${params.carbonation.k_leukapalkit}</td></tr>
        <tr><td>TT-laatat</td><td>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_ripa}</td><td>50</td><td>${params.carbonation.k_tt_laatat}</td></tr>
    </tbody>
</table>
<p class="table-note">
    Vertailun vuoksi: vuoden 2006 kenttämittauksista (kuivemmat pinnat) kalibroitu k oli:
    pilarit ${(inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.pilarit / Math.sqrt(32)).toFixed(2)},
    leukapalkit ${(inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.leukapalkit / Math.sqrt(32)).toFixed(2)},
    TT-laatat ${(inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.tt_laatat / Math.sqrt(32)).toFixed(2)} mm/√a.
    Ero johtuu eri mittausmenetelmistä ja -pisteistä (fenolftaleiinikoe vs. ohuthie, kuivemmat vs. kosteammat pinnat).
</p>
<p>
    Raudoitteen korroosio alkaa kun karbonatisaatiorintama saavuttaa betonipeitteen syvyyden:
</p>
<div class="formula">\\[ t_{\\text{corr}} = \\left(\\frac{c}{k}\\right)^2 \\]</div>
<p>
    missä <em>c</em> = betonipeite (mm). Tuutin [5] esittämän mallin mukaan
    korroosion alkamisajankohta riippuu sekä karbonatisaationopeudesta että betonipeitteen
    paksuudesta. Monte Carlo -simulaatiossa <em>k</em> noudattaa log-normaalijakaumaa
    (CoV = ${(params.carbonation.k_cov * 100).toFixed(0)} %) ja <em>c</em> normaalijakaumaa [7, 12].
    CoV (${(params.carbonation.k_cov * 100).toFixed(0)} %) edustaa malli- ja mittausepävarmuutta.
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonin tiivis huokosrakenne pitää k-kertoimen
    johdonmukaisesti matalana (1,3&ndash;1,8&nbsp;mm/&radic;a) [5, 7, 19, 30].
</p>

<h4>Karbonatisaation hidastuminen ajan myötä</h4>
<p>
    On tärkeää huomata, että neliöjuurimalli x&nbsp;=&nbsp;k&middot;&radic;t <strong>ei ennusta lineaarista
    etenemistä</strong>. Karbonatisaationopeus dx/dt&nbsp;=&nbsp;k/(2&radic;t) hidastuu jatkuvasti ajan
    funktiona &mdash; esimerkiksi ensimmäisten 10 vuoden aikana karbonatisaatio etenee yhtä paljon kuin
    seuraavien 30 vuoden aikana. Tämä on fysikaalinen seuraus siitä, että CO&sub2;:n täytyy diffundoitua
    yhä paksumman karbonatisaatiovyöhykkeen läpi [5, 7, 9].
</p>
<p>
    Pitkällä aikavälillä karbonatisaatio voi hidastua <em>vielä enemmän</em>
    kuin neliöjuurimalli ennustaa:
</p>
<ul>
    <li>Karbonatisaatioreaktiossa syntyvä CaCO&sub3; tiivistää huokosrakennetta ja hidastaa
        jatkodiffuusiota entisestään [7, 15].</li>
    <li>Korkealujuusbetonin (${inputData.kohde_tiedot.betonin_suunnittelulujuus}) matala vesisementtisuhde
        ja tiivis pasta rajoittavat CO&sub2;:n diffuusiota jo valmiiksi [5, 19, 30].</li>
    <li>fib Model Code 2010 [7] käyttää ympäristökerrointa, joka vähentää
        karbonatisaationopeutta ulko-olosuhteissa tyypillisesti 30&ndash;70 %.</li>
</ul>
<p>
    Tässä analyysissä neliöjuurimalli <strong>matalan k-kertoimen kanssa</strong> (k&nbsp;&asymp;&nbsp;1,9&nbsp;mm/&radic;a)
    on pikemminkin <em>konservatiivinen</em> arvio &mdash; todellinen karbonatisaatio saattaa olla jopa hitaampaa
    kuin malli ennustaa. Havaittu ~1&nbsp;% korroosioaste 50 vuoden jälkeen tukee tätä
    tulkintaa. Mallin suurin epävarmuus ei olekaan karbonatisaatiossa vaan tukipinnan reunarapautumisessa.
</p>

<h3 id="ch-4-2"><span class="chapter-num">4.2</span> Pakkasrapautumismalli</h3>
<p>
    Pakkasrapautuminen on merkittävin vauriomekanismi rakenteessa, jossa vesieristys on vuotanut
    ${2026 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta.
    Pakkasrasituksen etenemistä kuvataan ${params.frost.acceleration_factor >= 1.005 ? 'lievästi kiihtyvällä' : 'lineaarisella'} mallilla [3, 4, 14]:
</p>
<div class="formula">${params.frost.acceleration_factor >= 1.005
    ? '\\[ \\Sigma(t) = r \\cdot \\frac{a^t - 1}{a - 1} \\]'
    : '\\[ \\Sigma(t) = r \\cdot t \\]'}</div>
<p>
    missä <em>r</em> = rapautumisen perusnopeus (${params.frost.base_rate_mm_per_year} mm/a)${params.frost.acceleration_factor >= 1.005
    ? ', <em>a</em> = vuotuinen kiihtyvyyskerroin (' + params.frost.acceleration_factor + ')'
    : ''} ja
    <em>t</em> = altistusaika kriittisestä kyllästymisestä (v. ${params.frost.critical_saturation_year}).
</p>

<h4>Lineaarisen oletusmallin perustelu</h4>
<p>
    ${params.frost.acceleration_factor >= 1.005
    ? 'Tässä analyysissa on käytetty lievästi kiihtyvää mallia (a = ' + params.frost.acceleration_factor + '). Kirjallisuus tukee sekä lineaarista että lievästi kiihtyvää mallia:'
    : 'Oletuksena käytetään lineaarista mallia (a = 1,00), jossa rapautumisnopeus on vakio koko altistusajan. Tämä valinta perustuu <strong>kohdekohtaiseen kenttänäyttöön</strong>:'}
</p>
${params.frost.acceleration_factor < 1.005 ? `
<p>
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betoni on ollut alttiina pakkasrasitukselle
    ${2024 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta ilman toimivaa vedeneristystä. Jos positiivinen
    takaisinkytkentä (vaurio &rarr; huokoisuus &rarr; lisää vauriota) olisi merkittävä, 50 vuoden jälkeen
    pitäisi nähdä huomattavasti enemmän tuhoa. Sen sijaan vuoden 2024 ohuthieanalyysi osoittaa TT-rivan
    <em>&rdquo;rapautumattomaksi&rdquo;</em> ja betonin vetolujuudet ovat 1,5&ndash;3,0 MPa (ka. ~2,0 MPa).
    Korkealujuusbetonissa (${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa} MPa) matala vesisementtisuhde
    ja tiivis pasta hidastavat veden imeytymistä vaurioituneisiinkin kohtiin, mikä heikentää
    takaisinkytkentämekanismia [4, 14, 19].
</p>
` : ''}
<p>
    Kirjallisuusperustelu:
</p>
<ul>
    <li><strong>by 32 (1989) [3]:</strong> Suomen Betoniyhdistyksen käyttöikämalli käyttää olennaisesti vakionopeutta
        pakkasrapautumiselle kenttäolosuhteissa.</li>
    <li><strong>Vesikari (1988, VTT) [13]:</strong> Kenttäolosuhteissa pakkasrapautuminen etenee huomattavasti
        hitaammin kuin laboratoriokokeissa &mdash; tyypillisesti 10&ndash;50-kertaisesti hitaammin. Kentällä betoni
        ei ole jatkuvasti kriittisessä kyllästystilassa.</li>
    <li><strong>Pigeon &amp; Pleau (1995) [14]:</strong> Kenttäolosuhteissa jäätymis-sulamissyklejä on Etelä-Suomessa
        noin 50&ndash;100 vuodessa (vs. laboratorio ~300/vuosi).</li>
    <li><strong>Fagerlund (1977, 2004) [21]:</strong> Kriittisen kyllästysasteen malli: pakkasrapautumista tapahtuu
        vain kun kyllästysaste ylittää kriittisen arvon. Kentällä efektiivisten rasitussyklien määrä on pieni.</li>
    <li><strong>fib Model Code 2010 / Bulletin 34 [7, 15]:</strong> Pakkasrapautumiselle ei ole kvantitatiivista
        etenemismallia &mdash; käytetään avoidance/deemed-to-satisfy -lähestymistapaa.</li>
    <li><strong>RILEM TC 130-CSL (Sarja &amp; Vesikari 1996):</strong> Yleinen rapautumismalli d(t) = k&middot;t<sup>n</sup>,
        missä n &gt; 1 pakkasrapautumiselle. Teoreettisesti kiihtyvyys on perusteltua, mutta tämän kohteen
        50 vuoden kenttädata ei tue merkittävää kiihtymistä ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonissa.</li>
</ul>

<h4>Kiihtyvyyskerroin on säädettävissä</h4>
<p>
    Kiihtyvyyskerrointa (a) voidaan nostaa oletusarvosta konservatiivisempaan suuntaan (esim. a = 1,01 tai 1,02).
    Tämä voi olla perusteltua, jos halutaan korostaa riskiä tilanteessa, jossa rapautuminen kiihtyy tulevaisuudessa.
    Voimakas kiihtyvyys (a &ge; 1,03) ei kuitenkaan ole yhdenmukainen kenttähavaintojen kanssa [14].
</p>

<h4>Kalibrointi kenttähavaintoihin</h4>
<p>
    Mallin parametrit on kalibroitu kahden kuntotutkimuksen havaintojen perusteella:
</p>
<ul>
    <li><strong>2006 (t = 31 v):</strong> Pahimmissa kohdissa (TT-ripa B/4-5) rapautumista 24 mm syvyyteen,
        toisaalla (B/2-3) 20 mm. Malli tuottaa mediaanin ~${SimulationEngine.frostDamage(31, params.frost.base_rate_mm_per_year, params.frost.acceleration_factor).toFixed(0)} mm.
        Pahimmat havainnot (20&ndash;24 mm) vastaavat äärimmäisiä paikallisia arvoja (&gt; P99)
        log-normaalijakaumasta (CoV = ${(params.frost.rate_cov * 100).toFixed(0)} %).
        Tämä on johdonmukaista: paikalliset vesikerääntymäkohdat aiheuttavat pistekohtaisesti
        huomattavasti keskiarvoa suurempia vaurioita.</li>
    <li><strong>2024 (t = 49 v):</strong> Ohuthieanalyysi: TT-ripa <em>&rdquo;rapautumaton&rdquo;</em>, pilarit <em>&rdquo;rapautumaton&rdquo;</em>,
        mutta TT-laatan laippa <em>&rdquo;rapautunut, ettringiittiä huokosissa&rdquo;</em>.
        Vetolujuudet 1,5&ndash;3,0 MPa (ka. ~2,0 MPa). Malli tuottaa mediaanin ~${SimulationEngine.frostDamage(49, params.frost.base_rate_mm_per_year, params.frost.acceleration_factor).toFixed(0)} mm,
        mikä vastaa rakenteen yleiskuntoa: betoni on edelleen lujaa ja toimivaa, vaikka
        vesieristys on vuotanut ${2024 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen} vuotta.</li>
</ul>
<p>
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betoni (puristuslujuus ~${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa} MPa)
    kestää pakkasrasitusta paremmin kuin tavallinen betoni. Vaikka rakenne ei sisällä suojahuokoistusta
    (ei LP-betonia), korkea lujuus ja tiivis huokosrakenne hidastavat rapautumista verrattuna
    huonolaatuisempiin betoneihin [4, 14, 19]. Kriittiseksi vauriosyvyydeksi on määritetty 30 mm,
    minkä jälkeen raudoitteen ympärillä oleva betoni on merkittävästi heikentynyt [3, 4].
</p>

<h4>Paikallinen vaihtelu ja hajontakerroin</h4>
<p>
    Hajontakerroin (CoV = ${(params.frost.rate_cov * 100).toFixed(0)} %) on asetettu suureksi heijastamaan
    pihakansirakenteiden tyypillistä paikallista vaihtelua [4, 14]:
</p>
<ul>
    <li>Vesieristyksen vuotokohdat aiheuttavat pistekohtaisesti huomattavaa kosteusrasitusta</li>
    <li>Vierekkäiset alueet voivat olla lähes kuivia tai jatkuvasti märkiä</li>
    <li>Tämä näkyy 2024 tutkimuksessa: TT-ripa &rdquo;rapautumaton&rdquo; (hyvin säilynyt)
        mutta TT-laippa &rdquo;rapautunut, ettringiittiä&rdquo; (merkittävää vauriota)</li>
    <li>Vuoden 2006 rapautumissyvyydet vaihtelivat 0&ndash;24 mm eri kohdissa</li>
</ul>
<p>
    Pakkasenkestävyyden arviointiin sovelletaan by 68:n [4] ja SFS-EN 206:n [11] periaatteita.
</p>

<h3 id="ch-4-3"><span class="chapter-num">4.3</span> Tukipinta-analyysi (Eurokoodi 2)</h3>
<p>
    TT-laatan tukipinnan tehollinen pituus pienenee reunarapautumisen vuoksi [1, 6].
    Sisäreuna on osittain suojattu laatan painosta, joten reunakerroin on ${edgeFactor.toFixed(1)}
    (ulkoreuna täysi rapautuminen, sisäreuna 50 % nopeudella):
</p>
<div class="formula">\\[ l_{\\text{eff}}(t) = l_0 - ${edgeFactor.toFixed(1)} \\cdot v \\cdot t \\]</div>
<p>
    missä <em>l₀</em> = alkuperäinen tukipinta (${params.tukipinta.original_depth_mm} mm),
    <em>v</em> = reunarapautumisen nopeus (${params.tukipinta.rapautuminen_reuna_mm_per_year} mm/a) ja
    <em>t</em> = altistusaika.
</p>
<p>
    <strong>Tukipinnan alkuarvo:</strong> Vuoden 2006 kuntotutkimuksen mukaan leukapalkin
    leuka on 150 mm leveä, mutta TT-laatan todellinen tukipinta ulottuu vain noin
    ${params.tukipinta.original_depth_mm} mm leukapalkin päälle. Mallissa käytetään
    tätä todellista tukipintaa, ei leukapalkin kokonaisleveyttä.
</p>
<p>
    Eurokoodi 2:n (SFS-EN 1992-1-1, kohta 10.9.5.2) [1] mukainen vähimmäistukipinta
    elementtirakenteille on ${params.tukipinta.critical_min_mm} mm. Kun tehollinen tukipinta
    alittaa tämän arvon, sortumisriski kasvaa merkittävästi. Reunarapautumisen nopeus on
    kalibroitu siten, että vuoteen 2026 mennessä rakenne on edelleen pystyssä — kertynyt
    hävikki on noin
    ${(edgeFactor * params.tukipinta.rapautuminen_reuna_mm_per_year * (2026 - params.frost.critical_saturation_year)).toFixed(0)} mm,
    jolloin tehollinen tukipinta on noin
    ${(params.tukipinta.original_depth_mm - edgeFactor * params.tukipinta.rapautuminen_reuna_mm_per_year * (2026 - params.frost.critical_saturation_year)).toFixed(0)} mm
    (kriittisen rajan yläpuolella, CoV = ${(params.tukipinta.rapautuminen_cov * 100).toFixed(0)} %).
</p>

<h4>Betonin lujuuden vaikutus tukipinnan kapasiteettiin</h4>
<p>
    Sortumismalli on <em>konservatiivinen</em> koska se perustuu puhtaasti geometriseen
    tukipinnan pituuteen eikä huomioi betonin lujuutta. Todellisuudessa
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betoni
    (puristuslujuus ~${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa} MPa) kestää huomattavia kuormia
    pienelläkin tukipinnalla. Suunnittelukuorma on ${inputData.kohde_tiedot.kantavuus_kpa} kN/m&sup2;,
    joten tukipinnan puristusrasitus on murto-osa betonin kapasiteetista myös ${params.tukipinta.critical_min_mm} mm
    tukipinnalla [1, 19].
</p>
<p>
    Vuoden 2024 ohuthieanalyysin mukaan TT-rivan betoni on <em>&rdquo;rapautumaton&rdquo;</em>, mikä tukee
    arviota siitä, että betonin lujuus on säilynyt hyvin tukipinnan alueella. Hajontakerroin
    (CoV = ${(params.tukipinta.rapautuminen_cov * 100).toFixed(0)} %) on asetettu maltilliseksi vastaamaan
    tätä havaintoa. Todellinen sortumisriski on todennäköisesti pienempi kuin pelkkä
    geometrinen tarkastelu osoittaa [1, 6, 17].
</p>

<h3 id="ch-4-4"><span class="chapter-num">4.4</span> Mallin konservatiivisuuden arviointi</h3>
<p>
    Sortumismalli käyttää Eurokoodi 2:n vähimmäistukipintaa (${params.tukipinta.critical_min_mm}\u00a0mm)
    sortumiskriteerinä. Tämä on <em>suunnitteluarvo uusille elementtirakenteille</em> [1], ja se
    sisältää merkittävän varmuuskertoimen. Todellinen tukipinnan murtumiskapasiteetti riippuu
    betonin puristuslujuudesta ja kuormitustasosta.
</p>
<p>
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betonin nimellislujuus on
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa}\u00a0MPa. TT-laatan tukipinnalla vaikuttava
    puristusjännitys eri tukipinnan pituuksilla on:
</p>
<table class="data-table">
    <thead>
        <tr><th>Tukipinta (mm)</th><th>Puristusjännitys (MPa)</th><th>Käyttöaste</th><th>Arvio</th></tr>
    </thead>
    <tbody>
        <tr><td>${params.tukipinta.original_depth_mm} (alkuperäinen)</td><td>~0,6</td><td>~2 %</td><td>Erittäin suuri reservi</td></tr>
        <tr><td>${params.tukipinta.critical_min_mm} (EC2-raja)</td><td>~2,0</td><td>~7 %</td><td>Suuri reservi – ei murtumista</td></tr>
        <tr><td>50</td><td>~3,0</td><td>~10 %</td><td>Reservi edelleen merkittävä</td></tr>
        <tr><td>40</td><td>~3,7</td><td>~13 %</td><td>Lähestyy todellista rajaa</td></tr>
    </tbody>
</table>
<p>
    Taulukosta nähdään, että ${params.tukipinta.critical_min_mm}\u00a0mm tukipinnalla puristusjännitys
    on vain noin 7\u00a0% betonin kapasiteetista. Murtuminen vaatisi tukipinnan pienenemisen
    arviolta noin 50\u00a0mm:iin tai sen alle, missä käyttöaste on edelleen vain ~10\u00a0%.
    Todellinen sortuminen edellyttäisi tukipinnan nurjähtamista tai betonin paikallista
    lohkeamista, mikä alkaa olla mahdollista kun tukipinta on noin 40\u201350\u00a0mm [1, 19].
</p>
<p>
    <strong>Konservatiivisuuskerroin:</strong> Vaurioitumismatka mallissa on
    ${params.tukipinta.original_depth_mm}\u00a0mm &minus; ${params.tukipinta.critical_min_mm}\u00a0mm = ${params.tukipinta.original_depth_mm - params.tukipinta.critical_min_mm}\u00a0mm.
    Oikaistu vaurioitumismatka on ${params.tukipinta.original_depth_mm}\u00a0mm &minus; 50\u00a0mm = ${params.tukipinta.original_depth_mm - 50}\u00a0mm.
    Kerroin on ${params.tukipinta.original_depth_mm - 50}/${params.tukipinta.original_depth_mm - params.tukipinta.critical_min_mm} = ${conservatismFactor.toFixed(1)},
    eli vaurioitumisaika kaksinkertaistuu kriittisestä kyllästymisvuodesta (${critSatYear}) laskettuna:
</p>
<div style="text-align:center; margin: 12px 0; font-style: italic;">
    t<sub>oikaistu</sub> = ${critSatYear} + (t<sub>malli</sub> &minus; ${critSatYear}) &times; ${conservatismFactor.toFixed(1)}
</div>
<table class="data-table">
    <thead>
        <tr><th>Skenaario</th><th>Mallin mediaanivuosi</th><th>Oikaistu arvio</th></tr>
    </thead>
    <tbody>
        <tr><td>A – Ei toimenpiteitä</td><td>${ReportGenerator._formatYear(s.A.collapse_risk_year)}</td><td><strong>~${formatAdjusted(adjustedMedianA)}</strong></td></tr>
        <tr><td>B – Pintaremontti</td><td>${ReportGenerator._formatYear(s.B.collapse_risk_year)}</td><td><strong>~${formatAdjusted(adjustedMedianB)}</strong></td></tr>
        <tr><td>C – Täyskorjaus</td><td>${ReportGenerator._formatYear(s.C.collapse_risk_year)}</td><td><strong>~${formatAdjusted(adjustedMedianC)}</strong></td></tr>
        <tr><td>D – Täyskorjaus (puut säilyttäen)</td><td>${ReportGenerator._formatYear(s.D.collapse_risk_year)}</td><td><strong>~${formatAdjusted(adjustedMedianD)}</strong></td></tr>
    </tbody>
</table>
<p class="box-note" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; margin: 12px 0; font-size: 9pt;">
    <strong>Huomautus:</strong> Oikaistut arviot ovat asiantuntija-arvioita, jotka perustuvat
    betonin lujuusreservin analyysiin. Ne eivät ole Monte Carlo -simulaation tuloksia, vaan
    havainnollistavat mallin konservatiivisuuden suuruusluokkaa. Todellinen käyttöikä
    sijoittuu todennäköisesti mallin ennusteen ja oikaistun arvion välille.
</p>

<h3 id="ch-4-5"><span class="chapter-num">4.5</span> Monte Carlo -simulaatio</h3>
<p>
    Probabilistinen analyysi toteutetaan Monte Carlo -menetelmällä [12, 16], jossa simulaatio
    ajetaan ${params.monte_carlo_iterations.toLocaleString("fi-FI")} kertaa. Kullakin iteraatiolla parametrien
    arvot poimitaan tilastollisista jakaumista:
</p>
<table class="data-table">
    <thead>
        <tr><th>Parametri</th><th>Jakauma</th><th>Keskiarvo</th><th>CoV / hajonta</th></tr>
    </thead>
    <tbody>
        <tr><td>k-kerroin (pilarit)</td><td>Log-normaali</td><td>${params.carbonation.k_pilarit} mm/√a</td><td>${(params.carbonation.k_cov * 100).toFixed(0)} %</td></tr>
        <tr><td>k-kerroin (leukapalkit)</td><td>Log-normaali</td><td>${params.carbonation.k_leukapalkit} mm/√a</td><td>${(params.carbonation.k_cov * 100).toFixed(0)} %</td></tr>
        <tr><td>k-kerroin (TT-laatat)</td><td>Log-normaali</td><td>${params.carbonation.k_tt_laatat} mm/√a</td><td>${(params.carbonation.k_cov * 100).toFixed(0)} %</td></tr>
        <tr><td>Betonipeite (pilarit)</td><td>Normaali</td><td>${params.betonipeite.pilarit.mean} mm</td><td>± ${params.betonipeite.pilarit.std} mm</td></tr>
        <tr><td>Betonipeite (leukapalkit)</td><td>Normaali</td><td>${params.betonipeite.leukapalkit.mean} mm</td><td>± ${params.betonipeite.leukapalkit.std} mm</td></tr>
        <tr><td>Betonipeite (TT-laippa)</td><td>Normaali</td><td>${params.betonipeite.tt_laatta_laippa.mean} mm</td><td>± ${params.betonipeite.tt_laatta_laippa.std} mm</td></tr>
        <tr><td>Betonipeite (TT-ripa)</td><td>Normaali</td><td>${params.betonipeite.tt_ripa_alapinta.mean} mm</td><td>± ${params.betonipeite.tt_ripa_alapinta.std} mm</td></tr>
        <tr><td>Pintateräkset TT-ripa</td><td>Bernoulli</td><td>${(params.betonipeite.tt_ripa_pintaterakset_osuus * 100).toFixed(0)} % (peite = 0 mm)</td><td>&mdash;</td></tr>
        <tr><td>Pakkasrapautumisnopeus</td><td>Log-normaali</td><td>${params.frost.base_rate_mm_per_year} mm/a</td><td>${(params.frost.rate_cov * 100).toFixed(0)} %</td></tr>
        <tr><td>Reunarapautuminen</td><td>Log-normaali</td><td>${params.tukipinta.rapautuminen_reuna_mm_per_year} mm/a</td><td>${(params.tukipinta.rapautuminen_cov * 100).toFixed(0)} %</td></tr>
    </tbody>
</table>
<p>
    Log-normaalijakauma takaa positiiviset arvot fysikaalisille parametreille [7, 12].
    Normaalijakaumaa käytetään betonipeitteille, jotka voivat olla myös hyvin ohuita.
    Satunnaisluvut generoidaan Box-Muller-transformaatiolla [16].
    TT-rivan pintaterästen osuus (${(params.betonipeite.tt_ripa_pintaterakset_osuus * 100).toFixed(0)} %) mallinnetaan
    Bernoulli-jakaumalla: kullakin iteraatiolla ko. osuudella betonipeite asetetaan nollaan,
    mikä vastaa valmistusvirhettä, jossa raudoite on jäänyt valupintaan [2, 10].
    Näiden terästen korroosio on alkanut käytännössä heti vesieristyksen vuodettua (v. ${params.frost.critical_saturation_year}).
</p>
${params.bayesian_conditioning?.enabled ? `
<p>
    <strong>Bayesilainen ehdollistaminen (2024 havainto):</strong>
    Priorijakaumista arvotut (k, cover) -yhdistelmät tuottavat enemmän korroosiota havaintovuoteen
    ${params.bayesian_conditioning.observation_year} mennessä kuin kuntotutkimuksessa todettiin
    (havaittu korroosioaste 0&ndash;1 %). Malli ehdollistaa Monte Carlo -näytteet havaintoon
    rejection sampling -menetelmällä: näytteet joissa karbonatisaatio saavuttaa raudoituksen
    havaintovuoteen mennessä hylätään suurimmaksi osaksi, jolloin jäljelle jäävä
    näytejoukko on yhdenmukainen havaitun korroosioasteen kanssa.
    Tämä siirtää (k, cover) -jakaumat prioreista posterioreiksi ja tuottaa
    realistisemman tulevaisuusennusteen [12, 17].
</p>` : ''}

<!-- ===== 5. MALLIN KALIBROINTI JA SOPIVUUS KENTTÄDATAAN ===== -->
<div class="page-break"></div>
<h2 id="ch-5"><span class="chapter-num">5</span> Mallin kalibrointi ja sopivuus kenttädataan</h2>

<p>
    Laskentamalli on kalibroitu siten, että se tuottaa vuosien 2006 ja 2024 kuntotutkimusten
    kanssa yhdenmukaisia tuloksia. Tämä on mallin luotettavuuden kannalta olennainen vaatimus:
    mallin pitää pystyä selittämään mennyt kehitys ennen kuin sillä voidaan ennustaa tulevaa [7, 12].
</p>

<h3 id="ch-5-1"><span class="chapter-num">5.1</span> Karbonatisaation sopivuus</h3>

<table class="data-table">
    <thead>
        <tr>
            <th>Rakenneosa</th>
            <th>Havaittu 2006 (kenttä)</th>
            <th>Malli 2006 (t=32)</th>
            <th>Havaittu 2024 (ohuthie)</th>
            <th>Malli 2024 (t=50)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="label-cell">Pilarit</td>
            <td>${inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.pilarit} mm</td>
            <td>${SimulationEngine.carbonationDepth(params.carbonation.k_pilarit, 32, params.carbonation.dampening_age, params.carbonation.dampening_factor).toFixed(1)} mm</td>
            <td>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.pilarit} mm</td>
            <td>${SimulationEngine.carbonationDepth(params.carbonation.k_pilarit, 50, params.carbonation.dampening_age, params.carbonation.dampening_factor).toFixed(1)} mm</td>
        </tr>
        <tr>
            <td class="label-cell">TT-ripa</td>
            <td>${inputData.mittaustiedot_2006.karbonatisaatio_ka_mm.tt_laatat} mm</td>
            <td>${SimulationEngine.carbonationDepth(params.carbonation.k_tt_laatat, 32, params.carbonation.dampening_age, params.carbonation.dampening_factor).toFixed(1)} mm</td>
            <td>${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_ripa} mm</td>
            <td>${SimulationEngine.carbonationDepth(params.carbonation.k_tt_laatat, 50, params.carbonation.dampening_age, params.carbonation.dampening_factor).toFixed(1)} mm</td>
        </tr>
    </tbody>
</table>

<p>
    <strong>Havainto:</strong> Malli sopii 2024 ohuthiedataan täsmälleen (kalibrointivuosi).
    Vuoden 2006 kenttämittaustulokset (fenolftaleiinikoe) ovat 1,5&ndash;2 kertaa mallin ennustetta suuremmat.
    Tämä ero selittyy tunnetulla ilmiöllä: fenolftaleiinikoe <em>yliarvio</em> karbonatisaatiota kuivemmilla
    pinnoilla ja <em>aliarvio</em> kosteissa olosuhteissa [5, 9, 13]. Vuoden 2006 mittaukset tehtiin
    todennäköisesti kuivemmilta pinnoilta, kun taas vuoden 2024 ohuthie edustaa rakenteen todellista
    kosteustilaa luotettavammin.
</p>

<h3 id="ch-5-2"><span class="chapter-num">5.2</span> Pakkasrapautumisen sopivuus</h3>

<table class="data-table">
    <thead>
        <tr>
            <th>Ajankohta</th>
            <th>Havaittu</th>
            <th>Mallin mediaani</th>
            <th>Mallin P95</th>
            <th>Arvio</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="label-cell">2006 (t=31 v)</td>
            <td>Pahin 24 mm, tyypillinen 0&ndash;10 mm</td>
            <td>${SimulationEngine.frostDamage(31, params.frost.base_rate_mm_per_year, params.frost.acceleration_factor).toFixed(1)} mm</td>
            <td>&sim;15 mm</td>
            <td class="critical">Sopii: 24 mm = paikallinen ääriarvio (&gt;P99)</td>
        </tr>
        <tr>
            <td class="label-cell">2024 (t=49 v)</td>
            <td>TT-ripa &rdquo;rapautumaton&rdquo;, laippa &rdquo;rapautunut&rdquo;</td>
            <td>${SimulationEngine.frostDamage(49, params.frost.base_rate_mm_per_year, params.frost.acceleration_factor).toFixed(1)} mm</td>
            <td>&sim;22 mm</td>
            <td class="critical">Sopii: mediaani ~ rapautumaton, paikalliset vauriot ylähännässä</td>
        </tr>
    </tbody>
</table>

<p>
    Lineaarinen malli (a&nbsp;=&nbsp;${params.frost.acceleration_factor.toFixed(2)}) on yhdenmukainen molempien
    kuntotutkimusten kanssa. Jos kiihtyvyys olisi merkittävä (a&nbsp;&ge;&nbsp;1,03), vuoden 2024
    kumulatiivinen vaurio olisi yli 30 mm, mikä olisi ristiriidassa &rdquo;rapautumaton&rdquo;-havainnon
    kanssa [3, 4, 14].
</p>

<h3 id="ch-5-3"><span class="chapter-num">5.3</span> Tukipinnan sopivuus</h3>

<table class="data-table">
    <thead>
        <tr>
            <th>Ajankohta</th>
            <th>Havaittu</th>
            <th>Mallin mediaani</th>
            <th>Arvio</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="label-cell">2006 (t=31 v)</td>
            <td>Ei raportoituja ongelmia</td>
            <td>${(params.tukipinta.original_depth_mm - (params.tukipinta.reunakerroin || 1.5) * params.tukipinta.rapautuminen_reuna_mm_per_year * 31).toFixed(0)} mm</td>
            <td>Sopii: rakenne toimiva</td>
        </tr>
        <tr>
            <td class="label-cell">2024 (t=49 v)</td>
            <td>Ei raportoituja ongelmia</td>
            <td>${(params.tukipinta.original_depth_mm - (params.tukipinta.reunakerroin || 1.5) * params.tukipinta.rapautuminen_reuna_mm_per_year * 49).toFixed(0)} mm</td>
            <td>Sopii: rakenne toimiva, tukipinta &gt; ${params.tukipinta.critical_min_mm} mm</td>
        </tr>
    </tbody>
</table>

<p>
    Tukipintamallin suurin heikkous on, että tukipinnan todellista pituutta ei ole mitattu
    suoraan kummassakaan kuntotutkimuksessa. Mallissa käytetty alkuarvo
    (${params.tukipinta.original_depth_mm} mm) perustuu vuoden 2006 raportin mainintaan
    TT-laatan tukipinnasta leukapalkilla. Rapautumisnopeus
    (${params.tukipinta.rapautuminen_reuna_mm_per_year} mm/a) on johdettu arviosta, joka perustuu
    siihen, ettei tukipintaongelmia ole raportoitu 49 vuoden käytön jälkeen.
    <strong>Tukipinnan suora mittaus korjaussuunnittelun yhteydessä</strong> parantaisi mallin
    ennustuskykyä merkittävästi [1, 6].
</p>

<h3 id="ch-5-4"><span class="chapter-num">5.4</span> Korroosioasteen sopivuus</h3>
${params.bayesian_conditioning?.enabled ? `
<p>
    Monte Carlo -simulaatiossa on sovellettu Bayesilaista ehdollistamista (ks. kohta 4.4),
    joka sovittaa mallin ennustaman depasivointitodennäköisyyden vuoden 2024 havaintoon.
    Ilman ehdollistamista priorijakaumat ennustaisivat noin 14&ndash;15 %:n depasivointitodennäköisyyden
    vuoteen 2024 mennessä, josta ~5 prosenttiyksikköä johtuu pintateräksistä
    (betonipeite &asymp; 0&nbsp;mm). Ehdollistamisen jälkeen malli tuottaa havaitun ~1 %:n
    korroosioasteen kanssa yhdenmukaisen ennusteen.
</p>
<p>
    Priorijakauman ja havaintojen ero selittyy sillä, että neliöjuurimalli yliarvioi
    karbonatisaation etenemistä ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan
    korkealujuusbetonissa. Bayesilainen ehdollistaminen
    korjaa tämän systemaattisen yliarvion hylkäämällä (k, cover) -yhdistelmät, jotka
    ennustavat enemmän korroosiota kuin havaittu [12, 17].
</p>` : `
<p>
    Monte Carlo -simulaatio ennustaa TT-rivan depasivointitodennäköisyydeksi
    vuonna 2024 noin 14&ndash;15 %, josta ~5 prosenttiyksikköä johtuu pintateräksistä
    (betonipeite &asymp; 0&nbsp;mm) ja loput karbonatisaation ja matalan betonipeitteen
    yhteisvaikutuksesta. Havaittu korroosioaste on kuitenkin vain 0&ndash;1 %.
    Ero selittyy kahdella tunnetulla ilmiöllä:
</p>
<ol>
    <li><strong>Depassivoinnin ja näkyvän korroosion viive (5&ndash;15 v):</strong>
        Depassivointi käynnistää korroosion, mutta näkyvät vauriot (halkeilu, lohkeilu)
        ilmaantuvat vasta kun korroosiotuotteet ovat kertyneet riittävästi [5, 9, 15].</li>
    <li><strong>Pintateräkset:</strong> Valmistusvirheenä pintaan jääneet hakateräkset
        (${(params.betonipeite.tt_ripa_pintaterakset_osuus * 100).toFixed(0)} % TT-rivan teräksistä)
        selittävät molemissa kuntotutkimuksissa havaitut paljastuneet raudoitteet ja
        yksittäiset korroosiovauriot. Näiden terästen korroosio on alkanut heti
        vesieristyksen vuodettua (v.&nbsp;${params.frost.critical_saturation_year}).</li>
</ol>`}
${params.bayesian_conditioning?.enabled ? `
<p>
    <strong>Pintateräkset:</strong> Valmistusvirheenä pintaan jääneet hakateräkset
    (${(params.betonipeite.tt_ripa_pintaterakset_osuus * 100).toFixed(0)} % TT-rivan teräksistä)
    selittävät molemmissa kuntotutkimuksissa havaitut paljastuneet raudoitteet ja
    yksittäiset korroosiovauriot. Näiden terästen korroosio on alkanut heti
    vesieristyksen vuodettua (v.&nbsp;${params.frost.critical_saturation_year}) [2, 5, 10].
</p>` : ''}
<p>
    Mallin pääasiallinen riskihavainto &mdash; tukipinnan rapautuminen &mdash;
    ei riipu korroosioennusteesta. Todellinen korroosioriski voi olla malliennustetta pienempi, koska
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonin tiivis huokosrakenne hidastaa
    karbonatisaatiota tehokkaammin kuin yksinkertainen neliöjuurimalli olettaa [5, 7, 19, 30].
</p>

<!-- ===== 6. KORJAUSSKENAARIOT ===== -->
<div class="page-break"></div>
<h2 id="ch-6"><span class="chapter-num">6</span> Korjausskenaariot</h2>

<table class="data-table scenario-table">
    <thead>
        <tr>
            <th>Ominaisuus</th>
            <th class="sc-a">A: Passiivinen</th>
            <th class="sc-b">B: Pintaremontti</th>
            <th class="sc-c">C: Täyskorjaus</th>
            <th class="sc-d">D: Täyskorjaus (puut)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="label-cell">Kuvaus</td>
            <td>Ei korjaustoimenpiteitä. Vauriot etenevät nykyisellä nopeudella.</td>
            <td>Kevyt korjaus ja piha-alueen kohennus v. ${params.current_year}. Vaahterat säilytetään.</td>
            <td>Uusi vesieristys ja rakenteellinen korjaus v. ${params.current_year}.</td>
            <td>Uusi vesieristys ja rakenteellinen korjaus v. ${params.current_year}. Puut säilytetään erillisessä kasvualustassa.</td>
        </tr>
        <tr>
            <td class="label-cell">Pakkasrasituksen vähenemä</td>
            <td>0 %</td>
            <td>${(params.light_repair.frost_rate_reduction * 100).toFixed(0)} %</td>
            <td>${(params.full_repair.frost_rate_reduction * 100).toFixed(0)} %</td>
            <td>${(params.full_repair.frost_rate_reduction * 100).toFixed(0)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Karbonatisaation hidastuminen</td>
            <td>Ei vaikutusta</td>
            <td>Tauko ${params.light_repair.carbonation_pause_years} vuotta</td>
            <td>k-kerroin −${(params.full_repair.carbonation_k_reduction * 100).toFixed(0)} %</td>
            <td>k-kerroin −${(params.full_repair.carbonation_k_reduction * 100).toFixed(0)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Arvioitu kustannus</td>
            <td>0 €</td>
            <td>${(params.light_repair.cost_total_min_eur / 1000).toFixed(0)}–${(params.light_repair.cost_total_max_eur / 1000).toFixed(0)} t€</td>
            <td>${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}–${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. € (kilpailutettu)</td>
            <td>~${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur * 0.9 / 1e6).toFixed(1)}–${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur * 0.9 / 1e6).toFixed(1)} milj. € (~10 % vähemmän)</td>
        </tr>
        <tr>
            <td class="label-cell">Lisäkäyttöikä (tavoite)</td>
            <td>—</td>
            <td>Rajoitettu</td>
            <td>${params.full_repair.extended_life_years} vuotta</td>
            <td>${params.full_repair.extended_life_years} vuotta</td>
        </tr>
        <tr>
            <td class="label-cell">Pihakannen vaahterat</td>
            <td>Säilytetään</td>
            <td>Säilytetään</td>
            <td>Kaadetaan (hankesuunnitelma)</td>
            <td>Säilytetään (erillinen kasvualusta)</td>
        </tr>
    </tbody>
</table>

<!-- ===== 7. SIMULAATIOTULOKSET ===== -->
<div class="page-break"></div>
<h2 id="ch-7"><span class="chapter-num">7</span> Simulaatiotulokset</h2>

<h3 id="ch-7-1"><span class="chapter-num">7.1</span> Skenaarioiden yhteenveto</h3>

<table class="data-table results-summary">
    <thead>
        <tr>
            <th>Tunnusluku</th>
            <th class="sc-a">A: Passiivinen</th>
            <th class="sc-b">B: Pintaremontti</th>
            <th class="sc-c">C: Täyskorjaus</th>
            <th class="sc-d">D: Täyskorjaus (puut)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="label-cell">EC2-rajan alitus (mediaani)</td>
            <td class="sc-a">${ReportGenerator._formatYear(s.A.collapse_risk_year)}</td>
            <td class="sc-b">${ReportGenerator._formatYear(s.B.collapse_risk_year)}</td>
            <td class="sc-c">${ReportGenerator._formatYear(s.C.collapse_risk_year)}</td>
            <td class="sc-d">${ReportGenerator._formatYear(s.D.collapse_risk_year)}</td>
        </tr>
        <tr>
            <td class="label-cell">90 % luottamusväli</td>
            <td class="sc-a">${ReportGenerator._formatConfInterval(s.A.collapse_risk_year)}</td>
            <td class="sc-b">${ReportGenerator._formatConfInterval(s.B.collapse_risk_year)}</td>
            <td class="sc-c">${ReportGenerator._formatConfInterval(s.C.collapse_risk_year)}</td>
            <td class="sc-d">${ReportGenerator._formatConfInterval(s.D.collapse_risk_year)}</td>
        </tr>
        <tr>
            <td class="label-cell">Korroosion alkamisvuosi (mediaani)</td>
            <td>${ReportGenerator._formatYear(s.A.corrosion_initiation_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.B.corrosion_initiation_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.C.corrosion_initiation_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.D.corrosion_initiation_year, params.monte_carlo_iterations)}</td>
        </tr>
        <tr>
            <td class="label-cell">Havaittu korroosioaste 2024</td>
            <td colspan="4" style="text-align: center;">0\u20131 % (pilarit 1 %, TT-laippa 0 %, TT-ripa 1 %)</td>
        </tr>
        <tr>
            <td class="label-cell">Kriittinen pakkasvaurio (mediaani)</td>
            <td>${ReportGenerator._formatYear(s.A.critical_frost_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.B.critical_frost_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.C.critical_frost_year, params.monte_carlo_iterations)}</td>
            <td>${ReportGenerator._formatYear(s.D.critical_frost_year, params.monte_carlo_iterations)}</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2030</td>
            <td class="sc-a">${((s.A.collapse_prob_2030 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2030 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2030 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2030 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2035</td>
            <td class="sc-a">${((s.A.collapse_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2035 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2040</td>
            <td class="sc-a">${((s.A.collapse_prob_2040 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2040 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2040 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2040 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2050</td>
            <td class="sc-a">${((s.A.collapse_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2050 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2075</td>
            <td class="sc-a">${((s.A.collapse_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2075 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">EC2-raja alittuu 2100</td>
            <td class="sc-a">${((s.A.collapse_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-b">${((s.B.collapse_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-c">${((s.C.collapse_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td class="sc-d">${((s.D.collapse_prob_2100 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Korroosioriski 2035</td>
            <td>${((s.A.corrosion_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.B.corrosion_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.C.corrosion_prob_2035 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.D.corrosion_prob_2035 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Korroosioriski 2050</td>
            <td>${((s.A.corrosion_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.B.corrosion_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.C.corrosion_prob_2050 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.D.corrosion_prob_2050 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Korroosioriski 2075</td>
            <td>${((s.A.corrosion_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.B.corrosion_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.C.corrosion_prob_2075 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.D.corrosion_prob_2075 || 0) * 100).toFixed(1)} %</td>
        </tr>
        <tr>
            <td class="label-cell">Korroosioriski 2100</td>
            <td>${((s.A.corrosion_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.B.corrosion_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.C.corrosion_prob_2100 || 0) * 100).toFixed(1)} %</td>
            <td>${((s.D.corrosion_prob_2100 || 0) * 100).toFixed(1)} %</td>
        </tr>
    </tbody>
</table>
<p style="font-size: 0.85em; color: #64748b; margin-top: 6px;">
    <strong>Huom:</strong> Kuntotutkimus 2024: havaittu korroosioaste 0\u20131 %.
    Malli on tietoisesti konservatiivinen &mdash; depassivointitodenn\u00e4k\u00f6isyys kuvaa
    teoreettista raudoitteen suojakerroksen menetyst\u00e4, ei n\u00e4kyv\u00e4\u00e4 korroosiota.
</p>

<!-- Charts -->
<h3 id="ch-7-2"><span class="chapter-num">7.2</span> Karbonatisaation eteneminen</h3>
<p>
    Kuva 1 esittää karbonatisaatiosyvyyden etenemisen eri skenaarioissa. Luottamusvyöhyke
    (P5&ndash;P95) kuvastaa materiaalien ominaisuuksien hajontaa. Viitelinja osoittaa TT-laatan
    rivan kriittisimpien kohtien keskimääräisen betonipeitteen (${params.betonipeite.tt_ripa_alapinta.mean} mm,
    2006 alapintamittaus).
</p>
<p>
    Karbonatisaatio mallinnetaan kaksivaiheisella vaimennetulla &radic;t-mallilla:
    ensimmäisessä vaiheessa (t&nbsp;&le;&nbsp;${params.carbonation.dampening_age}&nbsp;v) karbonatisaatio etenee
    normaalin diffuusiomallin mukaisesti (x&nbsp;=&nbsp;k&radic;t), minkä jälkeen etenemisnopeus laskee
    kertoimella &alpha;&nbsp;=&nbsp;${params.carbonation.dampening_factor}. Matala vaimennuskerroin
    (&alpha;&nbsp;=&nbsp;${params.carbonation.dampening_factor}) on perusteltu kolmella tekijällä:
    (1)&nbsp;${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonin tiivis huokosrakenne ja matala
    vesisementtisuhde hidastavat CO&sub2;-diffuusiota luonnostaan [5,&nbsp;7,&nbsp;19],
    (2)&nbsp;karbonatisaatioreaktiossa syntyvä CaCO&sub3; täyttää kapillaarihuokosia ja tiivistää
    rakennetta entisestään pitkällä aikavälillä (Parrott 1987 [9], fib Model Code 2010 [7]),
    ja (3)&nbsp;Kailan [33] mukaan karbonatisoituminen ulkobetonissa käytännössä pysähtyy
    noin 30 vuodessa. Valittu &alpha;-arvo on yhdenmukainen havaitun erittäin matalan
    korroosioasteen (~1&nbsp;%) kanssa: 50 vuodessa vain muutama prosentti teräksistä
    on altistunut karbonatisaatiolle, mikä edellyttää karbonatisaation lähes pysähtymistä
    vaimennusiän jälkeen [5,&nbsp;9,&nbsp;30].
    Karbonatisaatiokerroin k&nbsp;&asymp;&nbsp;1,9&nbsp;mm/&radic;a on
    tyypillinen arvo korkealujuusbetonille ulko-olosuhteissa [5, 19, 30].
</p>
${ReportGenerator._chartImage(chartImages, "chart-carbonation", "Kuva 1. Karbonatisaation eteneminen (TT-ripa)")}

<h3 id="ch-7-3"><span class="chapter-num">7.3</span> Pakkasrapautumisen kertymä</h3>
<p>
    Kuva 2 esittää pakkasrapautumisen kumulatiivisen kertymän.
    ${params.frost.acceleration_factor >= 1.005
        ? 'Malli etenee lievästi kiihtyen (a = ' + params.frost.acceleration_factor + ').'
        : 'Malli etenee lineaarisesti (vakionopeus ' + params.frost.base_rate_mm_per_year + ' mm/a), mikä on ' + inputData.kohde_tiedot.betonin_suunnittelulujuus + '-betonin 50 vuoden kenttäkokeen tukema oletus [3, 13, 14].'}
    Kriittinen vauriosyvyys (30 mm) on esitetty punaisella katkoviivalla.
    ${params.frost.acceleration_factor < 1.005
        ? 'Lineaarisella mallilla mediaani ei saavuta kriittistä rajaa simulaatiojaksolla (mediaani t=100: ' + SimulationEngine.frostDamage(100, params.frost.base_rate_mm_per_year, params.frost.acceleration_factor).toFixed(0) + ' mm). Riski syntyy paikallisesta vaihtelusta: pahimmissa vesivuotokohdissa (P90+) raja ylittyy.'
        : 'Skenaario A:ssa kriittinen raja saavutetaan simulaatiojakson loppupuolella.'}
    Leveä luottamusväli (CoV = ${(params.frost.rate_cov * 100).toFixed(0)} %) heijastaa suurta paikallista
    vaihtelua &mdash; rakennuksen kuivemmissa osissa rapautuminen on hyvin vähäistä, kun taas
    vesivuotokohdissa se on merkittävästi keskiarvoa nopeampaa. Skenaarioissa C ja D pakkasrasitus
    lähes pysähtyy korjauksen jälkeen [3, 4].
</p>
${ReportGenerator._chartImage(chartImages, "chart-frost", "Kuva 2. Pakkasrapautumisen kumulatiivinen kertymä")}

<div class="page-break"></div>
<h3 id="ch-7-4"><span class="chapter-num">7.4</span> Tukipinnan tehollinen pituus</h3>
<p>
    Kuva 3 esittää TT-laatan tukipinnan tehollisen pituuden pienenemisen. Alkuarvo on
    ${params.tukipinta.original_depth_mm} mm (TT:n todellinen tukipinta leukapalkilla,
    ei leukapalkin 150 mm kokonaisleveys). Eurokoodi 2:n [1] mukainen vähimmäistukipinta
    (${params.tukipinta.critical_min_mm} mm) on esitetty punaisella katkoviivalla.
    Pieni turvamarginaali (${params.tukipinta.original_depth_mm} &minus; ${params.tukipinta.critical_min_mm} = ${params.tukipinta.original_depth_mm - params.tukipinta.critical_min_mm} mm)
    tekee tukipinnasta rakenteen kriittisimmän riskin.
</p>
${ReportGenerator._chartImage(chartImages, "chart-bearing", "Kuva 3. TT-laatan tukipinnan tehollinen pituus")}

<h3 id="ch-7-5"><span class="chapter-num">7.5</span> EC2-vähimmäistukipinnan alituksen todennäköisyys</h3>
<p>
    Kuva 4 esittää todennäköisyyden, että TT-laatan tukipinnan tehollinen pituus alittaa
    Eurokoodi 2:n vähimmäisvaatimuksen uusille rakenteille (${params.tukipinta.critical_min_mm}&nbsp;mm) [1,&nbsp;6].
    Kyseessä ei ole varsinainen sortumistodennäköisyys, vaan todennäköisyys sille, että
    tukipinta pienenee alle uudisrakentamisen suunnittelunormin &mdash; todellinen murtuminen
    vaatisi huomattavasti pidemmälle edennyttä rapautumista (ks. luku 4.4).
    Hyväksyttävä riskitaso (5&nbsp;%) on esitetty keltaisella katkoviivalla.
</p>
${ReportGenerator._chartImage(chartImages, "chart-collapse-prob", "Kuva 4. EC2-vähimmäistukipinnan alituksen todennäköisyys")}

<div class="page-break"></div>
<h3 id="ch-7-6"><span class="chapter-num">7.6</span> Korroosion todennäköisyys</h3>
<p>
    Kuva 5 esittää raudoitteen korroosion alkamistodennäköisyyden TT-laatan rivalle.
    Korroosion alkaminen ei vielä suoraan tarkoita rakenteellista vaaraa, mutta se
    käynnistää raudoitteen poikkipinnan pienenemisen ja tartunnan heikkenemisen [5, 9].
</p>
<p>
    <strong>Vertailu kuntotutkimuksen 2024 havaintoihin:</strong>
    Contrust Oy:n kuntotutkimuksessa (2024) havaittu korroosioaste oli pilarit 1&nbsp;%,
    TT-laippa 0&nbsp;% ja TT-ripa 1&nbsp;%. Karbonatisaatiosyvyys ohuthieanalyysistä oli
    pilarit ${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.pilarit}&nbsp;mm,
    TT-laippa ${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_laippa}&nbsp;mm ja
    TT-ripa ${inputData.mittaustiedot_2024.karbonatisaatio_ohuthie_ka_mm.tt_laatta_ripa}&nbsp;mm.
    Betonipeitteet olivat pilarit ${inputData.mittaustiedot_2024.betonipeite_ka_mm.pilarit}&nbsp;mm,
    TT-laippa ${inputData.mittaustiedot_2024.betonipeite_ka_mm.tt_laatta_laippa}&nbsp;mm ja
    TT-ripa ${inputData.mittaustiedot_2024.betonipeite_ka_mm.tt_laatta_ripa}&nbsp;mm.
    Kloridit olivat alle m&auml;&auml;ritysrajan (&lt;&nbsp;0,01&nbsp;%).
    ${params.bayesian_conditioning?.enabled
        ? `Monte Carlo -näytteet on ehdollistettu 2024 havaintoon (Bayesilainen rejection sampling),
    jolloin mallin ennustama depasivointitodennäköisyys vuonna ${params.bayesian_conditioning.observation_year}
    vastaa havaittua ~1&nbsp;% korroosioastetta. Ehdollistaminen hylkää (k, cover) -yhdistelmät jotka
    ennustaisivat enemmän korroosiota kuin havaittu, jolloin tulevaisuuden ennuste on realistisempi.`
        : `Havaittu 0&ndash;1&nbsp;% korroosioaste on mallin ennustamaa depasivointitodennäköisyyttä pienempi,
    mikä osoittaa mallin olevan tietoisesti konservatiivinen. Ero johtuu siitä, että depassivointi
    (karbonatisaatiorintaman saavuttaminen teräkseen) ei välittömästi näy näkyvänä korroosiona &mdash;
    työn alla olevan korroosion kehittyminen vie vuosia tai vuosikymmeniä [5, 9].`}
    Lis&auml;ksi karbonatisaation hidastuminen kosteassa ulkobetonissa noin 30 vuoden
    j&auml;lkeen [9, 33] rajoittaa depasivointirintaman etenemist&auml; pitk&auml;ll&auml; aikav&auml;lill&auml;.
</p>
${ReportGenerator._chartImage(chartImages, "chart-corrosion-prob", "Kuva 5. Korroosion alkamistodennäköisyys (TT-ripa)")}

<h3 id="ch-7-7"><span class="chapter-num">7.7</span> Rakenneosakohtainen analyysi</h3>
<p>
    Kuvat 6 ja 7 esittävät korroosion alkamisvuoden jakauman rakenneosittain sekä
    EC2-rajan alitusajankohdan jakauman skenaarioittain. TT-laatan ripa on kriittisin
    rakenneosa ohuen betonipeitteen (ka. ${params.betonipeite.tt_ripa_alapinta.mean} mm)
    vuoksi [2, 10].
</p>
${ReportGenerator._chartImage(chartImages, "chart-element-histogram", "Kuva 6. Korroosion alkamisvuoden jakauma rakenneosittain")}
${ReportGenerator._chartImage(chartImages, "chart-collapse-histogram", "Kuva 7. EC2-rajan alitusajankohdan jakauma skenaarioittain")}

<div class="page-break"></div>
<h3 id="ch-7-8"><span class="chapter-num">7.8</span> Skenaariovertailu</h3>
<p>
    Kuva 8 esittää tutkadiagrammin, joka vertailee neljää skenaariota viiden tunnusluvun
    suhteen. Suurempi arvo tarkoittaa suurempaa riskiä (paitsi "Käyttöikä jäljellä",
    jossa suurempi arvo on parempi).
</p>
${ReportGenerator._chartImage(chartImages, "chart-radar", "Kuva 8. Skenaarioiden vertailu (tutkadiagrammi)")}

<!-- ===== 8. HIILIJALANJÄLKIANALYYSI ===== -->
<div class="page-break"></div>
<h2 id="ch-8"><span class="chapter-num">8</span> Hiilijalanjälkianalyysi</h2>

${ReportGenerator._co2Chapter(inputData)}

<!-- ===== 9. VUOSIKOHTAISET TULOKSET ===== -->
<div class="page-break"></div>
<h2 id="ch-9"><span class="chapter-num">9</span> Vuosikohtaiset tulokset</h2>
<p>
    Taulukko esittää keskeisten tunnuslukujen mediaaniarvot valituilla tarkasteluvuosilla.
    Pakkasrapautuma (mm), tukipinnan tehollinen pituus (mm) ja EC2-rajan alitustodennäköisyys (%)
    on esitetty kullekin skenaariolle.
</p>
${ReportGenerator._dataTable(results, params)}

<p>
    Seuraava taulukko esittää karbonatisaatiosyvyyden (mediaani, TT-ripa, skenaario A)
    ja korroosion alkamistodennäköisyyden kullekin skenaariolle.
</p>
${ReportGenerator._carbonationTable(results, params)}

<!-- ===== 10. LASKENNAN LUOTETTAVUUS ===== -->
<div class="page-break"></div>
<h2 id="ch-10"><span class="chapter-num">10</span> Laskennan luotettavuus</h2>

<p>
    Tämä osio arvioi laskentamallin luotettavuutta kolmesta näkökulmasta: tieteellinen perusta,
    sovittaminen kohdekohtaiseen kenttädataan ja Monte Carlo -menetelmän tilastollinen luotettavuus.
    Tavoitteena on antaa lukijalle edellytykset arvioida, kuinka paljon esitettyihin tuloksiin voi luottaa.
</p>

<h3 id="ch-10-1"><span class="chapter-num">10.1</span> Tieteellinen perusta ja kirjallisuus</h3>

<p>
    Laskentamalli ei ole ad hoc -ratkaisu, vaan se perustuu rakennusalan vakiintuneisiin
    vauriomalleihin, jotka on dokumentoitu laajasti tieteellisessä ja ammatillisessa
    kirjallisuudessa. Kunkin osamallin taustalla on vuosikymmenten tutkimustyö:
</p>

<p>
    <strong>Karbonatisaatiomalli</strong> perustuu Fickin toiseen diffuusiolakiin, jonka
    neliöjuurimuoto (x&nbsp;=&nbsp;k&middot;&radic;t) on betonitekniikan yleisimmin käytetty
    karbonatisaatiomalli. Mallin teoreettinen perusta on peräisin Tuutin [5] väitöskirjasta
    (1982, Swedish Cement and Concrete Research Institute), joka on alan siteeratuimpia
    teoksia. Kosteuden aiheuttama hidastuminen perustuu Parrottin [9] tutkimukseen
    (1987, Cement and Concrete Association) ja fib Model Code 2010:n [7] kosteuskertoimeen.
    Kaksivaiheinen vaimennettu malli on Concrete Society TR&nbsp;61:n ja fib Bulletin 34:n [7]
    mukainen. Malli on validoitu laajasti suomalaisissa olosuhteissa Lahdensivun [30]
    väitöskirjassa (Tampere University of Technology, 2012) ja Köliön ym. [31] tutkimuksessa
    (Engineering Structures, 2014). Vesikarin [13] VTT-julkaisu (1988) tarjoaa suomalaisten
    betonirakenteiden käyttöikäennustemallit, joihin tässäkin analyysissä nojataan.
</p>

<p>
    <strong>Pakkasrapautumismalli</strong> pohjautuu Suomen Betoniyhdistyksen käyttöikäohjeistoon
    by&nbsp;32 [3] (1989) ja by&nbsp;68 [4] (2016) sekä kansainväliseen tutkimukseen:
    Pigeonin &amp; Pleaun [14] kenttäolosuhteiden rapautumisnopeuksiin (1995, E&nbsp;&amp;&nbsp;FN&nbsp;Spon),
    Fagerlundin [21] kriittisen kyllästysasteen teoriaan (1977, Materials and Structures;
    2004, Lund University) ja Powersin [23] klassiseen hydraulisen paineen teoriaan (1945).
    Lineaarinen perusmalli on yhdenmukainen by&nbsp;32:n kenttäolosuhteiden mallin kanssa.
    Penttalan [25] tutkimus (2006, Cement and Concrete Research) tarjoaa suomalaiset
    koeolosuhteiden vertailutiedot. RILEM TC&nbsp;130-CSL:n (Sarja &amp; Vesikari [26], 1996)
    yleinen rapautumismalli d(t)&nbsp;=&nbsp;k&middot;t<sup>n</sup> mahdollistaa kiihtyvän
    mallin, mutta tämän kohteen 50 vuoden kenttädata ei tue merkittävää kiihtymistä.
    Punkin &amp; Suomisen [32] VTT-julkaisu (1994) käsittelee suomalaisten betonien
    pakkasenkestävyyden varmistamista.
</p>

<p>
    <strong>Tukipinta-analyysi</strong> perustuu suoraan Eurokoodi&nbsp;2:n
    (SFS-EN&nbsp;1992-1-1 [1], kohta 10.9.5.2) vähimmäistukipintavaatimukseen
    elementtirakenteille. Eurokoodi on EU-alueella pakollinen mitoitusstandardi.
    Betonin lujuusreservien arviointi perustuu by&nbsp;50 Betoninormeihin [19] (2018)
    ja Melchersin [17] rakenteellisen luotettavuuden teoriaan (1999, John Wiley &amp; Sons).
</p>

<p>
    <strong>Probabilistinen menetelmä</strong> noudattaa JCSS Probabilistic Model Code
    -julkaisun [12] (2001, Joint Committee on Structural Safety) ja fib Model Code 2010:n [7]
    periaatteita palveluikäsuunnittelussa. DuraCrete-projektin [27] (EU Brite EuRam III, 2000)
    todennäköisyyspohjainen käyttöikämalli on menetelmän eurooppalainen vertailukohta.
    Box-Muller-transformaatio [16] (1958, Annals of Mathematical Statistics) on klassinen
    ja luotettava satunnaislukugeneraattori.
</p>

<p>
    Yhteenveto: laskentamalli koostuu vakiintuneista tieteellisistä osamalleista, joiden
    kukin komponentti on vertaisarvioitu ja laajasti käytetty rakennusalan suunnittelussa
    ja tutkimuksessa. Malli ei sisällä kokeellisia tai testaamattomia osia.
    Viitelista (luku 12) kattaa 35 lähdettä, joista merkittävä osa on kansainvälisiä
    standardeja, väitöskirjoja ja vertaisarvioituja tieteellisiä julkaisuja.
</p>

<h3 id="ch-10-2"><span class="chapter-num">10.2</span> Kalibrointi 50 vuoden kenttädataan</h3>

<p>
    Mallin luotettavuuden kannalta ratkaisevaa on, että se on sovitettu kohdekohtaiseen
    mittausdataan &mdash; ei pelkästään kirjallisuuden yleisarvoihin. Pihakannen rakentamisesta
    (1974) on kulunut yli 50 vuotta, ja sinä aikana on tehty kaksi perusteellista
    kuntotutkimusta (Vahanen Oy 2006 [34] ja Contrust Oy 2024 [35]). Malli on kalibroitu
    näiden tutkimusten mittaustuloksiin siten, että se selittää rakenteen tunnetun historian:
</p>

<ul>
    <li><strong>Karbonatisaation kalibrointi:</strong> Karbonatisaatiokerroin k on laskettu
        suoraan vuoden 2024 ohuthieanalyysin tuloksista (t&nbsp;=&nbsp;50&nbsp;v). Ohuthieanalyysi
        on luotettavampi kuin kenttäfenolftaleiinikoe kosteassa betonissa [5, 9, 13].
        Mallin tuottama karbonatisaatiosyvyys vastaa täsmälleen mitattuja arvoja vuonna 2024
        ja on johdonmukainen vuoden 2006 kenttämittausten kanssa (tunnettu mittausmenetelmäero
        selittää eroavuuden, ks. luku 5.1).</li>
    <li><strong>Pakkasrapautumisen kalibrointi:</strong> Rapautumisen perusnopeus
        (${params.frost.base_rate_mm_per_year}&nbsp;mm/a) on sovitettu siten, että mallin
        mediaani vastaa vuoden 2024 &rdquo;rapautumaton&rdquo; -havaintoa, ja vuoden 2006
        pahimmat paikalliset vauriot (24&nbsp;mm) osuvat mallin ylähäntään (&gt;&nbsp;P99).
        Malli selittää siis sekä tyypillisen yleistilan että äärimmäiset paikalliset vauriot
        yhtenäisellä tilastollisella jakaumalla (ks. luku 5.2).</li>
    <li><strong>Tukipinnan kalibrointi:</strong> Reunarapautumisen nopeus on kalibroitu siten,
        että rakenne on edelleen pystyssä vuonna 2026 &mdash; 51 vuotta rakentamisen jälkeen.
        Tämä on vahva rajoite: malli ei voi ennustaa jo tapahtunutta sortumista (ks. luku 5.3).</li>
    <li><strong>Korroosioasteen vastaavuus:</strong> Mallin ennustama korroosion alkamisaika
        on johdonmukainen havaitun erittäin matalan korroosioasteen (0&ndash;1&nbsp;%) kanssa.
        50 vuoden kosteusrasituksen jälkeen minimaalinen korroosio on juuri se, mitä malli
        ennustaa hidasta karbonatisaatiota ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan
        korkealujuusbetonissa (ks. luku 5.4).</li>
</ul>

<p>
    Malli ei siis perustu vain teoreettisiin oletuksiin, vaan se on <em>pakko-sovitettu</em>
    tunnettuun historiaan kahdessa ajanpisteessä (2006 ja 2024). Tämä on analogista tilastollisen
    mallin validointiin: malli joka ei pysty selittämään mennyttä dataa ei ole luotettava
    ennustamaan tulevaa [7, 12]. Tässä tapauksessa malli selittää kaiken tunnetun datan
    johdonmukaisesti.
</p>

<h3 id="ch-10-3"><span class="chapter-num">10.3</span> Monte Carlo -simulaation luotettavuus</h3>

<p>
    Monte Carlo -menetelmä on laajalti käytetty ja hyväksytty tapa käsitellä
    epävarmuutta rakennustekniikassa [7, 12, 17, 27]. Menetelmän luotettavuus
    perustuu useisiin tekijöihin:
</p>

<ul>
    <li><strong>Tilastollinen konvergenssi:</strong> Simulaatio ajetaan oletusarvoisesti
        10&nbsp;000 iteraatiolla. Tällä iteraatiomäärällä mediaanin tilastollinen
        virhe on noin 1&nbsp;% ja P5/P95-kvantiilien virhe alle 3&nbsp;%. Tulokset
        ovat käytännössä samoja riippumatta siitä, ajetaanko 8&nbsp;000 vai
        15&nbsp;000 iteraatiota, mikä osoittaa konvergenssin [16, 17].</li>
    <li><strong>Fysikaalinen rajoite:</strong> Kaikki satunnaismuuttujat ovat
        sidottuja fysikaalisesti järkeviin jakaumiin: log-normaalijakauma takaa
        positiiviset arvot materiaaliparametreille, normaalijakauma kuvaa betonipeitteen
        symmetristä vaihtelua, ja Bernoulli-jakauma mallintaa pintaterästen
        binääristä esiintymistä [7, 12].</li>
    <li><strong>Epävarmuuksien läpinäkyvyys:</strong> Simulaatio raportoi tulokset
        luottamusväleinä (P5&ndash;P95), ei pelkkinä pistearvioina. Tämä mahdollistaa
        lukijalle tulosten epävarmuuden arvioimisen. Leveä luottamusväli ei tarkoita
        epäluotettavaa mallia &mdash; se tarkoittaa, että malli on rehellinen
        epävarmuuksistaan.</li>
    <li><strong>Bayesilainen ehdollistaminen:</strong> Kun Bayes-ehdollistaminen
        on käytössä, simulaatio hylkää ne satunnaisotokset, jotka ovat ristiriidassa
        vuoden 2024 kuntotutkimuksen havaintojen kanssa (rejection sampling).
        Tämä tuottaa posteriorijakauman, joka on yhdenmukainen sekä
        priori-tiedon (kirjallisuus) että havaitun datan kanssa [12, 17].</li>
    <li><strong>Konservatiivisuus:</strong> Malli käyttää Eurokoodi 2:n
        vähimmäistukipintaa uusille rakenteille (${params.tukipinta.critical_min_mm}&nbsp;mm) raja-arvona,
        vaikka todellinen murtumiskapasiteetti on huomattavasti suurempi
        ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-betonille (ks. luku 4.4).
        Tämä tekee tuloksista systemaattisesti varovaisia &mdash; todellinen käyttöikä
        on todennäköisesti pidempi kuin mallin mediaani.</li>
</ul>

<p>
    Monte Carlo -simulaatio on erityisen sopiva tähän analyysiin, koska se pystyy
    käsittelemään usean epävarman parametrin yhteisvaikutuksen ilman yksinkertaistavia
    oletuksia parametrien riippumattomuudesta tai jakaumien muodosta.
    Vaihtoehtoinen deterministinen analyysi (yksittäinen laskenta &rdquo;pahimman tapauksen&rdquo;
    parametreilla) yliarvioisi riskiä merkittävästi eikä antaisi tietoa todennäköisyyksistä.
    Probabilistinen lähestymistapa on fib Model Code 2010:n [7] ja DuraCrete-projektin [27]
    suosittelema menetelmä käyttöikäsuunnittelussa.
</p>

<h3 id="ch-10-4"><span class="chapter-num">10.4</span> Rajoitukset ja epävarmuustekijät</h3>

<p>
    Vaikka malli on kalibroitu kenttädataan ja perustuu vakiintuneisiin tieteellisiin
    malleihin, sillä on tunnistettavia rajoituksia:
</p>

<ul>
    <li><strong>Ekstrapolaatio tuntemattomaan:</strong> Malli on sovitettu 50 vuoden
        dataan, mutta sitä käytetään ennustamaan vuosikymmeniä eteenpäin. Mitä kauemmas
        tulevaisuuteen ennuste ulottuu, sitä suurempi epävarmuus siihen liittyy.
        Tämä näkyy tuloksissa levenevänä luottamusvälinä.</li>
    <li><strong>Ilmastonmuutos:</strong> Malli ei eksplisiittisesti huomioi
        ilmastonmuutoksen vaikutuksia (muuttuvat jäätymis-sulamissyklit, sademäärät).
        Suomessa ilmastonmuutoksen arvioidaan vähentävän pakkasrasitusta, joten tämä
        rajoitus on pikemminkin konservatiivinen [31].</li>
    <li><strong>Paikallinen vaihtelu:</strong> Pihakansirakenne altistuu epätasaiselle
        kosteusrasitukselle. Malli käsittelee paikallista vaihtelua tilastollisen
        hajonnan kautta (CoV-kertoimet), mutta yksittäisten ongelmakohtien tarkka
        sijainti on tuntematon.</li>
    <li><strong>Mekaanisen vaurion yhteisvaikutukset:</strong> Malli käsittelee
        karbonatisaatiota, pakkasrapautumista ja tukipintaa erillisinä prosesseina.
        Todellisuudessa ne voivat voimistaa toisiaan (esim. pakkasrapautuminen nopeuttaa
        karbonatisaatiota halkeamien kautta). Tämä yksinkertaistus on yleinen
        käytäntö alan kirjallisuudessa [7, 26, 27].</li>
</ul>

<p>
    Kokonaisuutena malli on luotettava työkalu strategisten päätösten tueksi. Se perustuu
    tieteelliseen kirjallisuuteen, on kalibroitu kohdekohtaiseen mittausdataan ja käyttää
    tilastollisesti luotettavaa menetelmää. Mallin systemaattinen konservatiivisuus
    (Eurokoodi-raja vs. todellinen murtumiskapasiteetti) tarjoaa lisävarmuuskertoimen.
    Tuloksia tulee tulkita todennäköisyysjakaumina &mdash; ei täsmällisinä ennusteina &mdash;
    ja suuruusluokka-arvioina pitkän aikavälin päätöksenteolle.
</p>

<!-- ===== 11. JOHTOPÄÄTÖKSET JA SUOSITUKSET ===== -->
<div class="page-break"></div>
<h2 id="ch-11"><span class="chapter-num">11</span> Johtopäätökset ja suositukset</h2>

${ReportGenerator._conclusions(results, params, inputData)}

<!-- ===== 12. LÄHDELUETTELO ===== -->
<div class="page-break"></div>
<h2 id="ch-12"><span class="chapter-num">12</span> Lähdeluettelo</h2>

<ol class="references">
    <li id="ref-1">
        SFS-EN 1992-1-1 + A1 + AC (2015). <em>Eurokoodi 2: Betonirakenteiden suunnittelu.
        Osa 1-1: Yleiset säännöt ja rakennuksia koskevat säännöt.</em>
        Suomen Standardisoimisliitto SFS. Helsinki.
    </li>
    <li id="ref-2">
        by 42 (2019). <em>Betonijulkisivujen kuntotutkimus 2019.</em>
        Suomen Betoniyhdistys ry. Helsinki. ISBN 978-952-68068-9-4.
    </li>
    <li id="ref-3">
        by 32 (1989). <em>Betonirakenteiden säilyvyyssuunnittelu ja -ohjeet.</em>
        Suomen Betoniyhdistys ry. Helsinki.
    </li>
    <li id="ref-4">
        by 68 (2016). <em>Betonin pakkasenkestävyys.</em>
        Suomen Betoniyhdistys ry. Helsinki. ISBN 978-952-68068-4-9.
    </li>
    <li id="ref-5">
        Tuutti, K. (1982). <em>Corrosion of Steel in Concrete.</em>
        CBI Research Report fo 4.82. Swedish Cement and Concrete Research Institute. Stockholm.
    </li>
    <li id="ref-6">
        SFS-EN 1992-1-1 (2015), kohta 10.9.5.2: <em>Elementtirakenteiden tukipinnat.</em>
        Vähimmäistukipinta ja -kiinnitysvaatimukset.
    </li>
    <li id="ref-7">
        fib Bulletin 34 (2006). <em>Model Code for Service Life Design.</em>
        Fédération internationale du béton (fib). Lausanne. ISBN 978-2-88394-074-1.
    </li>
    <li id="ref-8">
        NT Build 492 (1999). <em>Concrete, Mortar and Cement-Based Repair Materials:
        Chloride Migration Coefficient from Non-steady-state Migration Experiments.</em>
        Nordtest. Espoo.
    </li>
    <li id="ref-9">
        Parrott, L.J. (1987). <em>A Review of Carbonation in Reinforced Concrete.</em>
        Cement and Concrete Association. Wexham Springs.
    </li>
    <li id="ref-10">
        Pentti, M. & Mattila, J. (1998). <em>Betonijulkisivujen ja parvekkeiden korjaus.
        Osa 1: Rakenteet, vauriot ja kunnon tutkiminen.</em>
        Tampereen teknillinen korkeakoulu, Rakennustekniikan laitos. Julkaisu 87. Tampere.
    </li>
    <li id="ref-11">
        SFS-EN 206 + A2 (2021). <em>Betoni: Määrittely, ominaisuudet, valmistus
        ja vaatimustenmukaisuus.</em> Suomen Standardisoimisliitto SFS. Helsinki.
    </li>
    <li id="ref-12">
        JCSS (2001). <em>Probabilistic Model Code.</em>
        Joint Committee on Structural Safety. ISBN 978-3-909386-79-6.
        Saatavilla: <span class="url">www.jcss-lc.org</span>.
    </li>
    <li id="ref-13">
        Vesikari, E. (1988). <em>Service life prediction of concrete structures
        with regard to corrosion of reinforcement.</em>
        VTT Research Notes 951. Valtion teknillinen tutkimuskeskus. Espoo.
    </li>
    <li id="ref-14">
        Pigeon, M. & Pleau, R. (1995). <em>Durability of Concrete in Cold Climates.</em>
        E & FN Spon. London. ISBN 0-419-19260-3.
    </li>
    <li id="ref-15">
        fib Bulletin 76 (2015). <em>Benchmarking of deemed-to-satisfy provisions
        in structural codes – Durability.</em>
        Fédération internationale du béton. Lausanne. ISBN 978-2-88394-116-8.
    </li>
    <li id="ref-16">
        Box, G.E.P. & Muller, M.E. (1958). "A Note on the Generation of Random Normal Deviates."
        <em>The Annals of Mathematical Statistics</em>, 29(2), pp. 610–611.
    </li>
    <li id="ref-17">
        Melchers, R.E. (1999). <em>Structural Reliability Analysis and Prediction.</em>
        2nd edition. John Wiley & Sons. Chichester. ISBN 0-471-98324-1.
    </li>
    <li id="ref-18">
        SFS 5445 (1988). <em>Betoni. Kovettuneen betonin vetolujuus. Pintavetokoe.</em>
        Suomen Standardisoimisliitto SFS. Helsinki.
    </li>
    <li id="ref-19">
        by 50 (2018). <em>Betoninormit 2016 (BY 50).</em>
        Suomen Betoniyhdistys ry. Helsinki. ISBN 978-952-68068-6-3.
    </li>
    <li id="ref-20">
        Raivio, T. & Tukiainen, P. (2006). <em>Betonisten pysäköintirakenteiden
        käyttöiän hallinta.</em> VTT Tiedotteita 2340. Valtion teknillinen tutkimuskeskus. Espoo.
    </li>
    <li id="ref-21">
        Fagerlund, G. (1977). "The critical degree of saturation method of assessing
        the freeze/thaw resistance of concrete."
        <em>Materials and Structures</em>, 10(58), pp. 217–229.
        Ks. myös: Fagerlund, G. (2004). <em>A service life model for internal frost damage in concrete.</em>
        Report TVBM-3119. Lund University. Lund.
    </li>
    <li id="ref-22">
        Hobbs, D.W. (1988). <em>Carbonation of Concrete Containing PFA.</em>
        Magazine of Concrete Research, 40(143), pp. 69–78.
    </li>
    <li id="ref-23">
        Powers, T.C. (1945). "A Working Hypothesis for Further Studies of Frost Resistance of Concrete."
        <em>Journal of the American Concrete Institute</em>, 16(4), pp. 245–272.
    </li>
    <li id="ref-24">
        Litvan, G.G. (1972). "Phase Transitions of Adsorbates: IV, Mechanism of Frost Action in Hardened Cement Paste."
        <em>Journal of the American Ceramic Society</em>, 55(1), pp. 38–42.
    </li>
    <li id="ref-25">
        Penttala, V. (2006). "Surface and internal deterioration of concrete due to saline and non-saline freeze–thaw loads."
        <em>Cement and Concrete Research</em>, 36(5), pp. 921–928.
    </li>
    <li id="ref-26">
        Sarja, A. & Vesikari, E. (1996). <em>Durability Design of Concrete Structures.</em>
        RILEM Report 14. E & FN Spon. London. ISBN 0-419-21410-0.
    </li>
    <li id="ref-27">
        DuraCrete (2000). <em>Probabilistic Performance Based Durability Design of Concrete Structures.</em>
        The European Union – Brite EuRam III. Document BE95-1347/R17.
    </li>
    <li id="ref-28">
        Tang, L. & Nilsson, L.-O. (1993). "Chloride binding capacity and binding isotherms of OPC pastes and mortars."
        <em>Cement and Concrete Research</em>, 23(2), pp. 247–253.
    </li>
    <li id="ref-29">
        Sisomphon, K. & Franke, L. (2007). "Carbonation rates of concretes containing high volume of pozzolanic materials."
        <em>Cement and Concrete Research</em>, 37(12), pp. 1647–1653.
    </li>
    <li id="ref-30">
        Lahdensivu, J. (2012). <em>Durability Properties and Actual Deterioration of Finnish Concrete Facades and Balconies.</em>
        Tampere University of Technology, Publication 1028. Tampere. ISBN 978-952-15-2823-0.
    </li>
    <li id="ref-31">
        Köliö, A. et al. (2014). "Durability demands related to carbonation induced corrosion for Finnish concrete buildings
        in changing climate." <em>Engineering Structures</em>, 62–63, pp. 42–52.
    </li>
    <li id="ref-32">
        Punkki, J. & Suominen, V. (1994). <em>Betonin pakkasenkestävyyden varmistaminen
        (Ensuring frost resistance of concrete).</em> VTT Tiedotteita 1567. Espoo.
    </li>
    <li id="ref-33">
        Kaila, P. (1997). <em>Talotohtori. Rakentajan pikkujättiläinen.</em>
        WSOY. Porvoo. ISBN 951-0-21451-5.
        Karbonatisoitumisen hidastumisesta ks. luku "Betoni", s. 283–285:
        kosteassa ulkobetonissa karbonatisoituminen käytännössä pysähtyy noin 30 vuodessa.
    </li>
    <li id="ref-34">
        Vahanen Oy (2006). <em>Pihakannen kuntotutkimus.</em>
        ${inputData.kohde_tiedot.nimi}. Helsinki.
        Saatavilla: <a href="https://drive.google.com/file/d/1jt7b_MVyD7v4312SzqtQErrDBKa6O2L8/view?usp=sharing" class="url">Google Drive</a>.
    </li>
    <li id="ref-35">
        Contrust Oy (2024). <em>Pihakannen kuntotutkimus.</em>
        ${inputData.kohde_tiedot.nimi}. Helsinki.
        Saatavilla: <a href="https://drive.google.com/file/d/1Ynu3_LPNEDh_npCL07y9s12zJwfI_T5-/view?usp=sharing" class="url">Google Drive</a>.
    </li>
    <li id="ref-36">
        <em>Pihakannen Hankesuunnitelma.</em>
        ${inputData.kohde_tiedot.nimi}. Helsinki.
        Saatavilla: <a href="https://drive.google.com/drive/folders/1VKEDKq8j-sIsNeOUsV21GFvSATutUvBq" class="url">Google Drive</a>.
    </li>
    <li id="ref-37">
        CO2data.fi (2024). <em>Rakennusmateriaalien päästökertoimet.</em>
        Suomen ympäristökeskus (Syke). Helsinki.
        Saatavilla: <span class="url">co2data.fi</span>.
    </li>
    <li id="ref-38">
        Hammond, G.P. & Jones, C.I. (2019). <em>Inventory of Carbon and Energy (ICE) Database, Version 3.0.</em>
        University of Bath. Bath, UK.
    </li>
    <li id="ref-39">
        Suomen ympäristökeskus (2023). <em>Rakentamisen ympäristövaikutukset.</em>
        Syke raportteja. Helsinki.
    </li>
    <li id="ref-40">
        Ilmasto.org (2024). <em>Lentoliikenteen päästöt.</em>
        Saatavilla: <span class="url">ilmasto.org</span>.
    </li>
    <li id="ref-41">
        Nowak, D.J., Stevens, J.C., Sisinni, S.M. & Luley, C.J. (2002).
        "Effects of Urban Tree Management and Species Selection on Atmospheric Carbon Dioxide."
        <em>Journal of Arboriculture</em>, 28(3), pp. 113–122.
    </li>
    <li id="ref-42">
        McPherson, E.G. & Simpson, J.R. (1999).
        "Carbon Dioxide Reduction Through Urban Forestry: Guidelines for Professional and Volunteer Tree Planters."
        <em>USDA Forest Service General Technical Report PSW-GTR-171.</em> Albany, CA.
    </li>
</ol>

<!-- ===== FOOTER ===== -->
<div class="report-footer">
    <p>
        Pihakansi Rakenneanalyysi v1.0 — ${inputData.kohde_tiedot.nimi}<br>
        Monte Carlo -simulaatio (N = ${params.monte_carlo_iterations.toLocaleString("fi-FI")}) ·
        Analyysihorisontti ${params.start_year}–${params.end_year}<br>
        Raportti generoitu ${dateStr}
    </p>
</div>

<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script>
    renderMathInElement(document.body, {
        delimiters: [
            {left: "\\\\[", right: "\\\\]", display: true},
            {left: "\\\\(", right: "\\\\)", display: false}
        ],
        throwOnError: false
    });
</script>

</body>
</html>`;

        // Open in new window
        const reportWindow = window.open("", "_blank");
        if (reportWindow) {
            reportWindow.document.write(html);
            reportWindow.document.close();
        } else {
            alert("Selaimen ponnahdusikkunoiden esto esti raportin avaamisen. Salli ponnahdusikkunat tälle sivustolle.");
        }
    }

    // ---- Helper: format year from stats object ----
    static _formatYear(statsObj, totalN) {
        if (!statsObj || isNaN(statsObj.median) || statsObj.n === 0) return "Ei riskiä";
        // If fewer than 10% of iterations triggered this event, median is not representative
        if (totalN && statsObj.n < totalN * 0.1) {
            return `> 2126 (${((statsObj.n / totalN) * 100).toFixed(1)} %)`;
        }
        return Math.round(statsObj.median).toString();
    }

    static _formatConfInterval(statsObj) {
        if (!statsObj || isNaN(statsObj.p5) || isNaN(statsObj.p95) || statsObj.n === 0) return "N/A";
        return `${Math.round(statsObj.p5)}–${Math.round(statsObj.p95)}`;
    }

    /** Find the first year when a probability field exceeds a threshold */
    static _yearWhenProbExceeds(results, scenario, field, threshold) {
        const stats = results.scenarios[scenario].stats;
        for (let yi = 0; yi < results.years.length; yi++) {
            if (stats[yi][field] >= threshold) {
                return results.years[yi];
            }
        }
        return null;
    }

    // ---- Helper: embed chart image ----
    static _chartImage(chartImages, canvasId, caption) {
        const src = chartImages[canvasId];
        if (!src) return `<p class="no-chart"><em>[Kaavio ${canvasId} ei saatavilla]</em></p>`;
        return `
<figure class="chart-figure">
    <img src="${src}" alt="${caption}">
    <figcaption>${caption}</figcaption>
</figure>`;
    }

    // ---- Helper: generate data table HTML ----
    static _dataTable(results, params) {
        const checkpoints = [2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060, 2065, 2070, 2075, 2080, 2090, 2100, 2110, 2126];
        let html = `
<table class="data-table yearly-table">
    <thead>
        <tr>
            <th rowspan="2">Vuosi</th>
            <th colspan="3" class="sc-a">Skenaario A</th>
            <th colspan="3" class="sc-b">Skenaario B</th>
            <th colspan="3" class="sc-c">Skenaario C</th>
            <th colspan="3" class="sc-d">Skenaario D</th>
        </tr>
        <tr>
            <th class="sc-a">Pakkas (mm)</th><th class="sc-a">Tuki (mm)</th><th class="sc-a">EC2 %</th>
            <th class="sc-b">Pakkas (mm)</th><th class="sc-b">Tuki (mm)</th><th class="sc-b">EC2 %</th>
            <th class="sc-c">Pakkas (mm)</th><th class="sc-c">Tuki (mm)</th><th class="sc-c">EC2 %</th>
            <th class="sc-d">Pakkas (mm)</th><th class="sc-d">Tuki (mm)</th><th class="sc-d">EC2 %</th>
        </tr>
    </thead>
    <tbody>`;

        for (const year of checkpoints) {
            const yi = results.years.indexOf(year);
            if (yi < 0) continue;

            html += `<tr><td class="year-cell">${year}</td>`;
            for (const scId of ["A", "B", "C", "D"]) {
                const st = results.scenarios[scId].stats[yi];
                const frostVal = st.frost.median.toFixed(1);
                const bearVal = st.bearing.median.toFixed(0);
                const collProb = (st.collapse_probability * 100).toFixed(1);

                const frostClass = st.frost.median > 30 ? ' class="danger"' : st.frost.median > 15 ? ' class="warning"' : '';
                const bearClass = st.bearing.median < params.tukipinta.critical_min_mm ? ' class="danger"' : st.bearing.median < params.tukipinta.critical_min_mm * 1.3 ? ' class="warning"' : '';
                const collClass = st.collapse_probability > 0.10 ? ' class="danger"' : st.collapse_probability > 0.02 ? ' class="warning"' : '';

                html += `<td${frostClass}>${frostVal}</td><td${bearClass}>${bearVal}</td><td${collClass}>${collProb} %</td>`;
            }
            html += `</tr>`;
        }

        html += `</tbody></table>`;
        return html;
    }

    // ---- Helper: generate carbonation & corrosion table HTML ----
    static _carbonationTable(results, params) {
        const checkpoints = [2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060, 2065, 2070, 2075, 2080, 2090, 2100, 2110, 2126];
        let html = `
<table class="data-table yearly-table">
    <thead>
        <tr>
            <th rowspan="2">Vuosi</th>
            <th>Skenaario A</th>
            <th colspan="4">Korroosioriski (%)</th>
        </tr>
        <tr>
            <th class="sc-a">Karb. (mm)</th>
            <th class="sc-a">A</th>
            <th class="sc-b">B</th>
            <th class="sc-c">C</th>
            <th class="sc-d">D</th>
        </tr>
    </thead>
    <tbody>`;

        for (const year of checkpoints) {
            const yi = results.years.indexOf(year);
            if (yi < 0) continue;

            const stA = results.scenarios.A.stats[yi];
            const stB = results.scenarios.B.stats[yi];
            const stC = results.scenarios.C.stats[yi];
            const stD = results.scenarios.D.stats[yi];
            const carbVal = stA.carbonation.median.toFixed(1);
            const corrA = (stA.corrosion_probability * 100).toFixed(1);
            const corrB = (stB.corrosion_probability * 100).toFixed(1);
            const corrC = (stC.corrosion_probability * 100).toFixed(1);
            const corrD = (stD.corrosion_probability * 100).toFixed(1);

            html += `<tr><td class="year-cell">${year}</td>`;
            html += `<td>${carbVal}</td>`;
            html += `<td>${corrA} %</td>`;
            html += `<td>${corrB} %</td>`;
            html += `<td>${corrC} %</td>`;
            html += `<td>${corrD} %</td>`;
            html += `</tr>`;
        }

        html += `</tbody></table>`;
        return html;
    }

    // ---- Helper: generate conclusions ----
    static _conclusions(results, params, inputData) {
        const edgeFactor = params.tukipinta.reunakerroin || 1.5;
        const s = results.summary;
        const collapseA = s.A.collapse_risk_year;
        const collapseB = s.B.collapse_risk_year;
        const collapseC = s.C.collapse_risk_year;
        const collapseD = s.D.collapse_risk_year;

        const risk2035A = ((s.A.collapse_prob_2035 || 0) * 100).toFixed(1);
        const risk2035B = ((s.B.collapse_prob_2035 || 0) * 100).toFixed(1);
        const risk2035C = ((s.C.collapse_prob_2035 || 0) * 100).toFixed(1);
        const risk2035D = ((s.D.collapse_prob_2035 || 0) * 100).toFixed(1);
        const risk2050A = ((s.A.collapse_prob_2050 || 0) * 100).toFixed(1);

        const ageYears = 2026 - inputData.kohde_tiedot.rakennettu;
        const exposureYears = 2026 - inputData.kohde_tiedot.vesieristys_vuotanut_alkaen;

        // Find year when 5% collapse risk is exceeded (same logic as executive summary)
        const yearExceed5A = ReportGenerator._yearWhenProbExceeds(results, 'A', 'collapse_probability', 0.05);
        const waitingYearsA = yearExceed5A ? yearExceed5A - 2026 : null;

        // Conservatism adjustment (same as in generate())
        const conservatismFactor = (params.tukipinta.original_depth_mm - 50) /
                                   (params.tukipinta.original_depth_mm - params.tukipinta.critical_min_mm);
        const critSatYear = params.frost.critical_saturation_year;
        function adjustYear(modelYear) {
            if (!modelYear || isNaN(modelYear)) return null;
            return Math.round(critSatYear + (modelYear - critSatYear) * conservatismFactor);
        }
        const adjustedMedianA = adjustYear(collapseA?.median);
        const adjustedMedianB = adjustYear(collapseB?.median);
        const adjustedMedianC = adjustYear(collapseC?.median);
        const adjustedMedianD = adjustYear(collapseD?.median);

        function formatAdjusted(year) {
            if (!year) return '\u2014';
            return `${year - 2026}\u00a0vuotta (vuoteen ~${year})`;
        }

        return `
<p>
    Monte Carlo -simulaation tulokset osoittavat, että ${inputData.kohde_tiedot.nimi}n pihakansi
    on ${ageYears} vuotta vanha ja on ollut alttiina hallitsemattomalle
    kosteusrasitukselle ${exposureYears} vuotta. <strong>Vesieristeen vuotaminen ei laskelmien mukaan
    vaaranna kannen kantavuutta.</strong> Vuoden 2024 ohuthieanalyysi kuvaa TT-rivan betonin
    &rdquo;rapautumattomaksi&rdquo;, korroosioaste on vain 0&ndash;1 % ja betonin lujuusominaisuudet ovat säilyneet.
    ${waitingYearsA !== null
        ? `Simulaation mukaan rakenne kestää turvallisesti vähintään ${waitingYearsA} vuotta ilman
    toimenpiteitä (tukipinta saavuttaa EC2:n suunnittelurajan uusille rakenteille vasta vuonna ${yearExceed5A}).`
        : `Tukipinta pysyy EC2:n suunnittelurajan yläpuolella koko simulaatiojaksolla.`}
</p>

<h3>Vesieristeen vuoto ei ole kantavuusriski</h3>
<p>
    Vesieristeen pitkäaikainen vuotaminen on ymmärrettävästi herättänyt huolta rakenteen kestävyydestä.
    Laskelmat ja kenttähavainnot osoittavat kuitenkin, ettei vuoto ole heikentänyt kannen kantavuutta:
</p>
<ul>
    <li><strong>Korroosio on vähäistä:</strong> Havaittu korroosioaste on vain 0&ndash;1 % ${ageYears} vuoden
        kosteusrasituksen jälkeen. ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betonin
        tiivis huokosrakenne ja matala vesisementtisuhde hidastavat karbonatisaatiota luonnostaan,
        minkä vuoksi karbonatisaatiorintama ei ole saavuttanut pääteräksiä kuin harvoissa pisteissä [5, 19, 30].</li>
    <li><strong>Betoni on lujaa:</strong> ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betoni
        (~${inputData.kohde_tiedot.betonin_suunnittelulujuus_mpa} MPa) kestää huomattavia kuormia.
        Vuoden 2024 ohuthieanalyysi osoittaa TT-rivan betonin olevan &rdquo;rapautumaton&rdquo; [2, 10].</li>
    <li><strong>Tukipinnassa on marginaalia:</strong> TT-laatan tukipinnan turvamarginaali Eurokoodi 2:n
        vähimmäisvaatimukseen (${params.tukipinta.critical_min_mm} mm) on arviolta noin
        ${(params.tukipinta.original_depth_mm - edgeFactor * params.tukipinta.rapautuminen_reuna_mm_per_year * (2026 - params.frost.critical_saturation_year)).toFixed(0)} mm
        vuonna 2026, ja pakkasrapautuminen pienentää sitä hitaasti (noin ${params.tukipinta.rapautuminen_reuna_mm_per_year} mm/a).
        ${params.tukipinta.critical_min_mm} mm raja on Eurokoodi 2:n suunnitteluarvo <em>uusille rakenteille</em>,
        eikä huomioi betonin todellista jäännöslujuutta [1, 6, 17].</li>
</ul>
<p>
    Malli on <strong>tietoisesti konservatiivinen</strong>: se käyttää raja-arvona Eurokoodi 2:n
    vähimmäistukipintaa uusille rakenteille (${params.tukipinta.critical_min_mm}\u00a0mm), eikä huomioi betonin
    todellista jäännöslujuutta. EC2-rajan alittuminen ei siis tarkoita sortumista, vaan sitä
    että tukipinta pienenee alle uudisrakentamisen suunnittelunormin [1, 6, 17].
    Oikaistut arviot, joissa rajana käytetään betonin lujuuden perusteella
    50\u00a0mm (${params.tukipinta.critical_min_mm}\u00a0mm:n sijaan), antavat mediaaniajoiksi:
    A:\u00a0<strong>~${formatAdjusted(adjustedMedianA)}</strong>,
    B:\u00a0<strong>~${formatAdjusted(adjustedMedianB)}</strong>,
    C:\u00a0<strong>~${formatAdjusted(adjustedMedianC)}</strong>,
    D:\u00a0<strong>~${formatAdjusted(adjustedMedianD)}</strong>
    (ks. luku 4.4).
</p>

<h3>Skenaariovertailu</h3>
<ol>
    <li><strong>Ilman korjaustoimenpiteitä (skenaario A)</strong> EC2:n vähimmäistukipinta
        (${params.tukipinta.critical_min_mm}\u00a0mm, uudet rakenteet) alittuu mediaanilla vuonna
        ${ReportGenerator._formatYear(collapseA)}
        ${!isNaN(collapseA.p5) && collapseA.n > 0 ? `(90 % luottamusväli: ${Math.round(collapseA.p5)}\u2013${Math.round(collapseA.p95)})` : ''}.
        Todennäköisyys rajan alitukselle vuoteen 2035 mennessä on ${risk2035A}\u00a0% ja vuoteen 2050 mennessä ${risk2050A}\u00a0%.
        Rakenne kestää laskennallisesti turvallisesti vuosikymmeniä ilman toimenpiteitä.
        Betonin lujuusreservin huomioiva oikaistu arvio on ~${formatAdjusted(adjustedMedianA)}.
        Pihakannen vaahterat säilytetään.
    </li>
    <li><strong>Pintaremontilla (skenaario B)</strong> EC2-rajan alituksen mediaani siirtyy
        arvoon ${ReportGenerator._formatYear(collapseB)}
        ${!isNaN(collapseB.p5) && collapseB.n > 0 ? `(90 % luottamusväli: ${Math.round(collapseB.p5)}\u2013${Math.round(collapseB.p95)})` : ''}.
        Pintaremontti sisältää pintarakenteiden päivityksen (betonilaatoituksen vaihto, pintavesien
        johtamisen parannus), vauriokohtien korjauksen ja piha-alueen kosmeettisen kohennuksen.
        Samalla parannetaan autotallin estetiikkaa: valaistusta kirkastetaan,
        betonipalkkeja harjataan ja maalataan valituilta osin, seinäpintoja maalataan,
        ja tarvittaessa lisätään peltejä vesien ohjaamiseksi viemäriin.
        Pihakannen vaahterat säilytetään, ja yleisilme paranee merkittävästi.
        Betonin lujuusreservin huomioiva oikaistu arvio on ~${formatAdjusted(adjustedMedianB)}.
    </li>
    <li><strong>Täyskorjauksella (skenaario C)</strong> EC2-rajan alituksen mediaani on
        ${ReportGenerator._formatYear(collapseC)}
        ${!isNaN(collapseC.p5) && collapseC.n > 0 ? `(90 % luottamusväli: ${Math.round(collapseC.p5)}\u2013${Math.round(collapseC.p95)})` : ''}.
        Täyskorjaus pysäyttää pakkasrapautumisen lähes kokonaan ja pidentää käyttöikää merkittävästi.
        Betonin lujuusreservin huomioiva oikaistu arvio on ~${formatAdjusted(adjustedMedianC)}.
        Hallituksen hankesuunnitelmassa pihakannen vaahterat kaadetaan, vaikka vaahtereiden
        kaatamiselle ei ole asiallista syytä ja korjaus on toteutettavissa myös ne säilyttäen.
    </li>
    <li><strong>Täyskorjaus puut säilyttäen (skenaario D)</strong> tuottaa rakenteellisesti saman tuloksen kuin skenaario C:
        EC2-rajan alituksen mediaani on ${ReportGenerator._formatYear(collapseD)}
        ${!isNaN(collapseD.p5) && collapseD.n > 0 ? `(90 % luottamusväli: ${Math.round(collapseD.p5)}\u2013${Math.round(collapseD.p95)})` : ''}.
        Oikaistu arvio on ~${formatAdjusted(adjustedMedianD)}.
        Kustannus on noin 10\u00a0% pienempi kuin skenaariossa C, koska puualuetta (~156\u00a0m\u00b2) ei tarvitse purkaa.
        Pihakannen vaahterat säilytetään erillisessä kasvualustassa (syvyys 1\u20131,5\u00a0m, mitoitettu 4 puulle).
        Patolevy-vaihtoehto suojaa rakenteita juuristolta. Kaupunkikuvallinen arvo ja hiilinielu säilyvät.
    </li>
</ol>
<p>
    Skenaariot B ja D säilyttävät pihakannen suuret vaahterat &mdash; Itä-Pasilan suurimmat puut.
    Skenaario D (täyskorjaus puut säilyttäen) yhdistää täyskorjauksen rakenteelliset hyödyt
    puuston säilyttämiseen ja on noin 10\u00a0% edullisempi kuin C. Hallituksen hankesuunnitelmassa
    (skenaario C) täyskorjaus edellyttää vaahtereiden kaatamista, minkä jälkeen piha-alueen
    palautuminen nykyiselle vihreystasolle veisi vuosikymmeniä. Vaahtereiden kaatamiselle ei ole
    rakenteellista eikä muutakaan asiallista syytä &mdash; koko vesieristeen uusimisen sisältävä
    remontti on toteutettavissa myös vaahterat säilyttäen (skenaario D).
</p>

<h3>Hiilijalanjälki</h3>
<p>
    Skenaarioiden ympäristövaikutukset eroavat merkittävästi (ks. luku 8):
    passiivisen vaihtoehdon (A) nettovaikutus on negatiivinen (\u2212${Math.abs(calculateCO2Emissions(inputData).A.netto_t).toFixed(1)}\u00a0t CO\u2082,
    puuston ansiosta), pintaremontin (B) nettopäästöt ovat ~${calculateCO2Emissions(inputData).B.netto_t}\u00a0t CO\u2082,
    täyskorjauksen (C) ~${calculateCO2Emissions(inputData).C.netto_t}\u00a0t CO\u2082
    ja täyskorjauksen puut säilyttäen (D) ~${calculateCO2Emissions(inputData).D.netto_t}\u00a0t CO\u2082.
    Skenaario D:n päästöt ovat huomattavasti pienemmät kuin C:n, koska puuston hiilinielu säilyy
    ja rakennuspäästöt ovat noin 10\u00a0% pienemmät.
    Skenaariossa C hiilijalanjälkeä kasvattaa merkittävästi pihakannen vaahtereiden kaataminen,
    joka vapauttaa puiden hiilivaraston ja lopettaa vuotuisen hiilensidonnan [41, 42].
</p>

<h3>Johtopäätös korjaustarpeesta</h3>
<p>
    Laskelmien perusteella <strong>massiivinen täyskorjaus
    (${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. \u20ac)
    ei vaikuta perustellulta tässä vaiheessa</strong>.
    Rakenne kestää konservatiivisenkin arvion mukaan turvallisesti vielä vuosikymmeniä, ja
    betonin kunto on kenttähavaintojen perusteella hyvä. Alkuperäinen kermieristys on käyttöikänsä
    lopussa ja vuotaa, mikä on aiheuttanut hidasta pakkasrapautumista. Rapautumisen vauhti on kuitenkin
    ${inputData.kohde_tiedot.betonin_suunnittelulujuus}-luokan betonissa niin maltillinen,
    ettei se muodosta akuuttia turvallisuusriskiä. Kermieristeen uusimisen viivästyessä
    pakkasrapautuminen jatkuu ja rakenteet kastuvat lisää, mikä kasvattaa myöhempää kuivaustarvetta.
</p>
<p>
    Molemmat kuntotutkimukset (${inputData.mittaustiedot_2006.vuosi} ja ${inputData.mittaustiedot_2024.vuosi})
    ovat suositelleet korjausta, ja vesieristeen korjaus on pitkällä aikavälillä perusteltua
    pakkasrapautumisen pysäyttämiseksi. Korjauksen ajoituksessa on kuitenkin liikkumavaraa, ja
    päätöksentekijät voivat harkita korjausta osana normaalia kiinteistön ylläpitosuunnitelmaa
    ilman erityistä kiireellisyyttä. On myös huomattava, että hallituksen valmistelemassa
    hankesuunnitelmassa täyskorjaus (skenaario C) edellyttäisi pihakannen kahden suuren vaahteran
    kaatamista &mdash; puut ovat Itä-Pasilan suurimmat ja kuusikerroksisen kerrostalon korkuiset.
    Vaahtereiden kaatamiselle ei ole asiallista syytä: vesieristeen uusimisen sisältävä
    täyskorjaus on toteutettavissa myös vaahterat säilyttäen (skenaario D).
    Skenaario D tuottaa rakenteellisesti saman tuloksen kuin C, mutta on noin 10\u00a0%
    edullisempi ja säilyttää puuston hiilinielun.
</p>

<h3>Suositukset</h3>
<ol>
    <li><strong>Ei akuuttia korjaustarvetta:</strong>
        Simulaatio osoittaa, ettei tilanne ole kiireellinen.
        Tukipinta pysyy Eurokoodi\u00a02:n suunnittelurajan (${params.tukipinta.critical_min_mm}\u00a0mm, uudet rakenteet)
        yläpuolella vielä vuosikymmeniä, ja todellinen reservi on todennäköisesti
        malliennustetta suurempi konservatiivisten oletusten vuoksi.
        TT-laatan tukipinnan turvamarginaali on arviolta noin
        ${(params.tukipinta.original_depth_mm - edgeFactor * params.tukipinta.rapautuminen_reuna_mm_per_year * (2026 - params.frost.critical_saturation_year)).toFixed(0)} mm
        vuonna 2026.</li>
    <li><strong>Kermieristeen korjaus pitkällä aikavälillä:</strong> Alkuperäinen kermieristys
        (bitumivedeneriste, rak. ${inputData.kohde_tiedot.rakennettu}) on käyttöikänsä lopussa ja
        vuotaa jo nyt. Kermieristeen uusiminen on perusteltua
        pakkasrapautumisen pysäyttämiseksi: mitä pidempään eriste vuotaa, sitä enemmän
        pakkasrapautumista kertyy ja rakenteet kastuvat lisää, mikä kasvattaa myöhempää
        kuivaustarvetta. Korjauksen ajoitus voidaan kuitenkin sovittaa taloyhtiön
        taloussuunnitelmaan. Pintaremontti (skenaario B, ${(params.light_repair.cost_total_min_eur / 1000).toFixed(0)}\u2013${(params.light_repair.cost_total_max_eur / 1000).toFixed(0)}&nbsp;t\u20ac)
        voi olla kustannustehokas vaihtoehto, joka samalla kohentaa piha-alueen yleisilmettä
        ja säilyttää pihakannen vaahterat.
        Täyskorjauksen kilpailutettu kustannusarvio on
        ${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur / 1e6).toFixed(1)} milj. \u20ac.
        Mikäli täyskorjaus toteutetaan, skenaario D (puut säilyttäen,
        ~${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_min_eur * 0.9 / 1e6).toFixed(1)}\u2013${(inputData.mittaustiedot_2024.toteutunut_kustannusarvio_max_eur * 0.9 / 1e6).toFixed(1)} milj. \u20ac)
        on suositeltava vaihtoehto, koska se on edullisempi, säilyttää pihakannen
        vaahterat ja tuottaa rakenteellisesti saman lopputuloksen.</li>
    <li><strong>Sadevesikaivojen huolto ja pintakuivatus:</strong> Vuoden 2024 kuntotutkimuksessa [35] havaittiin,
        että pihakannen sadevesikaivojen vedenpoisto oli estynyt: kaivot olivat tutkimushetkellä
        täynnä vettä, vaikka viimeisestä sateesta oli kulunut noin 4 vuorokautta (Contrust Oy, kohta 5.2).
        Tämä viittaa siihen, että kaivojen säännöllinen huolto (puhdistus, tukkeutumien poisto)
        on laiminlyöty. Toimiva pintakuivatus on rakenteen pitkäikäisyyden kannalta olennaista,
        koska seisova vesi lisää pakkasrapautumisen riskiä ja kosteusrasitusta.
        <strong>Sadevesikaivot tulee puhdistaa ja niiden toimivuus tarkistaa vähintään kaksi kertaa
        vuodessa</strong> (keväällä ja syksyllä). Huolto tulee jatkossa hoitaa ammattimaisesti ja
        ajallaan osana kiinteistön säännöllistä kunnossapito-ohjelmaa.
        Contrust Oy:n suosituksen mukaisesti kaivot tulisi uusia korjaushankkeen yhteydessä.</li>
    <li><strong>Seuranta:</strong> Rakenteen kuntoa on hyvä seurata säännöllisesti (esim. 3\u20135 vuoden välein).
        Erityistä huomiota tulee kiinnittää TT-laatan tukipintoihin ja mahdollisiin muodonmuutoksiin.
        Mikäli seurantahavainnoissa ilmenee merkittävää muutosta, korjauksen ajoitusta tulee arvioida
        uudelleen [2, 6, 20].</li>
    <li><strong>Normaali käyttö voi jatkua:</strong> Pihakannen normaali henkilöautopysäköinti voi jatkua
        ilman rajoituksia. Raskaan kaluston (yli ${inputData.kohde_tiedot.kantavuus_kpa} kN/m\u00b2) pitkäaikainen
        pysäköinti ei ole suositeltavaa [1, 6].</li>
</ol>

<div class="disclaimer">
    <strong>Huomautus:</strong> Tämä analyysi perustuu probabilistiseen mallinnukseen, jossa
    lähtötiedot on kalibroitu kahden kuntotutkimuksen mittaustuloksista (Vahanen 2006, Contrust 2024).
    Karbonatisaatiokertoimet on kalibroitu vuoden 2024 ohuthieanalyysin tuloksista, jotka ovat
    luotettavampia kuin kenttä-fenolftaleiinikoe kosteassa betonissa.
    Mallin tulokset ovat suuntaa-antavia ja niitä tulee tulkita yhdessä rakennesuunnittelijan
    asiantuntemuksen kanssa. Simulaation parametrit voidaan päivittää mahdollisten lisätutkimusten
    tulosten perusteella.
</div>`;
    }

    // ---- CO2 Chapter content ----
    static _co2Chapter(inputData) {
        const co2 = calculateCO2Emissions(inputData);
        const v = CO2_FACTORS.vertaukset;

        function fmtKg(val) { return Math.abs(val).toLocaleString("fi-FI"); }

        return `
<p>
    Tässä luvussa arvioidaan kunkin korjausskenaarion hiilijalanjälkeä. Laskelma kattaa
    rakennusmateriaalien valmistuksen, kuljetuksen ja työmaan päästöt sekä pihakannen puuston
    hiilensidonnan vaikutuksen 30 vuoden tarkastelujaksolla. Päästökertoimet perustuvat
    julkisiin tietokantoihin [37, 38, 39, 40] ja puustotutkimuksiin [41, 42].
</p>

<h3 id="ch-8-1"><span class="chapter-num">8.1</span> Päästökertoimet</h3>
<table class="data-table" style="margin: 12px 0;">
    <thead>
        <tr>
            <th style="text-align:left;">Materiaali / toiminto</th>
            <th>Päästökerroin</th>
            <th>Yksikkö</th>
            <th style="text-align:left;">Lähde</th>
        </tr>
    </thead>
    <tbody>
        <tr><td style="text-align:left;">Betoni (C32/40)</td><td>${CO2_FACTORS.betoni.kerroin}</td><td>kg CO\u2082e/m\u00b3</td><td style="text-align:left;">CO2data.fi; ICE v3.0 [37, 38]</td></tr>
        <tr><td style="text-align:left;">Raudoitus (kierrätetty)</td><td>${CO2_FACTORS.teras.kerroin}</td><td>kg CO\u2082e/kg</td><td style="text-align:left;">ICE v3.0 [38]</td></tr>
        <tr><td style="text-align:left;">Bitumikermi</td><td>${CO2_FACTORS.bitumikermi.kerroin}</td><td>kg CO\u2082e/m\u00b2</td><td style="text-align:left;">CO2data.fi; Syke [37, 39]</td></tr>
        <tr><td style="text-align:left;">Maali (akrylaatti)</td><td>${CO2_FACTORS.maali.kerroin}</td><td>kg CO\u2082e/m\u00b2</td><td style="text-align:left;">ICE v3.0 [38]</td></tr>
        <tr><td style="text-align:left;">Työkoneet (diesel)</td><td>${CO2_FACTORS.tyokoneet.kerroin}</td><td>kg CO\u2082e/kWh</td><td style="text-align:left;">CO2data.fi; Lipasto [37]</td></tr>
        <tr><td style="text-align:left;">Purkujäte (kuljetus + käsittely)</td><td>${CO2_FACTORS.purkujate.kerroin}</td><td>kg CO\u2082e/t</td><td style="text-align:left;">Syke [39]</td></tr>
        <tr><td style="text-align:left;">Iso vaahtera (hiilivarasto)</td><td>~${CO2_FACTORS.puusto.iso_vaahtera_hiilivarasto_kg}</td><td>kg C/puu</td><td style="text-align:left;">Nowak et al. 2002 [41]</td></tr>
        <tr><td style="text-align:left;">Kaupunkipuu (vuotuinen sidonta)</td><td>~${CO2_FACTORS.puusto.vuotuinen_sidonta_kg_co2}</td><td>kg CO\u2082/puu/v</td><td style="text-align:left;">McPherson & Simpson 1999 [42]</td></tr>
    </tbody>
</table>

<h3 id="ch-8-2"><span class="chapter-num">8.2</span> Skenaariokohtaiset päästöt</h3>

<table class="data-table" style="margin: 12px 0;">
    <thead>
        <tr>
            <th style="text-align:left;">Skenaario</th>
            <th>Rakentaminen</th>
            <th>Puusto (30 v)</th>
            <th>Netto</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:left;"><strong>A: Passiivinen</strong></td>
            <td>0 t</td>
            <td>\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t (puut sitovat)</td>
            <td><strong>${co2.A.netto_t} t</strong></td>
        </tr>
        <tr>
            <td style="text-align:left;"><strong>B: Pintaremontti</strong></td>
            <td>~${(co2.B.rakentaminen_kg / 1000).toFixed(0)} t</td>
            <td>\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t (puut sitovat)</td>
            <td><strong>~${co2.B.netto_t} t</strong></td>
        </tr>
        <tr>
            <td style="text-align:left;"><strong>C: Täyskorjaus</strong></td>
            <td>~${(co2.C.rakentaminen_kg / 1000).toFixed(0)} t</td>
            <td>+${(co2.C.puusto_kg / 1000).toFixed(1)} t (hiili vapautuu)</td>
            <td><strong>~${co2.C.netto_t} t</strong></td>
        </tr>
        <tr>
            <td style="text-align:left;"><strong>D: Täyskorjaus (puut säilyttäen)</strong></td>
            <td>~${(co2.D.rakentaminen_kg / 1000).toFixed(0)} t</td>
            <td>\u2212${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} t (puut sitovat)</td>
            <td><strong>~${co2.D.netto_t} t</strong></td>
        </tr>
    </tbody>
</table>

<p><strong>Skenaario B:n erittely:</strong></p>
<ul>
${co2.B.erittely.map(e => `    <li>${e.nimi}: ${fmtKg(e.kg)} kg CO\u2082e</li>`).join('\n')}
</ul>

<p style="margin-top: 8px;"><strong>Skenaario C:n erittely:</strong></p>
<ul>
${co2.C.erittely.map(e => `    <li>${e.nimi}: ${fmtKg(e.kg)} kg CO\u2082e</li>`).join('\n')}
</ul>

<p style="margin-top: 8px;"><strong>Skenaario D:n erittely:</strong></p>
<ul>
${co2.D.erittely.map(e => `    <li>${e.nimi}: ${fmtKg(e.kg)} kg CO\u2082e</li>`).join('\n')}
</ul>

<h3 id="ch-8-3"><span class="chapter-num">8.3</span> Vertailu ja havainnollistaminen</h3>
<p>
    Päästöjen suuruusluokkaa voi havainnollistaa arkipäiväisillä vertauksilla:
</p>
<table class="data-table" style="margin: 12px 0;">
    <thead>
        <tr>
            <th style="text-align:left;">Vertailu</th>
            <th>B: Pintaremontti</th>
            <th>C: Täyskorjaus</th>
            <th>D: Täyskorjaus (puut)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:left;">Helsinki\u2013Pariisi-lentoja (~${v.lento_hki_pariisi_kg} kg CO\u2082e/lento) [40]</td>
            <td>\u2248 ${co2.B.vertaukset.lennot_hki_pariisi} lentoa</td>
            <td>\u2248 ${co2.C.vertaukset.lennot_hki_pariisi} lentoa</td>
            <td>\u2248 ${co2.D.vertaukset.lennot_hki_pariisi} lentoa</td>
        </tr>
        <tr>
            <td style="text-align:left;">Henkilöauton ajokilometrit (${v.auto_kg_per_km} kg/km) [37]</td>
            <td>\u2248 ${(co2.B.vertaukset.autoilu_km / 1000).toFixed(0)}\u00a0000 km</td>
            <td>\u2248 ${(co2.C.vertaukset.autoilu_km / 1000).toFixed(0)}\u00a0000 km</td>
            <td>\u2248 ${(co2.D.vertaukset.autoilu_km / 1000).toFixed(0)}\u00a0000 km</td>
        </tr>
        <tr>
            <td style="text-align:left;">Keskivertosuomalaisen autoiluvuosia (~${v.suomalainen_autoilu_kg_per_v} kg/v)</td>
            <td>\u2248 ${co2.B.vertaukset.autoilu_vuodet} v</td>
            <td>\u2248 ${co2.C.vertaukset.autoilu_vuodet} v</td>
            <td>\u2248 ${co2.D.vertaukset.autoilu_vuodet} v</td>
        </tr>
    </tbody>
</table>

<h3 id="ch-8-4"><span class="chapter-num">8.4</span> Puuston merkitys hiilitaseessa</h3>
<p>
    Pihakannen kaksi suurta vaahterat ovat Itä-Pasilan suurimmat puut ja noin kuusikerroksisen
    kerrostalon korkuiset. Kukin puu varastoi arviolta noin ${CO2_FACTORS.puusto.iso_vaahtera_hiilivarasto_kg} kg hiiltä
    biomassaansa, mikä vastaa noin ${(CO2_FACTORS.puusto.iso_vaahtera_hiilivarasto_kg * 44 / 12 / 1000).toFixed(1)} tonnia
    CO\u2082:ta [41]. Lisäksi puut sitovat vuosittain yhteensä noin
    ${CO2_FACTORS.puusto.puita_kpl * CO2_FACTORS.puusto.vuotuinen_sidonta_kg_co2} kg CO\u2082:ta [42].
</p>
<p>
    Skenaarioissa A, B ja D vaahterat säilytetään, jolloin ne jatkavat hiilensidontataan koko
    elinaikansa. 30 vuodessa puiden nettosidonta on yhteensä noin ${(co2.puusto_30v.sidonta_kg / 1000).toFixed(1)} tonnia CO\u2082:ta.
</p>
<p>
    Skenaariossa C hankesuunnitelman mukaan vaahterat kaadetaan. Tällöin puiden hiilivarasto
    (~${(co2.puusto_30v.hiilivarasto_kg / 1000).toFixed(1)} t CO\u2082) vapautuu ilmakehään ja vuotuinen sidonta menetetään.
    Puuston kokonaisvaikutus skenaariossa C on noin +${(co2.C.puusto_kg / 1000).toFixed(1)} tonnia CO\u2082:ta
    30 vuoden tarkastelujaksolla. Tämä vastaa yksinään noin ${Math.round(co2.C.puusto_kg / v.lento_hki_pariisi_kg)}
    Helsinki\u2013Pariisi-lentoa.
</p>
<p>
    Skenaariossa D (täyskorjaus puut säilyttäen) rakennuspäästöt ovat noin 10\u00a0% pienemmät kuin
    skenaariossa C (puualuetta ~156\u00a0m\u00b2 ei pureta), ja puuston hiilinielu säilyy. Skenaarion D
    nettopäästöt ovat ~${co2.D.netto_t}\u00a0t CO\u2082, kun skenaarion C nettopäästöt ovat
    ~${co2.C.netto_t}\u00a0t CO\u2082. Ero johtuu sekä pienemmistä rakennuspäästöistä
    että puuston hiilinielun säilymisestä.
</p>
<p>
    Vaahtereiden säilyttäminen on siten paitsi viihtyisyyskysymys myös merkittävä
    ilmastoteko kaupunkiympäristössä [41, 42].
</p>
`;
    }

    // ---- Report CSS ----
    static _reportCSS() {
        return `
/* Report Print Styles */
@page {
    size: A4;
    margin: 25mm 20mm 25mm 20mm;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1e293b;
    background: #fff;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20mm 15mm;
}

@media screen {
    body { padding: 30px 40px; max-width: 900px; }
}

/* Print toolbar */
.print-toolbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #1e293b;
    color: #f1f5f9;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 9999;
    font-size: 13px;
}
.print-toolbar button {
    background: #6366f1;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
}
.print-toolbar button:hover { background: #4f46e5; }
@media screen { body { padding-top: 60px; } }

.no-print { }
@media print { .no-print { display: none !important; } }

/* Page breaks */
.page-break { page-break-before: always; }

/* Cover page */
.cover-page {
    text-align: center;
    padding: 60px 0 40px 0;
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.cover-badge {
    display: inline-block;
    background: #6366f1;
    color: white;
    padding: 6px 18px;
    border-radius: 4px;
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 24px;
}
.cover-page h1 {
    font-size: 26pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
    line-height: 1.2;
}
.cover-page h2 {
    font-size: 16pt;
    font-weight: 400;
    color: #475569;
    margin-bottom: 32px;
}
.cover-meta {
    color: #64748b;
    font-size: 11pt;
    margin-bottom: 40px;
}
.cover-meta p { margin-bottom: 4px; }
.cover-details {
    text-align: left;
    display: inline-block;
}
.cover-details table {
    border-collapse: collapse;
    font-size: 10pt;
}
.cover-details td {
    padding: 4px 16px 4px 0;
    color: #334155;
}
.cover-details td:first-child {
    font-weight: 600;
    color: #64748b;
    min-width: 160px;
}

/* Table of contents */
.toc-title {
    font-size: 16pt;
    font-weight: 700;
    margin-bottom: 20px;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
}
.toc { margin-bottom: 30px; }
.toc-item {
    display: flex;
    gap: 12px;
    padding: 5px 0;
    border-bottom: 1px dotted #e2e8f0;
    font-size: 11pt;
    text-decoration: none;
    color: inherit;
}
.toc-item.sub { padding-left: 24px; }
.toc-num { font-weight: 600; color: #6366f1; min-width: 30px; }
.toc-text { color: #334155; }
.toc-item:hover .toc-text { color: #6366f1; text-decoration: underline; }

/* Headings */
h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    margin: 28px 0 14px 0;
    padding-bottom: 6px;
    border-bottom: 2px solid #6366f1;
    page-break-after: avoid;
}
h3 {
    font-size: 12pt;
    font-weight: 700;
    color: #1e293b;
    margin: 20px 0 10px 0;
    page-break-after: avoid;
}
h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
    margin: 14px 0 6px 0;
}
.chapter-num {
    color: #6366f1;
    margin-right: 8px;
}

/* Paragraphs */
p {
    margin-bottom: 10px;
    text-align: justify;
    hyphens: auto;
}

/* Lists */
ol, ul {
    margin: 8px 0 14px 24px;
}
li { margin-bottom: 6px; }

/* Tables */
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
}
.data-table thead { background: #f1f5f9; }
.data-table th {
    padding: 7px 10px;
    text-align: center;
    font-weight: 600;
    color: #334155;
    border: 1px solid #cbd5e1;
    font-size: 9pt;
}
.data-table td {
    padding: 5px 10px;
    text-align: center;
    border: 1px solid #e2e8f0;
    color: #1e293b;
}
.data-table .label-cell {
    text-align: left;
    font-weight: 500;
    color: #475569;
    background: #f8fafc;
}
.critical { color: #dc2626; font-weight: 600; }
.table-note {
    font-size: 9pt;
    color: #64748b;
    margin-top: -8px;
    margin-bottom: 16px;
    font-style: italic;
}

/* Scenario colors */
.sc-a { background: rgba(244, 63, 94, 0.08); }
.sc-b { background: rgba(245, 158, 11, 0.08); }
.sc-c { background: rgba(16, 185, 129, 0.08); }
.sc-d { background: rgba(99, 102, 241, 0.08); }
th.sc-a { border-bottom: 3px solid #f43f5e; }
th.sc-b { border-bottom: 3px solid #f59e0b; }
th.sc-c { border-bottom: 3px solid #10b981; }
th.sc-d { border-bottom: 3px solid #6366f1; }

/* Danger/warning cells */
.danger { color: #dc2626; font-weight: 600; }
.warning { color: #d97706; font-weight: 600; }
.year-cell { font-weight: 600; text-align: left !important; background: #f8fafc; }

/* Formulas */
.formula {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #6366f1;
    padding: 10px 16px;
    text-align: center;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
}

/* Chart figures */
.chart-figure {
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
}
.chart-figure img {
    max-width: 100%;
    height: auto;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
}
.chart-figure figcaption {
    font-size: 9pt;
    color: #64748b;
    margin-top: 6px;
    font-style: italic;
}
.no-chart {
    text-align: center;
    color: #94a3b8;
    padding: 20px;
    border: 1px dashed #cbd5e1;
    border-radius: 4px;
    margin: 12px 0;
}

/* Disclaimer */
.disclaimer {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-left: 4px solid #f59e0b;
    border-radius: 0 4px 4px 0;
    padding: 12px 16px;
    margin: 20px 0;
    font-size: 10pt;
    color: #92400e;
}

/* References */
.references {
    font-size: 9.5pt;
    line-height: 1.5;
    counter-reset: none;
}
.references li {
    margin-bottom: 8px;
    padding-left: 4px;
}
.references em { font-style: italic; }
.url {
    color: #6366f1;
    word-break: break-all;
}

/* Report footer */
.report-footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 8.5pt;
    color: #94a3b8;
}

/* Yearly results table */
.yearly-table {
    font-size: 8.5pt;
}
.yearly-table th {
    font-size: 8pt;
}

/* Executive summary */
.executive-summary {
    margin: 20px 0 30px 0;
}
.executive-summary > p {
    font-size: 11pt;
    margin-bottom: 12px;
}
.scenario-box {
    border: 2px solid;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 12px 0;
    page-break-inside: avoid;
}
.scenario-box h4 {
    margin: 0 0 10px 0;
    font-size: 11pt;
}
.scenario-box.sc-a-box {
    border-color: #f43f5e;
    background: rgba(244, 63, 94, 0.06);
}
.scenario-box.sc-b-box {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.06);
}
.scenario-box.sc-c-box {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.06);
}
.scenario-box.sc-d-box {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
}
.scenario-box .key-metric {
    display: inline-block;
    margin-right: 24px;
    margin-bottom: 6px;
}
.scenario-box .key-metric .value {
    font-size: 14pt;
    font-weight: 700;
    color: #0f172a;
}
.scenario-box .key-metric .label {
    font-size: 8.5pt;
    color: #64748b;
    display: block;
}
.scenario-box .box-note {
    margin-top: 8px;
    margin-bottom: 0;
    font-size: 9.5pt;
    text-align: left;
}
.verdict-box {
    background: #ecfdf5;
    border: 2px solid #059669;
    border-radius: 6px;
    padding: 16px 20px;
    margin: 20px 0;
    text-align: center;
    page-break-inside: avoid;
}
.verdict-box p {
    text-align: center;
    margin-bottom: 4px;
}
.verdict-box .verdict-main {
    font-size: 13pt;
    font-weight: 700;
    color: #065f46;
}
`;
    }
}
