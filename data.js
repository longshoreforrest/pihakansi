// ============================================================
// Pihakansi Life-Cycle Analysis – Input Data & Parameters
// As Oy Sato-Pasila
//
// KORJATTU: Kalibroitu vuosien 2006 JA 2024 kuntotutkimusten
// perusteella. Ohuthieanalyysin karbonatisaatioarvot ovat
// luotettavampia kuin kenttäfenolftaleiinimittaukset kosteassa
// betonissa (Parrott 1987, fib MC 2010).
// ============================================================

const INPUT_DATA = {
    kohde_tiedot: {
        nimi: "As Oy Sato-Pasila",
        rakennettu: 1974,  // Vahanen 2006: "1974"; Contrust 2024: "1973" — käytetään vanhemman raportin arvoa
        pinta_ala_m2: 1565, // Vahanen 2006: ~1 565 m²; Contrust 2024: ~1 300 m² (eri mittaustapa)
        rakenne: "TT-laatasto pilaripalkkirungolla",
        vesieristys_vuotanut_alkaen: 1975,
        betonin_suunnittelulujuus: "K400",  // ≈ C32/40, puristuslujuus ~40 MPa
        betonin_suunnittelulujuus_mpa: 40,  // kp/cm² → MPa
        rakenneterakset: {
            pilarit: "A 40 H, A 22",
            leukapalkit: "A 40 H, A 22",
            tt_laatat: "Jänneteräs ST 160/180, A 40 H, verkko B50V",
        },
        kantavuus_kpa: 5.8,  // suunnittelukuorma 580 kp/m² ≈ 5.8 kN/m²
    },

    mittaustiedot_2006: {
        vuosi: 2006,
        tutkija: "Vahanen Oy",
        raportti_url: "https://drive.google.com/file/d/1jt7b_MVyD7v4312SzqtQErrDBKa6O2L8/view?usp=sharing",
        karbonatisaatio_ka_mm: {
            pilarit: 17.5,        // D/6, fenolftaleiinikoe, vaihteluväli 16–19 mm
            leukapalkit: 16.5,    // B/4-5, fenolftaleiinikoe, vaihteluväli 14–19 mm
            tt_laatat: 12.0,      // kenttämittaus ka., pistekohtaisesti jopa 20 mm
        },
        betonipeite_ka_mm: {
            pilarit: 35,
            leukapalkit: 41,
            tt_ripa_alapinta: 20, // peitepaksuusmittarilla, vaihteluväli 5–35 mm, 26 % välillä 6–10 mm
        },
        kloridit_paino_prosenttia: 0.02,  // max yksittäinen näyte, pääosin alle määritysrajan
        pakkasrapautuminen: "TT-ripa rapautumista 24 mm syvyyteen (B/4-5), 20 mm (B/2-3). Ettringiittiä E/5-6.",
        tukipinta: {
            leukapalkin_leuka_mm: 150,    // leukapalkin leukaosan leveys
            tt_tukipinta_leukapalkilla_mm: 100,  // TT-laatan todellinen tukipinta leukapalkilla
        },
        pintaterakset: "Muutamissa kohdin TT-ripojen alapinnoissa havaittiin valupintaan jääneitä hakateräksiä",
        betonipeite_jakauma_tt_ripa: "26 % mitatuista haoista 6–10 mm peitesyvyydellä, vaihteluväli 5–35 mm",
        suositus_remontille: 2008,
    },

    mittaustiedot_2024: {
        vuosi: 2024,
        tutkija: "Contrust Oy",
        raportti_url: "https://drive.google.com/file/d/1Ynu3_LPNEDh_npCL07y9s12zJwfI_T5-/view?usp=sharing",
        karbonatisaatio_ka_mm: {
            // Kenttämittaus fenolftaleiinikoe — aliarvio kosteassa betonissa!
            pilarit: 5.0,            // PI1–PI4 keskiarvo, vaihteluväli 0–15 mm
            tt_laatta_laippa: 3.7,   // L1–L2 laippa ka., vaihteluväli 0–11 mm
            tt_laatta_ripa: 6.3,     // P1–P4 ripa ka., vaihteluväli 0–19 mm
        },
        karbonatisaatio_ohuthie_ka_mm: {
            // Ohuthieanalyysi — luotettavampi kosteassa betonissa
            pilarit: 12.0,           // PI3 (B/3), vaihteluväli 7–19 mm
            tt_laatta_laippa: 9.0,   // L1 (B/1-2), vaihteluväli 4–12 mm
            tt_laatta_ripa: 12.0,    // P3 (B/3-4), vaihteluväli 8–16 mm
        },
        betonipeite_ka_mm: {
            pilarit: 37.9,
            tt_laatta_laippa: 30.0,
            tt_laatta_ripa: 39.9,    // huom: eri mittauspisteet kuin 2006 (alapinta 5–35 mm)
        },
        korroosioaste_prosenttia: {
            pilarit: 1,              // "korroosioriski on vähäinen"
            tt_laatta_laippa: 0,
            tt_laatta_ripa: 1,
        },
        vetolujuus_mpa: [2.2, 1.5, 2.4, 2.3, 3.0, 0.9, 1.9],  // kenttä + laboratorio
        ohuthie_havainnot: {
            tt_laatta_laippa: "Rapautunut, ettringiittiä huokosissa, sementtipastan rapautumista",
            tt_laatta_ripa: "Rapautumaton, laadullisia puutteita (runsas huokoisuus)",
            pilarit: "Rapautumaton, laadullisia puutteita",
        },
        pintaterakset: "Paljastuneita raudoitteita useissa TT-laatoissa, yksittäisiä paljastuneita jännepunoksia. Vauriot arviolta valmistuksen aikaisia työvirheitä (peitepaksuudet).",
        kloridit_paino_prosenttia: 0.005,  // kaikki näytteet < 0.01 (alle määritysrajan)
        suositus_remontille: 2026,
        arvioitu_korjauskustannus_eur_per_m2: 800,  // Contrust Oy arvio (1 300 m²) → ~1 040 000 €
        toteutunut_kustannusarvio_min_eur: 1500000,  // Urakan kilpailutuksen jälkeen
        toteutunut_kustannusarvio_max_eur: 2000000,  // Urakan kilpailutuksen jälkeen
    },
};

