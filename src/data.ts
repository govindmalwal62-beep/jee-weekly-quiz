import { Question } from './types';

export const INITIAL_QUESTIONS: Question[] = [
  // ==================== PHYSICS (IDs: P1 - P5) ====================
  {
    id: 'P1',
    subject: 'physics',
    year: 'JEE Main 2023',
    text: 'A projectile is projected with a velocity u at an angle θ with the horizontal. The ratio of its kinetic energy at the maximum height to its initial kinetic energy is 1/4. What is the angle of projection θ?',
    options: [
      '30°',
      '45°',
      '60°',
      '90°'
    ],
    correctAnswer: 2, // 60°
    explanation: 'At maximum height, the vertical component of velocity becomes zero, and only the horizontal component remains: v = u * cos(θ). The kinetic energy at max height is K_max = 0.5 * m * (u * cos(θ))² = K_initial * cos²(θ). We are given K_max / K_initial = 1/4. Therefore, cos²(θ) = 1/4 => cos(θ) = 1/2 => θ = 60°.'
  },
  {
    id: 'P2',
    subject: 'physics',
    year: 'JEE Main 2022',
    text: 'An electromagnetic wave of frequency 5 GHz is travelling in a medium of relative permittivity 9 and relative permeability 1. The velocity of the electromagnetic wave in that medium is:',
    options: [
      '1.0 × 10⁸ m/s',
      '3.0 × 10⁸ m/s',
      '1.5 × 10⁸ m/s',
      '2.0 × 10⁸ m/s'
    ],
    correctAnswer: 0, // 1.0 × 10^8
    explanation: 'The speed of light in a medium is given by v = c / sqrt(ε_r * μ_r), where c is the speed of light in vacuum (3 × 10⁸ m/s). Given ε_r = 9 and μ_r = 1: v = (3 × 10⁸) / sqrt(9 * 1) = (3 × 10⁸) / 3 = 1.0 × 10⁸ m/s.'
  },
  {
    id: 'P3',
    subject: 'physics',
    year: 'JEE Main 2021',
    text: 'A steady current of 5 A flows through a cylindrical conductor of diameter 1.0 mm. If the conduction electron density is 8.5 × 10²⁸ m⁻³, the drift velocity of electrons is approximately:',
    options: [
      '0.047 mm/s',
      '0.47 mm/s',
      '4.7 mm/s',
      '47.0 mm/s'
    ],
    correctAnswer: 1, // 0.47 mm/s
    explanation: 'The formula for drift velocity is v_d = I / (n * e * A). Here, I = 5 A, n = 8.5 × 10²⁸ m⁻³, e = 1.6 × 10⁻¹⁹ C, and diameter d = 1.0 mm => radius r = 0.5 mm = 5 × 10⁻⁴ m. Area A = π * r² = 3.1416 * (25 × 10⁻⁸) = 7.854 × 10⁻⁷ m². Substituting values: v_d = 5 / (8.5 × 10²⁸ * 1.6 × 10⁻¹⁹ * 7.854 × 10⁻⁷) ≈ 4.7 × 10⁻⁴ m/s = 0.47 mm/s.'
  },
  {
    id: 'P4',
    subject: 'physics',
    year: 'JEE Main 2024',
    text: 'In a Young\'s Double Slit Experiment, the slit separation is 0.5 mm and the distance of screen from the slits is 1.5 m. If light of wavelength 6000 Å is used, the fringe width of the interference pattern is:',
    options: [
      '1.2 mm',
      '1.8 mm',
      '2.4 mm',
      '3.0 mm'
    ],
    correctAnswer: 1, // 1.8 mm
    explanation: 'Fringe width (β) is given by β = λ * D / d. Here, λ = 6000 Å = 6000 × 10⁻¹⁰ m = 6 × 10⁻⁷ m, D = 1.5 m, d = 0.5 mm = 5 × 10⁻⁴ m. β = (6 × 10⁻⁷ * 1.5) / (5 × 10⁻⁴) = (9 × 10⁻⁷) / (5 × 10⁻⁴) = 1.8 × 10⁻³ m = 1.8 mm.'
  },
  {
    id: 'P5',
    subject: 'physics',
    year: 'JEE Main 2022',
    text: 'A radioactive nucleus A undergoes a series of decays: A → A₁ → A₂ → A₃, where the particles/radiation emitted are α, β⁻, and γ respectively. If the mass number and atomic number of A are 238 and 92, the mass number and atomic number of A₃ respectively are:',
    options: [
      '234 and 90',
      '234 and 91',
      '238 and 91',
      '234 and 89'
    ],
    correctAnswer: 1, // 234 and 91
    explanation: '1. A(238, 92) undergoes α-decay (-4 mass, -2 atomic) to become A₁(234, 90).\n2. A₁(234, 90) undergoes β⁻-decay (no change in mass, +1 atomic) to become A₂(234, 91).\n3. A₂(234, 91) undergoes γ-emission (no change in mass/atomic) to become A₃(234, 91).\nThus, A₃ has mass number 234 and atomic number 91.'
  },

  // ==================== CHEMISTRY (IDs: C1 - C5) ====================
  {
    id: 'C1',
    subject: 'chemistry',
    year: 'JEE Main 2023',
    text: 'Which of the following diatomic molecular species/ions is diamagnetic and possesses the shortest bond length?',
    options: [
      'O₂²⁺',
      'O₂',
      'O₂⁻',
      'N₂⁻'
    ],
    correctAnswer: 0, // O2^2+
    explanation: 'O₂²⁺ contains 14 electrons, which gives it an electronic configuration identical to N₂. Its bond order is 3 (highest among the choices), which corresponds to the shortest bond length. Since there are no unpaired electrons in its molecular orbitals, it is diamagnetic. Other species like O₂ (paramagnetic, BO=2), O₂⁻ (paramagnetic, BO=1.5), and N₂⁻ (paramagnetic, BO=2.5) have lower bond orders.'
  },
  {
    id: 'C2',
    subject: 'chemistry',
    year: 'JEE Main 2022',
    text: 'What is the IUPAC description of the coordination complex [Co(NH₃)₅(CO₃)]Cl?',
    options: [
      'Pentaamminecarbonatocobalt(III) chloride',
      'Carbonatodecaamminecobaltate(II) chloride',
      'Pentaamminecarbonatocobalt(II) chloride',
      'Pentaamminecarbonatocobaltate(III) chloride'
    ],
    correctAnswer: 0, // Pentaamminecarbonatocobalt(III) chloride
    explanation: 'In [Co(NH₃)₅(CO₃)]Cl, the complex cation is [Co(NH₃)₅(CO₃)]⁺ and the counter-anion is Cl⁻. The ligands inside are 5 Ammine (NH₃, neutral) and 1 Carbonato (CO₃²⁻, charge of -2). Let x be the oxidation state of Cobalt: x + 5(0) + 1(-2) = +1 (since chlorine is -1) => x = +3. Hence, the metal is Cobalt(III). In the cation complex, we write "cobalt" (not cobaltate). Therefore, its IUPAC name is Pentaamminecarbonatocobalt(III) chloride.'
  },
  {
    id: 'C3',
    subject: 'chemistry',
    year: 'JEE Main 2024',
    text: 'Which of the following organic compounds will yield a highly offensive-smelling isocyanide product upon heating with chloroform and ethanolic KOH (Carbylamine test)?',
    options: [
      'N-Methylaniline',
      'Aniline',
      'Trimethylamine',
      'Diethylamine'
    ],
    correctAnswer: 1, // Aniline
    explanation: 'The Carbylamine reaction (isocyanide test) is given exclusively by primary aliphatic and primary aromatic amines. Among the choices:\n- Aniline (C₆H₅NH₂) is a primary aromatic amine and reacts successfully to form phenyl isocyanide (foul smelling).\n- N-Methylaniline is a secondary amine (no reaction).\n- Diethylamine is a secondary amine (no reaction).\n- Trimethylamine is a tertiary amine (no reaction).'
  },
  {
    id: 'C4',
    subject: 'chemistry',
    year: 'JEE Main 2021',
    text: 'Identify the correct chronological order of the hydrides of Group 15 elements with respect to their increasing reducing power:',
    options: [
      'NH₃ < PH₃ < AsH₃ < SbH₃ < BiH₃',
      'BiH₃ < SbH₃ < AsH₃ < PH₃ < NH₃',
      'NH₃ < PH₃ < BiH₃ < SbH₃ < AsH₃',
      'PH₃ < NH₃ < AsH₃ < SbH₃ < BiH₃'
    ],
    correctAnswer: 0, // NH3 < PH3 < AsH3 < SbH3 < BiH3
    explanation: 'Down group 15, the size of the central atom increases, causing the M-H (Metal-Hydrogen) bond length to increase and bond dissociation energy to decrease. Consequently, the ease of releasing hydrogen increases, meaning reducing power increases from top to bottom. Thus: NH₃ < PH₃ < AsH₃ < SbH₃ < BiH₃. NH₃ is the weakest reducing agent, and BiH₃ is the strongest.'
  },
  {
    id: 'C5',
    subject: 'chemistry',
    year: 'JEE Main 2020',
    text: 'For a first-order chemical reaction, the time required for 99.9% completion is approximately how many times the half-life (t_1/2) of that same reaction?',
    options: [
      '10 times',
      '5 times',
      '3 times',
      '2 times'
    ],
    correctAnswer: 0, // 10 times
    explanation: 'For a first-order reaction: t = (2.303 / k) * log(a / (a - x)).\n- For 99.9% completion, x = 0.999a, so a - x = 0.001a. Hence, t_99.9% = (2.303 / k) * log(1000) = (2.303 / k) * 3 = 6.909 / k.\n- The half-life t_50% (or t_1/2) is given by t_1/2 = 0.693 / k.\nDividing the two: t_99.9% / t_1/2 = 6.909 / 0.693 ≈ 10. Therefore, the time required for 99.9% completion is 10 times the half-life.'
  },

  // ==================== MATHEMATICS (IDs: M1 - M5) ====================
  {
    id: 'M1',
    subject: 'maths',
    year: 'JEE Main 2023',
    text: 'Find the value of the limit as x approaches 0: lim (x → 0) (e^(x²) - cos(x)) / x²:',
    options: [
      '1/2',
      '1',
      '3/2',
      '2'
    ],
    correctAnswer: 2, // 3/2
    explanation: 'Using Taylor series expansions near x = 0:\n- e^(x²) = 1 + x² + x⁴/2! + ...\n- cos(x) = 1 - x²/2! + x⁴/4! - ...\nNumerator = e^(x²) - cos(x) = (1 + x² + ...) - (1 - x²/2 + ...) = 1.5 * x² + O(x⁴).\nDenominator is x².\nTherefore, lim (x → 0) (e^(x²) - cos(x)) / x² = lim (x → 0) (1.5 * x² + O(x⁴)) / x² = 1.5 = 3/2.'
  },
  {
    id: 'M2',
    subject: 'maths',
    year: 'JEE Main 2022',
    text: 'If the linear system of equations x + y + z = 6, x + 2y + 3z = 10, and x + 2y + λz = μ has infinitely many solutions, find the value of λ + μ:',
    options: [
      '11',
      '13',
      '15',
      '21'
    ],
    correctAnswer: 1, // 13
    explanation: 'For a system to have infinitely many solutions, the determinant of the coefficients must be zero: Δ = 0. Also, Δ_x = Δ_y = Δ_z = 0.\nEvaluating Δ:\n| 1  1  1 |\n| 1  2  3 | = 1*(2λ - 6) - 1*(λ - 3) + 1*(2 - 2) = λ - 3.\nThus, for Δ = 0, we must have λ = 3.\nSubstituting λ = 3, the second equation is x + 2y + 3z = 10 and the third is x + 2y + 3z = μ. For consistency and infinite solutions, these two planes must coincide, meaning we must have μ = 10.\nTherefore, λ = 3 and μ = 10, giving λ + μ = 13.'
  },
  {
    id: 'M3',
    subject: 'maths',
    year: 'JEE Main 2024',
    text: 'Find the area (in sq. units) of the bounded region enclosed between the parabolic curve y² = 4x and the straight line y = 2x:',
    options: [
      '1/6',
      '1/3',
      '2/3',
      '1/2'
    ],
    correctAnswer: 1, // 1/3
    explanation: 'Find intersection points: Substitutes y = 2x into y² = 4x => (2x)² = 4x => 4x² = 4x => 4x(x - 1) = 0 => x = 0 and x = 1.\nFor x ∈ [0, 1], the upper boundary is y = 2*sqrt(x) and the lower boundary is y = 2x.\nArea = ∫[0 to 1] (2 * x^(1/2) - 2x) dx = [ 2 * (2/3) * x^(3/2) - x² ][from 0 to 1] = 4/3 - 1 = 1/3 square units.'
  },
  {
    id: 'M4',
    subject: 'maths',
    year: 'JEE Main 2021',
    text: 'If z is a complex number such that |z - 2 + i| = |z - 4 - 3i|, then the geometric locus of z represents a straight line with slope equal to:',
    options: [
      '-1/2',
      '2',
      '-1',
      '-2'
    ],
    correctAnswer: 0, // -1/2
    explanation: 'The equation |z - z₁| = |z - z₂| represents the perpendicular bisector of the line segment joining complex points z₁ and z₂.\nHere, z₁ = 2 - i (represented as coordinates (2, -1)) and z₂ = 4 + 3i (represented as coordinates (4, 3)).\nThe slope of the line joining z₁ and z₂ is m₁ = (3 - (-1)) / (4 - 2) = 4 / 2 = 2.\nThe slope m₂ of the perpendicular bisector is given by m₁ * m₂ = -1 => 2 * m₂ = -1 => m₂ = -1/2.'
  },
  {
    id: 'M5',
    subject: 'maths',
    year: 'JEE Main 2023',
    text: 'Two symmetrical fair six-sided dice are thrown simultaneously. What is the probability that the sum of the numbers appearing on their faces is a prime number?',
    options: [
      '5/12',
      '7/18',
      '1/2',
      '11/36'
    ],
    correctAnswer: 0, // 5/12
    explanation: 'The list of possible sums when throwing two dice ranges from 2 to 12. Prime sums in this range are 2, 3, 5, 7, and 11.\nLet\'s count favorable pairs:\n- Sum = 2: (1,1) [1 outcome]\n- Sum = 3: (1,2), (2,1) [2 outcomes]\n- Sum = 5: (1,4), (2,3), (3,2), (4,1) [4 outcomes]\n- Sum = 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) [6 outcomes]\n- Sum = 11: (5,6), (6,5) [2 outcomes]\nTotal favorable outcomes = 1 + 2 + 4 + 6 + 2 = 15 outcomes.\nTotal outcomes = 6 × 6 = 36 outcomes.\nProbability = 15 / 36 = 5 / 12.'
  }
];

