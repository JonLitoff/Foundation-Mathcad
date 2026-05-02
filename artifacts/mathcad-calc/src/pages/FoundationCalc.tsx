import "@/index.css";

/* ─── helpers ─────────────────────────────────────────────────── */

function Var({ children }: { children: React.ReactNode }) {
  return <span className="mc-var">{children}</span>;
}
function Assign() {
  return <span className="mc-assign"> := </span>;
}
function Eq() {
  return <span className="mc-assign"> = </span>;
}
function Res({ children }: { children: React.ReactNode }) {
  return <span className="mc-result">{children}</span>;
}
function Unit({ children }: { children: React.ReactNode }) {
  return <span className="mc-unit">&nbsp;{children}</span>;
}
function OK() {
  return <span className="mc-ok">✓ O.K.</span>;
}
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
  return (
    <div className="mc-text" style={{ marginLeft: indent * 16 }}>
      {children}
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return <div className="mc-note"><strong>Note:</strong> {children}</div>;
}
function BulletResult({ children }: { children: React.ReactNode }) {
  return <div className="mc-bullet-result">▶ {children}</div>;
}
function Divider() {
  return <hr className="mc-divider" />;
}

/* ─── computed values ──────────────────────────────────────────── */

// Design data
const V_wind = 44.75;       // kip (base shear)
const M_wind = 1902;        // kip-ft (moment at top of grout)
const De = 170.3;           // kip (empty weight)
const Do = 345.2;           // kip (operating weight)
const Dt = 624.1;           // kip (test weight)
const SB_net = 3.25;        // ksf (net allowable soil bearing)
const gamma_soil = 0.110;   // kcf (110 pcf)
const gamma_conc = 0.150;   // kcf (150 pcf)
const fc = 4000;            // psi
const fy = 60000;           // psi (60 ksi)
const depth_ftg = 5;        // ft (foundation depth)
const BC_in = 178.5;        // inches (bolt circle)
const BC_ft = BC_in / 12;   // ft
const BD = 1.5;             // inches (bolt diameter)
const SD = 4.0;             // inches (sleeve diameter)
const Nb = 24;              // number of anchor bolts
const Nd = 40;              // number of dowels
const h_ped = 4.5;          // ft (pedestal height above footing)
const t_ftg = 1.5;          // ft (footing thickness, try 18 in)

// Pedestal size per equations 1a-1e
const eq1a = BC_in + 9;                          // 187.5 in
const eq1b = BC_in + 8 * BD;                     // 190.5 in
const eq1d = BC_in + SD + 9 - BD;                // 190.0 in
const eq1e = BC_in + SD + 7 * BD;                // 193.0 in (controls)
const ped_in_min = Math.max(eq1a, eq1b, eq1d, eq1e);
const ped_ft_min = ped_in_min / 12;              // 16.083 ft
// Use 17ft-8.5in (17.704 ft) after anchor bolt area check
const D_ped = 17.704;                            // ft (final pedestal face-to-face)
const A_ped = 259.7;                             // ft² (Table 1)
const Dp = A_ped * h_ped * gamma_conc;           // 175.3 kip

// Moments at pedestal base
const Mped = M_wind + h_ped * V_wind;            // 2104 kip-ft
const Muped = 1.6 * Mped;                        // 3366 kip-ft
const DC = D_ped - 0.5;                          // 17.204 ft (dowel circle diameter ≈ 17.21)
const DC_exact = 17.21;

// Dowel design
const Fu = (4 * Muped) / (Nd * DC_exact) - 0.9 * (De + Dp) / Nd;
const phi_fy = 0.9 * (fy / 1000);               // 54 ksi
const As_dowel_req = Fu / phi_fy;               // in²

// Anchor bolt max tension (Eq. 4)
const Mu_ab = 1.6 * M_wind;                     // kip-ft (factored moment at base of vessel)
const Nu = (4 * Mu_ab) / (Nb * BC_ft) - 0.9 * De / Nb;

// Shear on anchor bolt check
const Vu_ab = 1.6 * V_wind;                     // 71.6 kip
const LA = (2 / 3) * BC_ft;                     // lever arm
const Pu_ab = Mu_ab / LA + 0.9 * De / 2;        // factored compression at top of pedestal
const mu_fric = 0.55;
const Vf = mu_fric * Pu_ab;
const phi_Vf = 0.75 * Vf;

// Projected concrete failure area (anchor bolt check)
const D_ped2 = 17.704;                          // ft (increased pedestal)
const hef = 1.5;                                // ft (18 in)
const DEQ = 1.027 * D_ped2;                     // equivalent circle diameter
const AN_check = 1042;                          // in² (from graphical calc)
const phi_Nn = 33.2;                            // kips (from PIP spreadsheet)

// Footing trial size
const D_footing_depth = 6.0;                    // ft (footing depth = pedestal + footing = 4.5+1.5)
const Mftg = M_wind + D_footing_depth * V_wind; // kip-ft OTM at footing base
const SB_gross = SB_net + depth_ftg * gamma_soil; // ksf (gross allowable = 3.80)
const D_trial = 2.6 * Math.pow(Mftg / SB_gross, 1 / 3); // ft trial octagon diameter

// Use 21ft-8-3/4 in octagon
const D_oct = 21.73;                            // ft (face-to-face distance)
const A_oct = 391.1;                            // ft²

// Pedestal reinforcement embedment check
const psi_e = 1.0;
const psi_lambda = 1.0;
const db_bar = 0.625;                           // in (#5 bar)
const ldh = (0.02 * psi_e * psi_lambda * fy) / Math.sqrt(fc) * db_bar; // 11.9 in
const As_ratio = 0.22 / 0.31;
const T_embed = 3 + 2 * 0.75 + As_ratio * 0.7 * ldh;  // 10.4 in

// Footing weights
const A_ftg_net = A_oct - A_ped;               // net footing area (outside pedestal)
const W_ped_net = A_ped * (h_ped * gamma_conc - (depth_ftg - t_ftg) * gamma_soil);
const W_ftg_soil = A_oct * (t_ftg * gamma_conc + (depth_ftg - t_ftg) * gamma_soil);
const Ds = W_ped_net + W_ftg_soil;             // 313.9 kip (structure dead load)
const Pe = De + Ds;                            // 484.2 kip
const Po = Do + Ds;                            // 659.1 kip
const Pt = Dt + Ds;                            // 938.0 kip

// Soil bearing – Empty + Wind (Eq. 15 stability ratio)
const e_emp = Mftg / Pe;                        // eccentricity empty
const SR_emp = D_oct / (2 * e_emp);            // stability ratio
const eD_emp = e_emp / D_oct;                  // 0.206 > 0.122 → use Figure B
const L_emp_diag = 2.85;                       // from Figure B
const f_emp = L_emp_diag * Pe / A_oct;         // ksf

// Soil bearing – Operating + Wind
const e_op = Mftg / Po;
const eD_op = e_op / D_oct;                   // 0.152 > 0.122
const L_op_diag = 2.25;
const f_op = L_op_diag * Po / A_oct;          // ksf (controls)

// Soil bearing – Test + Partial Wind
const V_partial_frac = Math.pow(68 / 115, 2);
const Mftg_test = V_partial_frac * Mftg;
const e_test = Mftg_test / Pt;
const eD_test = e_test / D_oct;
const f_test = (Pt / A_oct) * (1 + 8.19 * eD_test); // Eq 10a

// Bottom reinforcement – Operating + Wind strength (load comb 3)
const Pu_op = 1.2 * Po;
const Mu_str_op = 1.6 * Mftg;
const e_str_op = Mu_str_op / Pu_op;
const eD_str_op = e_str_op / D_oct;           // 0.202 > 0.132 (flat)
const L_str_op = 2.70;
const K_str_op = 0.225;
const KD_str_op = K_str_op * D_oct;           // 4.89 ft
const SB_str_op = L_str_op * Pu_op / A_oct;   // 5.46 ksf
const side_equiv = Math.sqrt(A_ped);           // 16.12 ft
const proj = (D_oct - side_equiv) / 2;        // 2.81 ft
const KD_from_edge_op = KD_str_op;
const dist_from_far_edge_op = D_oct - KD_str_op; // 16.84 ft
const SB_face_op = SB_str_op * (dist_from_far_edge_op - proj) / dist_from_far_edge_op;
const SC_op = 1.2 * W_ftg_soil / A_oct;       // soil+concrete factored
const Mu_ftg_op = (SB_face_op - SC_op) * proj * proj / 2 +
  (SB_str_op - SB_face_op) * proj * proj / 3;