// ============================================================
// Simulation Parameters (adjustable)
//
// REKALIBROINTI (v3.0):
// k-kertoimet kalibroitu 2024 ohuthieanalyysistä (t = 50 v),
// koska ohuthie antaa luotettavamman karbonatisaatiosyvyyden
// kosteuskyllästyneessä betonissa. Kenttäfenolftaleiinikoe
// aliarvio kosteassa betonissa 2–4-kertaisesti.
//
// Tukipinta korjattu 100 mm:iin (TT:n todellinen tukipinta
// leukapalkilla per 2006 raportti), ei 150 mm (leukapalkin
// leukaosan leveys).
//
// Pakkasrapautumismalli kalibroitu kenttähavaintoihin (v4.0):
// base_rate 0.30 → 0.20, acceleration_factor 1.03 → 1.00 (lineaarinen),
// rate_cov 0.35 → 0.45. Lineaarinen oletus koska K400-betoni on
// osoittanut 50 vuoden kokeessa, ettei merkittävää kiihtymistä tapahdu.
// Kiihtyvyyskerroin säädettävissä sivupalkista (a > 1.00 = konservatiivisempi).
// Kalibroitu 2006 (24 mm pahin) ja 2024 ("rapautumaton") dataan.
// ============================================================

const DEFAULT_PARAMS = {
    // Monte Carlo
    monte_carlo_iterations: 10000,

    // Carbonation model: two-phase dampened √t model
    //
    // KAKSIVAIHEINEN MALLI (v9.0):
    // Kirjallisuus (Concrete Society, Parrott 1987, fib MC 2010, Kaila "Talotohtori"):
    // K400-betonin tiivis huokosrakenne ja CaCO₃:n tiivistävä vaikutus
    // hidastavat CO₂-diffuusiota merkittävästi pitkällä aikavälillä.
    // Lisäksi ulko-olosuhteissa (sade, kondenssio) kosteuden vaihtelu
    // rajoittaa diffuusiota. Vaimennuskerroin α = 0.2 perustuu siihen,
    // että havaittu ~1 % korroosioaste 50 v jälkeen edellyttää
    // voimakasta hidastumista — α = 0.3 tuottaisi liikaa korroosiota.
    //
    // Vaihe 1 (t ≤ dampening_age): x = k × √t (normaali diffuusio)
    // Vaihe 2 (t > dampening_age): x = x(t_damp) + α × k × (√t - √t_damp)
    //
    // k-kertoimet rekalibroitu 2024 ohuthieanalyysistä kaksivaiheisella mallilla:
    //   12 mm = k × √30 + 0.2 × k × (√50 - √30) = k × 6.37 → k = 1.88
    // Vrt. aiempi α=0.3: k = 12/6.82 = 1.76
    // Vrt. yksivaiheinen: k = 12/√50 = 1.70
    carbonation: {
        // 2024 ohuthie: pilarit 12 mm at t=50 -> k_dampened = 12/6.37 = 1.88
        k_pilarit: 1.88,
        // Leukapalkit: ei 2024 ohuthiedataa, skaalattu 2006-suhteella (2.92/3.09 = 0.945)
        k_leukapalkit: 1.78,
        // 2024 ohuthie: ripa 12 mm at t=50 -> k_dampened = 1.88
        k_tt_laatat: 1.88,
        // CoV (v7.0): 0.20, kalibroitu 2024 ohuthie vaihteluvälistä (8–16 mm → CoV ≈ 0.17)
        k_cov: 0.20,
        // Vaimennusparametrit (v9.0):
        // dampening_age: aika jolloin huokosrakenteen tiivistyminen alkaa
        //   vaikuttaa merkittävästi (CaCO₃ kertymä, betonin kypsyminen)
        // dampening_factor: CO₂-diffuusion vähenemä pitkällä aikavälillä
        //   K400-betonin tiivis huokosrakenne + CaCO₃-tiivistyminen + ulko-olosuhteet
        //   → α = 0.2 (yhdenmukainen havaitun ~1 % korroosioasteen kanssa)
        //   Kirjallisuus: kerroin 0,4 ± 0,4 @ RH 90 % (Springer 2016).
        dampening_age: 30,
        dampening_factor: 0.2,
    },

    // Concrete cover distribution (mm)
    betonipeite: {
        pilarit: { mean: 36.5, std: 8.0 },           // avg of 2006 (35) & 2024 (37.9)
        leukapalkit: { mean: 41.0, std: 10.0 },       // 2006 data
        tt_laatta_laippa: { mean: 30.0, std: 8.0 },   // 2024 data
        tt_ripa_alapinta: { mean: 20.0, std: 5.5 },   // 2006 alapintamittaus 5–35 mm
        // Huom: 2024 mittaus ripa 39.9 mm viittaa sivupinnan/pääteräksen peiteeseen.
        // 2006 alapintamittaus 5–35 mm kuvaa kriittisimpiä kohtia (alin peitepaksuus).
        // std (v6.0): Alennettu 7.5 → 5.5. Vaihteluväli 5–35 mm ≈ ±2σ välillä 9–31 mm,
        // mikä kattaa mitatun vaihteluvälin ilman ylikorostettua alahäntää.
        // Huom: 2006 data 26 % välillä 6–10 mm = hakateräksiä (ei pääteräksiä).
        // Normaalijakauma N(20, 5.5) ei kuvaa tätä bimodaalisuutta täydellisesti.

        // Pintaterästen osuus TT-rivassa (valmistusvirhe):
        // 2006: "muutamissa kohdin valupintaan jääneitä hakateräksiä" (peite ≈ 0 mm)
        // 2024: "paljastuneita raudoitteita useissa laatoissa", "yksittäisiä jännepunoksia"
        // 2024 raportti: "valmistuksen aikaisia työvirheitä (peitepaksuudet)"
        // (v7.0): Alennettu 0.05 → 0.02. Aiempi 5 % tuotti korroosiolattian joka
        // on ristiriidassa havaitun 0–1 % korroosioasteen kanssa. Jos 5 % teräksistä
        // olisi ollut pinnassa 50 vuotta, näkyvää korroosiota olisi enemmän.
        // 2 % vastaa paremmin "muutamissa kohdin" / "yksittäisiä" -havaintoja.
        tt_ripa_pintaterakset_osuus: 0.02,
    },

    // Frost deterioration model (by 32 / by 68 / Vesikari 1988 / Pigeon & Pleau 1995)
    //
    // REKALIBROINTI (v3.0):
    // Kenttähavaintoihin perustuva kalibrointi:
    // - 2006 (t=31v): lokalisoitua rapautumista 20–24 mm syvyyteen pahimmissa kohdissa
    //   → mediaani ~7 mm, P95 ~15 mm, pahin = äärimmäinen sijainti (uskottava)
    // - 2024 (t=49v): ohuthie TT-ripa "rapautumaton", pilarit "rapautumaton"
    //   → mediaani ~13 mm, betoni edelleen lujaa (K400, vetolujuus 1.5–3.0 MPa)
    //
    // Kirjallisuusperustelu lineaariselle/lievästi kiihtyvälle mallille:
    // - by 32 (1989): käyttöikämalli olettaa rapautumisnopeuden lähes vakioksi
    // - Vesikari (1988, VTT): kenttäolosuhteissa rapautuminen etenee hitaammin
    //   kuin laboratorion jäädytys-sulatuskokeissa (kerroin 10–50×)
    // - Pigeon & Pleau (1995): kenttäolosuhteissa jäätymis-sulamissyklejä
    //   ~50–100/vuosi (Etelä-Suomi), vs. laboratorio ~300/vuosi
    // - Fagerlund (1977, 2004): kriittinen kyllästysaste -malli; vaurionopeus
    //   riippuu kyllästysasteesta, joka kentällä vaihtelee kausittain
    // - fib MC 2010 / Bulletin 34: pakkasrapautumisen etenemistä ei mallinneta
    //   eksponentiaalisesti; käytetään kynnysarvo + vakionopeusmalleja
    //
    // Aiempi malli (a=1.03) kiihdytti nopeutta kaksinkertaiseksi joka 23. vuosi,
    // mikä tuotti 33 mm kumulatiivisen vaurion vuoteen 2024 mennessä — ristiriidassa
    // sen kanssa, että betoni on edelleen "rapautumaton" ja lujaa (vetolujuus 2.0 MPa ka.).
    //
    // REKALIBROINTI (v4.0): Lineaarinen malli (a=1.00) oletuksena.
    // K400-betoni on osoittanut 50 vuoden kenttäkokeessa, että positiivinen
    // takaisinkytkentä (vaurio → huokoisuus → lisää vauriota) on heikko.
    // Jos korkealujuusbetonissa kiihtyminen olisi voimakasta, 50 vuoden jälkeen
    // pitäisi nähdä enemmän tuhoa. Sen sijaan betoni on "rapautumaton" ja lujaa.
    // Lineaarinen malli:
    //   - 2006 (t=31): med 6.2 mm, P99 ~17 mm (havainto 24 mm = ääripahin)
    //   - 2024 (t=49): med 9.8 mm (yhdenmukainen "rapautumaton" kanssa)
    //   - 2074 (t=100): med 20 mm (30 mm rajaa EI saavuteta mediaanissa)
    // Kiihtyvyyskerroin on säädettävissä sivupalkista (a > 1.00 konservatiivisempaan).
    frost: {
        base_rate_mm_per_year: 0.20,   // Kenttäolosuhteet, K400, kalibroitu 2006+2024 datasta
        acceleration_factor: 1.00,      // Lineaarinen (by 32, kenttädatan tukema oletus)
        critical_saturation_year: 1975, // Vesieristys vuotanut alusta alkaen
        rate_cov: 0.45,                 // Suuri paikallinen vaihtelu
                                        // (2006: 0–24 mm, 2024: "rapautumaton"–"rapautunut")
        critical_damage_depth_mm: 30,   // Kriittinen pakkasvauriosyvyys (mm)
    },

    // TT-slab support surface
    // KORJATTU: TT-laatan todellinen tukipinta leukapalkilla on ~100 mm (2006 raportti),
    // EI 150 mm (joka on leukapalkin leukaosan kokonaisleveys).
    tukipinta: {
        original_depth_mm: 100,    // TT todellinen tukipinta leukapalkilla
        critical_min_mm: 75,       // Eurokoodi 2, SFS-EN 1992-1-1, kohta 10.9.5.2
        // Reunakerroin (v5.0): Aiemmin kovakoodattu 2.0 (molemmat reunat yhtä nopeasti).
        // Muutettu 1.5:ksi koska sisäreuna on osittain suojattu:
        // - TT-laatan paino puristaa sisäreunan betonipintaa leukapalkkia vasten
        // - Kosteuden ja pakkasen pääsy sisäreunaan on rajoitettu
        // - Ulkoreuna altistuu suoraan sateelle, jäälle ja mekaaniselle rasitukselle
        // Kerroin 1.5 = ulkoreuna täysi rapautuminen + sisäreuna 50 % nopeudella
        reunakerroin: 1.5,
        // Rapautumisnopeus (v5.0): Alennettu 0.12 → 0.10 mm/a.
        // Perustelu: 2024 ohuthieanalyysi kuvaa TT-rivan "rapautumattomaksi".
        // Jos nopeus olisi 0.12 mm/a molemmilta reunoilta (kerroin 2), 49 vuodessa
        // kumulatiivinen häviö olisi ~12 mm, mikä näkyisi ohuthieessä.
        // Nopeus 0.10 mm/a kertoimella 1.5: häviö 49v = 1.5×0.10×49 ≈ 7 mm,
        // joka on yhdenmukainen "rapautumaton" -havainnon kanssa.
        // Kalibrointitarkistus 2026: 100 - 1.5×0.10×51 ≈ 92 mm (turvallinen)
        rapautuminen_reuna_mm_per_year: 0.10,
        // CoV (v5.0): Alennettu 0.30 → 0.25.
        // 2024 ohuthie osoittaa tasaisen hyvän kunnon kaikissa näytteissä
        // (TT-ripa "rapautumaton", pilarit "rapautumaton", vetolujuus 1.5–3.0 MPa).
        // Pienemmälle hajonnalle ei ole syytä 50 vuoden tasaisen kunnon perusteella.
        rapautuminen_cov: 0.25,
    },

    // Scenario B: kevyt korjaus + piha-alueen kohennus
    light_repair: {
        frost_rate_reduction: 0.50,
        carbonation_pause_years: 5,
        cost_total_min_eur: 200000,
        cost_total_max_eur: 350000,
    },

    // Scenario C: full repair effects
    full_repair: {
        frost_rate_reduction: 0.95,
        carbonation_k_reduction: 0.30,
        extended_life_years: 50,
        cost_eur_per_m2: 800,  // 2024 raportin arvio
    },

    // Bayesian conditioning on 2024 observation (v9.0):
    //
    // Malli arpoo (k, cover) -pareja priorijakaumista, mutta osa yhdistelmistä
    // ennustaa korroosiota jo t=50 kohdalla (~11 %), vaikka havaittu korroosioaste
    // on vain 1 %. Bayesilainen ehdollistaminen hylkää MC-näytteet jotka ovat
    // ristiriidassa 2024 kuntotutkimuksen havainnon kanssa.
    //
    // Menetelmä: rejection sampling — näyte jossa karbonatisaatio ≥ cover
    // havaintovuonna hyväksytään todennäköisyydellä q = p_obs/p_model.
    // Tämä siirtää (k, cover) -jakaumat posterioriksi joka on yhdenmukainen
    // havaitun 0–1 % korroosioasteen kanssa.
    bayesian_conditioning: {
        enabled: true,
        observation_year: 2024,
        // Havaittu korroosioaste rakenneosittain (Contrust Oy kuntotutkimus 2024)
        observed_corrosion: {
            scenario: 0.01,            // TT-ripa (käytetään _runScenario:ssa)
            pilarit: 0.01,             // 1 %
            leukapalkit: 0.01,         // oletus (ei tarkkaa dataa)
            tt_laatta_laippa: 0.005,   // 0 % (käytetään 0.5 % teknistä alarajaa)
            tt_ripa_alapinta: 0.01,    // 1 %
        },
    },

    // Simulation time horizon
    // end_year (v5.0): Jatkettu 2074 → 2126 (100 vuotta nykyhetkestä).
    // Aiempi 2074 (100 v rakentamisesta) näytti vain 48 v eteenpäin,
    // mikä ei riitä täyskorjauksen (+50 v) hyödyn arviointiin.
    start_year: 1974,
    end_year: 2126,
    current_year: 2026,
};

// ============================================================
// Structural element definitions
// ============================================================

const STRUCTURAL_ELEMENTS = [
    {
        id: "pilarit",
        name: "Pilarit",
        nameEn: "Columns",
        color: "#6366f1",
        icon: "\u2b1c",
        critical: false,
    },
    {
        id: "leukapalkit",
        name: "Leukapalkit",
        nameEn: "Ledger Beams",
        color: "#8b5cf6",
        icon: "\u25ac",
        critical: false,
    },
    {
        id: "tt_laatta_laippa",
        name: "TT-laatta (laippa)",
        nameEn: "TT-slab (flange)",
        color: "#ec4899",
        icon: "\u2594",
        critical: true,
    },
    {
        id: "tt_ripa_alapinta",
        name: "TT-laatta (ripa)",
        nameEn: "TT-slab (rib)",
        color: "#f43f5e",
        icon: "\u258e",
        critical: true,
    },
];
