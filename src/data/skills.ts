/**
 * PLACEHOLDER skills. Grouped as a record groups them, with a plain
 * self-rating on a five-step scale drawn the way a transcript draws a grade
 * point scale.
 *
 * The rating is a claim about yourself, so make it defensible or lower it.
 * Replace every group marked PLACEHOLDER before publishing.
 */

export interface SkillGroup {
  group: string;
  skills: { name: string; level: number }[];
}

export const skillGroups: SkillGroup[] = [
  {
    group: "PLACEHOLDER — agentic systems",
    skills: [
      { name: "PLACEHOLDER skill", level: 5 },
      { name: "PLACEHOLDER skill", level: 4 },
      { name: "PLACEHOLDER skill", level: 4 },
      { name: "PLACEHOLDER skill", level: 3 },
    ],
  },
  {
    group: "PLACEHOLDER — languages",
    skills: [
      { name: "PLACEHOLDER skill", level: 5 },
      { name: "PLACEHOLDER skill", level: 4 },
      { name: "PLACEHOLDER skill", level: 3 },
    ],
  },
  {
    group: "PLACEHOLDER — practice",
    skills: [
      { name: "PLACEHOLDER skill", level: 4 },
      { name: "PLACEHOLDER skill", level: 3 },
      { name: "PLACEHOLDER skill", level: 3 },
    ],
  },
];

export const SCALE = 5;