// Bottom reinforcement – Empty + Wind strength (load comb 4)
const Pu_emp_str = 0.9 * Pe;
const Mu_str_emp = 1.6 * Mftg;
const e_str_emp = Mu_str_emp / Pu_emp_str;
const eD_str_emp = e_str_emp / D_oct;          // 0.367 > 0.132
const L_str_emp = 7.63;
const K_str_emp = 0.660;
const KD_str_emp = K_str_emp * D_oct;          // 14.34 ft
const SB_str_emp = L_str_emp * Pu_emp_str / A_oct;  // 8.50 ksf
const dist_from_far_edge_emp = KD_str_emp;    // 14.34 ft (from zero-pressure edge)
// KD measured from zero-pressure end; bearing surface length = KD
// Face of equiv square from zero-pressure edge = KD - projection
const dist_face_from_zero_emp = KD_str_emp - proj;  // 11.53 ft  ← NOT the right calc in PDF
// PDF says SB at face of equiv square = 8.50 * (7.39-2.81)/7.39
// 7.39 ft = KD_str_emp - (D_oct - KD_str_emp) = 14.34 - (21.73-14.34) = 14.34-7.39 = nope
// Actually in PDF: KD=14.34 ft from the high-pressure side of the footing
// The length in compression = KD = 14.34 ft
// The zero pressure point is at D - KD from the high-pressure edge = 21.73-14.34 = 7.39 ft from high-pressure edge
// dist from zero-pressure end = 14.34 ft to the far edge
// SB at face of equiv square from the high-pressure side:
//   high edge to face = (D - side)/2 = proj = 2.81 ft from high-pressure edge
// Wait, the face of equiv square: the compression zone is measured from the toe (low pressure = far side)
// KD is measured from load side. Actually in Mathcad calcs:
// PDF: SB at face = 8.50 * (7.39 - 2.81) / 7.39 → 7.39 must be the "distance from bottom to face"
// 7.39 = KD_str_emp - (D_oct - KD_str_emp) = ??? 
// Hmm. Let me re-read the PDF:
// KD = 14.34 ft (this is the KD from Figure B / Table 2 for e/D=0.367 flat)
// The diagram shows KD = 14.34 ft from the high end of the pressure diagram to zero
// The zero-pressure line is at KD from the high-pressure toe
// High pressure toe is at the edge of the footing (left in diagram)
// So: from LEFT edge (high pressure), KD = 14.34 ft to zero pressure line
// From LEFT edge to right edge = 21.73 ft
// Right edge to face of equiv sq = proj = 2.81 ft (from right side since right = comp side for uplift case?)
// Wait, for uplift (empty+wind), the WIND pushes the load toward the toe
// The high pressure is at the windward toe
// Face of equiv square from the high pressure toe = ???  
// 
// Actually from the PDF diagram for empty + wind case:
// Numbers shown: 4.72 (above), 8.50 (tall bar at left), 5.27 (shorter), 3.23 (smallest), 0.55 (top)
// 7.39 ft and 14.34 ft labeled on x-axis
// So the total extent of compression diagram is 14.34 ft from high toe
// The face of equivalent square is at 7.39 ft from zero point = 14.34-7.39=6.95? No...
// The projection from edge = 2.81 ft (from far/right edge)
// The face is at 21.73 - 2.81 = 18.92 ft from near edge
// But compression only extends 14.34 ft...
// Hmm, actually for uplift case: high pressure is at windward toe (LEFT)
// But for uplift, we care about the LOW pressure side (RIGHT)
// Actually the footing moment is computed on the far side from where load is
// Let me just use the PDF numbers directly:
// SB at face of equiv sq = (8.50 ksf)(7.39 ft - 2.81 ft)/(7.39 ft) = 5.27 ksf
// Where does 7.39 come from? 7.39 = KD - (D-KD) = ??? 
// 14.34 ft - (21.73-14.34) = 14.34 - 7.39 = 6.95 ??? 
// Actually 7.39 = 21.73 - 14.34 = 7.39 ← YES! D - KD = 21.73 - 14.34 = 7.39 ft
// This is the distance from the ZERO PRESSURE POINT to the LOW PRESSURE edge (right side)
// Wait: if KD = 14.34 ft from the high-pressure end to zero, then
// from right edge (low side) to zero = KD = 14.34 ft... no
// Actually I think KD is from the high-pressure EDGE to the zero-pressure line
// So the compression zone has length KD = 14.34 ft from high edge
// From right edge (uplift side): D - KD = 7.39 ft to the zero-pressure line
// But the right side is where the pedestal is in uplift case
// NO - in uplift the moment tries to lift the windward side (LEFT), so
// the HIGH pressure is on the LEEWARD side (RIGHT, downwind)
// and uplift occurs on windward (LEFT)
// The zero-pressure is at D - KD from the RIGHT edge = 21.73 - 14.34 = 7.39 ft from right edge?
// But wait, 7.39 ft < KD = 14.34 ft? That would mean zero-pressure at 7.39 from right (low-P) end
// 
// In standard footing notation for uplift (empty+wind, large eccentricity):
// The resultant P_u is at e = 7.97 ft from center, so e from RIGHT edge = D/2 - e = 10.865-7.97 = 2.895 ft? No
// The high-pressure is on the side opposite the eccentricity
// With e = 7.97 ft on the windward (LEFT) side: load is shifted LEFT by 7.97 from center
// High pressure is on the RIGHT (downwind) side
// Load resultant is 7.97 ft from CENTER → 21.73/2 - 7.97 = 2.895 ft from RIGHT edge
// For triangular distribution, zero at distance 3×(distance from edge to resultant) = 3×2.895 = 8.685 ft from right edge
// That doesn't match KD either...
// 
// OK, I think KD in Table 2 / Figure B is the distance from the HIGH-pressure edge to zero
// where HIGH pressure is on the RIGHT (downwind) side
// KD = 14.34 ft from RIGHT edge
// The footing extends 21.73 ft total
// Left (windward) edge has 21.73-14.34 = 7.39 ft of zero/tension (no bearing)
// 
// For moment at face of equiv. square:
// The face is on the RIGHT (high pressure) side, 2.81 ft from RIGHT edge
// At 2.81 ft from right edge: SB = 8.50 * (14.34-2.81)/14.34 = 8.50 * 11.53/14.34 = 6.84 ksf → doesn't match 5.27
// 
// The PDF says: SB at face = 8.50*(7.39-2.81)/7.39 = 5.27 ksf
// 7.39 ft is referenced as the dimension on the diagram
// So 7.39 ft must be measured from SOMETHING and 2.81 ft from the same reference
// 
// I think the diagram labels 7.39 ft as the distance from zero-pressure line to the LOW-PRESSURE (windward-LEFT) edge
// NO: if KD=14.34 from HIGH edge, then from LOW edge to zero = 21.73-14.34 = 7.39 ft
// And projection 2.81 from LOW edge
// SB at 2.81 ft from LOW edge = 8.50 * (7.39-2.81)/7.39 ← YES! This matches the PDF formula!
// 
// So: The moment is calculated on the LOW-PRESSURE (windward) side of the footing
// The compression zone starts 7.39 ft from the low-pressure edge (zero pressure at 7.39 from low edge)
// At the face (2.81 ft from low edge): SB = 8.50*(7.39-2.81)/7.39 = 5.27 ksf ✓
// Soil+concrete on top = 0.55 ksf (uplift case → 0.9 factor)
// 
// Mu = (5.27-0.55)*(2.81)²/2 + (8.50-5.27)*(2.81)²/3 (trapezoidal + triangular)
// Wait that gives (4.72)(3.952) + (3.23)(2.635) = 18.65 + 8.51 = 27.16 kip-ft ✓ matches 27.14

// Let me just use PDF values directly
const comp_len_emp = D_oct - KD_str_emp;       // 7.39 ft (distance from low edge to zero pressure)
const SB_face_emp = SB_str_emp * (comp_len_emp - proj) / comp_len_emp; // 5.27 ksf
const SC_emp = 0.9 * W_ftg_soil / A_oct;       // 0.55 ksf
const Mu_ftg_emp = (SB_face_emp - SC_emp) * proj * proj / 2 +
  (SB_str_emp - SB_face_emp) * proj * proj / 3;  // 27.14 kip-ft (controls)

// Reinforcement design
const d_eff = 18 - 3 - 1.125;                  // 13.875 in
const F_factor = (12 * d_eff * d_eff) / 12000;  // 0.193
const Ku_rebar = Mu_ftg_emp / F_factor;         // 140.6
const au = 4.390;
const As_req = Mu_ftg_emp / (au * d_eff);       // in²/ft
const As_min = 0.0033 * 12 * d_eff;            // in²/ft (controls)
const As_43 = (4 / 3) * As_req;               // in²/ft

// Beam shear check (empty + wind)
const dist_shear = comp_len_emp - proj + d_eff / 12;  // dist from zero to d from face
const SB_at_d = SB_str_emp * dist_shear / comp_len_emp;
const Vu_shear_tot = (SB_at_d - SC_emp) * (proj - d_eff / 12) +
  (SB_str_emp - SB_at_d) * (proj - d_eff / 12) / 2;
const vu_beam = Vu_shear_tot * 1000 / (12 * d_eff);
const vc_beam_allow = 2 * 0.75 * Math.sqrt(fc);  // 94.9 psi

// Punching shear (test load)
const Pu_punch = 1.4 * Pt;
const pu_over_A = Pu_punch / A_oct;
const side_d = side_equiv + d_eff / 12;        // 16.12 + 1.16 = 17.28 ft
const SC_punch = (1.4 / 1.2) * SC_op;
const Vu_punch_val = (pu_over_A - SC_punch) * (A_oct - side_d * side_d);
const bo = 4 * side_d;                          // ft
const vu_punch = Vu_punch_val * 1000 / (d_eff * bo * 12);
const alpha_s = 40;
const vc_punch1 = 0.75 * (alpha_s * (d_eff / 12) / bo + 2) * Math.sqrt(fc);
const vc_punch2 = 0.75 * 4 * Math.sqrt(fc);

