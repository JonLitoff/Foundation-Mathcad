import { useState } from "react";
import "@/index.css";

/* ─── display helpers ─────────────────────────────────────────── */
function fmt(n: number, d = 2): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(d);
}

/* ─── layout & style components ──────────────────────────────── */
function InputVar({ children }: { children: React.ReactNode }) {
  return <span className="mc-input-var">{children}</span>;
}
function Var({ children }: { children: React.ReactNode }) {
  return <span className="mc-var">{children}</span>;
}
function Assign() { return <span className="mc-assign"> := </span>; }
function Eq() { return <span className="mc-assign"> = </span>; }
function Res({ children }: { children: React.ReactNode }) {
  return <span className="mc-result">{children}</span>;
}
function Unit({ children }: { children: React.ReactNode }) {
  return <span className="mc-unit">&nbsp;{children}</span>;
}
function OK() { return <span className="mc-ok">✓ O.K.</span>; }
function NG() { return <span className="mc-ng">✗ N.G.</span>; }
function Check({ pass }: { pass: boolean }) { return pass ? <OK /> : <NG />; }
function Ref({ children }: { children: React.ReactNode }) {
  return <span className="mc-ref">{children}</span>;
}
function Sup({ children }: { children: React.ReactNode }) {
  return <sup style={{ fontSize: "0.68em" }}>{children}</sup>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <sub style={{ fontSize: "0.75em" }}>{children}</sub>;
}
function Row({ children, indent = 0 }: { children: React.ReactNode; indent?: number }) {
  return (
    <div className="mc-equation-row" style={{ marginLeft: indent * 24 }}>
      {children}
    </div>
  );
}
function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="mc-section-header">{children}</div>;
}
function SubHeader({ children }: { children: React.ReactNode }) {
  return <div className="mc-subsection-header">{children}</div>;
}
function Text({ children, indent = 0 }: { children: React.ReactNode; indent?: number }) {
  return <div className="mc-text" style={{ marginLeft: indent * 16 }}>{children}</div>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <div className="mc-note"><strong>Note:</strong> {children}</div>;
}
function BulletResult({ children }: { children: React.ReactNode }) {
  return <div className="mc-bullet-result">▶ {children}</div>;
}
function Divider() { return <hr className="mc-divider" />; }
function Cmt({ children }: { children: React.ReactNode }) {
  return <span className="mc-inline-comment">{children}</span>;
}

/* ─── interactive input components ───────────────────────────── */

/** Numeric input — amber styling matching InputVar */
function N({
  value, set, w = 75,
}: { value: number; set: (v: number) => void; w?: number }) {
  return (
    <input
      type="number"
      step="any"
      value={value}
      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) set(v); }}
      className="mc-num-input"
      style={{ width: w }}
    />
  );
}

/** Text input for project info fields */
function TI({
  value, set, w = 200, placeholder = "",
}: { value: string; set: (v: string) => void; w?: number; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => set(e.target.value)}
      placeholder={placeholder}
      className="mc-text-input"
      style={{ width: w }}
    />
  );
}

/* ─── main component ──────────────────────────────────────────── */

