import { useState } from "react";
import "@/index.css";

/* ─── display helpers ─────────────────────────────────────────── */
function fmt(n: number, d = 2): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(d);
}

/** Convert decimal feet to "X ft – Y in" with ⅛-inch fractions */
function fmtFtIn(decFt: number): string {
  if (!isFinite(decFt) || isNaN(decFt)) return "—";
  const totalEighths = Math.round(decFt * 12 * 8);
  const ft  = Math.floor(totalEighths / 96);
  const rem = totalEighths % 96;
  const inW = Math.floor(rem / 8);
  const frc = rem % 8;
  const fracStr: Record<number, string> = { 0:'', 1:'⅛', 2:'¼', 3:'⅜', 4:'½', 5:'⅝', 6:'¾', 7:'⅞' };
  return `${ft} ft\u2013${inW}${fracStr[frc] ?? ''} in`;
}

/* ─── Octagon bearing pressure solver ────────────────────────────
   Resolves L and K coefficients analytically for eccentric loads.
   Fully-compressed case: exact formula.  Partial-uplift: bisection.
   Reference: PIP STE03350 Figure B / Table 2                       */

/** Width of a regular octagon (flat direction, across-flats = D) at height y.
 *  For |y| ≤ h₁ = (√2−1)D/2 the full width D applies; then tapers linearly
 *  to (√2−1)D at the flat faces y = ±D/2.                          */
function octWFlat(y: number, D: number): number {
  const ay = Math.abs(y);
  if (ay <= D / 2) return Math.SQRT2 * D - 2 * ay;   // valid for full range
  return 0;
}

/** Width of the octagon cut perpendicular to its diagonal axis at height yp.
 *  The diagonal axis points toward a vertex (22.5° from flat axis).
 *  Far vertex is at yp = D/(2·cos22.5°) ≈ 0.5412·D.               */
function octWDiag(yp: number, D: number): number {
  const c = Math.cos(Math.PI / 8), s = Math.sin(Math.PI / 8);
  const Dq = D / Math.SQRT2, cd = c - s, cs = c + s;
  const b1l = (s * yp - D / 2) / c, b1h = (s * yp + D / 2) / c;
  const b2l = (-D / 2 - c * yp) / s, b2h = (D / 2 - c * yp) / s;
  const b3l = (-Dq - cd * yp) / cs,  b3h = (Dq - cd * yp) / cs;
  const b4l = (-Dq + cs * yp) / cd,  b4h = (Dq + cs * yp) / cd;
  return Math.max(0, Math.min(b1h, b2h, b3h, b4h) - Math.max(b1l, b2l, b3l, b4l));
}

/** Numerically integrate A = ∫w·dy, S = ∫w·y·dy, I2 = ∫w·y²·dy
 *  over the compressed zone [y_n, y_far] using 300 strips.          */
function octIntegrals(
  y_n: number, y_far: number, D: number,
  wFn: (y: number, D: number) => number
) {
  const N = 300, dy = (y_far - y_n) / N;
  let A = 0, S = 0, I2 = 0;
  for (let i = 0; i < N; i++) {
    const y = y_n + (i + 0.5) * dy;
    const w = wFn(y, D);
    A += w * dy; S += w * y * dy; I2 += w * y * y * dy;
  }
  return { A, S, I2 };
}

/** Solve L and K for an octagonal footing under eccentric load e (ft).
 *  dir='flat': axis toward flat face  — kern = 0.132·D, y_far = D/2
 *  dir='diag': axis toward vertex      — kern = 0.122·D, y_far ≈ 0.541·D
 *
 *  Returns { L, K, compLen } where:
 *    L       = q_max·A_oct / P  (bearing-pressure coefficient)
 *    K       = (y_n + D/2)/D   (neutral-axis position ratio, 0 when fully compressed)
 *    compLen = length of compression zone from far edge to neutral axis (ft) */
