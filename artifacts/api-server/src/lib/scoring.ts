// ─── Scoring Service ──────────────────────────────────────────────────────────
// Processes raw questionnaire answers and returns calculated sub-scale scores.
//
// Scale correction notes (raw stored values → scoring values):
//  Q2: stored 1=کاملا موافقم → scoring wants 5=کاملا موافقم → reverse: 6 - v
//  Q6: stored 1-5 → scoring wants 0-4 → subtract 1
//  Q7: stored 1=خیلی مهم است → scoring wants 3=خیلی مهم است → reverse: 4 - v

export interface Q1Scores {
  aggression: number;       // items 1-6  (خشم شخصی)
  competitiveAnger: number; // items 7-12 (پرخاشگری ابزاری)
  total: number;
}

export interface Q2Scores {
  emotionalExhaustion: number; // items 1, 5, 7
  total: number;
}

export interface Q3Scores {
  importance: number;                  // items 1, 4, 6
  psychologicalConsequences: number;   // items 2, 3, 5
  total: number;
  interpretation: string;
  interpretationLevel: "none" | "symptomatic" | "addicted";
}

export interface Q4Scores {
  total: number; // range 10-30 (only 10 valid items)
}

export interface Q5Scores {
  confidence: number; // items 1-6  (اطمینان)
  constancy: number;  // items 7-10 (پایداری)
  control: number;    // items 11-14 (کنترل)
  total: number;
}

export interface Q6Scores {
  tension: number;     // items 1, 17, 18, 24
  depression: number;  // items 7, 8, 16, 20
  anger: number;       // items 9, 15, 25, 29
  vigour: number;      // items 2, 19, 26, 30
  fatigue: number;     // items 4, 10, 14, 28
  confusion: number;   // items 3, 13, 23, 32
  calmness: number;    // items 6, 12, 22, 27
  happiness: number;   // items 5, 11, 21, 31
  positiveMood: number;
  negativeMood: number;
}

export interface Q7Scores {
  achievement: number;       // items 3, 12, 14, 21, 25, 28
  teamAffiliation: number;   // items 8, 18, 22
  fitness: number;           // items 6, 15, 24
  energyRelease: number;     // items 4, 5, 13, 16, 19
  situationalFactors: number;// items 9, 27, 30
  skillDevelopment: number;  // items 1, 10, 23
  friendship: number;        // items 2, 11, 20, 26
  fun: number;               // items 7, 17, 29
}

export interface Scores {
  q1: Q1Scores;
  q2: Q2Scores;
  q3: Q3Scores;
  q4: Q4Scores;
  q5: Q5Scores;
  q6: Q6Scores;
  q7: Q7Scores;
}

// Sum selected 1-based item indices from an array
function pick(arr: number[], items: number[]): number {
  return items.reduce((acc, i) => acc + (arr[i - 1] ?? 0), 0);
}

function rev5(v: number) { return 6 - v; }
function rev3(v: number) { return 4 - v; }

