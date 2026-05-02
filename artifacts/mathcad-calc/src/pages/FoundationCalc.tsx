import "@/index.css";

/* ─── helpers ─────────────────────────────────────────────────── */

function InputVar({ children }: { children: React.ReactNode }) {
  return <span className="mc-input-var">{children}</span>;
}
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
function Cmt({ children }: { children: React.ReactNode }) {
  return <span className="mc-inline-comment">{children}</span>;
}

/* ─── computed values ──────────────────────────────────────────── */

// Design data
const V_wind = 44.75;
const M_wind = 1902;
const De = 170.3;
const Do = 345.2;
const Dt = 624.1;
const SB_net = 3.25;
const gamma_soil = 0.110;
const gamma_conc = 0.150;
const fc = 4000;
const fy = 60000;
const depth_ftg = 5;
const BC_in = 178.5;
const BC_ft = BC_in / 12;
const BD = 1.5;
const SD = 4.0;
const Nb = 24;
const Nd = 40;
const h_ped = 4.5;
const t_ftg = 1.5;

// Pedestal size per equations 1a-1e
const eq1a = BC_in + 9;
const eq1b = BC_in + 8 * BD;
const eq1d = BC_in + SD + 9 - BD;
const eq1e = BC_in + SD + 7 * BD;
const ped_in_min = Math.max(eq1a, eq1b, eq1d, eq1e);
const ped_ft_min = ped_in_min / 12;
const D_ped = 17.704;
const A_ped = 259.7;
const Dp = A_ped * h_ped * gamma_conc;

// Moments at pedestal base
const Mped = M_wind + h_ped * V_wind;
const Muped = 1.6 * Mped;
const DC_exact = 17.21;

// Dowel design
const Fu = (4 * Muped) / (Nd * DC_exact) - 0.9 * (De + Dp) / Nd;
const As_dowel_req = Fu / (0.9 * (fy / 1000));

// Anchor bolt max tension
const Mu_ab = 1.6 * M_wind;
const Nu = (4 * Mu_ab) / (Nb * BC_ft) - 0.9 * De / Nb;

// Shear / friction
const Vu_ab = 1.6 * V_wind;
const LA = (2 / 3) * BC_ft;
const Pu_ab = Mu_ab / LA + 0.9 * De / 2;
const mu_fric = 0.55;
const Vf = mu_fric * Pu_ab;
const phi_Vf = 0.75 * Vf;

// Projected concrete failure area
const hef = 1.5;
const DEQ = 1.027 * D_ped;
const phi_Nn = 33.2;

// Footing trial size
const D_footing_depth = 6.0;
const Mftg = M_wind + D_footing_depth * V_wind;
const SB_gross = SB_net + depth_ftg * gamma_soil;
const D_trial = 2.6 * Math.pow(Mftg / SB_gross, 1 / 3);

const D_oct = 21.73;
const A_oct = 391.1;

// Embedment check
const psi_e = 1.0;
const psi_lambda = 1.0;
const db_bar = 0.625;
const ldh = (0.02 * psi_e * psi_lambda * fy) / Math.sqrt(fc) * db_bar;
const As_ratio = 0.22 / 0.31;
const T_embed = 3 + 2 * 0.75 + As_ratio * 0.7 * ldh;

// Footing weights
const W_ped_net = A_ped * (h_ped * gamma_conc - (depth_ftg - t_ftg) * gamma_soil);
const W_ftg_soil = A_oct * (t_ftg * gamma_conc + (depth_ftg - t_ftg) * gamma_soil);
const Ds = W_ped_net + W_ftg_soil;
const Pe = De + Ds;
const Po = Do + Ds;
const Pt = Dt + Ds;

// Soil bearing
const e_emp = Mftg / Pe;
const SR_emp = D_oct / (2 * e_emp);
const eD_emp = e_emp / D_oct;
const L_emp_diag = 2.85;
const f_emp = L_emp_diag * Pe / A_oct;

const e_op = Mftg / Po;
const eD_op = e_op / D_oct;
const L_op_diag = 2.25;
const f_op = L_op_diag * Po / A_oct;

const V_partial_frac = Math.pow(68 / 115, 2);
const Mftg_test = V_partial_frac * Mftg;
const e_test = Mftg_test / Pt;
const eD_test = e_test / D_oct;
const f_test = (Pt / A_oct) * (1 + 8.19 * eD_test);

// Bottom reinforcement
const Pu_op = 1.2 * Po;
const Mu_str_op = 1.6 * Mftg;
const e_str_op = Mu_str_op / Pu_op;
const eD_str_op = e_str_op / D_oct;
const L_str_op = 2.70;
const K_str_op = 0.225;
const KD_str_op = K_str_op * D_oct;
const SB_str_op = L_str_op * Pu_op / A_oct;
const side_equiv = Math.sqrt(A_ped);
const proj = (D_oct - side_equiv) / 2;
const dist_from_far_edge_op = D_oct - KD_str_op;
const SB_face_op = SB_str_op * (dist_from_far_edge_op - proj) / dist_from_far_edge_op;
const SC_op = 1.2 * W_ftg_soil / A_oct;
const Mu_ftg_op = (SB_face_op - SC_op) * proj * proj / 2 +
  (SB_str_op - SB_face_op) * proj * proj / 3;

const Pu_emp_str = 0.9 * Pe;
const Mu_str_emp = 1.6 * Mftg;
const e_str_emp = Mu_str_emp / Pu_emp_str;
const eD_str_emp = e_str_emp / D_oct;
const L_str_emp = 7.63;
const K_str_emp = 0.660;
const KD_str_emp = K_str_emp * D_oct;
const SB_str_emp = L_str_emp * Pu_emp_str / A_oct;
const comp_len_emp = D_oct - KD_str_emp;
const SB_face_emp = SB_str_emp * (comp_len_emp - proj) / comp_len_emp;
const SC_emp = 0.9 * W_ftg_soil / A_oct;
const Mu_ftg_emp = (SB_face_emp - SC_emp) * proj * proj / 2 +
  (SB_str_emp - SB_face_emp) * proj * proj / 3;

