import type { Grade, Topic } from '@/types';

// 25 topics across grades 4-8, ordered roughly by Common Core sequencing.
// IDs are stable so they can be referenced from Supabase rows.
export const TOPICS: Topic[] = [
  // Grade 4 -----------------------------------------------------------------
  {
    id: 'g4-multidigit-mult',
    grade: 4,
    order: 1,
    title: 'Multi-Digit Multiplication',
    description: 'Multiply 2- and 3-digit numbers using the standard algorithm and area models.',
    prerequisites: [],
    commonCoreStandard: '4.NBT.B.5',
  },
  {
    id: 'g4-multidigit-div',
    grade: 4,
    order: 2,
    title: 'Multi-Digit Division',
    description: 'Divide 4-digit numbers by 1-digit divisors with and without remainders.',
    prerequisites: ['g4-multidigit-mult'],
    commonCoreStandard: '4.NBT.B.6',
  },
  {
    id: 'g4-equiv-fractions',
    grade: 4,
    order: 3,
    title: 'Equivalent Fractions',
    description: 'Recognize and generate equivalent fractions; compare fractions.',
    prerequisites: ['g4-multidigit-mult'],
    commonCoreStandard: '4.NF.A.1',
  },
  {
    id: 'g4-fraction-add-sub',
    grade: 4,
    order: 4,
    title: 'Adding & Subtracting Fractions',
    description: 'Add and subtract fractions with like denominators.',
    prerequisites: ['g4-equiv-fractions'],
    commonCoreStandard: '4.NF.B.3',
  },
  {
    id: 'g4-fraction-mult-whole',
    grade: 4,
    order: 5,
    title: 'Multiplying Fractions by Whole Numbers',
    description: 'Multiply a fraction by a whole number; solve real-world problems.',
    prerequisites: ['g4-fraction-add-sub'],
    commonCoreStandard: '4.NF.B.4',
  },

  // Grade 5 -----------------------------------------------------------------
  {
    id: 'g5-decimal-place-value',
    grade: 5,
    order: 1,
    title: 'Decimal Place Value',
    description: 'Read, write, and compare decimals to thousandths.',
    prerequisites: ['g4-fraction-mult-whole'],
    commonCoreStandard: '5.NBT.A.3',
  },
  {
    id: 'g5-decimal-ops',
    grade: 5,
    order: 2,
    title: 'Decimal Operations',
    description: 'Add, subtract, multiply, and divide decimals to hundredths.',
    prerequisites: ['g5-decimal-place-value'],
    commonCoreStandard: '5.NBT.B.7',
  },
  {
    id: 'g5-fraction-mult-div',
    grade: 5,
    order: 3,
    title: 'Fraction Multiplication & Division',
    description: 'Multiply and divide fractions by fractions and whole numbers.',
    prerequisites: ['g4-fraction-mult-whole'],
    commonCoreStandard: '5.NF.B',
  },
  {
    id: 'g5-volume',
    grade: 5,
    order: 4,
    title: 'Volume of Rectangular Prisms',
    description: 'Find volume using unit cubes and the V = l × w × h formula.',
    prerequisites: ['g5-decimal-ops'],
    commonCoreStandard: '5.MD.C.5',
  },
  {
    id: 'g5-order-of-ops',
    grade: 5,
    order: 5,
    title: 'Order of Operations',
    description: 'Evaluate expressions using parentheses, brackets, and PEMDAS.',
    prerequisites: ['g5-decimal-ops'],
    commonCoreStandard: '5.OA.A.1',
  },

  // Grade 6 -----------------------------------------------------------------
  {
    id: 'g6-ratios',
    grade: 6,
    order: 1,
    title: 'Ratios & Unit Rates',
    description: 'Understand ratio language and use unit rates to solve problems.',
    prerequisites: ['g5-fraction-mult-div'],
    commonCoreStandard: '6.RP.A.1',
  },
  {
    id: 'g6-percent',
    grade: 6,
    order: 2,
    title: 'Percent Problems',
    description: 'Find a percent of a quantity; solve problems involving discounts and tax.',
    prerequisites: ['g6-ratios'],
    commonCoreStandard: '6.RP.A.3.c',
  },
  {
    id: 'g6-fraction-div',
    grade: 6,
    order: 3,
    title: 'Dividing Fractions',
    description: 'Interpret and compute quotients of fractions; word problems.',
    prerequisites: ['g5-fraction-mult-div'],
    commonCoreStandard: '6.NS.A.1',
  },
  {
    id: 'g6-negatives',
    grade: 6,
    order: 4,
    title: 'Integers & the Number Line',
    description: 'Locate, compare, and order positive and negative rational numbers.',
    prerequisites: ['g5-decimal-ops'],
    commonCoreStandard: '6.NS.C.6',
  },
  {
    id: 'g6-expressions',
    grade: 6,
    order: 5,
    title: 'Algebraic Expressions',
    description: 'Read, write, and evaluate expressions with variables.',
    prerequisites: ['g5-order-of-ops'],
    commonCoreStandard: '6.EE.A.2',
  },

  // Grade 7 -----------------------------------------------------------------
  {
    id: 'g7-proportional',
    grade: 7,
    order: 1,
    title: 'Proportional Relationships',
    description: 'Recognize, represent, and solve proportional relationships.',
    prerequisites: ['g6-ratios'],
    commonCoreStandard: '7.RP.A.2',
  },
  {
    id: 'g7-rational-ops',
    grade: 7,
    order: 2,
    title: 'Operations with Rational Numbers',
    description: 'Add, subtract, multiply, and divide positive and negative rationals.',
    prerequisites: ['g6-negatives'],
    commonCoreStandard: '7.NS.A.1',
  },
  {
    id: 'g7-linear-eq',
    grade: 7,
    order: 3,
    title: 'Solving Linear Equations',
    description: 'Solve multi-step equations of the form px + q = r and p(x + q) = r.',
    prerequisites: ['g6-expressions', 'g7-rational-ops'],
    commonCoreStandard: '7.EE.B.4',
  },
  {
    id: 'g7-probability',
    grade: 7,
    order: 4,
    title: 'Probability of Simple Events',
    description: 'Find theoretical and experimental probability of chance events.',
    prerequisites: ['g6-percent'],
    commonCoreStandard: '7.SP.C.5',
  },
  {
    id: 'g7-circles',
    grade: 7,
    order: 5,
    title: 'Area & Circumference of Circles',
    description: 'Use π to find circumference and area; solve real-world problems.',
    prerequisites: ['g7-proportional'],
    commonCoreStandard: '7.G.B.4',
  },

  // Grade 8 -----------------------------------------------------------------
  {
    id: 'g8-exponents',
    grade: 8,
    order: 1,
    title: 'Exponents & Scientific Notation',
    description: 'Apply properties of integer exponents; work with scientific notation.',
    prerequisites: ['g7-rational-ops'],
    commonCoreStandard: '8.EE.A.1',
  },
  {
    id: 'g8-linear-functions',
    grade: 8,
    order: 2,
    title: 'Linear Functions',
    description: 'Interpret and graph linear functions; rate of change and y-intercept.',
    prerequisites: ['g7-linear-eq'],
    commonCoreStandard: '8.F.A.3',
  },
  {
    id: 'g8-systems',
    grade: 8,
    order: 3,
    title: 'Systems of Linear Equations',
    description: 'Solve systems graphically and algebraically (substitution, elimination).',
    prerequisites: ['g8-linear-functions'],
    commonCoreStandard: '8.EE.C.8',
  },
  {
    id: 'g8-pythagorean',
    grade: 8,
    order: 4,
    title: 'Pythagorean Theorem',
    description: 'Apply the Pythagorean theorem to find missing side lengths.',
    prerequisites: ['g7-rational-ops'],
    commonCoreStandard: '8.G.B.7',
  },
  {
    id: 'g8-scatter-plots',
    grade: 8,
    order: 5,
    title: 'Scatter Plots & Bivariate Data',
    description: 'Construct and interpret scatter plots; identify linear association.',
    prerequisites: ['g8-linear-functions'],
    commonCoreStandard: '8.SP.A.1',
  },
];

export function topicsForGrade(grade: Grade): Topic[] {
  return TOPICS.filter((t) => t.grade === grade).sort((a, b) => a.order - b.order);
}

export function findTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function firstTopicForGrade(grade: Grade): Topic {
  return topicsForGrade(grade)[0];
}

/**
 * Given a student's progress map, returns the next topic they should work on.
 * Falls back to the first topic for their grade.
 */
export function nextTopicForStudent(
  grade: Grade,
  progressByTopic: Record<string, { status: string; mastery_score: number }>,
): Topic {
  const topics = topicsForGrade(grade);
  for (const t of topics) {
    const p = progressByTopic[t.id];
    if (!p || p.status !== 'mastered') return t;
  }
  return topics[topics.length - 1];
}

/**
 * A topic is unlocked if all of its prerequisites are mastered (or there are none).
 */
export function isTopicUnlocked(
  topic: Topic,
  progressByTopic: Record<string, { status: string; mastery_score: number }>,
): boolean {
  if (topic.prerequisites.length === 0) return true;
  return topic.prerequisites.every((id) => progressByTopic[id]?.status === 'mastered');
}