export function calculateScores(
  q1: number[],
  q2raw: number[],
  q3: number[],
  q4: number[],
  q5raw: number[],
  q6raw: number[],
  q7raw: number[],
): Scores {

  // ── Q1: Aggression (scale 1-5, no correction) ───────────────────────────
  const q1Scores: Q1Scores = {
    aggression:      pick(q1, [1, 2, 3, 4, 5, 6]),
    competitiveAnger:pick(q1, [7, 8, 9, 10, 11, 12]),
    total:           q1.reduce((a, b) => a + b, 0),
  };

  // ── Q2: Burnout (stored: 1=کاملا موافقم → scoring: 5=کاملا موافقم) ─────
  const q2 = q2raw.map(rev5);
  const q2Scores: Q2Scores = {
    emotionalExhaustion: pick(q2, [1, 5, 7]),
    total:               q2.reduce((a, b) => a + b, 0),
  };

  // ── Q3: Exercise Addiction (scale 1-5, correct direction) ───────────────
  const q3Total = pick(q3, [1, 2, 3, 4, 5, 6]);
  let interpretation: string;
  let interpretationLevel: Q3Scores["interpretationLevel"];
  if (q3Total <= 12) {
    interpretation = "بدون علائم اعتیاد به تمرین";
    interpretationLevel = "none";
  } else if (q3Total <= 23) {
    interpretation = "دارای علائم اعتیاد به تمرین";
    interpretationLevel = "symptomatic";
  } else {
    interpretation = "معتاد به تمرین";
    interpretationLevel = "addicted";
  }
  const q3Scores: Q3Scores = {
    importance:               pick(q3, [1, 4, 6]),
    psychologicalConsequences:pick(q3, [2, 3, 5]),
    total:                    q3Total,
    interpretation,
    interpretationLevel,
  };

  // ── Q4: Competitive Anxiety (scale 1-3) ─────────────────────────────────
  const excluded  = new Set([1, 4, 7, 10, 13]);
  const reverseQ4 = new Set([6, 11]);
  let q4Total = 0;
  for (let i = 0; i < q4.length; i++) {
    const item = i + 1;
    if (excluded.has(item)) continue;
    q4Total += reverseQ4.has(item) ? rev3(q4[i]) : q4[i];
  }
  const q4Scores: Q4Scores = { total: q4Total };

  // ── Q5: Mental Toughness (reverse items 4,7,8,9,10) ────────────────────
  const reverseQ5 = new Set([4, 7, 8, 9, 10]);
  const q5 = q5raw.map((v, i) => reverseQ5.has(i + 1) ? rev5(v) : v);
  const q5Scores: Q5Scores = {
    confidence: pick(q5, [1, 2, 3, 4, 5, 6]),
    constancy:  pick(q5, [7, 8, 9, 10]),
    control:    pick(q5, [11, 12, 13, 14]),
    total:      q5.reduce((a, b) => a + b, 0),
  };

  // ── Q6: Mood States (stored 1-5 → scoring 0-4) ──────────────────────────
  const q6 = q6raw.map(v => v - 1);
  const p6 = (items: number[]) => pick(q6.map(v => v + 1), items) - items.length;
  // pick uses 1-based; shift back to 0-based by subtracting count
  const tension    = p6([1, 17, 18, 24]);
  const depression = p6([7, 8, 16, 20]);
  const anger      = p6([9, 15, 25, 29]);
  const vigour     = p6([2, 19, 26, 30]);
  const fatigue    = p6([4, 10, 14, 28]);
  const confusion  = p6([3, 13, 23, 32]);
  const calmness   = p6([6, 12, 22, 27]);
  const happiness  = p6([5, 11, 21, 31]);
  const q6Scores: Q6Scores = {
    tension, depression, anger, vigour, fatigue, confusion, calmness, happiness,
    positiveMood: vigour + calmness + happiness,
    negativeMood: tension + depression + anger + fatigue + confusion,
  };

  // ── Q7: Participation Motivation (stored: 1=خیلی مهم → scoring: 3=خیلی مهم) ─
  const q7 = q7raw.map(rev3);
  const q7Scores: Q7Scores = {
    achievement:       pick(q7, [3, 12, 14, 21, 25, 28]),
    teamAffiliation:   pick(q7, [8, 18, 22]),
    fitness:           pick(q7, [6, 15, 24]),
    energyRelease:     pick(q7, [4, 5, 13, 16, 19]),
    situationalFactors:pick(q7, [9, 27, 30]),
    skillDevelopment:  pick(q7, [1, 10, 23]),
    friendship:        pick(q7, [2, 11, 20, 26]),
    fun:               pick(q7, [7, 17, 29]),
  };

  return {
    q1: q1Scores,
    q2: q2Scores,
    q3: q3Scores,
    q4: q4Scores,
    q5: q5Scores,
    q6: q6Scores,
    q7: q7Scores,
  };
}