// Reinforcement design
const d_eff = 18 - 3 - 1.125;
const F_factor = (12 * d_eff * d_eff) / 12000;
const Ku_rebar = Mu_ftg_emp / F_factor;
const au = 4.390;
const As_req = Mu_ftg_emp / (au * d_eff);
const As_min = 0.0033 * 12 * d_eff;
const As_43 = (4 / 3) * As_req;

// Beam shear
const vu_beam = (11.55 * 1000) / (12 * d_eff);
const vc_beam_allow = 2 * 0.75 * Math.sqrt(fc);

// Punching shear
const Pu_punch = 1.4 * Pt;
const side_d = side_equiv + d_eff / 12;
const SC_punch = (1.4 / 1.2) * SC_op;
const Vu_punch_val = (Pu_punch / A_oct - SC_punch) * (A_oct - side_d * side_d);
const bo = 4 * side_d;
const vu_punch = Vu_punch_val * 1000 / (d_eff * bo * 12);
const alpha_s = 40;
const vc_punch1 = 0.75 * (alpha_s * (d_eff / 12) / bo + 2) * Math.sqrt(fc);
const vc_punch2 = 0.75 * 4 * Math.sqrt(fc);

// Top reinforcement
const Mu_top = (1.4 / 1.2) * SC_op * proj * proj / 2;
const Mu_top_in = Mu_top * 12000;
const ft_flex = 5 * 0.55 * Math.sqrt(fc);
const t_eff = Math.sqrt(6 * Mu_top_in / ft_flex);
const t_reqd = t_eff + 2;

/* ─── component ─────────────────────────────────────────────────── */