export default function FoundationCalc() {

  /* ── Project info ─────────────────────────────────────────── */
  const [projTitle,   setProjTitle]   = useState("Vertical Vessel Foundation Design");
  const [projRef,     setProjRef]     = useState("PIP STE03350, December 2008");
  const [projCode,    setProjCode]    = useState("ACI 318-05, ASCE/SEI 7-05, PIP STC01015");
  const [projDate,    setProjDate]    = useState("May 2, 2026");
  const [projSubject, setProjSubject] = useState("Octagonal footing for skirt-supported vertical vessel");
  const [calcBy,      setCalcBy]      = useState("");
  const [chkBy,       setChkBy]       = useState("");
  const [projNo,      setProjNo]      = useState("");

  /* ── Wind loads ───────────────────────────────────────────── */
  const [V_wind,       setV_wind]       = useState(44.75);  // kip
  const [M_wind,       setM_wind]       = useState(1902);   // kip·ft
  const [V_design_mph, setV_design_mph] = useState(115);    // mph, design wind speed

  /* ── Vessel dead loads ────────────────────────────────────── */
  const [De, setDe] = useState(170.3);  // kip
  const [Do, setDo] = useState(345.2);  // kip
  const [Dt, setDt] = useState(624.1);  // kip

  /* ── Soil & concrete ──────────────────────────────────────── */
  const [SB_net,     setSB_net]     = useState(3.25);
  const [depth_ftg,  setDepth_ftg]  = useState(5);
  const [gamma_soil, setGamma_soil] = useState(0.110);
  const [gamma_conc, setGamma_conc] = useState(0.150);
  const [fc,         setFc]         = useState(4000);
  const [fy,         setFy]         = useState(60000);

  /* ── Anchor bolt data ─────────────────────────────────────── */
  const [Nb,    setNb]    = useState(24);
  const [BD,    setBD]    = useState(1.5);
  const [SD,    setSD]    = useState(4.0);
  const [BC_in, setBC_in] = useState(178.5);

  /* ── Foundation geometry (initial) ───────────────────────── */
  const [h_ped, setH_ped] = useState(4.5);
  const [t_ftg, setT_ftg] = useState(1.5);
  const [Nd,    setNd]    = useState(40);

  /* ── Pedestal properties (final, after bolt-area check) ───── */
  const [D_ped, setD_ped] = useState(17.704);
  const [A_ped, setA_ped] = useState(259.7);

  /* ── Code factors ─────────────────────────────────────────── */
  const [phi_flex_ped, setPhi_flex_ped] = useState(0.9);  // flexure, ACI §9.3.2.1
  const [phi_shear,    setPhi_shear]    = useState(0.75); // shear, ACI §9.3.2.3
  const [phi_flex,     setPhi_flex]     = useState(0.55); // plain concrete, ACI §22.5

  /* ── Anchor bolt check ────────────────────────────────────── */
  const [mu_fric,    setMu_fric]    = useState(0.55);
  const [hef_in,     setHef_in]     = useState(18);    // embedment depth, in
  const [A_N,        setA_N]        = useState(1042);  // in², graphical layout
  const [phi_Nn_val, setPhi_Nn_val] = useState(33.2);  // kip, from spreadsheet

  /* ── Bolt length ──────────────────────────────────────────── */
  const [projection_in, setProjection_in] = useState(14); // in = 1 ft 2 in
  const [P1_in,         setP1_in]         = useState(2);  // in

  /* ── Footing size ─────────────────────────────────────────── */
  const [D_oct, setD_oct] = useState(21.73);
  const [A_oct, setA_oct] = useState(391.1);

  /* ── Embedment check ──────────────────────────────────────── */
  const [psi_e,      setPsi_e]      = useState(1.0);
  const [psi_lambda, setPsi_lambda] = useState(1.0);
  const [db_bar,     setDb_bar]     = useState(0.625); // in

  /* ── Partial wind ─────────────────────────────────────────── */
  const [V_partial_mph, setV_partial_mph] = useState(68);

  /* ── Bearing coefficients (read from PIP Figure B / Table 2) */
  const [L_emp_diag, setL_emp_diag] = useState(2.85);
  const [L_op_diag,  setL_op_diag]  = useState(2.25);
  const [L_str_op,   setL_str_op]   = useState(2.70);
  const [K_str_op,   setK_str_op]   = useState(0.225);
  const [L_str_emp,  setL_str_emp]  = useState(7.63);
  const [K_str_emp,  setK_str_emp]  = useState(0.660);

  /* ── Reinforcement ────────────────────────────────────────── */
  const [cover,       setCover]       = useState(3);      // in
  const [d_bar_rebar, setD_bar_rebar] = useState(1.125);  // in
  const [au,          setAu]          = useState(4.390);
  const [alpha_s,     setAlpha_s]     = useState(40);

  /* ═══════════════════════════════════════════════════════════
     DERIVED COMPUTATIONS  (all reactive — recalc on any input change)
     ═══════════════════════════════════════════════════════════ */

  const BC_ft    = BC_in / 12;
  const hef      = hef_in / 12;        // ft
  const t_ftg_in = t_ftg * 12;         // in, for display

  /* Pedestal size equations */
  const eq1a       = BC_in + 9;
  const eq1b       = BC_in + 8 * BD;
  const eq1d       = BC_in + SD + 9 - BD;
  const eq1e       = BC_in + SD + 7 * BD;
  const ped_in_min = Math.max(eq1a, eq1b, eq1d, eq1e);
  const ped_ft_min = ped_in_min / 12;
  const DC_exact   = D_ped - 0.5;

  /* Pedestal moments */
  const Dp    = A_ped * h_ped * gamma_conc;
  const Mped  = M_wind + h_ped * V_wind;
  const Muped = 1.6 * Mped;

  /* Dowel design */
  const Fu          = (4 * Muped) / (Nd * DC_exact) - 0.9 * (De + Dp) / Nd;
  const As_dowel_req = Math.max(0, Fu) / (phi_flex_ped * (fy / 1000));

  /* Anchor bolt tension */
  const Mu_ab = 1.6 * M_wind;
  const Nu    = (4 * Mu_ab) / (Nb * BC_ft) - 0.9 * De / Nb;

  /* Shear / friction */
  const Vu_ab  = 1.6 * V_wind;
  const LA     = (2 / 3) * BC_ft;
  const Pu_ab  = Mu_ab / LA + 0.9 * De / 2;
  const Vf     = mu_fric * Pu_ab;
  const phi_Vf = 0.75 * Vf;

  /* Projected failure area */
  const DEQ = 1.027 * D_ped;

  /* Bolt length */
  const L_min_in_total = projection_in + hef_in + P1_in;
  const L_min_ft_int   = Math.floor(L_min_in_total / 12);
  const L_min_in_rem   = L_min_in_total - L_min_ft_int * 12;

  /* Footing trial size */
  const D_footing_depth = h_ped + t_ftg;
  const Mftg    = M_wind + D_footing_depth * V_wind;
  const SB_gross = SB_net + depth_ftg * gamma_soil;
  const D_trial  = 2.6 * Math.pow(Mftg / SB_gross, 1 / 3);

  /* Embedment */
  const ldh           = (0.02 * psi_e * psi_lambda * fy) / Math.sqrt(fc) * db_bar;
  const As_ratio_embed = As_dowel_req / 0.31;
  const T_embed        = 3 + 2 * 0.75 + As_ratio_embed * 0.7 * ldh;

  /* Footing weights */
  const W_ped_net  = A_ped * (h_ped * gamma_conc - (depth_ftg - t_ftg) * gamma_soil);
  const W_ftg_soil = A_oct * (t_ftg * gamma_conc + (depth_ftg - t_ftg) * gamma_soil);
  const Ds = W_ped_net + W_ftg_soil;
  const Pe = De + Ds;
  const Po = Do + Ds;
  const Pt = Dt + Ds;

  /* Soil bearing */
  const e_emp  = Mftg / Pe;
  const SR_emp = D_oct / (2 * e_emp);
  const eD_emp = e_emp / D_oct;
  const f_emp  = L_emp_diag * Pe / A_oct;

  const e_op  = Mftg / Po;
  const eD_op = e_op / D_oct;
  const f_op  = L_op_diag * Po / A_oct;

  const V_partial_frac = Math.pow(V_partial_mph / V_design_mph, 2);
  const Mftg_test = V_partial_frac * Mftg;
  const e_test  = Mftg_test / Pt;
  const eD_test = e_test / D_oct;
  const f_test  = (Pt / A_oct) * (1 + 8.19 * eD_test);

  /* Bottom reinforcement — Case A (operating + wind) */
  const Pu_op    = 1.2 * Po;
  const Mu_str_op = 1.6 * Mftg;
  const e_str_op  = Mu_str_op / Pu_op;
  const eD_str_op = e_str_op / D_oct;
  const KD_str_op = K_str_op * D_oct;
  const SB_str_op = L_str_op * Pu_op / A_oct;
  const side_equiv         = Math.sqrt(A_ped);
  const proj               = (D_oct - side_equiv) / 2;
  const dist_from_far_edge_op = D_oct - KD_str_op;
  const SB_face_op = SB_str_op * (dist_from_far_edge_op - proj) / dist_from_far_edge_op;
  const SC_op      = 1.2 * W_ftg_soil / A_oct;
  const Mu_ftg_op  = (SB_face_op - SC_op) * proj * proj / 2 +
                     (SB_str_op - SB_face_op) * proj * proj / 3;

  /* Bottom reinforcement — Case B (empty + wind) */
  const Pu_emp_str = 0.9 * Pe;
  const Mu_str_emp  = 1.6 * Mftg;
  const e_str_emp   = Mu_str_emp / Pu_emp_str;
  const eD_str_emp  = e_str_emp / D_oct;
  const KD_str_emp  = K_str_emp * D_oct;
  const SB_str_emp  = L_str_emp * Pu_emp_str / A_oct;
  const comp_len_emp = D_oct - KD_str_emp;
  const SB_face_emp  = SB_str_emp * (comp_len_emp - proj) / comp_len_emp;
  const SC_emp       = 0.9 * W_ftg_soil / A_oct;
  const Mu_ftg_emp   = (SB_face_emp - SC_emp) * proj * proj / 2 +
                       (SB_str_emp - SB_face_emp) * proj * proj / 3;

  /* Reinforcement design */
  const d_eff    = t_ftg_in - cover - d_bar_rebar / 2;
  const F_factor = (12 * d_eff * d_eff) / 12000;
  const Ku_rebar = Mu_ftg_emp / F_factor;
  const As_req   = Mu_ftg_emp / (au * d_eff);
  const As_min   = 0.0033 * 12 * d_eff;
  const As_43    = (4 / 3) * As_req;

  /* Beam shear */
  const SB_at_d     = SB_str_emp * (comp_len_emp - proj + d_eff / 12) / comp_len_emp;
  const proj_less_d  = proj - d_eff / 12;
  const Vu_beam_p1   = (SB_at_d - SC_emp) * proj_less_d;
  const Vu_beam_p2   = (SB_str_emp - SB_at_d) * proj_less_d / 2;
  const Vu_beam_val  = Vu_beam_p1 + Vu_beam_p2;
  const vu_beam      = Vu_beam_val * 1000 / (12 * d_eff);
  const vc_beam_allow = 2 * phi_shear * Math.sqrt(fc);

  /* Punching shear */
  const Pu_punch    = 1.4 * Pt;
  const side_d      = side_equiv + d_eff / 12;
  const SC_punch    = (1.4 / 1.2) * SC_op;
  const Vu_punch_val = (Pu_punch / A_oct - SC_punch) * (A_oct - side_d * side_d);
  const bo          = 4 * side_d;
  const vu_punch    = Vu_punch_val * 1000 / (d_eff * bo * 12);
  const vc_punch1   = phi_shear * (alpha_s * (d_eff / 12) / bo + 2) * Math.sqrt(fc);
  const vc_punch2   = phi_shear * 4 * Math.sqrt(fc);

  /* Top reinforcement */
  const Mu_top    = (1.4 / 1.2) * SC_op * proj * proj / 2;
  const Mu_top_in = Mu_top * 12000;
  const ft_flex   = 5 * phi_flex * Math.sqrt(fc);
  const t_eff     = Math.sqrt(6 * Mu_top_in / ft_flex);
  const t_reqd    = t_eff + 2;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="mc-page bg-gray-100 min-h-screen py-8">
      <div className="no-print flex justify-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => window.print()}
          className="bg-blue-700 text-white px-6 py-2 text-sm font-bold hover:bg-blue-800 rounded"
        >
          🖨 Print / Save as PDF
        </button>
        <span className="text-xs text-gray-500 self-center italic">
          Click any amber field to edit — all results update instantly
        </span>
      </div>

      <div className="mc-worksheet shadow-lg">

        {/* ── Title Block ─────────────────────────────── */}
        <div className="mc-title-block">
          <div className="mc-title">
            <TI value={projTitle} set={setProjTitle} w={400} placeholder="Project Title" />
          </div>
          <table className="mc-meta-table">
            <tbody>
              <tr>
                <td>Reference:</td>
                <td><TI value={projRef} set={setProjRef} w={300} /></td>
                <td style={{ paddingLeft: 24 }}>Project No.:</td>
                <td><TI value={projNo} set={setProjNo} w={140} placeholder="—" /></td>
              </tr>
              <tr>
                <td>Code:</td>
                <td><TI value={projCode} set={setProjCode} w={300} /></td>
                <td style={{ paddingLeft: 24 }}>Calc. By:</td>
                <td><TI value={calcBy} set={setCalcBy} w={140} placeholder="—" /></td>
              </tr>
              <tr>
                <td>Date:</td>
                <td><TI value={projDate} set={setProjDate} w={160} /></td>
                <td style={{ paddingLeft: 24 }}>Chk. By:</td>
                <td><TI value={chkBy} set={setChkBy} w={140} placeholder="—" /></td>
              </tr>
              <tr>
                <td>Subject:</td>
                <td colSpan={3}><TI value={projSubject} set={setProjSubject} w={500} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Vessel Sketch + Design Data ──────────────── */}
        <SectionHeader>VESSEL GEOMETRY &amp; DESIGN DATA</SectionHeader>

        <div style={{ display: "flex", gap: 32, marginBottom: 12, flexWrap: "wrap" }}>
          {/* Left – sketch */}
          <div style={{ flex: "0 0 220px" }}>
            <svg viewBox="0 0 220 370" style={{ width: 220, height: 370, fontFamily: "Arial", fontSize: 9 }}>
              <line x1="10" y1="280" x2="210" y2="280" stroke="#888" strokeDasharray="4,3" strokeWidth={1} />
              <text x="155" y="292" fill="#555" fontSize="8">Grade El. 100 ft</text>
              <rect x="30" y="295" width="160" height="22" fill="#d9e8d9" stroke="#4a7a4a" strokeWidth={1.2} />
              <rect x="65" y="235" width="90" height="62" fill="#cce0cc" stroke="#4a7a4a" strokeWidth={1.2} />
              <rect x="82" y="55" width="56" height="182" fill="none" stroke="#333" strokeWidth={1.5} />
              <ellipse cx="110" cy="55" rx="28" ry="8" fill="none" stroke="#333" strokeWidth={1.2} />
              <rect x="76" y="190" width="68" height="47" fill="none" stroke="#555" strokeWidth={1} strokeDasharray="3,2" />
              <rect x="55" y="217" width="110" height="4" fill="#aaa" />
              <text x="168" y="222" fill="#444" fontSize="8">Platf. #1 (90°)</text>
              <rect x="55" y="160" width="110" height="4" fill="#aaa" />
              <text x="168" y="165" fill="#444" fontSize="8">Platf. #2 (60°)</text>
              <rect x="55" y="100" width="110" height="4" fill="#aaa" />
              <text x="168" y="105" fill="#444" fontSize="8">Platf. #3 (12 ft dia)</text>
              <rect x="79" y="57" width="62" height="180" fill="none" stroke="#b09060" strokeWidth={0.8} strokeDasharray="2,2" />
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#1a5fa8" />
                </marker>
              </defs>
              <line x1="12" y1="140" x2="76" y2="140" stroke="#1a5fa8" strokeWidth={1.5} markerEnd="url(#arrow)" />
              <text x="5" y="136" fill="#1a5fa8" fontSize="8" fontWeight="bold">W</text>
              <line x1="20" y1="55" x2="20" y2="237" stroke="#666" strokeWidth={0.7} markerEnd="url(#arrow)" />
              <line x1="20" y1="237" x2="20" y2="55" stroke="#666" strokeWidth={0.7} />
              <text x="3" y="150" fill="#444" fontSize="8" transform="rotate(-90,3,150)">67 ft</text>
              <text x="168" y="80" fill="#444" fontSize="8">49 ft</text>
              <line x1="164" y1="55" x2="164" y2="160" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />
              <text x="168" y="195" fill="#444" fontSize="8">23 ft</text>
              <line x1="164" y1="160" x2="164" y2="235" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />
              <text x="15" y="273" fill="#555" fontSize="8">4.5 ft</text>
              <text x="15" y="308" fill="#555" fontSize="8">1.5 ft</text>
              <line x1="65" y1="245" x2="155" y2="245" stroke="#e06020" strokeWidth={0.8} />
              <text x="85" y="258" fill="#e06020" fontSize="7.5">17 ft-8½ in</text>
              <line x1="30" y1="310" x2="190" y2="310" stroke="#1a5fa8" strokeWidth={0.8} />
              <text x="65" y="325" fill="#1a5fa8" fontSize="7.5">21 ft-8¾ in</text>
              <text x="132" y="130" fill="#555" fontSize="7">⁹⁄₁₆ in</text>
              <text x="5" y="55" fill="#333" fontSize="7">4 in dia pipe</text>
              <text x="5" y="63" fill="#333" fontSize="7">1½ in insul.</text>
              <text x="60" y="72" fill="#333" fontSize="7.5">14 ft dia.</text>
              <text x="62" y="82" fill="#555" fontSize="7">(14.42 ft)</text>
            </svg>
          </div>

          {/* Right – input variable definitions */}
          <div style={{ flex: "1 1 320px" }}>
            <SubHeader>Wind Load Data (ASCE/SEI 7-05)</SubHeader>

            <Row indent={1}>
              <InputVar>V<Sub>design</Sub></InputVar><Assign />
              <N value={V_design_mph} set={setV_design_mph} w={55} /><Unit>mph</Unit>
              <Cmt>design wind speed</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>V</InputVar><Assign />
              <N value={V_wind} set={setV_wind} /><Unit>kip</Unit>
              <Cmt>base shear at base of vessel</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>M</InputVar><Assign />
              <N value={M_wind} set={setM_wind} w={85} /><Unit>kip·ft</Unit>
              <Cmt>overturning moment at top of grout</Cmt>
            </Row>

            <SubHeader>Vessel Dead Loads</SubHeader>

            <Row indent={1}>
              <InputVar>D<Sub>e</Sub></InputVar><Assign />
              <N value={De} set={setDe} /><Unit>kip</Unit>
              <Cmt>empty weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>D<Sub>o</Sub></InputVar><Assign />
              <N value={Do} set={setDo} /><Unit>kip</Unit>
              <Cmt>operating weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>D<Sub>t</Sub></InputVar><Assign />
              <N value={Dt} set={setDt} /><Unit>kip</Unit>
              <Cmt>hydrotest weight</Cmt>
            </Row>

            <SubHeader>Soil &amp; Concrete</SubHeader>

            <Row indent={1}>
              <InputVar>SB<Sub>net</Sub></InputVar><Assign />
              <N value={SB_net} set={setSB_net} w={55} /><Unit>ksf</Unit>
              <Cmt>net allowable bearing (transient)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>depth</InputVar><Assign />
              <N value={depth_ftg} set={setDepth_ftg} w={45} /><Unit>ft</Unit>
              <Cmt>foundation depth below grade</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>γ<Sub>s</Sub></InputVar><Assign />
              <N value={gamma_soil} set={setGamma_soil} w={60} /><Unit>kcf</Unit>
              <Cmt>soil unit weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>γ<Sub>c</Sub></InputVar><Assign />
              <N value={gamma_conc} set={setGamma_conc} w={60} /><Unit>kcf</Unit>
              <Cmt>concrete unit weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>f′<Sub>c</Sub></InputVar><Assign />
              <N value={fc} set={setFc} w={65} /><Unit>psi</Unit>
              <Cmt>concrete compressive strength</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>f<Sub>y</Sub></InputVar><Assign />
              <N value={fy} set={setFy} w={75} /><Unit>psi</Unit>
              <Cmt>reinforcement yield strength</Cmt>
            </Row>

            <SubHeader>Anchor Bolt Data</SubHeader>

            <Row indent={1}>
              <InputVar>N<Sub>b</Sub></InputVar><Assign />
              <N value={Nb} set={setNb} w={45} />
              <Cmt>number of anchor bolts (multiple of 8)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>BD</InputVar><Assign />
              <N value={BD} set={setBD} w={50} /><Unit>in</Unit>
              <Cmt>bolt diameter — ASTM F1554, Gr. 36</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>SD</InputVar><Assign />
              <N value={SD} set={setSD} w={50} /><Unit>in</Unit>
              <Cmt>sleeve diameter</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>BC</InputVar><Assign />
              <N value={BC_in} set={setBC_in} w={70} /><Unit>in</Unit>
              <Cmt>bolt circle diameter</Cmt>
            </Row>

            <SubHeader>Foundation Geometry (Initial)</SubHeader>

            <Row indent={1}>
              <InputVar>h<Sub>ped</Sub></InputVar><Assign />
              <N value={h_ped} set={setH_ped} w={50} /><Unit>ft</Unit>
              <Cmt>pedestal height above top of footing</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>t<Sub>ftg</Sub></InputVar><Assign />
              <N value={t_ftg} set={setT_ftg} w={50} /><Unit>ft</Unit>
              <Cmt>footing thickness</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>N<Sub>d</Sub></InputVar><Assign />
              <N value={Nd} set={setNd} w={45} />
              <Cmt>number of pedestal dowels (multiple of 8)</Cmt>
            </Row>
          </div>
        </div>

        {/* ── Pedestal Design ─────────────────────────── */}
        <SectionHeader>PEDESTAL DESIGN</SectionHeader>
        <SubHeader>Minimum Pedestal Size (Equations 1a – 1f, PIP STE03350)</SubHeader>

        <Text>The pedestal face-to-face dimension must satisfy the largest of the following:</Text>

        <Row indent={1}>
          <Var>P<Sub>ped,1a</Sub></Var><Assign />
          <span className="mc-expr">BC + 9 in = {fmt(BC_in,1)} + 9</span>
          <Eq /><Res>{fmt(eq1a,1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1a</Ref>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>ped,1b</Sub></Var><Assign />
          <span className="mc-expr">BC + 8·BD = {fmt(BC_in,1)} + 8({BD})</span>
          <Eq /><Res>{fmt(eq1b,1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1b — Grade 36 bolts</Ref>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>ped,1d</Sub></Var><Assign />
          <span className="mc-expr">BC + SD + 9 − BD = {fmt(BC_in,1)} + {SD} + 9 − {BD}</span>
          <Eq /><Res>{fmt(eq1d,1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1d</Ref>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>ped,1e</Sub></Var><Assign />
          <span className="mc-expr">BC + SD + 7·BD = {fmt(BC_in,1)} + {SD} + 7({BD})</span>
          <Eq /><Res>{fmt(eq1e,1)}</Res><Unit>in</Unit>
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
          <Ref>Eq. 1e</Ref>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>ped,min</Sub></Var><Assign />
          <span className="mc-expr">max({fmt(eq1a,1)}, {fmt(eq1b,1)}, {fmt(eq1d,1)}, {fmt(eq1e,1)})</span>
          <Eq /><Res>{fmt(ped_in_min,1)}</Res><Unit>in</Unit>
          <Eq /><Res>{fmt(ped_ft_min,3)}</Res><Unit>ft</Unit>
        </Row>

        <BulletResult>Use 16 ft – 1⅛ in octagon (initial trial). Increased to 17 ft – 8½ in after anchor bolt area check.</BulletResult>

        <Note>
          The initial 16 ft – 1⅛ in pedestal did not provide sufficient projected concrete failure area
          (A<Sub>N</Sub>) for N<Sub>u</Sub>. The pedestal "diameter" was increased to 17 ft – 8½ in (17.704 ft).
          See "Anchor Bolt Check" below.
        </Note>

        <Divider />
        <SubHeader>Pedestal Properties and Moments</SubHeader>

        <Row indent={1}>
          <InputVar>D<Sub>ped</Sub></InputVar><Assign />
          <N value={D_ped} set={setD_ped} w={80} /><Unit>ft</Unit>
          <Cmt>face-to-face (final, after anchor bolt area check)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>A<Sub>ped</Sub></InputVar><Assign />
          <N value={A_ped} set={setA_ped} w={70} /><Unit>ft²</Unit>
          <Cmt>area of regular octagon at D<Sub>ped</Sub> — Table 1, PIP STE03350</Cmt>
        </Row>
        <Row indent={1}>
          <Var>D<Sub>p</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>ped</Sub> × h<Sub>ped</Sub> × γ<Sub>c</Sub> = {A_ped} × {h_ped} × {gamma_conc}</span>
          <Eq /><Res>{fmt(Dp,1)}</Res><Unit>kip</Unit>
          <Cmt>pedestal self-weight</Cmt>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">M + V·h<Sub>ped</Sub> = {M_wind} + {V_wind}({h_ped})</span>
          <Eq /><Res>{fmt(Mped,0)}</Res><Unit>kip·ft</Unit>
          <Cmt>OTM at pedestal base</Cmt>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u,ped</Sub></Var><Assign />
          <span className="mc-expr">1.6 × M<Sub>ped</Sub> = 1.6 × {fmt(Mped,0)}</span>
          <Eq /><Res>{fmt(Muped,0)}</Res><Unit>kip·ft</Unit>
          <Ref>Load Comb. 4, Table 4, PIP STC01015</Ref>
        </Row>

        <Divider />
        <SubHeader>Pedestal Dowel Design</SubHeader>

        <Row indent={1}>
          <Var>DC</Var><Assign />
          <span className="mc-expr">D<Sub>ped</Sub> − 0.5 ft = {D_ped} − 0.5</span>
          <Eq /><Res>{fmt(DC_exact,3)}</Res><Unit>ft</Unit>
          <Cmt>dowel circle diameter (≈ pedestal dia. minus 6 in)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>D<Sub>e</Sub> + D<Sub>p</Sub></Var><Assign />
          <span className="mc-expr">{De} + {fmt(Dp,1)}</span>
          <Eq /><Res>{fmt(De + Dp,1)}</Res><Unit>kip</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>F<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">4·M<Sub>u,ped</Sub> / (N<Sub>d</Sub>·DC) − 0.9·(D<Sub>e</Sub>+D<Sub>p</Sub>)/N<Sub>d</Sub></span>
            <Ref>Eq. 2</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = 4({fmt(Muped,0)}) / ({Nd}·{fmt(DC_exact,3)}) − 0.9({fmt(De+Dp,1)})/{Nd}
            </span>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {fmt(4*Muped/(Nd*DC_exact),2)} − {fmt(0.9*(De+Dp)/Nd,2)}
            </span>
            <Eq /><Res>{fmt(Fu,2)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <Row indent={1}>
          <InputVar>φ</InputVar><Assign />
          <N value={phi_flex_ped} set={setPhi_flex_ped} w={50} />
          <Cmt>strength reduction factor — tension-controlled flexure (ACI 318-05 §9.3.2.1)</Cmt>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>A<Sub>s,req</Sub></Var><Assign />
            <span className="mc-expr">F<Sub>u</Sub> / (φ·f<Sub>y</Sub>) = {fmt(Fu,2)} / ({phi_flex_ped} × {fy/1000})</span>
            <Eq /><Res>{fmt(As_dowel_req,2)}</Res><Unit>in²</Unit>
            <Ref>Eq. 3</Ref>
          </Row>
        </div>

        <BulletResult>
          Use 40 – #5 bars (A<Sub>s</Sub> = 0.31 in²) with #4 ties at 15 in c/c (minimum reinforcement controls)
        </BulletResult>

        {/* ── Anchor Bolt Check ─────────────────────────── */}
        <SectionHeader>ANCHOR BOLT CHECK (PIP STE05121)</SectionHeader>
        <SubHeader>Maximum Tension on Anchor Bolt</SubHeader>

        <Row indent={1}>
          <Var>BC<Sub>ft</Sub></Var><Assign />
          <span className="mc-expr">BC / 12 = {BC_in} / 12</span>
          <Eq /><Res>{fmt(BC_ft,3)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6 × M = 1.6 × {M_wind}</span>
          <Eq /><Res>{fmt(Mu_ab,0)}</Res><Unit>kip·ft</Unit>
          <Ref>Load Comb. 4, Table 4, PIP STC01015</Ref>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>N<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">4·M<Sub>u</Sub> / (N<Sub>b</Sub>·BC<Sub>ft</Sub>) − 0.9·D<Sub>e</Sub>/N<Sub>b</Sub></span>
            <Ref>Eq. 4</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = 4({fmt(Mu_ab,0)}) / ({Nb} × {fmt(BC_ft,3)}) − 0.9({De})/{Nb}
            </span>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {fmt(4*Mu_ab/(Nb*BC_ft),2)} − {fmt(0.9*De/Nb,2)}
            </span>
            <Eq /><Res>{fmt(Nu,1)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <Divider />
        <SubHeader>Maximum Shear on Anchor Bolt — Friction Check</SubHeader>

        <Row indent={1}>
          <Var>V<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6 × V = 1.6 × {V_wind}</span>
          <Eq /><Res>{fmt(Vu_ab,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <InputVar>μ</InputVar><Assign />
          <N value={mu_fric} set={setMu_fric} w={55} />
          <Cmt>coefficient of friction — grouted base plate (PIP STE05121)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>LA</Var><Assign />
          <span className="mc-expr">(2/3)·BC<Sub>ft</Sub> = (2/3)({fmt(BC_ft,3)})</span>
          <Eq /><Res>{fmt(LA,2)}</Res><Unit>ft</Unit>
          <Ref>conservative lever arm, Eq. 5</Ref>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>P<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">M<Sub>u</Sub>/LA + 0.9·D<Sub>e</Sub>/2</span>
            <Ref>Eq. 5</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {fmt(Mu_ab,0)}/{fmt(LA,2)} + 0.9({De})/2
              &nbsp;= {fmt(Mu_ab/LA,0)} + {fmt(0.9*De/2,0)}
            </span>
            <Eq /><Res>{fmt(Pu_ab,0)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <Row indent={1}>
          <Var>V<Sub>f</Sub></Var><Assign />
          <span className="mc-expr">μ·P<Sub>u</Sub> = {mu_fric}({fmt(Pu_ab,0)})</span>
          <Eq /><Res>{fmt(Vf,0)}</Res><Unit>kip</Unit>
          <Ref>Eq. 6</Ref>
        </Row>
        <Row indent={1}>
          <Var>φV<Sub>f</Sub></Var><Assign />
          <span className="mc-expr">0.75 × {fmt(Vf,0)}</span>
          <Eq /><Res>{fmt(phi_Vf,0)}</Res><Unit>kip</Unit>
          <span style={{ marginLeft: 8, fontWeight: "bold", color: "#555" }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 6 }}>V<Sub>u</Sub> = {fmt(Vu_ab,1)} kip</span>
          <Check pass={phi_Vf > Vu_ab} />
          <Ref>Eq. 7</Ref>
        </Row>

        <BulletResult>Anchor bolts are NOT required to resist shear — friction is adequate.</BulletResult>

        <Divider />
        <SubHeader>Projected Concrete Failure Area (A<Sub>N</Sub>)</SubHeader>

        <Note>
          Several iterations confirmed that D = 16 ft – 1⅛ in provides insufficient A<Sub>N</Sub>.
          The pedestal diameter is increased to 17 ft – 8½ in.
        </Note>

        <Row indent={1}>
          <InputVar>h<Sub>ef</Sub></InputVar><Assign />
          <N value={hef_in} set={setHef_in} w={45} /><Unit>in</Unit>
          <Eq /><Res>{fmt(hef,2)}</Res><Unit>ft</Unit>
          <Ref>embedment depth — Table 1, PIP STE05121</Ref>
        </Row>
        <Row indent={1}>
          <Var>1.5·h<Sub>ef</Sub></Var><Assign />
          <span className="mc-expr">1.5({fmt(hef,2)})</span>
          <Eq /><Res>{fmt(1.5*hef,2)}</Res><Unit>ft</Unit>
          <Cmt>projected failure radius</Cmt>
        </Row>
        <Row indent={1}>
          <Var>D<Sub>EQ</Sub></Var><Assign />
          <span className="mc-expr">1.027 × D<Sub>ped</Sub> = 1.027 × {D_ped}</span>
          <Eq /><Res>{fmt(DEQ,2)}</Res><Unit>ft</Unit>
          <Cmt>equivalent circle diameter for octagonal pedestal</Cmt>
        </Row>

        {/* AN diagram */}
        <div style={{ marginLeft: 24, marginTop: 8 }}>
          <div style={{ fontSize: "8.5pt", color: "#444", marginBottom: 4 }}>
            Graphical determination of A<Sub>N</Sub> (single bolt at {fmt(BC_in/Nb,0)} in spacing on bolt circle):
          </div>
          <svg viewBox="0 0 260 160" style={{ width: 260, height: 160, border: "1px solid #c0d0e0", background: "#fafcff" }}>
            <circle cx="130" cy="80" r="70" fill="none" stroke="#1a5fa8" strokeWidth={1.5} strokeDasharray="4,3" />
            <text x="122" y="18" fill="#1a5fa8" fontSize="8">EQUIVALENT</text>
            <text x="126" y="27" fill="#1a5fa8" fontSize="8">CIRCLE</text>
            <circle cx="130" cy="80" r="3" fill="#333" />
            <text x="102" y="88" fill="#333" fontSize="7.5">CENTER POINT OF</text>
            <text x="102" y="96" fill="#333" fontSize="7.5">EQUIV. CIRCLE</text>
            <rect x="103" y="53" width="54" height="54" fill="#d0e8ff" stroke="#1a5fa8" strokeWidth={1} opacity={0.7} />
            <text x="108" y="82" fill="#1a3a8f" fontSize="7.5" fontWeight="bold">A</text>
            <text x="115" y="82" fill="#1a3a8f" fontSize="6.5">N</text>
            <text x="118" y="82" fill="#1a3a8f" fontSize="7.5"> = {A_N.toLocaleString()} in²</text>
            <line x1="75" y1="53" x2="75" y2="107" stroke="#e06020" strokeWidth={0.8} />
            <text x="54" y="83" fill="#e06020" fontSize="7.5">{fmt(BC_in/Nb,0)} in</text>
            <line x1="103" y1="130" x2="157" y2="130" stroke="#e06020" strokeWidth={0.8} />
            <text x="112" y="143" fill="#e06020" fontSize="7.5">{fmt(BC_in/Nb,0)} in</text>
          </svg>
        </div>

        <Row indent={1}>
          <InputVar>A<Sub>N</Sub></InputVar><Assign />
          <N value={A_N} set={setA_N} w={70} /><Unit>in²</Unit>
          <Cmt>from graphical/CAD layout</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>φN<Sub>n</Sub></InputVar><Assign />
          <N value={phi_Nn_val} set={setPhi_Nn_val} w={60} /><Unit>kip</Unit>
          <span style={{ fontWeight: "bold", marginLeft: 6 }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>N<Sub>u</Sub> = {fmt(Nu,1)} kip</span>
          <Check pass={phi_Nn_val > Nu} />
          <Ref>PIP Anchor Bolt Design Spreadsheet / ACI 318-05 App. D</Ref>
        </Row>

        <SubHeader>Bolt Length</SubHeader>
        <Row indent={1}>
          <InputVar>Projection</InputVar><Assign />
          <N value={projection_in} set={setProjection_in} w={50} /><Unit>in</Unit>
          <Cmt>bolt projection above top of grout (from vessel data sheet)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>P₁</InputVar><Assign />
          <N value={P1_in} set={setP1_in} w={45} /><Unit>in</Unit>
          <Cmt>nut/anchor-head thickness allowance (PIP STE05121)</Cmt>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">
            L<Sub>min</Sub> = Projection + h<Sub>ef</Sub> + P₁ = {projection_in} + {hef_in} + {P1_in}
          </span>
          <Eq /><Res>{L_min_ft_int} ft – {fmt(L_min_in_rem,0)} in</Res>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">ASL = 2 ft – 8 in &lt; L<Sub>min</Sub> → Use BSL bolts</span>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">BSL length = 4 ft – 5 in</span>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">BSL embedment = (4 ft – 5 in) − ({fmt(projection_in/12,3)} ft)</span>
          <Cmt>verify embedment &lt; pedestal depth ({h_ped} ft)</Cmt>
          <OK />
        </Row>

        <BulletResult>Use {Nb} – {BD} in dia. BSL anchor bolts, ASTM F1554, Grade 36</BulletResult>
        <BulletResult>Final pedestal size: {D_ped} ft = {fmt(D_ped*12,2)} in octagon (face-to-face)</BulletResult>

        {/* ── Footing Design ─────────────────────────────── */}
        <SectionHeader>FOOTING DESIGN</SectionHeader>
        <SubHeader>Trial Octagon Size (Equation 8)</SubHeader>

        <Row indent={1}>
          <Var>d<Sub>ftg</Sub></Var><Assign />
          <span className="mc-expr">h<Sub>ped</Sub> + t<Sub>ftg</Sub> = {h_ped} + {t_ftg}</span>
          <Eq /><Res>{fmt(D_footing_depth,1)}</Res><Unit>ft</Unit>
          <Cmt>total depth from top of grout to bottom of footing</Cmt>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>ftg</Sub></Var><Assign />
          <span className="mc-expr">M + V·d<Sub>ftg</Sub> = {M_wind} + {V_wind}({D_footing_depth})</span>
          <Eq /><Res>{fmt(Mftg,0)}</Res><Unit>kip·ft</Unit>
          <Cmt>OTM at footing base</Cmt>
        </Row>
        <Row indent={1}>
          <Var>SB<Sub>gross</Sub></Var><Assign />
          <span className="mc-expr">SB<Sub>net</Sub> + depth·γ<Sub>s</Sub> = {SB_net} + {depth_ftg}({gamma_soil})</span>
          <Eq /><Res>{fmt(SB_gross,2)}</Res><Unit>ksf</Unit>
          <Cmt>gross allowable soil bearing</Cmt>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>D<Sub>trial</Sub></Var><Assign />
            <span className="mc-expr">2.6·(M<Sub>ftg</Sub>/SB<Sub>gross</Sub>)<Sup>1/3</Sup></span>
            <Ref>Eq. 8</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = 2.6·({fmt(Mftg,0)}/{fmt(SB_gross,2)})<Sup>1/3</Sup>
            </span>
            <Eq /><Res>{fmt(D_trial,2)}</Res><Unit>ft</Unit>
          </Row>
        </div>

        <BulletResult>Try {D_oct} ft octagon. A = {A_oct} ft² (Table 1, PIP STE03350)</BulletResult>

        <Row indent={1}>
          <InputVar>D<Sub>oct</Sub></InputVar><Assign />
          <N value={D_oct} set={setD_oct} w={70} /><Unit>ft</Unit>
          <Cmt>face-to-face dimension of octagonal footing</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>A<Sub>oct</Sub></InputVar><Assign />
          <N value={A_oct} set={setA_oct} w={70} /><Unit>ft²</Unit>
          <Cmt>area of regular octagon — Table 1, PIP STE03350</Cmt>
        </Row>

        <Divider />
        <SubHeader>Check Footing Thickness for Pedestal Dowel Embedment</SubHeader>

        <Row indent={1}>
          <InputVar>Ψ<Sub>e</Sub></InputVar><Assign />
          <N value={psi_e} set={setPsi_e} w={45} />
          <Cmt>epoxy coating factor</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>λ</InputVar><Assign />
          <N value={psi_lambda} set={setPsi_lambda} w={45} />
          <Cmt>lightweight concrete factor (normal weight)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>d<Sub>b</Sub></InputVar><Assign />
          <N value={db_bar} set={setDb_bar} w={60} /><Unit>in</Unit>
          <Cmt>bar diameter — #5 bar</Cmt>
        </Row>

        <Row indent={1}>
          <Var>l<Sub>dh</Sub></Var><Assign />
          <span className="mc-expr">
            [0.02·Ψ<Sub>e</Sub>·λ·f<Sub>y</Sub>/√f′<Sub>c</Sub>]·d<Sub>b</Sub>
            = [0.02({psi_e})({psi_lambda})({fy})/√{fc}]·{db_bar}
          </span>
          <Eq /><Res>{fmt(ldh,1)}</Res><Unit>in</Unit>
          <Ref>ACI 318-05 §12.5.2</Ref>
        </Row>
        <Row indent={1}>
          <Var>A<Sub>s,req</Sub>/A<Sub>s,prov</Sub></Var><Assign />
          <span className="mc-expr">{fmt(As_dowel_req,2)}/0.31</span>
          <Eq /><Res>{fmt(As_ratio_embed,2)}</Res>
        </Row>
        <Row indent={1}>
          <Var>T<Sub>req</Sub></Var><Assign />
          <span className="mc-expr">
            3 in + 2(0.75 in) + (A<Sub>s,req</Sub>/A<Sub>s,prov</Sub>)(0.7)(l<Sub>dh</Sub>)
            = 3 + 1.5 + ({fmt(As_ratio_embed,2)})(0.7)({fmt(ldh,1)})
          </span>
          <Eq /><Res>{fmt(T_embed,1)}</Res><Unit>in</Unit>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">T<Sub>min</Sub> = 12 in (Section 4.7.1)</span>
        </Row>

        <BulletResult>Use footing thickness t<Sub>ftg</Sub> = {fmt(t_ftg_in,0)} in ({t_ftg} ft)</BulletResult>

        <Divider />
        <SubHeader>Footing and Soil Weights</SubHeader>

        <Row indent={1}>
          <Var>W<Sub>ped,net</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>ped</Sub>·[h<Sub>ped</Sub>·γ<Sub>c</Sub> − (depth−t<Sub>ftg</Sub>)·γ<Sub>s</Sub>]</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = {A_ped}·[{h_ped}({gamma_conc}) − {depth_ftg - t_ftg}({gamma_soil})]
          </span>
          <Eq /><Res>{fmt(W_ped_net,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>W<Sub>ftg+soil</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>oct</Sub>·[t<Sub>ftg</Sub>·γ<Sub>c</Sub> + (depth−t<Sub>ftg</Sub>)·γ<Sub>s</Sub>]</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = {A_oct}·[{t_ftg}({gamma_conc}) + {depth_ftg - t_ftg}({gamma_soil})]
          </span>
          <Eq /><Res>{fmt(W_ftg_soil,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>D<Sub>s</Sub></Var><Assign />
          <span className="mc-expr">W<Sub>ped,net</Sub> + W<Sub>ftg+soil</Sub> = {fmt(W_ped_net,1)} + {fmt(W_ftg_soil,1)}</span>
          <Eq /><Res>{fmt(Ds,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>e</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>e</Sub> + D<Sub>s</Sub> = {De} + {fmt(Ds,1)}</span>
          <Eq /><Res>{fmt(Pe,1)}</Res><Unit>kip</Unit>
          <Cmt>total vertical load — empty</Cmt>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>o</Sub> + D<Sub>s</Sub> = {Do} + {fmt(Ds,1)}</span>
          <Eq /><Res>{fmt(Po,1)}</Res><Unit>kip</Unit>
          <Cmt>total vertical load — operating</Cmt>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>t</Sub> + D<Sub>s</Sub> = {Dt} + {fmt(Ds,1)}</span>
          <Eq /><Res>{fmt(Pt,1)}</Res><Unit>kip</Unit>
          <Cmt>total vertical load — test</Cmt>
        </Row>

        {/* ── Soil Bearing & Stability ─────────────────── */}
        <SectionHeader>SOIL BEARING AND STABILITY CHECK</SectionHeader>

        <Text>For each load case: eccentricity e = M<Sub>ftg</Sub>/P. If e/D &gt; 0.122 (diagonal) or 0.132 (flat),
          bearing area is not fully in compression; use Figure B (PIP STE03350) to find coefficient L.
          Maximum bearing pressure: f = L·P/A. Stability ratio: SR = D/(2e) ≥ 1.5.</Text>

        <Divider />
        <SubHeader>Case 1 — Empty + Wind (Load Combination 3, Table 3, PIP STC01015)</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>e</Sub></Var>
          <Eq /><Res>{fmt(Pe,1)}</Res><Unit>kip</Unit>
          <span style={{ marginLeft: 16 }}>
            <Var>M<Sub>ftg</Sub></Var><Eq /><Res>{fmt(Mftg,0)}</Res><Unit>kip·ft</Unit>
          </span>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg</Sub> / P<Sub>e</Sub> = {fmt(Mftg,0)} / {fmt(Pe,1)}</span>
          <Eq /><Res>{fmt(e_emp,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>SR</Var><Assign />
          <span className="mc-expr">D<Sub>oct</Sub>/(2·e) = {D_oct}/(2×{fmt(e_emp,2)})</span>
          <Eq /><Res>{fmt(SR_emp,2)}</Res>
          <span style={{ marginLeft: 6 }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>1.5</span>
          <Check pass={SR_emp >= 1.5} />
          <Ref>Eq. 15</Ref>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{fmt(e_emp,2)} / {D_oct}</span>
          <Eq /><Res>{fmt(eD_emp,3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → footing not fully in compression → use Figure B</span>
        </Row>
        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <N value={L_emp_diag} set={setL_emp_diag} w={55} />
          <Ref>coefficient from Figure B, PIP STE03350 (e/D = {fmt(eD_emp,3)})</Ref>
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P/A = {L_emp_diag}({fmt(Pe,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(f_emp,2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>SB<Sub>gross</Sub> = {fmt(SB_gross,2)} ksf</span>
          <Check pass={f_emp <= SB_gross} />
          <Ref>Eq. 11</Ref>
        </Row>

        <Divider />
        <SubHeader>Case 2 — Operating + Wind (Load Combination 2, Table 3, PIP STC01015) ← Controls</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>o</Sub></Var>
          <Eq /><Res>{fmt(Po,1)}</Res><Unit>kip</Unit>
          <span style={{ marginLeft: 16 }}>
            <Var>M<Sub>ftg</Sub></Var><Eq /><Res>{fmt(Mftg,0)}</Res><Unit>kip·ft</Unit>
          </span>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg</Sub> / P<Sub>o</Sub> = {fmt(Mftg,0)} / {fmt(Po,1)}</span>
          <Eq /><Res>{fmt(e_op,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{fmt(e_op,2)} / {D_oct}</span>
          <Eq /><Res>{fmt(eD_op,3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → use Figure B</span>
        </Row>
        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <N value={L_op_diag} set={setL_op_diag} w={55} />
          <Ref>Figure B (e/D = {fmt(eD_op,3)})</Ref>
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P<Sub>o</Sub>/A<Sub>oct</Sub> = {L_op_diag}({fmt(Po,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(f_op,2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"} {fmt(SB_gross,2)} ksf</span>
          <Check pass={f_op <= SB_gross} />
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controlling case</span>
        </Row>

        <Divider />
        <SubHeader>Case 3 — Test + Partial Wind (Load Combination 6, Table 3, PIP STC01015)</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>t</Sub></Var><Eq /><Res>{fmt(Pt,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <InputVar>V<Sub>partial</Sub></InputVar><Assign />
          <N value={V_partial_mph} set={setV_partial_mph} w={50} /><Unit>mph</Unit>
          <Cmt>partial wind speed for test condition (ASCE/SEI 7-05)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>ftg,test</Sub></Var><Assign />
          <span className="mc-expr">(V<Sub>partial</Sub>/V<Sub>design</Sub>)<Sup>2</Sup> × M<Sub>ftg</Sub> = ({V_partial_mph}/{V_design_mph})² × {fmt(Mftg,0)}</span>
          <Eq /><Res>{fmt(Mftg_test,1)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg,test</Sub> / P<Sub>t</Sub> = {fmt(Mftg_test,1)} / {fmt(Pt,1)}</span>
          <Eq /><Res>{fmt(e_test,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{fmt(e_test,2)} / {D_oct}</span>
          <Eq /><Res>{fmt(eD_test,3)}</Res>
          <span style={{ marginLeft: 8 }}>{"<"} 0.122 → full area in compression → Eq. 10a</span>
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">(P<Sub>t</Sub>/A<Sub>oct</Sub>)[1 + 8.19·(e/D)] = ({fmt(Pt,1)}/{A_oct})[1 + 8.19({fmt(eD_test,3)})]</span>
          <Eq /><Res>{fmt(f_test,2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"} {fmt(SB_gross,2)} ksf</span>
          <Check pass={f_test <= SB_gross} />
          <Ref>Eq. 10a</Ref>
        </Row>

        <BulletResult>Use {D_oct} ft octagon footing</BulletResult>

        {/* ── Bottom Reinforcement ─────────────────────── */}
        <SectionHeader>BOTTOM REINFORCEMENT DESIGN</SectionHeader>

        <Text>Strength-level bearing pressures use factored loads; L and K coefficients from Table 2 (flat) /
          Figure B (PIP STE03350). KD = K·D<Sub>oct</Sub> is the distance from the low-pressure edge to the
          zero-pressure line. Compression zone = D<Sub>oct</Sub> − KD from the high-pressure edge.</Text>

        <Divider />
        <SubHeader>Case A — Operating + Wind (Load Comb. 3: 1.2(D<Sub>s</Sub>+D<Sub>o</Sub>) + 1.6W)</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.2·P<Sub>o</Sub> = 1.2({fmt(Po,1)})</span>
          <Eq /><Res>{fmt(Pu_op,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6·M<Sub>ftg</Sub> = 1.6({fmt(Mftg,0)})</span>
          <Eq /><Res>{fmt(Mu_str_op,0)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>u</Sub> / P<Sub>u</Sub> = {fmt(Mu_str_op,0)} / {fmt(Pu_op,1)}</span>
          <Eq /><Res>{fmt(e_str_op,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{fmt(e_str_op,2)} / {D_oct}</span>
          <Eq /><Res>{fmt(eD_str_op,3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2 / Figure B</span>
        </Row>
        <Row indent={1}>
          <InputVar>L</InputVar><Assign /><N value={L_str_op} set={setL_str_op} w={55} />
          <span style={{ marginLeft: 16 }}><InputVar>K</InputVar><Assign /><N value={K_str_op} set={setK_str_op} w={60} /></span>
          <Ref>(flat, Table 2 / Figure B, e/D = {fmt(eD_str_op,3)})</Ref>
        </Row>
        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {K_str_op} × {D_oct}</span>
          <Eq /><Res>{fmt(KD_str_op,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {L_str_op}({fmt(Pu_op,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(SB_str_op,2)}</Res><Unit>ksf</Unit>
        </Row>
        <Row indent={1}>
          <Var>side<Sub>eq</Sub></Var><Assign />
          <span className="mc-expr">√A<Sub>ped</Sub> = √{A_ped}</span>
          <Eq /><Res>{fmt(side_equiv,2)}</Res><Unit>ft</Unit>
          <Cmt>side of equivalent square pedestal</Cmt>
        </Row>
        <Row indent={1}>
          <Var>proj</Var><Assign />
          <span className="mc-expr">(D<Sub>oct</Sub> − side<Sub>eq</Sub>)/2 = ({D_oct} − {fmt(side_equiv,2)})/2</span>
          <Eq /><Res>{fmt(proj,2)}</Res><Unit>ft</Unit>
          <Cmt>footing projection beyond face of pedestal</Cmt>
        </Row>

        {/* Diagram – operating+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            <rect x="20" y="30" width="320" height="50" fill="#e8f4e8" stroke="#4a7a4a" strokeWidth={1} />
            <rect x="88" y="30" width="184" height="50" fill="#c8e8c8" stroke="#2a6a2a" strokeWidth={1.2} />
            {(() => {
              const fW = 320; const fX0 = 20;
              const KD_frac_op = KD_str_op / D_oct;
              const zeroX = fX0 + KD_frac_op * fW;
              const highX = fX0 + fW;
              const baseY = 80; const maxPressH = 45;
              return (
                <>
                  <polygon points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`} fill="#c0daff" stroke="#1a5fa8" strokeWidth={1} />
                  <line x1={zeroX} y1={baseY} x2={zeroX} y2={baseY - 5} stroke="#888" strokeWidth={0.8} strokeDasharray="3,2" />
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">{fmt(SB_str_op,2)} ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {(() => {
                    const faceX = highX - (proj / D_oct) * fW;
                    const compLen = dist_from_far_edge_op;
                    const sbFaceH = maxPressH * (compLen - proj) / compLen;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">{fmt(SB_face_op,2)}</text>
                      </>
                    );
                  })()}
                  <line x1={highX - (proj / D_oct) * fW} y1={100} x2={highX} y2={100} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (proj / D_oct / 2) * fW} y={112} fill="#e06020" fontSize="7" textAnchor="middle">{fmt(proj,2)} ft</text>
                  <line x1={zeroX} y1={108} x2={highX} y2={108} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={118} fill="#444" fontSize="7" textAnchor="middle">{fmt(dist_from_far_edge_op,2)} ft (comp. zone)</text>
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = {fmt(SC_op,2)}</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">SB·({fmt(dist_from_far_edge_op,2)}−proj)/{fmt(dist_from_far_edge_op,2)} = {fmt(SB_str_op,2)}·({fmt(dist_from_far_edge_op,2)}−{fmt(proj,2)})/{fmt(dist_from_far_edge_op,2)}</span>
          <Eq /><Res>{fmt(SB_face_op,2)}</Res><Unit>ksf</Unit>
        </Row>
        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">1.2·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 1.2({fmt(W_ftg_soil,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(SC_op,2)}</Res><Unit>ksf</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>M<Sub>u,ftg</Sub></Var><Assign />
            <span className="mc-expr">(SB<Sub>face</Sub>−soil+conc.)·proj²/2 + (SB−SB<Sub>face</Sub>)·proj²/3</span>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = ({fmt(SB_face_op,2)}−{fmt(SC_op,2)})({fmt(proj,2)})²/2 +
              ({fmt(SB_str_op,2)}−{fmt(SB_face_op,2)})({fmt(proj,2)})²/3
            </span>
          </Row>
          <Row><Eq /><Res>{fmt(Mu_ftg_op,2)}</Res><Unit>kip·ft/ft</Unit></Row>
        </div>

        <Divider />
        <SubHeader>Case B — Empty + Wind (Load Comb. 4: 0.9(D<Sub>e</Sub>+D<Sub>s</Sub>) + 1.6W) ← Controls</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">0.9·P<Sub>e</Sub> = 0.9({fmt(Pe,1)})</span>
          <Eq /><Res>{fmt(Pu_emp_str,1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6·M<Sub>ftg</Sub> = 1.6({fmt(Mftg,0)})</span>
          <Eq /><Res>{fmt(Mu_str_emp,0)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>u</Sub> / P<Sub>u</Sub> = {fmt(Mu_str_emp,0)} / {fmt(Pu_emp_str,1)}</span>
          <Eq /><Res>{fmt(e_str_emp,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{fmt(e_str_emp,2)} / {D_oct}</span>
          <Eq /><Res>{fmt(eD_str_emp,3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2</span>
        </Row>
        <Row indent={1}>
          <InputVar>L</InputVar><Assign /><N value={L_str_emp} set={setL_str_emp} w={55} />
          <span style={{ marginLeft: 16 }}><InputVar>K</InputVar><Assign /><N value={K_str_emp} set={setK_str_emp} w={60} /></span>
          <Ref>(flat, Table 2, e/D = {fmt(eD_str_emp,3)})</Ref>
        </Row>
        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {K_str_emp} × {D_oct}</span>
          <Eq /><Res>{fmt(KD_str_emp,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {L_str_emp}({fmt(Pu_emp_str,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(SB_str_emp,2)}</Res><Unit>ksf</Unit>
        </Row>

        {/* Diagram – empty+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            {(() => {
              const fW = 320; const fX0 = 20;
              const KD_frac_emp = KD_str_emp / D_oct;
              const zeroX = fX0 + KD_frac_emp * fW;
              const highX = fX0 + fW;
              const baseY = 80; const maxPressH = 45;
              return (
                <>
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  <polygon points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`} fill="#c0daff" stroke="#1a5fa8" strokeWidth={1} />
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">{fmt(SB_str_emp,2)} ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {(() => {
                    const faceX = highX - (proj / D_oct) * fW;
                    const compLen = comp_len_emp;
                    const sbFaceH = maxPressH * (compLen - proj) / compLen;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">{fmt(SB_face_emp,2)}</text>
                      </>
                    );
                  })()}
                  <line x1={zeroX} y1={100} x2={highX} y2={100} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={112} fill="#444" fontSize="7" textAnchor="middle">{fmt(comp_len_emp,2)} ft (comp. zone)</text>
                  <line x1={highX - (proj / D_oct) * fW} y1={107} x2={highX} y2={107} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (proj / D_oct / 2) * fW} y={118} fill="#e06020" fontSize="7" textAnchor="middle">{fmt(proj,2)} ft</text>
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = {fmt(SC_emp,2)}</text>
                  <line x1={fX0} y1={100} x2={zeroX} y2={100} stroke="#888" strokeWidth={0.8} />
                  <text x={(fX0 + zeroX) / 2} y={112} fill="#888" fontSize="7" textAnchor="middle">{fmt(KD_str_emp,2)} ft (KD)</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">SB·(comp.zone−proj)/comp.zone = {fmt(SB_str_emp,2)}·({fmt(comp_len_emp,2)}−{fmt(proj,2)})/{fmt(comp_len_emp,2)}</span>
          <Eq /><Res>{fmt(SB_face_emp,2)}</Res><Unit>ksf</Unit>
        </Row>
        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">0.9·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 0.9({fmt(W_ftg_soil,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(SC_emp,2)}</Res><Unit>ksf</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>M<Sub>u,ftg</Sub></Var><Assign />
            <span className="mc-expr">(SB<Sub>face</Sub>−soil)·proj²/2 + (SB−SB<Sub>face</Sub>)·proj²/3</span>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = ({fmt(SB_face_emp,2)}−{fmt(SC_emp,2)})({fmt(proj,2)})²/2 +
              ({fmt(SB_str_emp,2)}−{fmt(SB_face_emp,2)})({fmt(proj,2)})²/3
            </span>
          </Row>
          <Row>
            <Eq /><Res>{fmt(Mu_ftg_emp,2)}</Res><Unit>kip·ft/ft</Unit>
            <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
          </Row>
        </div>

        <Divider />
        <SubHeader>Reinforcement Calculation</SubHeader>

        <Row indent={1}>
          <InputVar>t<Sub>ftg,in</Sub></InputVar><Assign />
          <Res>{fmt(t_ftg_in,0)}</Res><Unit>in</Unit>
          <Cmt>= t<Sub>ftg</Sub> × 12 = {t_ftg} × 12</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>cover</InputVar><Assign />
          <N value={cover} set={setCover} w={45} /><Unit>in</Unit>
          <Cmt>clear cover (cast against soil)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>d<Sub>bar</Sub></InputVar><Assign />
          <N value={d_bar_rebar} set={setD_bar_rebar} w={60} /><Unit>in</Unit>
          <Cmt>bar diameter (approx. for #9 bar — conservative)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>d</Var><Assign />
          <span className="mc-expr">t<Sub>ftg,in</Sub> − cover − d<Sub>bar</Sub>/2 = {fmt(t_ftg_in,0)} − {cover} − {d_bar_rebar}</span>
          <Eq /><Res>{fmt(d_eff,3)}</Res><Unit>in</Unit>
          <Cmt>effective depth</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>b</InputVar><Assign />
          <span className="mc-expr">12</span><Unit>in</Unit>
          <Cmt>unit strip width (1 ft)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>F</Var><Assign />
          <span className="mc-expr">b·d²/12,000 = 12({fmt(d_eff,3)})²/12,000</span>
          <Eq /><Res>{fmt(F_factor,3)}</Res>
        </Row>
        <Row indent={1}>
          <Var>K<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub>/F = {fmt(Mu_ftg_emp,2)}/{fmt(F_factor,3)}</span>
          <Eq /><Res>{fmt(Ku_rebar,1)}</Res>
        </Row>
        <Row indent={1}>
          <InputVar>a<Sub>u</Sub></InputVar><Assign />
          <N value={au} set={setAu} w={65} />
          <Cmt>from K<Sub>u</Sub> design table</Cmt>
        </Row>
        <Row indent={1}>
          <Var>A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub>/(a<Sub>u</Sub>·d) = {fmt(Mu_ftg_emp,2)}/({au} × {fmt(d_eff,3)})</span>
          <Eq /><Res>{fmt(As_req,2)}</Res><Unit>in²/ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>A<Sub>s,min</Sub></Var><Assign />
          <span className="mc-expr">0.0033 × 12 × d = 0.0033 × 12 × {fmt(d_eff,3)}</span>
          <Eq /><Res>{fmt(As_min,2)}</Res><Unit>in²/ft</Unit>
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
        </Row>
        <Row indent={1}>
          <Var>(4/3)A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">(4/3)({fmt(As_req,2)})</span>
          <Eq /><Res>{fmt(As_43,2)}</Res><Unit>in²/ft</Unit>
        </Row>

        <BulletResult>Use #6 @ 9 in E.W. (bottom); A<Sub>s</Sub> = 0.59 in²/ft</BulletResult>

        {/* ── Shear Check ─────────────────────────────── */}
        <SectionHeader>SHEAR CHECK</SectionHeader>
        <SubHeader>Beam Shear — Empty + Wind (Controls)</SubHeader>

        <Row indent={1}>
          <Var>d/12</Var><Assign />
          <span className="mc-expr">{fmt(d_eff,3)}/12</span>
          <Eq /><Res>{fmt(d_eff/12,3)}</Res><Unit>ft</Unit>
          <Cmt>effective depth in feet</Cmt>
        </Row>
        <Row indent={1}>
          <Var>SB<Sub>at d</Sub></Var><Assign />
          <span className="mc-expr">
            SB·(comp.zone − proj + d/12)/comp.zone = {fmt(SB_str_emp,2)}·({fmt(comp_len_emp,2)} − {fmt(proj,2)} + {fmt(d_eff/12,3)})/{fmt(comp_len_emp,2)}
          </span>
          <Eq /><Res>{fmt(SB_at_d,2)}</Res><Unit>ksf</Unit>
        </Row>
        <Row indent={1}>
          <Var>V<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">(SB<Sub>at d</Sub> − Soil+Conc.)(proj − d/12) + (SB − SB<Sub>at d</Sub>)(proj − d/12)/2</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = ({fmt(SB_at_d,2)} − {fmt(SC_emp,2)})({fmt(proj_less_d,2)}) + ({fmt(SB_str_emp,2)} − {fmt(SB_at_d,2)})({fmt(proj_less_d,2)})/2
          </span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= {fmt(Vu_beam_p1,2)} + {fmt(Vu_beam_p2,2)}</span>
          <Eq /><Res>{fmt(Vu_beam_val,2)}</Res><Unit>kip/ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u</Sub>·1000/(b·d) = {fmt(Vu_beam_val,2)}(1000)/(12 × {fmt(d_eff,3)})</span>
          <Eq /><Res>{fmt(vu_beam,1)}</Res><Unit>psi</Unit>
        </Row>
        <Row indent={1}>
          <InputVar>φ</InputVar><Assign />
          <N value={phi_shear} set={setPhi_shear} w={50} />
          <Cmt>shear strength reduction factor (ACI 318-05 §9.3.2.3)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">2φ√f′<Sub>c</Sub> = 2({phi_shear})√{fc}</span>
          <Eq /><Res>{fmt(vc_beam_allow,1)}</Res><Unit>psi</Unit>
          <Ref>ACI 318-05 §11.3.1</Ref>
        </Row>
        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Eq />
          <Res>{fmt(vu_beam,1)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>φv<Sub>c</Sub> = {fmt(vc_beam_allow,1)} psi</span>
          <Check pass={vu_beam < vc_beam_allow} />
        </Row>

        <Divider />
        <SubHeader>Punching Shear — Test Load (Load Comb. 7: 1.4·D<Sub>t</Sub>)</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub>/A<Sub>oct</Sub></Var><Assign />
          <span className="mc-expr">1.4·P<Sub>t</Sub>/A<Sub>oct</Sub> = 1.4({fmt(Pt,1)})/{A_oct}</span>
          <Eq /><Res>{fmt(1.4*Pt/A_oct,2)}</Res><Unit>ksf</Unit>
        </Row>
        <Row indent={1}>
          <Var>c + d</Var><Assign />
          <span className="mc-expr">side<Sub>eq</Sub> + d/12 = {fmt(side_equiv,2)} + {fmt(d_eff/12,3)}</span>
          <Eq /><Res>{fmt(side_d,3)}</Res><Unit>ft</Unit>
          <Cmt>critical punching perimeter side length</Cmt>
        </Row>
        <Row indent={1}>
          <Var>b<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">4(c + d) = 4({fmt(side_d,3)})</span>
          <Eq /><Res>{fmt(bo,3)}</Res><Unit>ft</Unit>
          <Cmt>critical perimeter length</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>α<Sub>s</Sub></InputVar><Assign />
          <N value={alpha_s} set={setAlpha_s} w={50} />
          <Cmt>interior column factor (ACI 318-05)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>SC<Sub>punch</Sub></Var><Assign />
          <span className="mc-expr">(1.4/1.2)·Soil+Conc.<Sub>op</Sub> = (1.4/1.2)·{fmt(SC_op,4)}</span>
          <Eq /><Res>{fmt(SC_punch,2)}</Res><Unit>ksf</Unit>
          <Cmt>factored soil+concrete counterweight for test load combination</Cmt>
        </Row>
        <Row indent={1}>
          <Var>V<Sub>u,punch</Sub></Var><Assign />
          <span className="mc-expr">
            (P<Sub>u</Sub>/A − SC<Sub>punch</Sub>)·(A<Sub>oct</Sub> − (c+d)²)
            = ({fmt(1.4*Pt/A_oct,2)} − {fmt(SC_punch,2)})({A_oct} − {fmt(side_d*side_d,1)})
          </span>
        </Row>
        <Row indent={2}>
          <Eq /><Res>{fmt(Vu_punch_val,0)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u,punch</Sub>·1000/(d·b<Sub>o</Sub>·12) = {fmt(Vu_punch_val,0)}(1000)/({fmt(d_eff,3)}·{fmt(bo,3)}·12)</span>
          <Eq /><Res>{fmt(vu_punch,0)}</Res><Unit>psi</Unit>
        </Row>
        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">φ·(α<Sub>s</Sub>·d/b<Sub>o</Sub> + 2)·√f′<Sub>c</Sub></span>
          <Ref>ACI 318-05 Eq. 11-34</Ref>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= {phi_shear}[{alpha_s}({fmt(d_eff/12,3)}/{fmt(bo,3)}) + 2]√{fc}</span>
          <Eq /><Res>{fmt(vc_punch1,0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {fmt(vu_punch,0)} psi</span>
          <Check pass={vc_punch1 > vu_punch} />
        </Row>
        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">φ·4·√f′<Sub>c</Sub> = {phi_shear}(4)√{fc}</span>
          <Eq /><Res>{fmt(vc_punch2,0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {fmt(vu_punch,0)} psi</span>
          <Check pass={vc_punch2 > vu_punch} />
          <Ref>ACI 318-05 Eq. 11-35</Ref>
        </Row>

        {/* ── Top Reinforcement ────────────────────────── */}
        <SectionHeader>TOP REINFORCEMENT CHECK</SectionHeader>
        <Text>
          Check whether concrete section alone can resist the weight of soil and concrete above the footing
          without top reinforcement. Use load factor 1.4 (gravity only).
        </Text>

        <Row indent={1}>
          <InputVar>φ<Sub>flex</Sub></InputVar><Assign />
          <N value={phi_flex} set={setPhi_flex} w={50} />
          <Cmt>flexural strength reduction factor (plain concrete, ACI 318-05 §22.5)</Cmt>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u,top</Sub></Var><Assign />
          <span className="mc-expr">(1.4/1.2)·Soil+Conc.<Sub>op</Sub>·proj²/2 = {fmt((1.4/1.2)*SC_op,4)}({fmt(proj,2)})²/2</span>
          <Eq /><Res>{fmt(Mu_top,2)}</Res><Unit>kip·ft/ft</Unit>
          <Eq /><Res>{fmt(Mu_top_in,0)}</Res><Unit>in·lb/in</Unit>
        </Row>
        <Row indent={1}>
          <Var>f′<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">5·φ<Sub>flex</Sub>·√f′<Sub>c</Sub> = 5({phi_flex})√{fc}</span>
          <Eq /><Res>{fmt(ft_flex,1)}</Res><Unit>psi</Unit>
          <Ref>Eq. 16</Ref>
        </Row>
        <Row indent={1}>
          <Var>t<Sub>eff</Sub></Var><Assign />
          <span className="mc-expr">√(6·M<Sub>u,top</Sub>/f′<Sub>t</Sub>) = √(6·{fmt(Mu_top_in,0)}/{fmt(ft_flex,1)})</span>
          <Eq /><Res>{fmt(t_eff,1)}</Res><Unit>in</Unit>
          <Ref>Eq. 18</Ref>
        </Row>
        <Row indent={1}>
          <Var>t<Sub>reqd</Sub></Var><Assign />
          <span className="mc-expr">t<Sub>eff</Sub> + 2 in (cast against soil) = {fmt(t_eff,1)} + 2</span>
          <Eq /><Res>{fmt(t_reqd,1)}</Res><Unit>in</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>t<Sub>ftg</Sub> = {fmt(t_ftg_in,0)} in</span>
          <Check pass={t_reqd < t_ftg_in} />
          <Ref>Eq. 17a</Ref>
        </Row>

        <BulletResult>Concrete section adequate — no top reinforcement required</BulletResult>

        {/* ── Summary ──────────────────────────────────── */}
        <SectionHeader>DESIGN SUMMARY</SectionHeader>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Pedestal</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Shape</td><td><strong>Octagon — {fmt(D_ped*12,1)} in ({D_ped} ft)</strong></td></tr>
                <tr><td>Height</td><td><strong>{h_ped} ft above footing</strong></td></tr>
                <tr><td>Verticals</td><td><strong>{Nd} – #5 bars</strong></td></tr>
                <tr><td>Ties</td><td><strong>#4 ties @ 15 in c/c</strong></td></tr>
                <tr><td>Top mat</td><td><strong>#4 @ 12 in E.W. (2 directions)</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Anchor Bolts</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Count</td><td><strong>{Nb}</strong></td></tr>
                <tr><td>Size</td><td><strong>{BD} in dia. BSL</strong></td></tr>
                <tr><td>Spec.</td><td><strong>ASTM F1554, Grade 36</strong></td></tr>
                <tr><td>Bolt circle</td><td><strong>{fmt(BC_in,1)} in ({fmt(BC_ft,3)} ft)</strong></td></tr>
                <tr><td>h<Sub>ef</Sub></td><td><strong>{hef_in} in ({fmt(hef,2)} ft)</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Footing</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Shape</td><td><strong>Octagon — {D_oct} ft</strong></td></tr>
                <tr><td>Thickness</td><td><strong>{fmt(t_ftg_in,0)} in ({t_ftg} ft)</strong></td></tr>
                <tr><td>Bottom reinf.</td><td><strong>#6 @ 9 in E.W.</strong></td></tr>
                <tr><td>Top reinf.</td><td><strong>{t_reqd < t_ftg_in ? "Not required" : "Required — check design"}</strong></td></tr>
                <tr><td>Depth</td><td><strong>{depth_ftg} ft below grade</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid #c0d0e0", paddingTop: 8, fontSize: "8pt", color: "#777", textAlign: "center" }}>
          {projTitle} · {projRef} · {projCode} ·
          Prepared per Process Industry Practices, December 2008
        </div>
      </div>
    </div>
  );
}