export const PRACTICAL_SUGGESTIONS = [
  { id: 'guess', text: 'Avoid random guessing', desc: 'JEE Main has -1 negative marking. Educated elimination is better than blind guessing.' },
  { id: 'weak', text: 'Improve weak chapters', desc: 'Analyze your performance frequently and dedicate extra revision hours to weaker subjects.' },
  { id: 'formulas', text: 'Revise formulas regularly', desc: 'Maintain a cheat sheet for Physics and Math formulas and go through them daily.' },
  { id: 'mock', text: 'Practice mock tests daily', desc: 'Solving standard 3-hour mock tests builds required mental stamina and muscle memory.' },
  { id: 'time', text: 'Improve time management', desc: 'Spend no more than 45 mins on Chemistry, leaving max duration for Physics and Math analysis.' },
  { id: 'accuracy', text: 'Increase accuracy before speed', desc: 'Aim to solve fewer questions with 100% correct accuracy rather than rushing and getting negative marks.' },
  { id: 'ncert', text: 'Focus on NCERT for Chemistry', desc: 'Inorganic and Organic Chemistry in JEE Main are heavily based on NCERT line-by-line questions.' },
  { id: 'schedule', text: 'Maintain proper revision schedule', desc: 'Set aside the last 2 hours of your study schedule strictly for structured revision exercises.' }
];

export const DEFAULT_ADMIN_PASSWORD = 'admin';
export const DEFAULT_EXAM_DURATION = 60 * 60; // 60 minutes in seconds