function solveLK(e: number, D: number, dir: 'flat' | 'diag'): { L: number; K: number; compLen: number } {
  if (!isFinite(e) || e <= 0) return { L: 1, K: 0, compLen: D };
  const c8    = Math.cos(Math.PI / 8);
  const y_far = dir === 'flat' ? D / 2 : D / (2 * c8);   // far-edge distance
  const kern  = dir === 'flat' ? 0.132 * D : 0.122 * D;  // kern eccentricity
  const A_oct = 0.8284 * D * D;
  const wFn   = dir === 'flat' ? octWFlat : octWDiag;

  if (e <= kern) {
    // Fully compressed — exact closed form: L = 1 + e/kern, K = 0
    return { L: 1 + e / kern, K: 0, compLen: y_far };
  }
  if (e >= y_far * 0.998) return { L: 999, K: 0.98, compLen: D * 0.02 };

  // Partial uplift — bisect on neutral-axis position y_n
  // e_computed = (I2 − y_n·S) / (S − y_n·A) — increases monotonically with y_n
  let lo = -y_far, hi = y_far * 0.995;
  for (let iter = 0; iter < 64; iter++) {
    const yn = (lo + hi) / 2;
    const { A, S, I2 } = octIntegrals(yn, y_far, D, wFn);
    const den = S - yn * A;
    if (Math.abs(den) < 1e-10) { lo = yn; continue; }
    const ec = (I2 - yn * S) / den;
    if (Math.abs(ec - e) < 1e-6) break;
    if (ec < e) lo = yn; else hi = yn;
  }
  const yn = (lo + hi) / 2;
  const { A, S } = octIntegrals(yn, y_far, D, wFn);
  const den     = S - yn * A;
  const compLen = y_far - yn;
  const L       = Math.abs(den) > 1e-10 ? A_oct * compLen / den : 999;
  const K       = Math.max(0, Math.min(1, 0.5 + yn / D));
  return { L: Math.max(1, L), K, compLen };
}

/* ─── ACI 318-05 Appendix D anchor breakout ──────────────────────── */

/** Per-bolt projected area A_N (in²) — ACI D.5.2 rectangular approximation.
 *  Arc spacing s_arc = π·BC/Nb; effective width = min(s_arc, 3·hef). */
function calcAN(BC_in: number, Nb: number, hef_in: number): number {
  const s_arc = Math.PI * BC_in / Nb;
  return Math.min(s_arc, 3 * hef_in) * 3 * hef_in;
}

/** φNn per bolt (kip) — ACI 318-05 Eq. D-7 (cast-in headed bolts).
 *  φNn = φ · (A_N/A_Nco) · ψc · Nb_basic
 *  where Nb_basic = kc · √fc · hef^1.5 / 1000  (kc = 24 cast-in)   */
function calcPhiNn(
  A_N: number, hef_in: number, fc: number,
  phi_a: number, psi_c: number, kc: number
): number {
  const A_Nco  = 9 * hef_in * hef_in;
  const Nb_kip = kc * Math.sqrt(fc) * Math.pow(hef_in, 1.5) / 1000;
  return phi_a * (A_N / A_Nco) * psi_c * Nb_kip;
}

/* ─── Computed-value display helpers ─────────────────────────────── */

/** Computed result badge — green, same height as amber NumInput */
function CalcVal({ v, dec = 3 }: { v: number; dec?: number }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 2,
      background: '#e4f5e4', border: '1px solid #2a7a2a',
      color: '#145a14', fontWeight: 700, fontFamily: 'Consolas, monospace',
      fontSize: '9.5pt', minWidth: 48, textAlign: 'center', verticalAlign: 'middle',
    }}>{fmt(v, dec)}</span>
  );
}