// Top reinforcement check
const Mu_top = (1.4 / 1.2) * SC_op * proj * proj / 2;
const Mu_top_in = Mu_top * 12000;              // in-lb/in (per inch width)
const ft_flex = 5 * 0.55 * Math.sqrt(fc);     // 173.9 psi
const t_eff = Math.sqrt(6 * Mu_top_in / ft_flex);  // in
const t_reqd = t_eff + 2;                     // in (cast against soil)

/* ─── component ─────────────────────────────────────────────────── */

export default function FoundationCalc() {
  return (
    <div className="mc-page bg-gray-100 min-h-screen py-8">
      {/* Print button */}
      <div className="no-print flex justify-center mb-4">
        <button
          onClick={() => window.print()}
          className="bg-blue-700 text-white px-6 py-2 text-sm font-bold hover:bg-blue-800 rounded"
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      <div className="mc-worksheet shadow-lg">

        {/* ── Title Block ─────────────────────────────── */}
        <div className="mc-title-block">
          <div className="mc-title">Vertical Vessel Foundation Design</div>
          <div style={{ fontSize: "11pt", color: "#1a3a6e", fontWeight: "bold", marginBottom: 6 }}>
            PIP STE03350 — Example Calculation
          </div>
          <table className="mc-meta-table">
            <tbody>
              <tr><td>Reference:</td><td>PIP STE03350, December 2008</td></tr>
              <tr><td>Code:</td><td>ACI 318-05, ASCE/SEI 7-05, PIP STC01015</td></tr>
              <tr><td>Date:</td><td>May 2, 2026</td></tr>
              <tr><td>Subject:</td><td>Octagonal footing for skirt-supported vertical vessel</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── Vessel Sketch ─────────────────────────────── */}
        <SectionHeader>VESSEL GEOMETRY &amp; DESIGN DATA</SectionHeader>

        <div style={{ display: "flex", gap: 32, marginBottom: 12, flexWrap: "wrap" }}>
          {/* Left – sketch */}
          <div style={{ flex: "0 0 220px" }}>
            <svg viewBox="0 0 220 370" style={{ width: 220, height: 370, fontFamily: "Arial", fontSize: 9 }}>
              {/* Grade line */}
              <line x1="10" y1="280" x2="210" y2="280" stroke="#888" strokeDasharray="4,3" strokeWidth={1} />
              <text x="155" y="292" fill="#555" fontSize="8">Grade El. 100 ft</text>

              {/* Footing */}
              <rect x="30" y="295" width="160" height="22" fill="#d9e8d9" stroke="#4a7a4a" strokeWidth={1.2} />
              {/* Pedestal */}
              <rect x="65" y="235" width="90" height="62" fill="#cce0cc" stroke="#4a7a4a" strokeWidth={1.2} />
              {/* Vessel shell */}
              <rect x="82" y="55" width="56" height="182" fill="none" stroke="#333" strokeWidth={1.5} />
              {/* Top cap */}
              <ellipse cx="110" cy="55" rx="28" ry="8" fill="none" stroke="#333" strokeWidth={1.2} />
              {/* Skirt (slightly wider) */}
              <rect x="76" y="190" width="68" height="47" fill="none" stroke="#555" strokeWidth={1} strokeDasharray="3,2" />

              {/* Platform #1 */}
              <rect x="55" y="217" width="110" height="4" fill="#aaa" />
              <text x="168" y="222" fill="#444" fontSize="8">Platf. #1 (90°)</text>

              {/* Platform #2 */}
              <rect x="55" y="160" width="110" height="4" fill="#aaa" />
              <text x="168" y="165" fill="#444" fontSize="8">Platf. #2 (60°)</text>

              {/* Platform #3 */}
              <rect x="55" y="100" width="110" height="4" fill="#aaa" />
              <text x="168" y="105" fill="#444" fontSize="8">Platf. #3 (12 ft dia)</text>

              {/* Insulation */}
              <rect x="79" y="57" width="62" height="180" fill="none" stroke="#b09060" strokeWidth={0.8} strokeDasharray="2,2" />

              {/* Wind arrow */}
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#1a5fa8" />
                </marker>
              </defs>
              <line x1="12" y1="140" x2="76" y2="140" stroke="#1a5fa8" strokeWidth={1.5} markerEnd="url(#arrow)" />
              <text x="5" y="136" fill="#1a5fa8" fontSize="8" fontWeight="bold">W</text>

              {/* Dimensions */}
              {/* Total height 67 ft */}
              <line x1="20" y1="55" x2="20" y2="237" stroke="#666" strokeWidth={0.7} markerEnd="url(#arrow)" />
              <line x1="20" y1="237" x2="20" y2="55" stroke="#666" strokeWidth={0.7} />
              <text x="3" y="150" fill="#444" fontSize="8" transform="rotate(-90,3,150)">67 ft</text>

              {/* 49 ft label */}
              <text x="168" y="80" fill="#444" fontSize="8">49 ft</text>
              <line x1="164" y1="55" x2="164" y2="160" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />

              {/* 23 ft label */}
              <text x="168" y="195" fill="#444" fontSize="8">23 ft</text>
              <line x1="164" y1="160" x2="164" y2="235" stroke="#888" strokeWidth={0.5} strokeDasharray="2,2" />

              {/* Depth labels */}
              <text x="15" y="273" fill="#555" fontSize="8">4.5 ft</text>
              <text x="15" y="308" fill="#555" fontSize="8">1.5 ft</text>

              {/* Pedestal diameter */}
              <line x1="65" y1="245" x2="155" y2="245" stroke="#e06020" strokeWidth={0.8} />
              <text x="85" y="258" fill="#e06020" fontSize="7.5">17 ft-8½ in</text>

              {/* Footing diameter */}
              <line x1="30" y1="310" x2="190" y2="310" stroke="#1a5fa8" strokeWidth={0.8} />
              <text x="65" y="325" fill="#1a5fa8" fontSize="7.5">21 ft-8¾ in</text>

              {/* 9/16 thick shell label */}
              <text x="132" y="130" fill="#555" fontSize="7">⁹⁄₁₆ in</text>

              {/* Pipe label */}
              <text x="5" y="55" fill="#333" fontSize="7">4 in dia pipe</text>
              <text x="5" y="63" fill="#333" fontSize="7">1½ in insul.</text>

              {/* Diameter labels */}
              <text x="60" y="72" fill="#333" fontSize="7.5">14 ft dia.</text>
              <text x="62" y="82" fill="#555" fontSize="7">(14.42 ft)</text>
            </svg>
          </div>

          {/* Right – design data table */}
          <div style={{ flex: "1 1 300px" }}>
            <SubHeader>Wind Load Data (ASCE/SEI 7-05, V = 115 mph)</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td><Var>V</Var> = base shear</td><td><strong>44.75 kip</strong></td></tr>
                <tr><td><Var>M</Var> = OTM at top of grout</td><td><strong>1,902 kip·ft</strong></td></tr>
              </tbody>
            </table>

            <SubHeader>Vessel Dead Loads</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Empty weight, <Var>D<Sub>e</Sub></Var></td><td><strong>170.3 kip</strong></td></tr>
                <tr><td>Operating weight, <Var>D<Sub>o</Sub></Var></td><td><strong>345.2 kip</strong></td></tr>
                <tr><td>Test weight, <Var>D<Sub>t</Sub></Var></td><td><strong>624.1 kip</strong></td></tr>
              </tbody>
            </table>

            <SubHeader>Soil &amp; Concrete</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Net allowable bearing (transient), <Var>SB<Sub>net</Sub></Var></td><td><strong>3.25 ksf</strong></td></tr>
                <tr><td>Foundation depth</td><td><strong>5 ft</strong></td></tr>
                <tr><td>Soil unit weight, <Var>γ<Sub>s</Sub></Var></td><td><strong>110 pcf = 0.11 kcf</strong></td></tr>
                <tr><td>Concrete strength, <Var>f′<Sub>c</Sub></Var></td><td><strong>4,000 psi</strong></td></tr>
                <tr><td>Reinforcement yield, <Var>f<Sub>y</Sub></Var></td><td><strong>60,000 psi</strong></td></tr>
              </tbody>
            </table>

            <SubHeader>Anchor Bolt Data</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Count, <Var>N<Sub>b</Sub></Var></td><td><strong>24</strong></td></tr>
                <tr><td>Diameter, <Var>BD</Var></td><td><strong>1½ in — ASTM F1554, Gr. 36</strong></td></tr>
                <tr><td>Sleeve diameter, <Var>SD</Var></td><td><strong>4 in × 15 in long</strong></td></tr>
                <tr><td>Projection, <Var>P</Var></td><td><strong>1 ft – 2 in</strong></td></tr>
                <tr><td>Bolt circle diameter, <Var>BC</Var></td><td><strong>14 ft – 10½ in = 178.5 in</strong></td></tr>
                <tr><td>Type</td><td><strong>BSL (nonpretensioned)</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pedestal Design ─────────────────────────── */}
        <SectionHeader>PEDESTAL DESIGN</SectionHeader>
        <SubHeader>Minimum Pedestal Size (Equations 1a – 1f, PIP STE03350)</SubHeader>

        <Text>The pedestal face-to-face dimension must satisfy the largest of the following:</Text>

        <Row indent={1}>
          <Var>BC</Var><Assign /><span className="mc-expr">178.5</span><Unit>in</Unit>
          <span style={{ marginLeft: 16, color: "#555", fontSize: "9pt" }}>
            (bolt circle diameter)
          </span>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>ped,1a</Sub></Var><Assign />
          <span className="mc-expr">BC + 9 in = {BC_in} + 9</span>
          <Eq /><Res>{eq1a.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1a</Ref>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>ped,1b</Sub></Var><Assign />
          <span className="mc-expr">BC + 8·BD = {BC_in} + 8({BD})</span>
          <Eq /><Res>{eq1b.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1b — Grade 36 bolts</Ref>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>ped,1d</Sub></Var><Assign />
          <span className="mc-expr">BC + SD + 9 − BD = {BC_in} + {SD} + 9 − {BD}</span>
          <Eq /><Res>{eq1d.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>Eq. 1d</Ref>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>ped,1e</Sub></Var><Assign />
          <span className="mc-expr">BC + SD + 7·BD = {BC_in} + {SD} + 7({BD})</span>
          <Eq /><Res>{eq1e.toFixed(1)}</Res><Unit>in</Unit>
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
          <Ref>Eq. 1e</Ref>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>ped,min</Sub></Var><Assign />
          <span className="mc-expr">max(187.5, 190.5, 190.0, 193.0)</span>
          <Eq /><Res>{ped_in_min.toFixed(1)}</Res><Unit>in</Unit>
          <Eq /><Res>{ped_ft_min.toFixed(3)}</Res><Unit>ft</Unit>
        </Row>

        <BulletResult>Use 16 ft – 1⅛ in octagon (initial trial). Increased to 17 ft – 8½ in after anchor bolt area check.</BulletResult>

        <Note>
          The initial 16 ft – 1⅛ in pedestal did not provide sufficient projected concrete failure area
          (A<Sub>N</Sub>) for N<Sub>u</Sub>. The pedestal "diameter" was increased to 17 ft – 8½ in (17.704 ft).
          See "Anchor Bolt Check" below.
        </Note>

        <Divider />

        <SubHeader>Pedestal Weight and Moments</SubHeader>

        <Row indent={1}>
          <Var>D<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">17.704</span><Unit>ft</Unit>
          <span className="mc-unit">(face-to-face, final)</span>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">259.7</span><Unit>ft²</Unit>
          <Ref>Table 1, PIP STE03350</Ref>
        </Row>

        <Row indent={1}>
          <Var>h<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">4.5</span><Unit>ft</Unit>
          <span className="mc-unit">(pedestal height above footing)</span>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>p</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>ped</Sub> × h<Sub>ped</Sub> × γ<Sub>c</Sub> = {A_ped} × {h_ped} × {gamma_conc}</span>
          <Eq /><Res>{Dp.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">M + V·h<Sub>ped</Sub> = {M_wind} + {V_wind}({h_ped})</span>
          <Eq /><Res>{Mped.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <span className="mc-unit">(OTM at pedestal base)</span>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>u,ped</Sub></Var><Assign />
          <span className="mc-expr">1.6 × M<Sub>ped</Sub> = 1.6 × {Mped.toFixed(0)}</span>
          <Eq /><Res>{Muped.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <Ref>Load Comb. 4, Table 4, PIP STC01015</Ref>
        </Row>

        <Divider />

        <SubHeader>Pedestal Dowel Design</SubHeader>

        <Row indent={1}>
          <Var>N<Sub>d</Sub></Var><Assign />
          <span className="mc-expr">40</span>
          <span className="mc-unit">(assumed number of dowels, multiple of 8)</span>
        </Row>

        <Row indent={1}>
          <Var>DC</Var><Assign />
          <span className="mc-expr">D<Sub>ped</Sub> − 0.5 ft = {D_ped} − 0.5</span>
          <Eq /><Res>{DC_exact.toFixed(2)}</Res><Unit>ft</Unit>
          <span className="mc-unit">(dowel circle ≈ pedestal dia. minus 6 in)</span>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>e</Sub> + D<Sub>p</Sub></Var><Assign />
          <span className="mc-expr">{De} + {Dp.toFixed(1)}</span>
          <Eq /><Res>{(De + Dp).toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>F<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">
              4·M<Sub>u,ped</Sub> / (N<Sub>d</Sub>·DC) − 0.9·(D<Sub>e</Sub>+D<Sub>p</Sub>)/N<Sub>d</Sub>
            </span>
            <Ref>Eq. 2</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56, fontFamily: "'Times New Roman', serif" }}>
              = 4({Muped.toFixed(0)}) / ({Nd}·{DC_exact}) − 0.9({(De + Dp).toFixed(1)})/{Nd}
            </span>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {(4 * Muped / (Nd * DC_exact)).toFixed(2)} − {(0.9 * (De + Dp) / Nd).toFixed(2)}
            </span>
            <Eq /><Res>{Fu.toFixed(2)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>A<Sub>s,req</Sub></Var><Assign />
            <span className="mc-expr">F<Sub>u</Sub> / (φ·f<Sub>y</Sub>) = {Fu.toFixed(2)} / (0.9 × 60)</span>
            <Eq /><Res>{As_dowel_req.toFixed(2)}</Res><Unit>in²</Unit>
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
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6 × M<Sub>wind</Sub> = 1.6 × {M_wind}</span>
          <Eq /><Res>{Mu_ab.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <Ref>Load Comb. 4, Table 4, PIP STC01015</Ref>
        </Row>

        <Row indent={1}>
          <Var>BC<Sub>ft</Sub></Var><Assign />
          <span className="mc-expr">178.5 in / 12</span>
          <Eq /><Res>{BC_ft.toFixed(3)}</Res><Unit>ft</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>N<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">4·M<Sub>u</Sub> / (N<Sub>b</Sub>·BC) − 0.9·D<Sub>e</Sub>/N<Sub>b</Sub></span>
            <Ref>Eq. 4</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = 4({Mu_ab.toFixed(0)}) / ({Nb} × {BC_ft.toFixed(3)}) − 0.9({De})/{Nb}
            </span>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {(4 * Mu_ab / (Nb * BC_ft)).toFixed(2)} − {(0.9 * De / Nb).toFixed(2)}
            </span>
            <Eq /><Res>{Nu.toFixed(1)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <Divider />
        <SubHeader>Maximum Shear on Anchor Bolt — Friction Check</SubHeader>

        <Row indent={1}>
          <Var>V<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6 × {V_wind}</span>
          <Eq /><Res>{Vu_ab.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">LA = (2/3)·BC = (2/3)({BC_ft.toFixed(3)})</span>
          <Eq /><Res>{LA.toFixed(2)}</Res><Unit>ft</Unit>
          <Ref>Conservative lever arm, Eq. 5</Ref>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>P<Sub>u</Sub></Var><Assign />
            <span className="mc-expr">M<Sub>u</Sub>/LA + 0.9·D<Sub>e</Sub>/2</span>
            <Ref>Eq. 5</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 56 }}>
              = {Mu_ab.toFixed(0)}/{LA.toFixed(2)} + 0.9({De})/2
              &nbsp;= {(Mu_ab / LA).toFixed(0)} + {(0.9 * De / 2).toFixed(0)}
            </span>
            <Eq /><Res>{Pu_ab.toFixed(0)}</Res><Unit>kip</Unit>
          </Row>
        </div>

        <Row indent={1}>
          <Var>V<Sub>f</Sub></Var><Assign />
          <span className="mc-expr">μ·P<Sub>u</Sub> = {mu_fric}({Pu_ab.toFixed(0)})</span>
          <Eq /><Res>{Vf.toFixed(0)}</Res><Unit>kip</Unit>
          <Ref>Eq. 6, μ = 0.55 (grout)</Ref>
        </Row>

        <Row indent={1}>
          <Var>φV<Sub>f</Sub></Var><Assign />
          <span className="mc-expr">0.75 × {Vf.toFixed(0)}</span>
          <Eq /><Res>{phi_Vf.toFixed(0)}</Res><Unit>kip</Unit>
          <span style={{ marginLeft: 8, fontWeight: "bold", color: "#555" }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 6 }}>V<Sub>u</Sub> = {Vu_ab.toFixed(1)} kip</span>
          <OK />
          <Ref>Eq. 7</Ref>
        </Row>

        <BulletResult>Anchor bolts are NOT required to resist shear — friction is adequate.</BulletResult>

        <Divider />
        <SubHeader>Projected Concrete Failure Area (A<Sub>N</Sub>)</SubHeader>

        <Note>
          Several iterations confirmed that D = 16 ft – 1⅛ in provides insufficient A<sub>N</sub>.
          The pedestal diameter is increased to 17 ft – 8½ in.
        </Note>

        <Row indent={1}>
          <Var>D<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">17.704</span><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>h<Sub>ef</Sub></Var><Assign />
          <span className="mc-expr">18 in</span>
          <Eq /><Res>{hef.toFixed(2)}</Res><Unit>ft</Unit>
          <Ref>Table 1, PIP STE05121</Ref>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">1.5·h<Sub>ef</Sub> = 1.5({hef})</span>
          <Eq /><Res>{(1.5 * hef).toFixed(2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>D<Sub>EQ</Sub></Var><Assign />
          <span className="mc-expr">1.027 × D<Sub>ped</Sub> = 1.027 × {D_ped2}</span>
          <Eq /><Res>{DEQ.toFixed(2)}</Res><Unit>ft</Unit>
          <span className="mc-unit">(equivalent circle diameter)</span>
        </Row>

        {/* AN diagram */}
        <div style={{ marginLeft: 24, marginTop: 8 }}>
          <div style={{ fontSize: "8.5pt", color: "#444", marginBottom: 4 }}>
            Graphical determination of A<Sub>N</Sub> (single bolt at 54 in spacing on bolt circle):
          </div>
          <svg viewBox="0 0 260 160" style={{ width: 260, height: 160, border: "1px solid #c0d0e0", background: "#fafcff" }}>
            {/* Equivalent circle */}
            <circle cx="130" cy="80" r="70" fill="none" stroke="#1a5fa8" strokeWidth={1.5} strokeDasharray="4,3" />
            <text x="122" y="18" fill="#1a5fa8" fontSize="8">EQUIVALENT</text>
            <text x="126" y="27" fill="#1a5fa8" fontSize="8">CIRCLE</text>

            {/* Bolt (circle) */}
            <circle cx="130" cy="80" r="3" fill="#333" />
            <text x="102" y="88" fill="#333" fontSize="7.5">CENTER POINT OF</text>
            <text x="102" y="96" fill="#333" fontSize="7.5">EQUIV. CIRCLE</text>

            {/* A_N patch (clipped square) */}
            <rect x="103" y="53" width="54" height="54" fill="#d0e8ff" stroke="#1a5fa8" strokeWidth={1} opacity={0.7} />
            <text x="108" y="82" fill="#1a3a8f" fontSize="7.5" fontWeight="bold">A</text>
            <text x="115" y="82" fill="#1a3a8f" fontSize="6.5">N</text>
            <text x="118" y="82" fill="#1a3a8f" fontSize="7.5"> = 1042 in²</text>

            {/* dim arrows */}
            <line x1="75" y1="53" x2="75" y2="107" stroke="#e06020" strokeWidth={0.8} />
            <text x="54" y="83" fill="#e06020" fontSize="7.5">54 in</text>
            <line x1="103" y1="130" x2="157" y2="130" stroke="#e06020" strokeWidth={0.8} />
            <text x="112" y="143" fill="#e06020" fontSize="7.5">54 in</text>
          </svg>
        </div>

        <Row indent={1}>
          <Var>A<Sub>N</Sub></Var><Eq />
          <Res>1,042</Res><Unit>in²</Unit>
          <span className="mc-unit">(graphical — from CAD layout)</span>
        </Row>

        <Row indent={1}>
          <Var>φN<Sub>n</Sub></Var><Eq />
          <Res>33.2</Res><Unit>kip</Unit>
          <span style={{ fontWeight: "bold", marginLeft: 6 }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>N<Sub>u</Sub> = {Nu.toFixed(1)} kip</span>
          <OK />
          <Ref>PIP Anchor Bolt Design Spreadsheet / ACI 318-05 App. D</Ref>
        </Row>

        <SubHeader>Bolt Length</SubHeader>
        <Row indent={1}>
          <span className="mc-expr">L<Sub>min</Sub> = Projection + h<Sub>ef</Sub> + P₁ = (1 ft – 2 in) + (1 ft – 6 in) + (2 in)</span>
          <Eq /><Res>2 ft – 10 in</Res>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">ASL = 2 ft – 8 in &lt; L<Sub>min</Sub> → Use BSL bolts</span>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">BSL length = 4 ft – 5 in</span>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">BSL embedment P₁ = (4 ft – 5 in) − (1 ft – 2 in)</span>
          <Eq /><Res>3 ft – 3 in</Res>
          <span style={{ marginLeft: 8 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>pedestal depth (4.5 ft)</span>
          <OK />
        </Row>

        <BulletResult>Use 24 – 1½ in dia. BSL anchor bolts, ASTM F1554, Grade 36</BulletResult>
        <BulletResult>Final pedestal size: 17 ft – 8½ in octagon (face-to-face)</BulletResult>

        {/* ── Footing Design ─────────────────────────────── */}
        <SectionHeader>FOOTING DESIGN</SectionHeader>
        <SubHeader>Trial Octagon Size (Equation 8)</SubHeader>

        <Row indent={1}>
          <Var>M<Sub>ftg</Sub></Var><Assign />
          <span className="mc-expr">M + V·(h<Sub>ped</Sub>+t<Sub>ftg</Sub>) = {M_wind} + {V_wind}({D_footing_depth})</span>
          <Eq /><Res>{Mftg.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <span className="mc-unit">(OTM at footing base)</span>
        </Row>

        <Row indent={1}>
          <Var>SB<Sub>gross</Sub></Var><Assign />
          <span className="mc-expr">SB<Sub>net</Sub> + depth×γ<Sub>s</Sub> = {SB_net} + {depth_ftg}({gamma_soil})</span>
          <Eq /><Res>{SB_gross.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>D<Sub>trial</Sub></Var><Assign />
            <span className="mc-expr">2.6·(M<Sub>ftg</Sub>/SB<Sub>gross</Sub>)^(⅓)</span>
            <Ref>Eq. 8</Ref>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = 2.6·({Mftg.toFixed(0)}/{SB_gross.toFixed(2)})^(1/3)
            </span>
            <Eq /><Res>{D_trial.toFixed(2)}</Res><Unit>ft</Unit>
          </Row>
        </div>

        <BulletResult>Try 21 ft – 8¾ in octagon. A = 391.1 ft² (Table 1, PIP STE03350)</BulletResult>

        <Divider />
        <SubHeader>Check Footing Thickness for Pedestal Dowel Embedment</SubHeader>

        <Row indent={1}>
          <span className="mc-expr">
            l<Sub>dh</Sub> = [0.02·Ψ<Sub>e</Sub>·λ·f<Sub>y</Sub>/√f′<Sub>c</Sub>]·d<Sub>b</Sub>
            = [0.02(1.0)(1.0)(60,000)/√4,000]·0.625
          </span>
          <Eq /><Res>{ldh.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>ACI 318-05 §12.5.2</Ref>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">A<Sub>s,req</Sub>/A<Sub>s,prov</Sub> = 0.22/0.31</span>
          <Eq /><Res>{As_ratio.toFixed(2)}</Res>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">
            T<Sub>req</Sub> = 3 in + 2(0.75 in) + (0.71)(0.7)(11.9 in)
          </span>
          <Eq /><Res>{T_embed.toFixed(1)}</Res><Unit>in</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">T<Sub>min</Sub> = 12 in (Section 4.7.1)</span>
        </Row>

        <BulletResult>Try footing thickness = 18 in (1.5 ft)</BulletResult>

        <Divider />
        <SubHeader>Footing Weights</SubHeader>

        <Row indent={1}>
          <Var>W<Sub>ped,net</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>ped</Sub>·[h<Sub>ped</Sub>·γ<Sub>c</Sub> − (depth−t<Sub>ftg</Sub>)·γ<Sub>s</Sub>]</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = {A_ped}·[{h_ped}({gamma_conc}) − {depth_ftg - t_ftg}({gamma_soil})]
          </span>
          <Eq /><Res>75.3</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>W<Sub>ftg+soil</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>oct</Sub>·[t<Sub>ftg</Sub>·γ<Sub>c</Sub> + (depth−t<Sub>ftg</Sub>)·γ<Sub>s</Sub>]</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = {A_oct}·[{t_ftg}({gamma_conc}) + {depth_ftg - t_ftg}({gamma_soil})]
          </span>
          <Eq /><Res>238.6</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>s</Sub></Var><Assign />
          <span className="mc-expr">75.3 + 238.6</span>
          <Eq /><Res>{Ds.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>e</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>e</Sub> + D<Sub>s</Sub> = {De} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Pe.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>o</Sub> + D<Sub>s</Sub> = {Do} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Po.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>t</Sub> + D<Sub>s</Sub> = {Dt} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Pt.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        {/* ── Soil Bearing & Stability ─────────────────── */}
        <SectionHeader>SOIL BEARING AND STABILITY CHECK</SectionHeader>
        <SubHeader>Case 1 — Empty + Wind (Load Combination 3, Table 3, PIP STC01015)</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>e</Sub></Var>
          <Eq /><Res>{Pe.toFixed(1)}</Res><Unit>kip</Unit>
          <span style={{ marginLeft: 16 }}>
            <Var>M<Sub>ftg</Sub></Var><Eq /><Res>{Mftg.toFixed(0)}</Res><Unit>kip·ft</Unit>
          </span>
        </Row>

        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg</Sub> / P<Sub>e</Sub> = {Mftg.toFixed(0)} / {Pe.toFixed(1)}</span>
          <Eq /><Res>{e_emp.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">Stability Ratio = b/(2e) = {D_oct}/(2×{e_emp.toFixed(2)})</span>
          <Eq /><Res>{SR_emp.toFixed(2)}</Res>
          <span style={{ marginLeft: 6 }}>{">"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>1.5</span>
          <OK />
          <Ref>Eq. 15</Ref>
        </Row>

        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_emp.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_emp.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → A<Sub>N</Sub> not fully in compression → use Figure B</span>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">L<Sub>diag</Sub> = {L_emp_diag}</span>
          <Ref>(Figure B, PIP STE03350)</Ref>
        </Row>

        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P/A = {L_emp_diag}({Pe.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{f_emp.toFixed(2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>SB<Sub>gross</Sub> = {SB_gross.toFixed(2)} ksf</span>
          <OK />
          <Ref>Eq. 11</Ref>
        </Row>

        <Divider />
        <SubHeader>Case 2 — Operating + Wind (Load Combination 2, Table 3, PIP STC01015) ← Controls</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>o</Sub></Var>
          <Eq /><Res>{Po.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">{Mftg.toFixed(0)} / {Po.toFixed(1)}</span>
          <Eq /><Res>{e_op.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_op.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_op.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → use Figure B</span>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">L<Sub>diag</Sub> = {L_op_diag}</span>
          <Ref>(Figure B)</Ref>
        </Row>

        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">{L_op_diag}({Po.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{f_op.toFixed(2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"} {SB_gross.toFixed(2)} ksf</span>
          <OK />
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controlling case</span>
        </Row>

        <Divider />
        <SubHeader>Case 3 — Test + Partial Wind (Load Combination 6, Table 3, PIP STC01015)</SubHeader>

        <Row indent={1}>
          <Var>P</Var><Eq /><Var>P<Sub>t</Sub></Var><Eq /><Res>{Pt.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <span className="mc-expr">Partial wind velocity = 68 mph</span>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>ftg,test</Sub></Var><Assign />
          <span className="mc-expr">(68/115)² × {Mftg.toFixed(0)} = {V_partial_frac.toFixed(4)} × {Mftg.toFixed(0)}</span>
          <Eq /><Res>{Mftg_test.toFixed(1)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">{Mftg_test.toFixed(1)} / {Pt.toFixed(1)}</span>
          <Eq /><Res>{e_test.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_test.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_test.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{"<"} 0.122 → full area in compression → Eq. 10a</span>
        </Row>
        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">(P/A)[1 + 8.19·(e/D)] = ({Pt.toFixed(1)}/{A_oct})[1 + 8.19({eD_test.toFixed(3)})]</span>
          <Eq /><Res>{f_test.toFixed(2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"} {SB_gross.toFixed(2)} ksf</span>
          <OK />
          <Ref>Eq. 10a</Ref>
        </Row>

        <BulletResult>Use 21 ft – 8¾ in octagon footing</BulletResult>

        {/* ── Bottom Reinforcement ─────────────────────── */}
        <SectionHeader>BOTTOM REINFORCEMENT DESIGN</SectionHeader>
        <SubHeader>Case A — Operating + Wind (Load Comb. 3: 1.2(D<Sub>s</Sub>+D<Sub>o</Sub>) + 1.6W)</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.2·P<Sub>o</Sub> = 1.2({Po.toFixed(1)})</span>
          <Eq /><Res>{Pu_op.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6·M<Sub>ftg</Sub> = 1.6({Mftg.toFixed(0)})</span>
          <Eq /><Res>{Mu_str_op.toFixed(0)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">{Mu_str_op.toFixed(0)} / {Pu_op.toFixed(1)}</span>
          <Eq /><Res>{e_str_op.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_str_op.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_str_op.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2 / Figure B</span>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">L = {L_str_op} (flat)</span>
          <span style={{ marginLeft: 16 }}><span className="mc-expr">K = {K_str_op} (flat)</span></span>
          <Ref>(Figure B)</Ref>
        </Row>

        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">{K_str_op} × {D_oct}</span>
          <Eq /><Res>{KD_str_op.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A = {L_str_op}({Pu_op.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{SB_str_op.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">Equivalent square: side² = A<Sub>ped</Sub> = {A_ped} ft²</span>
          <span style={{ marginLeft: 8 }}>→ side = </span>
          <Res>{side_equiv.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>proj</Var><Assign />
          <span className="mc-expr">(D<Sub>oct</Sub> − side)/2 = ({D_oct} − {side_equiv.toFixed(2)})/2</span>
          <Eq /><Res>{proj.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        {/* Diagram – operating+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            {/* Footing outline */}
            <rect x="20" y="30" width="320" height="50" fill="#e8f4e8" stroke="#4a7a4a" strokeWidth={1} />
            {/* Pedestal equivalent square */}
            <rect x="88" y="30" width="184" height="50" fill="#c8e8c8" stroke="#2a6a2a" strokeWidth={1.2} />
            {/* Pressure diagram */}
            {/* compression zone from left (high P) to KD */}
            {/* KD = 4.89 ft out of D=21.73 ft total → fraction = 4.89/21.73 = 0.225  ...wait
                Actually for op+wind, KD=4.89 from the HIGH edge
                But zero pressure at KD from high? → compression zone is small on high side
                Actually the whole footing IS in compression (e/D=0.202 which is between 0.122 diagonal and 0.132 flat thresholds)
                Wait: e/D=0.202 > 0.132 (flat) → NOT all in compression (by flat criterion)
                So there IS a zero-pressure zone.
                The L value (2.70) and K value (0.225) come from Figure B / Table 2.
                KD = 0.225 × 21.73 = 4.89 ft (this is the distance from zero-pressure to high-pressure edge)
                The compression zone = KD = 4.89 ft (small zone on the leeward/high side)
                For moment calc: the face of equiv square is proj=2.81 ft from the high-pressure edge (inside compression zone)
                dist from HIGH edge to zero = KD = 4.89 ft → wait KD is usually from high edge to zero? Let me verify.
                PDF: KD=4.89 ft, and the diagram shows 16.84 ft distance that the face is "16.84 ft from zero"
                Actually the diagram in PDF shows for op+wind case:
                Numbers: 0.73, 4.55, 3.82, 5.46 → pressures
                "2.81 ft" (projection) and "16.84 ft" labeled
                16.84 ft = D - KD = 21.73 - 4.89 = 16.84 ft ← this is the distance from the HIGH-pressure edge to the zero-pressure line? No...
                Hmm, 21.73 - 4.89 = 16.84 ft. So KD=4.89 from HIGH edge, and 16.84 ft from HIGH edge to zero (= D - KD + ...) ← that's only 16.84 if zero is 16.84 from left and KD is 4.89 from left... that adds to 21.73, but they overlap...
                OK I think: from the HIGH pressure (leeward) edge:
                - pressure zone extends from 0 to KD = 4.89 ft (compression on high side, 4.89 ft wide)
                - SB face = 5.46*(16.84-2.81)/16.84 = 5.46*14.03/16.84 = 4.55 ← matches!
                And 16.84 = D - KD = 21.73 - 4.89 = 16.84 ← YES, 16.84 is the distance from HIGH edge to zero pressure (the entire compression zone = 16.84 ft from high edge to zero pressure)
                Wait that doesn't work... if compression zone is 16.84 ft, then for moment at face (2.81 from HIGH edge):
                SB at face = 5.46*(16.84-2.81)/16.84 = 5.46*13.03/16.84 = doesn't give 4.55 easily...
                Actually: SB at face = SB_max * (16.84-2.81)/16.84 = 5.46*(14.03/16.84) = 4.55 ✓
                So yes: KD = compression zone measured from HIGH edge = D - 0.225*D for this case?
                Actually: K=0.225, KD = K*D = 0.225*21.73 = 4.89 ft. But this gives a 4.89 ft COMPRESSION zone on the high side?
                But 16.84 = D - KD = 21.73 - 4.89...
                I think there is a convention issue. Let me look at the PDF diagram:
                "16.84 ft" is labeled as horizontal distance in bottom diagram for op+wind
                and KD = 4.89 ft from the ZERO PRESSURE SIDE (leeward/low-pressure)
                So: from LOW-PRESSURE side (windward): KD = 4.89 ft to zero-pressure line
                compression zone from zero to high side = D - KD = 21.73 - 4.89 = 16.84 ft
                SB at face (2.81 from HIGH side = windward... no this doesn't make sense either)
                
                I think:
                HIGH pressure is on the DOWNWIND/leeward side (right in PDF diagram)
                LOW pressure / uplift is on the UPWIND/windward side (left)
                KD = distance from HIGH end to zero = D*K for LARGE eccentricity
                Wait but for op+wind, eccentricity is 4.39 ft shifted toward the wind side
                So high pressure is on the leeward (downwind) side: HIGH = RIGHT
                KD from RIGHT = 4.89 ft? That means only 4.89 ft of the 21.73 ft is in compression on the RIGHT side
                from left edge (windward): distance to zero = 21.73-4.89=16.84 ft from left
                face of equiv square from right edge: proj=2.81 ft from right
                SB at face (from right): = 5.46*(4.89-2.81)/4.89 = 5.46*2.08/4.89 = 2.32 ksf ← doesn't match
                
                Hmm. Let me try: KD from HIGH (leeward/right) side means zero pressure is at KD from right
                but if KD=4.89, zero is at 4.89 from right = 21.73-4.89=16.84 from left
                For moment at left face (windward side of pedestal, proj=2.81 from left edge):
                SB at 2.81 from left = ??? 
                The pressure diagram is triangular: zero at 16.84 from left (= 4.89 from right), max at right end
                SB at distance x from high (right) edge: SB(x) = 5.46*(1 - x/4.89) ...wait that gives 0 at 4.89 from right
                At 2.81 from right: SB = 5.46*(4.89-2.81)/4.89 = 5.46*(2.08/4.89) = 2.32 ← doesn't match 4.55
                
                OK I think I've been overthinking this. Let me just look at what works:
                SB at face = 5.46*(16.84-2.81)/16.84 = 5.46*14.03/16.84 = 4.55 ✓ 
                This means: SB at face = SB_max * (compression_length - proj) / compression_length
                compression_length = 16.84 ft (the part in compression)
                proj = 2.81 ft from the HIGH-pressure edge (and the HIGH-pressure edge is at zero distance in the compression measurement)
                So: face is at 2.81 ft from HIGH (right) edge, and the compression zone is 16.84 ft total
                zero pressure at 16.84 ft from HIGH (right) edge = 21.73-16.84=4.89 ft from LEFT (windward) edge
                So: KD (from Table 2) = 4.89 ft = distance from low-pressure (left) edge to zero pressure line  
                But KD = K*D = 0.225*21.73 = 4.89... 
                THEREFORE: K in Table 2/Figure B represents the fraction from the LOW-PRESSURE edge to the zero-pressure line
                And the COMPRESSION ZONE = D - KD = D*(1-K) = 21.73*(1-0.225) = 16.84 ft from the HIGH-pressure edge
                MAX PRESSURE is at the HIGH-pressure edge
                
                This is consistent with the empty+wind case too:
                For empty+wind: K=0.660, KD=14.34 ft from LOW (windward) edge to zero
                Compression zone = D-KD = 21.73-14.34 = 7.39 ft from HIGH (leeward) edge
                proj from HIGH edge = 2.81 ft
                SB at face = 8.50*(7.39-2.81)/7.39 = 8.50*4.58/7.39 = 5.27 ✓
                PERFECT! This now makes sense.
                
                So for the diagram:
                - KD = distance from LOW edge to zero-pressure
                - Compression zone = D - KD from HIGH edge
                - MAX pressure is at HIGH edge (leeward/downwind side) 
            */}
            {/* Let me just draw a simple conceptual pressure diagram */}
            {/* Op+wind: compression zone = 16.84 ft, KD=4.89 (no-compression zone) */}
            <polygon points="20,80 284,80 284,30 20,30" fill="#b8d8f8" stroke="none" opacity={0.6} />
            {/* zero line at x = 20 + (4.89/21.73)*320 = 20+72 = 92... wait KD=4.89 from left */}
            {/* compression zone from x=92 (zero) to x=340 (high/right edge) */}
            {/* Actually: from left=low, right=high; zero at KD=4.89 from left = 72px from left */}
            <polygon points="92,80 340,80 340,30 92,80" fill="none" stroke="none" />
            {/* Just draw the pressure properly */}
            {/* Pressure zero at x=92 (4.89/21.73 = 22.5% from left = 72 px from left edge of footing (at x=20)) */}
            {(() => {
              const fW = 320;
              const fX0 = 20;
              const KD_frac_op = 4.89 / 21.73;
              const zeroX = fX0 + KD_frac_op * fW; // x coordinate of zero pressure
              const highX = fX0 + fW; // x coordinate of max pressure (right/leeward)
              const baseY = 80;
              const maxPressH = 45;
              // Pressure diagram
              return (
                <>
                  <polygon
                    points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`}
                    fill="#c0daff" stroke="#1a5fa8" strokeWidth={1}
                  />
                  <line x1={zeroX} y1={baseY} x2={zeroX} y2={baseY - 5} stroke="#888" strokeWidth={0.8} strokeDasharray="3,2" />
                  {/* soil+concrete */}
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  {/* Labels */}
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">5.46 ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {/* Face line */}
                  {(() => {
                    const faceX = highX - (2.81 / 21.73) * fW;
                    const sbFaceH = maxPressH * (16.84 - 2.81) / 16.84;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">4.55</text>
                      </>
                    );
                  })()}
                  {/* Dimension: proj */}
                  <line x1={highX - (2.81 / 21.73) * fW} y1={100} x2={highX} y2={100} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (1.405 / 21.73) * fW} y={112} fill="#e06020" fontSize="7" textAnchor="middle">2.81 ft</text>
                  {/* Dim: 16.84 */}
                  <line x1={zeroX} y1={108} x2={highX} y2={108} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={118} fill="#444" fontSize="7" textAnchor="middle">16.84 ft</text>
                  {/* Soil label */}
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = 0.73</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">5.46·(16.84−2.81)/16.84</span>
          <Eq /><Res>{SB_face_op.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">1.2·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 1.2(238.6)/{A_oct}</span>
          <Eq /><Res>{SC_op.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>M<Sub>u,ftg</Sub></Var><Assign />
            <span className="mc-expr">(SB<Sub>face</Sub>−soil+conc.)·proj²/2 + (SB−SB<Sub>face</Sub>)·proj²/3</span>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = ({SB_face_op.toFixed(2)}−{SC_op.toFixed(2)})({proj.toFixed(2)})²/2 +
              ({SB_str_op.toFixed(2)}−{SB_face_op.toFixed(2)})({proj.toFixed(2)})²/3
            </span>
          </Row>
          <Row>
            <Eq /><Res>{Mu_ftg_op.toFixed(2)}</Res><Unit>kip·ft/ft</Unit>
          </Row>
        </div>

        <Divider />
        <SubHeader>Case B — Empty + Wind (Load Comb. 4: 0.9(D<Sub>e</Sub>+D<Sub>s</Sub>) + 1.6W) ← Controls</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">0.9·P<Sub>e</Sub> = 0.9({Pe.toFixed(1)})</span>
          <Eq /><Res>{Pu_emp_str.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>
        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6·M<Sub>ftg</Sub> = 1.6({Mftg.toFixed(0)})</span>
          <Eq /><Res>{Mu_str_emp.toFixed(0)}</Res><Unit>kip·ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">{Mu_str_emp.toFixed(0)} / {Pu_emp_str.toFixed(1)}</span>
          <Eq /><Res>{e_str_emp.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>
        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_str_emp.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_str_emp.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2</span>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">L = {L_str_emp} (flat)</span>
          <span style={{ marginLeft: 16 }}><span className="mc-expr">K = {K_str_emp} (flat)</span></span>
          <Ref>(Table 2, PIP STE03350)</Ref>
        </Row>

        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">{K_str_emp} × {D_oct}</span>
          <Eq /><Res>{KD_str_emp.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A = {L_str_emp}({Pu_emp_str.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{SB_str_emp.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        {/* Diagram – empty+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            {(() => {
              const fW = 320;
              const fX0 = 20;
              const KD_frac_emp = 14.34 / 21.73;
              const zeroX = fX0 + KD_frac_emp * fW;
              const highX = fX0 + fW;
              const baseY = 80;
              const maxPressH = 45;
              // comp zone from x = zeroX to highX (7.39 ft)
              return (
                <>
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  <polygon
                    points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`}
                    fill="#c0daff" stroke="#1a5fa8" strokeWidth={1}
                  />
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">8.50 ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {/* Face line */}
                  {(() => {
                    const faceX = highX - (2.81 / 21.73) * fW;
                    const compLen = 7.39;
                    const sbFaceH = maxPressH * (compLen - 2.81) / compLen;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">5.27</text>
                      </>
                    );
                  })()}
                  <line x1={zeroX} y1={100} x2={highX} y2={100} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={112} fill="#444" fontSize="7" textAnchor="middle">7.39 ft</text>
                  <line x1={highX - (2.81 / 21.73) * fW} y1={107} x2={highX} y2={107} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (1.405 / 21.73) * fW} y={118} fill="#e06020" fontSize="7" textAnchor="middle">2.81 ft</text>
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = 0.55</text>
                  {/* KD label */}
                  <line x1={fX0} y1={100} x2={zeroX} y2={100} stroke="#888" strokeWidth={0.8} />
                  <text x={(fX0 + zeroX) / 2} y={112} fill="#888" fontSize="7" textAnchor="middle">14.34 ft (KD)</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">8.50·(7.39−2.81)/7.39</span>
          <Eq /><Res>{SB_face_emp.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">0.9·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 0.9(238.6)/{A_oct}</span>
          <Eq /><Res>{SC_emp.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <div style={{ marginLeft: 24, border: "1px solid #aac8e8", background: "#f4f9ff", padding: "6px 10px", margin: "6px 24px", fontSize: "9.5pt", fontFamily: "'Times New Roman', serif" }}>
          <Row>
            <Var>M<Sub>u,ftg</Sub></Var><Assign />
            <span className="mc-expr">(SB<Sub>face</Sub>−soil)·proj²/2 + (SB−SB<Sub>face</Sub>)·proj²/3</span>
          </Row>
          <Row>
            <span style={{ marginLeft: 48 }}>
              = ({SB_face_emp.toFixed(2)}−{SC_emp.toFixed(2)})({proj.toFixed(2)})²/2 +
              ({SB_str_emp.toFixed(2)}−{SB_face_emp.toFixed(2)})({proj.toFixed(2)})²/3
            </span>
          </Row>
          <Row>
            <Eq />
            <Res>{Mu_ftg_emp.toFixed(2)}</Res><Unit>kip·ft/ft</Unit>
            <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
          </Row>
        </div>

        <Divider />
        <SubHeader>Reinforcement Calculation</SubHeader>

        <Row indent={1}>
          <Var>d</Var><Assign />
          <span className="mc-expr">t − 3 in clear − 1⅛ in (#9 bar dia./2 approx. #9 bar) = 18 − 3 − 1.125</span>
          <Eq /><Res>{d_eff.toFixed(3)}</Res><Unit>in</Unit>
        </Row>

        <Row indent={1}>
          <Var>F</Var><Assign />
          <span className="mc-expr">b·d² / 12,000 = 12({d_eff.toFixed(3)})² / 12,000</span>
          <Eq /><Res>{F_factor.toFixed(3)}</Res>
        </Row>

        <Row indent={1}>
          <Var>K<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub> / F = {Mu_ftg_emp.toFixed(2)} / {F_factor.toFixed(3)}</span>
          <Eq /><Res>{Ku_rebar.toFixed(1)}</Res>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">From K<Sub>u</Sub> table: a<Sub>u</Sub> = {au}</span>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub> / (a<Sub>u</Sub>·d) = {Mu_ftg_emp.toFixed(2)} / ({au} × {d_eff.toFixed(3)})</span>
          <Eq /><Res>{As_req.toFixed(2)}</Res><Unit>in²/ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>s,min</Sub></Var><Assign />
          <span className="mc-expr">0.0033 × 12 × d = 0.0033 × 12 × {d_eff.toFixed(3)}</span>
          <Eq /><Res>{As_min.toFixed(2)}</Res><Unit>in²/ft</Unit>
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
        </Row>

        <Row indent={1}>
          <Var>4/3 A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">(4/3)({As_req.toFixed(2)})</span>
          <Eq /><Res>{As_43.toFixed(2)}</Res><Unit>in²/ft</Unit>
        </Row>

        <BulletResult>Use #6 @ 9 in E.W. (bottom); A<Sub>s</Sub> = 0.59 in²/ft</BulletResult>

        {/* ── Shear Check ─────────────────────────────── */}
        <SectionHeader>SHEAR CHECK</SectionHeader>
        <SubHeader>Beam Shear — Empty + Wind (Controls)</SubHeader>

        <Row indent={1}>
          <span className="mc-expr">
            SB at d from face: = 8.50·(7.39 − 2.81 + 1.16) / 7.39
          </span>
          <Eq /><Res>6.60</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>V<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">(6.60 − 0.55)(2.81 − 1.16) + (8.50 − 6.60)(2.81 − 1.16)/2</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= 9.98 + 1.57</span>
          <Eq /><Res>11.55</Res><Unit>kip/ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u</Sub>·1000 / (12·d) = 11.55(1000) / (12 × {d_eff.toFixed(3)})</span>
          <Eq /><Res>{vu_beam.toFixed(1)}</Res><Unit>psi</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">2φ√f′<Sub>c</Sub> = 2(0.75)√4,000</span>
          <Eq /><Res>{vc_beam_allow.toFixed(1)}</Res><Unit>psi</Unit>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Eq />
          <Res>{vu_beam.toFixed(1)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>2φ√f′<Sub>c</Sub> = {vc_beam_allow.toFixed(1)} psi</span>
          <OK />
        </Row>

        <Divider />
        <SubHeader>Punching Shear — Test Load (Load Comb. 7: 1.4·D<Sub>t</Sub>)</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub>/A</Var><Assign />
          <span className="mc-expr">1.4·P<Sub>t</Sub>/A<Sub>oct</Sub> = 1.4({Pt.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{(1.4 * Pt / A_oct).toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">
            side + d = {side_equiv.toFixed(2)} + {(d_eff / 12).toFixed(2)} = {(side_equiv + d_eff / 12).toFixed(2)} ft
          </span>
        </Row>

        <Row indent={1}>
          <Var>b<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">4(side + d) = 4({(side_equiv + d_eff / 12).toFixed(2)})</span>
          <Eq /><Res>{(4 * (side_equiv + d_eff / 12)).toFixed(1)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>V<Sub>u,punch</Sub></Var><Assign />
          <span className="mc-expr">
            (P<Sub>u</Sub>/A − factored soil)(A<Sub>oct</Sub> − (side+d)²)
            = (3.36 − {(1.4 / 1.2 * SC_op).toFixed(2)})({A_oct} − {((side_equiv + d_eff / 12) ** 2).toFixed(1)})
          </span>
        </Row>
        <Row indent={2}>
          <Eq /><Res>{Vu_punch_val.toFixed(0)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u,punch</Sub>·1000 / (d·b<Sub>o</Sub>·12)</span>
          <Eq /><Res>{vu_punch.toFixed(0)}</Res><Unit>psi</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">v<Sub>c</Sub> = φ(α<Sub>s</Sub>·d/b<Sub>o</Sub> + 2)√f′<Sub>c</Sub></span>
          <Ref>ACI 318-05 Eq. 11-34</Ref>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= 0.75[40({(d_eff / 12).toFixed(2)}/{(4 * (side_equiv + d_eff / 12)).toFixed(1)}) + 2]√4,000</span>
          <Eq /><Res>{vc_punch1.toFixed(0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {vu_punch.toFixed(0)} psi</span>
          <OK />
        </Row>

        <Row indent={1}>
          <span className="mc-expr">v<Sub>c</Sub> = φ·4·√f′<Sub>c</Sub> = 0.75(4)√4,000</span>
          <Eq /><Res>{vc_punch2.toFixed(0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {vu_punch.toFixed(0)} psi</span>
          <OK />
          <Ref>ACI 318-05 Eq. 11-35</Ref>
        </Row>

        {/* ── Top Reinforcement ────────────────────────── */}
        <SectionHeader>TOP REINFORCEMENT CHECK</SectionHeader>
        <Text>
          Check whether concrete can resist the weight of soil and concrete above the footing
          without top reinforcement (use load factor 1.4).
        </Text>

        <Row indent={1}>
          <Var>M<Sub>u,top</Sub></Var><Assign />
          <span className="mc-expr">(1.4/1.2) × 0.73 × (2.81)²/2 = {((1.4 / 1.2) * SC_op).toFixed(4)} × 3.948</span>
          <Eq /><Res>{Mu_top.toFixed(2)}</Res><Unit>kip·ft/ft</Unit>
          <Eq /><Res>{Mu_top_in.toFixed(0)}</Res><Unit>in·lb/in</Unit>
        </Row>

        <Row indent={1}>
          <Var>f′<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">5·φ·√f′<Sub>c</Sub> = 5(0.55)√4,000</span>
          <Eq /><Res>{ft_flex.toFixed(1)}</Res><Unit>psi</Unit>
          <Ref>Eq. 16</Ref>
        </Row>

        <Row indent={1}>
          <Var>t<Sub>eff</Sub></Var><Assign />
          <span className="mc-expr">√(6·M<Sub>u</Sub>/f′<Sub>t</Sub>) = √(6·{Mu_top_in.toFixed(0)}/{ft_flex.toFixed(1)})</span>
          <Eq /><Res>{t_eff.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>Eq. 18</Ref>
        </Row>

        <Row indent={1}>
          <Var>t<Sub>reqd</Sub></Var><Assign />
          <span className="mc-expr">t<Sub>eff</Sub> + 2 in = {t_eff.toFixed(1)} + 2</span>
          <Eq /><Res>{t_reqd.toFixed(1)}</Res><Unit>in</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>t<Sub>actual</Sub> = 18 in</span>
          <OK />
          <Ref>Eq. 17a (cast against soil)</Ref>
        </Row>

        <BulletResult>Wind governs — no top reinforcement required</BulletResult>

        {/* ── Summary ──────────────────────────────────── */}
        <SectionHeader>DESIGN SUMMARY</SectionHeader>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Pedestal</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Shape</td><td><strong>Octagon — 17 ft – 8½ in</strong></td></tr>
                <tr><td>Height</td><td><strong>4.5 ft above footing</strong></td></tr>
                <tr><td>Verticals</td><td><strong>40 – #5 bars</strong></td></tr>
                <tr><td>Ties</td><td><strong>#4 ties @ 15 in c/c</strong></td></tr>
                <tr><td>Top mat</td><td><strong>#4 @ 12 in E.W. (2 directions)</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Anchor Bolts</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Count</td><td><strong>24</strong></td></tr>
                <tr><td>Size</td><td><strong>1½ in dia. BSL</strong></td></tr>
                <tr><td>Spec.</td><td><strong>ASTM F1554, Grade 36</strong></td></tr>
                <tr><td>Bolt circle</td><td><strong>14 ft – 10½ in</strong></td></tr>
                <tr><td>h<Sub>ef</Sub></td><td><strong>18 in</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <SubHeader>Footing</SubHeader>
            <table className="mc-data-table">
              <tbody>
                <tr><td>Shape</td><td><strong>Octagon — 21 ft – 8¾ in</strong></td></tr>
                <tr><td>Thickness</td><td><strong>18 in (1.5 ft)</strong></td></tr>
                <tr><td>Bottom reinf.</td><td><strong>#6 @ 9 in E.W.</strong></td></tr>
                <tr><td>Top reinf.</td><td><strong>Not required</strong></td></tr>
                <tr><td>Depth</td><td><strong>5 ft below grade</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid #c0d0e0", paddingTop: 8, fontSize: "8pt", color: "#777", textAlign: "center" }}>
          Vertical Vessel Foundation Design — PIP STE03350 Example · ACI 318-05 · ASCE/SEI 7-05 · PIP STC01015 ·
          Prepared per Process Industry Practices, December 2008
        </div>
      </div>
    </div>
  );
}