export default function FoundationCalc() {
  return (
    <div className="mc-page bg-gray-100 min-h-screen py-8">
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
            <SubHeader>Wind Load Data (ASCE/SEI 7-05, V = 115 mph)</SubHeader>

            <Row indent={1}>
              <InputVar>V</InputVar><Assign />
              <span className="mc-expr">44.75</span><Unit>kip</Unit>
              <Cmt>base shear at base of vessel</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>M</InputVar><Assign />
              <span className="mc-expr">1,902</span><Unit>kip·ft</Unit>
              <Cmt>overturning moment at top of grout</Cmt>
            </Row>

            <SubHeader>Vessel Dead Loads</SubHeader>

            <Row indent={1}>
              <InputVar>D<Sub>e</Sub></InputVar><Assign />
              <span className="mc-expr">170.3</span><Unit>kip</Unit>
              <Cmt>empty weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>D<Sub>o</Sub></InputVar><Assign />
              <span className="mc-expr">345.2</span><Unit>kip</Unit>
              <Cmt>operating weight</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>D<Sub>t</Sub></InputVar><Assign />
              <span className="mc-expr">624.1</span><Unit>kip</Unit>
              <Cmt>hydrotest weight</Cmt>
            </Row>

            <SubHeader>Soil &amp; Concrete</SubHeader>

            <Row indent={1}>
              <InputVar>SB<Sub>net</Sub></InputVar><Assign />
              <span className="mc-expr">3.25</span><Unit>ksf</Unit>
              <Cmt>net allowable bearing (transient)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>depth</InputVar><Assign />
              <span className="mc-expr">5</span><Unit>ft</Unit>
              <Cmt>foundation depth below grade</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>γ<Sub>s</Sub></InputVar><Assign />
              <span className="mc-expr">0.110</span><Unit>kcf</Unit>
              <Cmt>soil unit weight (110 pcf)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>γ<Sub>c</Sub></InputVar><Assign />
              <span className="mc-expr">0.150</span><Unit>kcf</Unit>
              <Cmt>concrete unit weight (150 pcf)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>f′<Sub>c</Sub></InputVar><Assign />
              <span className="mc-expr">4,000</span><Unit>psi</Unit>
              <Cmt>concrete compressive strength</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>f<Sub>y</Sub></InputVar><Assign />
              <span className="mc-expr">60,000</span><Unit>psi</Unit>
              <Cmt>reinforcement yield strength</Cmt>
            </Row>

            <SubHeader>Anchor Bolt Data</SubHeader>

            <Row indent={1}>
              <InputVar>N<Sub>b</Sub></InputVar><Assign />
              <span className="mc-expr">24</span>
              <Cmt>number of anchor bolts (multiple of 8)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>BD</InputVar><Assign />
              <span className="mc-expr">1.5</span><Unit>in</Unit>
              <Cmt>bolt diameter — ASTM F1554, Gr. 36</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>SD</InputVar><Assign />
              <span className="mc-expr">4.0</span><Unit>in</Unit>
              <Cmt>sleeve diameter (4 in × 15 in long)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>BC</InputVar><Assign />
              <span className="mc-expr">178.5</span><Unit>in</Unit>
              <Cmt>bolt circle diameter (14 ft – 10½ in)</Cmt>
            </Row>

            <SubHeader>Foundation Geometry (Initial)</SubHeader>

            <Row indent={1}>
              <InputVar>h<Sub>ped</Sub></InputVar><Assign />
              <span className="mc-expr">4.5</span><Unit>ft</Unit>
              <Cmt>pedestal height above top of footing</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>t<Sub>ftg</Sub></InputVar><Assign />
              <span className="mc-expr">1.5</span><Unit>ft</Unit>
              <Cmt>footing thickness (try 18 in)</Cmt>
            </Row>
            <Row indent={1}>
              <InputVar>N<Sub>d</Sub></InputVar><Assign />
              <span className="mc-expr">40</span>
              <Cmt>number of pedestal dowels (assumed, multiple of 8)</Cmt>
            </Row>
          </div>
        </div>

        {/* ── Pedestal Design ─────────────────────────── */}
        <SectionHeader>PEDESTAL DESIGN</SectionHeader>
        <SubHeader>Minimum Pedestal Size (Equations 1a – 1f, PIP STE03350)</SubHeader>

        <Text>The pedestal face-to-face dimension must satisfy the largest of the following:</Text>

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
        <SubHeader>Pedestal Properties and Moments</SubHeader>

        <Row indent={1}>
          <InputVar>D<Sub>ped</Sub></InputVar><Assign />
          <span className="mc-expr">17.704</span><Unit>ft</Unit>
          <Cmt>face-to-face (final, after anchor bolt area check)</Cmt>
        </Row>

        <Row indent={1}>
          <InputVar>A<Sub>ped</Sub></InputVar><Assign />
          <span className="mc-expr">259.7</span><Unit>ft²</Unit>
          <Cmt>area of regular octagon at D<Sub>ped</Sub> — Table 1, PIP STE03350</Cmt>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>p</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>ped</Sub> × h<Sub>ped</Sub> × γ<Sub>c</Sub> = {A_ped} × {h_ped} × {gamma_conc}</span>
          <Eq /><Res>{Dp.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>pedestal self-weight</Cmt>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>ped</Sub></Var><Assign />
          <span className="mc-expr">M + V·h<Sub>ped</Sub> = {M_wind} + {V_wind}({h_ped})</span>
          <Eq /><Res>{Mped.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <Cmt>OTM at pedestal base</Cmt>
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
          <Var>DC</Var><Assign />
          <span className="mc-expr">D<Sub>ped</Sub> − 0.5 ft = {D_ped} − 0.5</span>
          <Eq /><Res>{DC_exact.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>dowel circle diameter (≈ pedestal dia. minus 6 in)</Cmt>
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
            <span style={{ marginLeft: 56 }}>
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

        <Row indent={1}>
          <InputVar>φ</InputVar><Assign />
          <span className="mc-expr">0.9</span>
          <Cmt>strength reduction factor — tension-controlled flexure (ACI 318-05 §9.3.2.1)</Cmt>
        </Row>

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
          <Var>BC<Sub>ft</Sub></Var><Assign />
          <span className="mc-expr">BC / 12 = 178.5 / 12</span>
          <Eq /><Res>{BC_ft.toFixed(3)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">1.6 × M = 1.6 × {M_wind}</span>
          <Eq /><Res>{Mu_ab.toFixed(0)}</Res><Unit>kip·ft</Unit>
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
          <span className="mc-expr">1.6 × V = 1.6 × {V_wind}</span>
          <Eq /><Res>{Vu_ab.toFixed(1)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <InputVar>μ</InputVar><Assign />
          <span className="mc-expr">0.55</span>
          <Cmt>coefficient of friction — grouted base plate (PIP STE05121)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>LA</Var><Assign />
          <span className="mc-expr">(2/3)·BC<Sub>ft</Sub> = (2/3)({BC_ft.toFixed(3)})</span>
          <Eq /><Res>{LA.toFixed(2)}</Res><Unit>ft</Unit>
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
          <Ref>Eq. 6</Ref>
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
          Several iterations confirmed that D = 16 ft – 1⅛ in provides insufficient A<Sub>N</Sub>.
          The pedestal diameter is increased to 17 ft – 8½ in.
        </Note>

        <Row indent={1}>
          <InputVar>h<Sub>ef</Sub></InputVar><Assign />
          <span className="mc-expr">18</span><Unit>in</Unit>
          <Eq /><Res>{hef.toFixed(2)}</Res><Unit>ft</Unit>
          <Ref>embedment depth — Table 1, PIP STE05121</Ref>
        </Row>

        <Row indent={1}>
          <Var>1.5·h<Sub>ef</Sub></Var><Assign />
          <span className="mc-expr">1.5({hef})</span>
          <Eq /><Res>{(1.5 * hef).toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>projected failure radius</Cmt>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>EQ</Sub></Var><Assign />
          <span className="mc-expr">1.027 × D<Sub>ped</Sub> = 1.027 × {D_ped}</span>
          <Eq /><Res>{DEQ.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>equivalent circle diameter for octagonal pedestal</Cmt>
        </Row>

        {/* AN diagram */}
        <div style={{ marginLeft: 24, marginTop: 8 }}>
          <div style={{ fontSize: "8.5pt", color: "#444", marginBottom: 4 }}>
            Graphical determination of A<Sub>N</Sub> (single bolt at 54 in spacing on bolt circle):
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
            <text x="118" y="82" fill="#1a3a8f" fontSize="7.5"> = 1042 in²</text>
            <line x1="75" y1="53" x2="75" y2="107" stroke="#e06020" strokeWidth={0.8} />
            <text x="54" y="83" fill="#e06020" fontSize="7.5">54 in</text>
            <line x1="103" y1="130" x2="157" y2="130" stroke="#e06020" strokeWidth={0.8} />
            <text x="112" y="143" fill="#e06020" fontSize="7.5">54 in</text>
          </svg>
        </div>

        <Row indent={1}>
          <Var>A<Sub>N</Sub></Var><Assign />
          <Res>1,042</Res><Unit>in²</Unit>
          <Cmt>from graphical/CAD layout</Cmt>
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
          <InputVar>Projection</InputVar><Assign />
          <span className="mc-expr">1 ft – 2 in</span>
          <Cmt>bolt projection above top of grout (from vessel data sheet)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>P₁</InputVar><Assign />
          <span className="mc-expr">2</span><Unit>in</Unit>
          <Cmt>nut/anchor-head thickness allowance (PIP STE05121)</Cmt>
        </Row>
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
          <span className="mc-expr">BSL embedment = (4 ft – 5 in) − (1 ft – 2 in)</span>
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
          <InputVar>d<Sub>ftg</Sub></InputVar><Assign />
          <span className="mc-expr">h<Sub>ped</Sub> + t<Sub>ftg</Sub> = {h_ped} + {t_ftg}</span>
          <Eq /><Res>{D_footing_depth.toFixed(1)}</Res><Unit>ft</Unit>
          <Cmt>total depth from top of grout to bottom of footing</Cmt>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>ftg</Sub></Var><Assign />
          <span className="mc-expr">M + V·d<Sub>ftg</Sub> = {M_wind} + {V_wind}({D_footing_depth})</span>
          <Eq /><Res>{Mftg.toFixed(0)}</Res><Unit>kip·ft</Unit>
          <Cmt>OTM at footing base</Cmt>
        </Row>

        <Row indent={1}>
          <Var>SB<Sub>gross</Sub></Var><Assign />
          <span className="mc-expr">SB<Sub>net</Sub> + depth·γ<Sub>s</Sub> = {SB_net} + {depth_ftg}({gamma_soil})</span>
          <Eq /><Res>{SB_gross.toFixed(2)}</Res><Unit>ksf</Unit>
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
              = 2.6·({Mftg.toFixed(0)}/{SB_gross.toFixed(2)})<Sup>1/3</Sup>
            </span>
            <Eq /><Res>{D_trial.toFixed(2)}</Res><Unit>ft</Unit>
          </Row>
        </div>

        <BulletResult>Try 21 ft – 8¾ in octagon. A = 391.1 ft² (Table 1, PIP STE03350)</BulletResult>

        <Row indent={1}>
          <InputVar>D<Sub>oct</Sub></InputVar><Assign />
          <span className="mc-expr">21.73</span><Unit>ft</Unit>
          <Cmt>face-to-face dimension of octagonal footing (21 ft – 8¾ in)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>A<Sub>oct</Sub></InputVar><Assign />
          <span className="mc-expr">391.1</span><Unit>ft²</Unit>
          <Cmt>area of regular octagon — Table 1, PIP STE03350</Cmt>
        </Row>

        <Divider />
        <SubHeader>Check Footing Thickness for Pedestal Dowel Embedment</SubHeader>

        <Row indent={1}>
          <InputVar>Ψ<Sub>e</Sub></InputVar><Assign />
          <span className="mc-expr">1.0</span>
          <Cmt>epoxy coating factor</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>λ</InputVar><Assign />
          <span className="mc-expr">1.0</span>
          <Cmt>lightweight concrete factor (normal weight)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>d<Sub>b</Sub></InputVar><Assign />
          <span className="mc-expr">0.625</span><Unit>in</Unit>
          <Cmt>bar diameter — #5 bar</Cmt>
        </Row>

        <Row indent={1}>
          <Var>l<Sub>dh</Sub></Var><Assign />
          <span className="mc-expr">
            [0.02·Ψ<Sub>e</Sub>·λ·f<Sub>y</Sub>/√f′<Sub>c</Sub>]·d<Sub>b</Sub>
            = [0.02(1.0)(1.0)(60,000)/√4,000]·0.625
          </span>
          <Eq /><Res>{ldh.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>ACI 318-05 §12.5.2</Ref>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>s,req</Sub>/A<Sub>s,prov</Sub></Var><Assign />
          <span className="mc-expr">0.22/0.31</span>
          <Eq /><Res>{As_ratio.toFixed(2)}</Res>
        </Row>

        <Row indent={1}>
          <Var>T<Sub>req</Sub></Var><Assign />
          <span className="mc-expr">
            3 in + 2(0.75 in) + (A<Sub>s,req</Sub>/A<Sub>s,prov</Sub>)(0.7)(l<Sub>dh</Sub>)
            = 3 + 2(0.75) + (0.71)(0.7)(11.9)
          </span>
          <Eq /><Res>{T_embed.toFixed(1)}</Res><Unit>in</Unit>
        </Row>

        <Row indent={1}>
          <span className="mc-expr">T<Sub>min</Sub> = 12 in (Section 4.7.1)</span>
        </Row>

        <BulletResult>Use footing thickness t<Sub>ftg</Sub> = 18 in (1.5 ft)</BulletResult>

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
          <Eq /><Res>{W_ped_net.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>net pedestal weight (pedestal concrete minus displaced soil)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>W<Sub>ftg+soil</Sub></Var><Assign />
          <span className="mc-expr">A<Sub>oct</Sub>·[t<Sub>ftg</Sub>·γ<Sub>c</Sub> + (depth−t<Sub>ftg</Sub>)·γ<Sub>s</Sub>]</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">
            = {A_oct}·[{t_ftg}({gamma_conc}) + {depth_ftg - t_ftg}({gamma_soil})]
          </span>
          <Eq /><Res>{W_ftg_soil.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>footing concrete + soil overburden weight</Cmt>
        </Row>

        <Row indent={1}>
          <Var>D<Sub>s</Sub></Var><Assign />
          <span className="mc-expr">W<Sub>ped,net</Sub> + W<Sub>ftg+soil</Sub> = {W_ped_net.toFixed(1)} + {W_ftg_soil.toFixed(1)}</span>
          <Eq /><Res>{Ds.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>total structure dead load (foundation)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>P<Sub>e</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>e</Sub> + D<Sub>s</Sub> = {De} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Pe.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>total vertical load — empty</Cmt>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>o</Sub> + D<Sub>s</Sub> = {Do} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Po.toFixed(1)}</Res><Unit>kip</Unit>
          <Cmt>total vertical load — operating</Cmt>
        </Row>
        <Row indent={1}>
          <Var>P<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">D<Sub>t</Sub> + D<Sub>s</Sub> = {Dt} + {Ds.toFixed(1)}</span>
          <Eq /><Res>{Pt.toFixed(1)}</Res><Unit>kip</Unit>
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
          <Var>SR</Var><Assign />
          <span className="mc-expr">D<Sub>oct</Sub>/(2·e) = {D_oct}/(2×{e_emp.toFixed(2)})</span>
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
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → footing not fully in compression → use Figure B</span>
        </Row>

        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <span className="mc-expr">{L_emp_diag}</span>
          <Ref>coefficient from Figure B, PIP STE03350 (e/D = {eD_emp.toFixed(3)})</Ref>
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
          <span style={{ marginLeft: 16 }}>
            <Var>M<Sub>ftg</Sub></Var><Eq /><Res>{Mftg.toFixed(0)}</Res><Unit>kip·ft</Unit>
          </span>
        </Row>

        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg</Sub> / P<Sub>o</Sub> = {Mftg.toFixed(0)} / {Po.toFixed(1)}</span>
          <Eq /><Res>{e_op.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_op.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_op.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.122 → use Figure B</span>
        </Row>

        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <span className="mc-expr">{L_op_diag}</span>
          <Ref>Figure B (e/D = {eD_op.toFixed(3)})</Ref>
        </Row>

        <Row indent={1}>
          <Var>f</Var><Assign />
          <span className="mc-expr">L·P<Sub>o</Sub>/A<Sub>oct</Sub> = {L_op_diag}({Po.toFixed(1)})/{A_oct}</span>
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
          <InputVar>V<Sub>partial</Sub></InputVar><Assign />
          <span className="mc-expr">68</span><Unit>mph</Unit>
          <Cmt>partial wind speed for test condition (ASCE/SEI 7-05)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>ftg,test</Sub></Var><Assign />
          <span className="mc-expr">(V<Sub>partial</Sub>/V)<Sup>2</Sup> × M<Sub>ftg</Sub> = (68/115)² × {Mftg.toFixed(0)}</span>
          <Eq /><Res>{Mftg_test.toFixed(1)}</Res><Unit>kip·ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>e</Var><Assign />
          <span className="mc-expr">M<Sub>ftg,test</Sub> / P<Sub>t</Sub> = {Mftg_test.toFixed(1)} / {Pt.toFixed(1)}</span>
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
          <span className="mc-expr">(P<Sub>t</Sub>/A<Sub>oct</Sub>)[1 + 8.19·(e/D)] = ({Pt.toFixed(1)}/{A_oct})[1 + 8.19({eD_test.toFixed(3)})]</span>
          <Eq /><Res>{f_test.toFixed(2)}</Res><Unit>ksf</Unit>
          <span style={{ marginLeft: 6 }}>{"<"} {SB_gross.toFixed(2)} ksf</span>
          <OK />
          <Ref>Eq. 10a</Ref>
        </Row>

        <BulletResult>Use 21 ft – 8¾ in octagon footing</BulletResult>

        {/* ── Bottom Reinforcement ─────────────────────── */}
        <SectionHeader>BOTTOM REINFORCEMENT DESIGN</SectionHeader>

        <Text>Strength-level bearing pressures use factored loads; L and K coefficients from Table 2 (flat) /
          Figure B (PIP STE03350). KD = K·D<Sub>oct</Sub> is the distance from the low-pressure edge to the
          zero-pressure line. Compression zone = D<Sub>oct</Sub> − KD from the high-pressure edge.</Text>

        <Divider />
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
          <span className="mc-expr">M<Sub>u</Sub> / P<Sub>u</Sub> = {Mu_str_op.toFixed(0)} / {Pu_op.toFixed(1)}</span>
          <Eq /><Res>{e_str_op.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_str_op.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_str_op.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2 / Figure B</span>
        </Row>

        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <span className="mc-expr">{L_str_op}</span>
          <span style={{ marginLeft: 16 }}><InputVar>K</InputVar><Assign /><span className="mc-expr">{K_str_op}</span></span>
          <Ref>(flat, Table 2 / Figure B, e/D = {eD_str_op.toFixed(3)})</Ref>
        </Row>

        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {K_str_op} × {D_oct}</span>
          <Eq /><Res>{KD_str_op.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>distance from low-pressure edge to zero-pressure line</Cmt>
        </Row>

        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {L_str_op}({Pu_op.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{SB_str_op.toFixed(2)}</Res><Unit>ksf</Unit>
          <Cmt>maximum bearing pressure at high-pressure edge</Cmt>
        </Row>

        <Row indent={1}>
          <Var>side<Sub>eq</Sub></Var><Assign />
          <span className="mc-expr">√A<Sub>ped</Sub> = √{A_ped}</span>
          <Eq /><Res>{side_equiv.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>side of equivalent square pedestal</Cmt>
        </Row>

        <Row indent={1}>
          <Var>proj</Var><Assign />
          <span className="mc-expr">(D<Sub>oct</Sub> − side<Sub>eq</Sub>)/2 = ({D_oct} − {side_equiv.toFixed(2)})/2</span>
          <Eq /><Res>{proj.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>footing projection beyond face of pedestal</Cmt>
        </Row>

        {/* Diagram – operating+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            <rect x="20" y="30" width="320" height="50" fill="#e8f4e8" stroke="#4a7a4a" strokeWidth={1} />
            <rect x="88" y="30" width="184" height="50" fill="#c8e8c8" stroke="#2a6a2a" strokeWidth={1.2} />
            {(() => {
              const fW = 320;
              const fX0 = 20;
              const KD_frac_op = KD_str_op / D_oct;
              const zeroX = fX0 + KD_frac_op * fW;
              const highX = fX0 + fW;
              const baseY = 80;
              const maxPressH = 45;
              return (
                <>
                  <polygon
                    points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`}
                    fill="#c0daff" stroke="#1a5fa8" strokeWidth={1}
                  />
                  <line x1={zeroX} y1={baseY} x2={zeroX} y2={baseY - 5} stroke="#888" strokeWidth={0.8} strokeDasharray="3,2" />
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">{SB_str_op.toFixed(2)} ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {(() => {
                    const faceX = highX - (proj / D_oct) * fW;
                    const compLen = D_oct - KD_str_op;
                    const sbFaceH = maxPressH * (compLen - proj) / compLen;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">{SB_face_op.toFixed(2)}</text>
                      </>
                    );
                  })()}
                  <line x1={highX - (proj / D_oct) * fW} y1={100} x2={highX} y2={100} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (proj / D_oct / 2) * fW} y={112} fill="#e06020" fontSize="7" textAnchor="middle">{proj.toFixed(2)} ft</text>
                  <line x1={zeroX} y1={108} x2={highX} y2={108} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={118} fill="#444" fontSize="7" textAnchor="middle">{dist_from_far_edge_op.toFixed(2)} ft (comp. zone)</text>
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = {SC_op.toFixed(2)}</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">SB·({dist_from_far_edge_op.toFixed(2)}−proj)/{dist_from_far_edge_op.toFixed(2)} = {SB_str_op.toFixed(2)}·({dist_from_far_edge_op.toFixed(2)}−{proj.toFixed(2)})/{dist_from_far_edge_op.toFixed(2)}</span>
          <Eq /><Res>{SB_face_op.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">1.2·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 1.2({W_ftg_soil.toFixed(1)})/{A_oct}</span>
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
          <span className="mc-expr">M<Sub>u</Sub> / P<Sub>u</Sub> = {Mu_str_emp.toFixed(0)} / {Pu_emp_str.toFixed(1)}</span>
          <Eq /><Res>{e_str_emp.toFixed(2)}</Res><Unit>ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>e/D</Var><Assign />
          <span className="mc-expr">{e_str_emp.toFixed(2)} / {D_oct}</span>
          <Eq /><Res>{eD_str_emp.toFixed(3)}</Res>
          <span style={{ marginLeft: 8 }}>{">"} 0.132 (flat) → Table 2</span>
        </Row>

        <Row indent={1}>
          <InputVar>L</InputVar><Assign />
          <span className="mc-expr">{L_str_emp}</span>
          <span style={{ marginLeft: 16 }}><InputVar>K</InputVar><Assign /><span className="mc-expr">{K_str_emp}</span></span>
          <Ref>(flat, Table 2, e/D = {eD_str_emp.toFixed(3)})</Ref>
        </Row>

        <Row indent={1}>
          <Var>KD</Var><Assign />
          <span className="mc-expr">K × D<Sub>oct</Sub> = {K_str_emp} × {D_oct}</span>
          <Eq /><Res>{KD_str_emp.toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>distance from low-pressure edge to zero-pressure line</Cmt>
        </Row>

        <Row indent={1}>
          <Var>SB</Var><Assign />
          <span className="mc-expr">L·P<Sub>u</Sub>/A<Sub>oct</Sub> = {L_str_emp}({Pu_emp_str.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{SB_str_emp.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        {/* Diagram – empty+wind */}
        <div style={{ marginLeft: 24, marginTop: 10, marginBottom: 10 }}>
          <svg viewBox="0 0 360 120" style={{ width: 360, height: 120 }}>
            {(() => {
              const fW = 320;
              const fX0 = 20;
              const KD_frac_emp = KD_str_emp / D_oct;
              const zeroX = fX0 + KD_frac_emp * fW;
              const highX = fX0 + fW;
              const baseY = 80;
              const maxPressH = 45;
              return (
                <>
                  <rect x={fX0} y={baseY} width={fW} height={8} fill="#d0e8d0" stroke="#4a7a4a" strokeWidth={0.7} />
                  <polygon
                    points={`${zeroX},${baseY} ${highX},${baseY} ${highX},${baseY - maxPressH}`}
                    fill="#c0daff" stroke="#1a5fa8" strokeWidth={1}
                  />
                  <text x={highX - 2} y={baseY - maxPressH - 3} fill="#1a3a8f" fontSize="8" textAnchor="end">{SB_str_emp.toFixed(2)} ksf</text>
                  <text x={zeroX - 2} y={baseY - 8} fill="#555" fontSize="7">zero</text>
                  {(() => {
                    const faceX = highX - (proj / D_oct) * fW;
                    const compLen = comp_len_emp;
                    const sbFaceH = maxPressH * (compLen - proj) / compLen;
                    return (
                      <>
                        <line x1={faceX} y1={20} x2={faceX} y2={baseY + 10} stroke="#e06020" strokeWidth={1} strokeDasharray="3,2" />
                        <text x={faceX - 2} y={22} fill="#e06020" fontSize="7" textAnchor="end">face</text>
                        <text x={faceX + 1} y={baseY - sbFaceH - 2} fill="#444" fontSize="7">{SB_face_emp.toFixed(2)}</text>
                      </>
                    );
                  })()}
                  <line x1={zeroX} y1={100} x2={highX} y2={100} stroke="#444" strokeWidth={0.8} />
                  <text x={(zeroX + highX) / 2} y={112} fill="#444" fontSize="7" textAnchor="middle">{comp_len_emp.toFixed(2)} ft (comp. zone)</text>
                  <line x1={highX - (proj / D_oct) * fW} y1={107} x2={highX} y2={107} stroke="#e06020" strokeWidth={0.8} />
                  <text x={highX - (proj / D_oct / 2) * fW} y={118} fill="#e06020" fontSize="7" textAnchor="middle">{proj.toFixed(2)} ft</text>
                  <text x={fX0 + 4} y={92} fill="#4a7a4a" fontSize="7">soil+conc. = {SC_emp.toFixed(2)}</text>
                  <line x1={fX0} y1={100} x2={zeroX} y2={100} stroke="#888" strokeWidth={0.8} />
                  <text x={(fX0 + zeroX) / 2} y={112} fill="#888" fontSize="7" textAnchor="middle">{KD_str_emp.toFixed(2)} ft (KD)</text>
                </>
              );
            })()}
          </svg>
        </div>

        <Row indent={1}>
          <Var>SB<Sub>face</Sub></Var><Assign />
          <span className="mc-expr">SB·(comp.zone−proj)/comp.zone = {SB_str_emp.toFixed(2)}·({comp_len_emp.toFixed(2)}−{proj.toFixed(2)})/{comp_len_emp.toFixed(2)}</span>
          <Eq /><Res>{SB_face_emp.toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>Soil+Conc.</Var><Assign />
          <span className="mc-expr">0.9·W<Sub>ftg+soil</Sub>/A<Sub>oct</Sub> = 0.9({W_ftg_soil.toFixed(1)})/{A_oct}</span>
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
          <InputVar>t<Sub>ftg,in</Sub></InputVar><Assign />
          <span className="mc-expr">18</span><Unit>in</Unit>
          <Cmt>footing thickness</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>cover</InputVar><Assign />
          <span className="mc-expr">3</span><Unit>in</Unit>
          <Cmt>clear cover (cast against soil)</Cmt>
        </Row>
        <Row indent={1}>
          <InputVar>d<Sub>bar</Sub></InputVar><Assign />
          <span className="mc-expr">1.125</span><Unit>in</Unit>
          <Cmt>bar diameter (approx. for #9 bar — conservative)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>d</Var><Assign />
          <span className="mc-expr">t<Sub>ftg,in</Sub> − cover − d<Sub>bar</Sub>/2 = 18 − 3 − 1.125</span>
          <Eq /><Res>{d_eff.toFixed(3)}</Res><Unit>in</Unit>
          <Cmt>effective depth</Cmt>
        </Row>

        <Row indent={1}>
          <InputVar>b</InputVar><Assign />
          <span className="mc-expr">12</span><Unit>in</Unit>
          <Cmt>unit strip width (1 ft)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>F</Var><Assign />
          <span className="mc-expr">b·d²/12,000 = 12({d_eff.toFixed(3)})²/12,000</span>
          <Eq /><Res>{F_factor.toFixed(3)}</Res>
        </Row>

        <Row indent={1}>
          <Var>K<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub>/F = {Mu_ftg_emp.toFixed(2)}/{F_factor.toFixed(3)}</span>
          <Eq /><Res>{Ku_rebar.toFixed(1)}</Res>
        </Row>

        <Row indent={1}>
          <InputVar>a<Sub>u</Sub></InputVar><Assign />
          <span className="mc-expr">{au}</span>
          <Cmt>from K<Sub>u</Sub> design table</Cmt>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">M<Sub>u,ftg</Sub>/(a<Sub>u</Sub>·d) = {Mu_ftg_emp.toFixed(2)}/({au} × {d_eff.toFixed(3)})</span>
          <Eq /><Res>{As_req.toFixed(2)}</Res><Unit>in²/ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>A<Sub>s,min</Sub></Var><Assign />
          <span className="mc-expr">0.0033 × 12 × d = 0.0033 × 12 × {d_eff.toFixed(3)}</span>
          <Eq /><Res>{As_min.toFixed(2)}</Res><Unit>in²/ft</Unit>
          <span style={{ color: "#b00", fontWeight: "bold", marginLeft: 8 }}>← Controls</span>
        </Row>

        <Row indent={1}>
          <Var>(4/3)A<Sub>s,req</Sub></Var><Assign />
          <span className="mc-expr">(4/3)({As_req.toFixed(2)})</span>
          <Eq /><Res>{As_43.toFixed(2)}</Res><Unit>in²/ft</Unit>
        </Row>

        <BulletResult>Use #6 @ 9 in E.W. (bottom); A<Sub>s</Sub> = 0.59 in²/ft</BulletResult>

        {/* ── Shear Check ─────────────────────────────── */}
        <SectionHeader>SHEAR CHECK</SectionHeader>
        <SubHeader>Beam Shear — Empty + Wind (Controls)</SubHeader>

        <Row indent={1}>
          <Var>d/12</Var><Assign />
          <span className="mc-expr">{d_eff.toFixed(3)}/12</span>
          <Eq /><Res>{(d_eff / 12).toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>effective depth converted to feet</Cmt>
        </Row>

        <Row indent={1}>
          <Var>SB<Sub>at d</Sub></Var><Assign />
          <span className="mc-expr">
            SB·(comp.zone − proj + d/12)/comp.zone = {SB_str_emp.toFixed(2)}·({comp_len_emp.toFixed(2)} − {proj.toFixed(2)} + {(d_eff / 12).toFixed(2)})/{comp_len_emp.toFixed(2)}
          </span>
          <Eq /><Res>6.60</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>V<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">(SB<Sub>at d</Sub> − Soil+Conc.)(proj − d/12) + (SB − SB<Sub>at d</Sub>)(proj − d/12)/2</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= (6.60 − {SC_emp.toFixed(2)})(2.81 − {(d_eff / 12).toFixed(2)}) + (8.50 − 6.60)(2.81 − {(d_eff / 12).toFixed(2)})/2</span>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= 9.98 + 1.57</span>
          <Eq /><Res>11.55</Res><Unit>kip/ft</Unit>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u</Sub>·1000/(b·d) = 11.55(1000)/(12 × {d_eff.toFixed(3)})</span>
          <Eq /><Res>{vu_beam.toFixed(1)}</Res><Unit>psi</Unit>
        </Row>

        <Row indent={1}>
          <InputVar>φ</InputVar><Assign />
          <span className="mc-expr">0.75</span>
          <Cmt>shear strength reduction factor (ACI 318-05 §9.3.2.3)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">2φ√f′<Sub>c</Sub> = 2(0.75)√4,000</span>
          <Eq /><Res>{vc_beam_allow.toFixed(1)}</Res><Unit>psi</Unit>
          <Ref>ACI 318-05 §11.3.1</Ref>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Eq />
          <Res>{vu_beam.toFixed(1)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>φv<Sub>c</Sub> = {vc_beam_allow.toFixed(1)} psi</span>
          <OK />
        </Row>

        <Divider />
        <SubHeader>Punching Shear — Test Load (Load Comb. 7: 1.4·D<Sub>t</Sub>)</SubHeader>

        <Row indent={1}>
          <Var>P<Sub>u</Sub>/A<Sub>oct</Sub></Var><Assign />
          <span className="mc-expr">1.4·P<Sub>t</Sub>/A<Sub>oct</Sub> = 1.4({Pt.toFixed(1)})/{A_oct}</span>
          <Eq /><Res>{(1.4 * Pt / A_oct).toFixed(2)}</Res><Unit>ksf</Unit>
        </Row>

        <Row indent={1}>
          <Var>c + d</Var><Assign />
          <span className="mc-expr">side<Sub>eq</Sub> + d/12 = {side_equiv.toFixed(2)} + {(d_eff / 12).toFixed(2)}</span>
          <Eq /><Res>{(side_equiv + d_eff / 12).toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>critical punching perimeter side length</Cmt>
        </Row>

        <Row indent={1}>
          <Var>b<Sub>o</Sub></Var><Assign />
          <span className="mc-expr">4(c + d) = 4({(side_equiv + d_eff / 12).toFixed(2)})</span>
          <Eq /><Res>{(4 * (side_equiv + d_eff / 12)).toFixed(2)}</Res><Unit>ft</Unit>
          <Cmt>critical perimeter length</Cmt>
        </Row>

        <Row indent={1}>
          <InputVar>α<Sub>s</Sub></InputVar><Assign />
          <span className="mc-expr">{alpha_s}</span>
          <Cmt>interior column factor (ACI 318-05)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>SC<Sub>punch</Sub></Var><Assign />
          <span className="mc-expr">(1.4/1.2)·Soil+Conc.<Sub>op</Sub> = (1.4/1.2)·{SC_op.toFixed(4)}</span>
          <Eq /><Res>{SC_punch.toFixed(2)}</Res><Unit>ksf</Unit>
          <Cmt>factored soil+concrete counterweight for test load combination</Cmt>
        </Row>

        <Row indent={1}>
          <Var>V<Sub>u,punch</Sub></Var><Assign />
          <span className="mc-expr">
            (P<Sub>u</Sub>/A − SC<Sub>punch</Sub>)·(A<Sub>oct</Sub> − (c+d)²)
            = ({(1.4 * Pt / A_oct).toFixed(2)} − {SC_punch.toFixed(2)})({A_oct} − {(side_d * side_d).toFixed(1)})
          </span>
        </Row>
        <Row indent={2}>
          <Eq /><Res>{Vu_punch_val.toFixed(0)}</Res><Unit>kip</Unit>
        </Row>

        <Row indent={1}>
          <Var>v<Sub>u</Sub></Var><Assign />
          <span className="mc-expr">V<Sub>u,punch</Sub>·1000/(d·b<Sub>o</Sub>·12) = {Vu_punch_val.toFixed(0)}(1000)/({d_eff.toFixed(3)}·{(4 * (side_equiv + d_eff / 12)).toFixed(2)}·12)</span>
          <Eq /><Res>{vu_punch.toFixed(0)}</Res><Unit>psi</Unit>
        </Row>

        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">φ·(α<Sub>s</Sub>·d/b<Sub>o</Sub> + 2)·√f′<Sub>c</Sub></span>
          <Ref>ACI 318-05 Eq. 11-34</Ref>
        </Row>
        <Row indent={2}>
          <span className="mc-expr">= 0.75[{alpha_s}({(d_eff / 12).toFixed(2)}/{(4 * (side_equiv + d_eff / 12)).toFixed(2)}) + 2]√4,000</span>
          <Eq /><Res>{vc_punch1.toFixed(0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {vu_punch.toFixed(0)} psi</span>
          <OK />
        </Row>

        <Row indent={1}>
          <Var>φv<Sub>c</Sub></Var><Assign />
          <span className="mc-expr">φ·4·√f′<Sub>c</Sub> = 0.75(4)√4,000</span>
          <Eq /><Res>{vc_punch2.toFixed(0)}</Res><Unit>psi</Unit>
          <span style={{ marginLeft: 6 }}>{">"} {vu_punch.toFixed(0)} psi</span>
          <OK />
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
          <span className="mc-expr">0.55</span>
          <Cmt>flexural strength reduction factor (plain concrete, ACI 318-05 §22.5)</Cmt>
        </Row>

        <Row indent={1}>
          <Var>M<Sub>u,top</Sub></Var><Assign />
          <span className="mc-expr">(1.4/1.2)·Soil+Conc.<Sub>op</Sub>·proj²/2 = {((1.4 / 1.2) * SC_op).toFixed(4)}({proj.toFixed(2)})²/2</span>
          <Eq /><Res>{Mu_top.toFixed(2)}</Res><Unit>kip·ft/ft</Unit>
          <Eq /><Res>{Mu_top_in.toFixed(0)}</Res><Unit>in·lb/in</Unit>
        </Row>

        <Row indent={1}>
          <Var>f′<Sub>t</Sub></Var><Assign />
          <span className="mc-expr">5·φ<Sub>flex</Sub>·√f′<Sub>c</Sub> = 5(0.55)√4,000</span>
          <Eq /><Res>{ft_flex.toFixed(1)}</Res><Unit>psi</Unit>
          <Ref>Eq. 16</Ref>
        </Row>

        <Row indent={1}>
          <Var>t<Sub>eff</Sub></Var><Assign />
          <span className="mc-expr">√(6·M<Sub>u,top</Sub>/f′<Sub>t</Sub>) = √(6·{Mu_top_in.toFixed(0)}/{ft_flex.toFixed(1)})</span>
          <Eq /><Res>{t_eff.toFixed(1)}</Res><Unit>in</Unit>
          <Ref>Eq. 18</Ref>
        </Row>

        <Row indent={1}>
          <Var>t<Sub>reqd</Sub></Var><Assign />
          <span className="mc-expr">t<Sub>eff</Sub> + 2 in (cast against soil) = {t_eff.toFixed(1)} + 2</span>
          <Eq /><Res>{t_reqd.toFixed(1)}</Res><Unit>in</Unit>
          <span style={{ marginLeft: 6 }}>{"<"}</span>
          <span className="mc-expr" style={{ marginLeft: 4 }}>t<Sub>ftg</Sub> = 18 in</span>
          <OK />
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