/** Toggle button — switches between equation-auto and manual-chart modes */
function CalcToggle({ useCalc, onToggle, label }: {
  useCalc: boolean; onToggle: () => void; label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                  margin: '5px 0 3px 24px' }}>
      <button
        onClick={onToggle}
        style={{
          padding: '2px 14px', borderRadius: 10, cursor: 'pointer',
          fontSize: 10, fontWeight: 700, fontFamily: 'Arial, sans-serif',
          border: useCalc ? '1.5px solid #2a7a2a' : '1.5px solid #b06000',
          background: useCalc ? '#d8f2d8' : '#fff3d8',
          color: useCalc ? '#145a14' : '#804000',
          transition: 'all 0.15s',
        }}
      >
        {useCalc ? '⚡ Equations (click for manual)' : '📊 Manual / Chart (click for equations)'}
      </button>
      <span style={{ fontSize: 9, color: '#777', fontStyle: 'italic' }}>{label}</span>
    </div>
  );
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

  /* ── Calculation-mode toggles ─────────────────────────────────── */
  const [useCalcL,  setUseCalcL]  = useState(false); // bearing L/K coefficients
  const [useCalcAN, setUseCalcAN] = useState(false); // ACI anchor breakout

  /* ── ACI D.5.2 parameters (editable when anchor equations active) */
  const [kc_anc,  setKc_anc]  = useState(24);    // kc = 24 for cast-in headed
  const [psi_c_N, setPsi_c_N] = useState(1.25);  // ψc,N — Condition A
  const [phi_anc, setPhi_anc] = useState(0.75);  // φ — Condition A

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

  /* ── Equation-based L/K coefficients (octagon solver) ─────────── */
  const lk_emp_calc  = solveLK(Mftg / Pe,                   D_oct, 'diag');
  const lk_op_calc   = solveLK(Mftg / Po,                   D_oct, 'diag');
  const lk_s_op_calc = solveLK((1.6 * Mftg) / (1.2 * (Do + (A_ped * (h_ped * gamma_conc - (depth_ftg - t_ftg) * gamma_soil) + A_oct * (t_ftg * gamma_conc + (depth_ftg - t_ftg) * gamma_soil)))), D_oct, 'flat');
  const lk_s_em_calc = solveLK((1.6 * Mftg) / (0.9 * Pe),  D_oct, 'flat');

  // _u = "used" — either from equation or manual state, based on toggle
  const L_emp_u  = useCalcL ? lk_emp_calc.L  : L_emp_diag;
  const L_op_u   = useCalcL ? lk_op_calc.L   : L_op_diag;
  const L_sop_u  = useCalcL ? lk_s_op_calc.L : L_str_op;
  const K_sop_u  = useCalcL ? lk_s_op_calc.K : K_str_op;
  const L_sem_u  = useCalcL ? lk_s_em_calc.L : L_str_emp;
  const K_sem_u  = useCalcL ? lk_s_em_calc.K : K_str_emp;

  /* ── ACI D.5.2 anchor breakout (equation-based) ────────────────── */
  const A_N_calc_val   = calcAN(BC_in, Nb, hef_in);
  const A_N_u          = useCalcAN ? A_N_calc_val : A_N;
  const phi_Nn_calc_val = calcPhiNn(A_N_u, hef_in, fc, phi_anc, psi_c_N, kc_anc);
  const phi_Nn_u       = useCalcAN ? phi_Nn_calc_val : phi_Nn_val;

  /* Soil bearing */
  const e_emp  = Mftg / Pe;
  const SR_emp = D_oct / (2 * e_emp);
  const eD_emp = e_emp / D_oct;
  const f_emp  = L_emp_u * Pe / A_oct;

  const e_op  = Mftg / Po;
  const eD_op = e_op / D_oct;
  const f_op  = L_op_u * Po / A_oct;

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
  const KD_str_op = K_sop_u * D_oct;
  const SB_str_op = L_sop_u * Pu_op / A_oct;
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
  const KD_str_emp  = K_sem_u * D_oct;
  const SB_str_emp  = L_sem_u * Pu_emp_str / A_oct;
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
          {/* Left – sketch (dynamic) */}
          <div style={{ flex: "0 0 230px" }}>
            {(() => {
              /* ── layout constants ── */
              const cx         = 115;   // SVG horizontal centre
              const pedTopY    = 235;   // fixed: vessel base / pedestal top
              const availPx    = 108;   // pixels for h_ped + t_ftg combined
              const totalFndFt = Math.max(h_ped + t_ftg, 0.5);
              const hSc        = availPx / totalFndFt;   // px per foot

              const pedH_px  = h_ped * hSc;
              const ftgH_px  = t_ftg * hSc;
              const pedBotY  = pedTopY + pedH_px;
              const ftgBotY  = pedBotY + ftgH_px;

              /* Grade line: aboveGrade = h_ped − (depth_ftg − t_ftg) */
              const aboveGrade = Math.max(h_ped - (depth_ftg - t_ftg), 0);
              const gradeY     = pedTopY + aboveGrade * hSc;

              /* Widths (footing = reference 160 px = D_oct) */
              const ftgW  = 160;
              const pedW  = Math.max(Math.round(ftgW * (D_ped / D_oct)), 52);
              const bcW   = Math.min(ftgW * (BC_ft / D_oct), ftgW - 2);
              const ftgX  = cx - ftgW / 2;
              const pedX  = cx - pedW / 2;
              const bcX   = cx - bcW / 2;

              /* dim-line tick half-length */
              const tk = 4;

              const svgH = Math.max(ftgBotY + 28, 370);

              return (
                <svg viewBox={`0 0 230 ${svgH}`}
                     style={{ width: 230, height: svgH, fontFamily: "Arial", fontSize: 9 }}>

                  {/* ── Fixed vessel section ── */}
                  <defs>
                    <marker id="arr" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                      <path d="M0,0 L5,2.5 L0,5 Z" fill="#1a5fa8" />
                    </marker>
                  </defs>

                  {/* vessel cylinder */}
                  <rect x="87" y="55" width="56" height="180" fill="none" stroke="#333" strokeWidth={1.5} />
                  <ellipse cx={cx} cy="55" rx="28" ry="8" fill="none" stroke="#333" strokeWidth={1.2} />

                  {/* skirt / base ring */}
                  <rect x="81" y="190" width="68" height="45" fill="none" stroke="#555" strokeWidth={1} strokeDasharray="3,2" />

                  {/* platforms */}
                  <rect x="58" y="215" width="114" height="4" fill="#bbb" />
                  <text x="174" y="220" fill="#444" fontSize="7.5">Platf. #1 (90°)</text>
                  <rect x="58" y="162" width="114" height="4" fill="#bbb" />
                  <text x="174" y="167" fill="#444" fontSize="7.5">Platf. #2 (60°)</text>
                  <rect x="58" y="102" width="114" height="4" fill="#bbb" />
                  <text x="174" y="107" fill="#444" fontSize="7.5">Platf. #3 (12 ft)</text>

                  {/* height annotation lines */}
                  <line x1="170" y1="55"  x2="170" y2="162" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />
                  <text x="172" y="113"   fill="#555" fontSize="7.5">49 ft</text>
                  <line x1="170" y1="162" x2="170" y2="235" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />
                  <text x="172" y="202"   fill="#555" fontSize="7.5">23 ft</text>

                  {/* overall height arrow */}
                  <line x1="22" y1="55" x2="22" y2={pedTopY} stroke="#666" strokeWidth={0.7} markerEnd="url(#arr)" />
                  <line x1="22" y1={pedTopY} x2="22" y2="55" stroke="#666" strokeWidth={0.7} />
                  <text x="5" y="152" fill="#444" fontSize="7.5" transform="rotate(-90,5,152)">67 ft</text>

                  {/* wind arrow */}
                  <line x1="14" y1="140" x2="79" y2="140" stroke="#1a5fa8" strokeWidth={1.5} markerEnd="url(#arr)" />
                  <text x="7" y="136" fill="#1a5fa8" fontSize="8" fontWeight="bold">W</text>

                  {/* vessel info */}
                  <text x="62"  y="72"  fill="#333" fontSize="7.5">14 ft dia.</text>
                  <text x="64"  y="82"  fill="#555" fontSize="7">(14.42 ft)</text>

                  {/* ── Dynamic foundation section ── */}

                  {/* Grade line */}
                  <line x1="5"  y1={gradeY} x2="220" y2={gradeY}
                        stroke="#888" strokeDasharray="4,3" strokeWidth={1} />
                  <text x={cx + 38} y={gradeY - 3} fill="#555" fontSize="7.5">Grade El. 100 ft</text>

                  {/* Footing rectangle */}
                  <rect x={ftgX} y={pedBotY} width={ftgW} height={ftgH_px}
                        fill="#d9e8d9" stroke="#4a7a4a" strokeWidth={1.2} />

                  {/* Pedestal rectangle */}
                  <rect x={pedX} y={pedTopY} width={pedW} height={pedH_px}
                        fill="#cce0cc" stroke="#4a7a4a" strokeWidth={1.2} />

                  {/* Bolt-circle dashed indicator */}
                  <line x1={bcX} y1={pedTopY + 6} x2={bcX + bcW} y2={pedTopY + 6}
                        stroke="#b08040" strokeDasharray="3,2" strokeWidth={1} />
                  <text x={cx} y={pedTopY + 16} fill="#9a6000" fontSize="7" textAnchor="middle">
                    BC = {fmt(BC_in, 0)} in
                  </text>

                  {/* ── h_ped dimension line (left of pedestal) ── */}
                  <line x1={pedX - 14} y1={pedTopY} x2={pedX - 10} y2={pedTopY}
                        stroke="#556" strokeWidth={0.8} />
                  <line x1={pedX - 12} y1={pedTopY} x2={pedX - 12} y2={pedBotY}
                        stroke="#556" strokeWidth={0.8} />
                  <line x1={pedX - 14} y1={pedBotY} x2={pedX - 10} y2={pedBotY}
                        stroke="#556" strokeWidth={0.8} />
                  <text x={pedX - 15} y={(pedTopY + pedBotY) / 2 + 3}
                        fill="#444" fontSize="7.5" textAnchor="end">
                    {fmt(h_ped, 1)} ft
                  </text>

                  {/* ── t_ftg dimension line (left of footing) ── */}
                  <line x1={ftgX - 14} y1={pedBotY} x2={ftgX - 10} y2={pedBotY}
                        stroke="#556" strokeWidth={0.8} />
                  <line x1={ftgX - 12} y1={pedBotY} x2={ftgX - 12} y2={ftgBotY}
                        stroke="#556" strokeWidth={0.8} />
                  <line x1={ftgX - 14} y1={ftgBotY} x2={ftgX - 10} y2={ftgBotY}
                        stroke="#556" strokeWidth={0.8} />
                  <text x={ftgX - 15} y={(pedBotY + ftgBotY) / 2 + 3}
                        fill="#444" fontSize="7.5" textAnchor="end">
                    {fmt(t_ftg, 1)} ft
                  </text>

                  {/* ── D_ped dimension line (inside pedestal, near bottom) ── */}
                  <line x1={pedX}        y1={pedBotY - 10} x2={pedX}        y2={pedBotY - 10 + tk}
                        stroke="#e06020" strokeWidth={0.8} />
                  <line x1={pedX}        y1={pedBotY - 10 + tk / 2}
                        x2={pedX + pedW}  y2={pedBotY - 10 + tk / 2}
                        stroke="#e06020" strokeWidth={0.8} />
                  <line x1={pedX + pedW} y1={pedBotY - 10} x2={pedX + pedW} y2={pedBotY - 10 + tk}
                        stroke="#e06020" strokeWidth={0.8} />
                  <text x={cx} y={pedBotY - 2} fill="#e06020" fontSize="7.5" textAnchor="middle">
                    {fmtFtIn(D_ped)}
                  </text>

                  {/* ── D_oct dimension line (below footing) ── */}
                  <line x1={ftgX}        y1={ftgBotY + 5} x2={ftgX}        y2={ftgBotY + 5 + tk}
                        stroke="#1a5fa8" strokeWidth={0.8} />
                  <line x1={ftgX}        y1={ftgBotY + 5 + tk / 2}
                        x2={ftgX + ftgW}  y2={ftgBotY + 5 + tk / 2}
                        stroke="#1a5fa8" strokeWidth={0.8} />
                  <line x1={ftgX + ftgW} y1={ftgBotY + 5} x2={ftgX + ftgW} y2={ftgBotY + 5 + tk}
                        stroke="#1a5fa8" strokeWidth={0.8} />
                  <text x={cx} y={ftgBotY + 18} fill="#1a5fa8" fontSize="7.5" textAnchor="middle">
                    {fmtFtIn(D_oct)}
                  </text>
                </svg>
              );
            })()}
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
            <text x="118" y="82" fill="#1a3a8f" fontSize="7.5"> = {A_N_u.toLocaleString()} in²</text>
            <line x1="75" y1="53" x2="75" y2="107" stroke="#e06020" strokeWidth={0.8} />
            <text x="54" y="83" fill="#e06020" fontSize="7.5">{fmt(BC_in/Nb,0)} in</text>
            <line x1="103" y1="130" x2="157" y2="130" stroke="#e06020" strokeWidth={0.8} />
            <text x="112" y="143" fill="#e06020" fontSize="7.5">{fmt(BC_in/Nb,0)} in</text>
          </svg>
        </div>

        <CalcToggle
          useCalc={useCalcAN}
          onToggle={() => setUseCalcAN(v => !v)}
          label={useCalcAN
            ? "A_N and φNn computed from ACI 318-05 Appendix D.5.2 equations — click for manual entry"
            : "A_N from graphical layout, φNn from spreadsheet — click to use ACI D.5.2 equations"}
        />

        {useCalcAN && (
          <div style={{ marginLeft: 24, marginBottom: 6, border: '1px solid #2a7a2a',
                        background: '#f0f8f0', padding: '6px 10px', borderRadius: 3,
                        fontSize: '8.5pt', fontFamily: 'Arial, sans-serif', color: '#1a4a1a' }}>
            <strong>ACI 318-05 D.5.2 parameters:</strong>&nbsp;
            k<sub>c</sub>&nbsp;=&nbsp;<N value={kc_anc} set={setKc_anc} w={40} />&nbsp;
            ψ<sub>c,N</sub>&nbsp;=&nbsp;<N value={psi_c_N} set={setPsi_c_N} w={45} />&nbsp;
            φ&nbsp;=&nbsp;<N value={phi_anc} set={setPhi_anc} w={40} />&nbsp;
            <span style={{ marginLeft: 8, fontSize: '7.5pt', color: '#555' }}>
              (k<sub>c</sub>=24 cast-in; ψ<sub>c</sub>=1.25 Cond. A; φ=0.75 Cond. A)
            </span>
          </div>
        )}

        <Row indent={1}>
          {useCalcAN ? <Var>A<Sub>N</Sub></Var> : <InputVar>A<Sub>N</Sub></InputVar>}<Assign />
          {useCalcAN ? (
            <><CalcVal v={A_N_calc_val} dec={0} /><Unit>in²</Unit>
              <Cmt>⚡ ACI D.5.2: min(s_arc, 3·h<sub>ef</sub>)·3·h<sub>ef</sub> = min({fmt(Math.PI*BC_in/Nb,1)}, {fmt(3*hef_in,0)})·{fmt(3*hef_in,0)}</Cmt></>
          ) : (
            <><N value={A_N} set={setA_N} w={70} /><Unit>in²</Unit><Cmt>from graphical/CAD layout</Cmt></>
          )}
        </Row>

        {useCalcAN && (
          <Row indent={1}>
            <Var>A<Sub>Nco</Sub></Var><Assign />
            <span className="mc-expr">9·h<Sub>ef</Sub>² = 9·{hef_in}² </span>
            <Eq /><Res>{fmt(9*hef_in*hef_in,0)}</Res><Unit>in²</Unit>
            <Cmt>single anchor reference area, ACI Eq. D-6</Cmt>
          </Row>
        )}
        {useCalcAN && (
          <Row indent={1}>
            <Var>N<Sub>b</Sub></Var><Assign />
            <span className="mc-expr">{kc_anc}·√f'<Sub>c</Sub>·h<Sub>ef</Sub><Sup>1.5</Sup> = {kc_anc}·√{fc}·{hef_in}<Sup>1.5</Sup></span>
            <Eq /><Res>{fmt(kc_anc*Math.sqrt(fc)*Math.pow(hef_in,1.5)/1000,1)}</Res><Unit>kip</Unit>
            <Cmt>basic breakout, ACI Eq. D-7</Cmt>
          </Row>
        )}

        <Row indent={1}>
          {useCalcAN ? <Var>φN<Sub>n</Sub></Var> : <InputVar>φN<Sub>n</Sub></InputVar>}<Assign />
          {useCalcAN ? (
            <><CalcVal v={phi_Nn_calc_val} dec={1} /><Unit>kip</Unit>
              <Cmt>⚡ φ·(A<sub>N</sub>/A<sub>Nco</sub>)·ψ<sub>c</sub>·N<sub>b</sub> = {fmt(phi_anc,2)}·({fmt(A_N_u,0)}/{fmt(9*hef_in*hef_in,0)})·{fmt(psi_c_N,2)}·{fmt(kc_anc*Math.sqrt(fc)*Math.pow(hef_in,1.5)/1000,1)}</Cmt></>
          ) : (
            <><N value={phi_Nn_val} set={setPhi_Nn_val} w={60} /><Unit>kip</Unit></>
          )}
          <span style={{ fontWeight: "bold", marginLeft: 6 }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>N<Sub>u</Sub> = {fmt(Nu,1)} kip</span>
          <Check pass={phi_Nn_u > Nu} />
          <Ref>ACI 318-05 App. D</Ref>
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

        <CalcToggle
          useCalc={useCalcL}
          onToggle={() => setUseCalcL(v => !v)}
          label={useCalcL
            ? "L and K auto-computed via octagon bisection (exact numerical solution, PIP Figure B equivalent)"
            : "L values entered manually from PIP Figure B chart or Table 2 — click to auto-compute"}
        />

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
          {useCalcL ? <Var>L</Var> : <InputVar>L</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_emp_calc.L} /><Cmt>⚡ octagon bisection — {eD_emp > 0.122 ? 'partial uplift' : 'fully compressed'}, e/D = {fmt(eD_emp,3)}</Cmt></>
            : <><N value={L_emp_diag} set={setL_emp_diag} w={55} /><Ref>coefficient from Figure B, PIP STE03350 (e/D = {fmt(eD_emp,3)})</Ref></>
          }
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P/A = {fmt(L_emp_u,3)}({fmt(Pe,1)})/{A_oct}</span>
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
          {useCalcL ? <Var>L</Var> : <InputVar>L</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_op_calc.L} /><Cmt>⚡ octagon bisection — {eD_op > 0.122 ? 'partial uplift' : 'fully compressed'}, e/D = {fmt(eD_op,3)}</Cmt></>
            : <><N value={L_op_diag} set={setL_op_diag} w={55} /><Ref>Figure B (e/D = {fmt(eD_op,3)})</Ref></>
          }
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P<Sub>o</Sub>/A<Sub>oct</Sub> = {fmt(L_op_u,3)}({fmt(Po,1)})/{A_oct}</span>
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

        <CalcToggle
          useCalc={useCalcL}
          onToggle={() => setUseCalcL(v => !v)}
          label={useCalcL
            ? "L, K auto-computed via octagon bisection solver (flat direction)"
            : "L, K entered manually from PIP Table 2 / Figure B — click to auto-compute"}
        />

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
          {useCalcL ? <Var>L</Var> : <InputVar>L</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_s_op_calc.L} dec={3} /></>
            : <N value={L_str_op} set={setL_str_op} w={55} />}
          <span style={{ marginLeft: 16 }}>{useCalcL ? <Var>K</Var> : <InputVar>K</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_s_op_calc.K} dec={3} /><Cmt>⚡ octagon bisection — flat, e/D = {fmt(eD_str_op,3)}</Cmt></>
            : <><N value={K_str_op} set={setK_str_op} w={60} /><Ref>(flat, Table 2 / Figure B, e/D = {fmt(eD_str_op,3)})</Ref></>}
          </span>
        </Row>
        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {fmt(K_sop_u,3)} × {D_oct}</span>
          <Eq /><Res>{fmt(KD_str_op,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {fmt(L_sop_u,3)}({fmt(Pu_op,1)})/{A_oct}</span>
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
          {useCalcL ? <Var>L</Var> : <InputVar>L</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_s_em_calc.L} dec={3} /></>
            : <N value={L_str_emp} set={setL_str_emp} w={55} />}
          <span style={{ marginLeft: 16 }}>{useCalcL ? <Var>K</Var> : <InputVar>K</InputVar>}<Assign />
          {useCalcL
            ? <><CalcVal v={lk_s_em_calc.K} dec={3} /><Cmt>⚡ octagon bisection — flat, e/D = {fmt(eD_str_emp,3)}</Cmt></>
            : <><N value={K_str_emp} set={setK_str_emp} w={60} /><Ref>(flat, Table 2, e/D = {fmt(eD_str_emp,3)})</Ref></>}
          </span>
        </Row>
        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {fmt(K_sem_u,3)} × {D_oct}</span>
          <Eq /><Res>{fmt(KD_str_emp,2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {fmt(L_sem_u,3)}({fmt(Pu_emp_str,1)})/{A_oct}</span>
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
