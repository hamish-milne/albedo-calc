import {
  type Character,
  Weapon,
  type Armor,
  type Skill,
  WeaponRangeNames,
} from "./schema";

export enum WoundState {
  Uninjured = 0,
  Wounded = 1,
  Crippled = 2,
  Incapacitated = 3,
  Devastated = 4,
}
export const WoundStateNames = Object.keys(WoundState).filter((x) =>
  isNaN(Number(x))
);

export enum Range {
  Close = 0,
  Short = 1,
  Medium = 2,
  Long = 3,
  Extreme = 4,
  Over = 5,
}
export const RangeNames = Object.keys(Range).filter((x) => isNaN(Number(x)));

export enum Cover {
  None = 0,
  Quarter = 1,
  Half = 2,
  ThreeQuarter = 3,
  Total = 4,
}
export const CoverNames = Object.keys(Cover).filter((x) => isNaN(Number(x)));

function getRange(params: { attacker: Character; distance: number }): Range {
  const { attacker, distance } = params;
  const { ranges } = attacker.weapon;
  for (let i = 0; i < WeaponRangeNames.length; i++) {
    const range = ranges[WeaponRangeNames[i]];
    if (range && distance <= range) {
      return i;
    }
  }
  return Range.Over;
}

export type AttackResult = "Miss" | "Tie" | "Hit" | "Crit";

function marksToDice(x: number): number {
  if (x < 1) {
    return 0;
  }
  return Math.min(2 * (1 + Math.floor(x)), 12);
}

function one(x: number) {
  const y = marksToDice(x);
  return y ? [y] : [];
}

function two(x: number) {
  const y = marksToDice(x);
  return y ? [y, y] : [];
}

function getAttackDice(params: {
  attacker: Character;
}): number[] | number | string {
  const { attacker } = params;
  const marks = Math.min(attacker.marks[attacker.weapon.skill] || 0, 8);
  switch (attacker.mode) {
    case "Rote":
      return marks + 1;
    case "Roll":
      return marks ? one(marks) : "Skill too low to Roll";
    case "Push":
      return marks ? two(marks) : "Skill too low to Push";
    case "Risk":
      return marks < 5 ? one(marks + 1) : "Skill too high to Risk";
    case "Breeze":
      return marks > 2 ? two(marks / 2) : "Skill too low to Breeze";
  }
}

function coverToDie(cover: Cover): number[] | undefined {
  switch (Number(cover)) {
    default:
    case Cover.None:
      return [];
    case Cover.Quarter:
      return [8];
    case Cover.Half:
      return [10];
    case Cover.ThreeQuarter:
      return [12];
    case Cover.Total:
      return undefined;
  }
}

function concealmentToDie(concealment: Cover): number[] {
  switch (Number(concealment)) {
    default:
    case Cover.None:
      return [];
    case Cover.Quarter:
      return [8];
    case Cover.Half:
      return [10];
    case Cover.ThreeQuarter:
      return [12];
    case Cover.Total:
      return [12, 12];
  }
}

function rangeToDie(range: Range): number | undefined {
  switch (range) {
    case Range.Close:
      return 4;
    case Range.Short:
      return 6;
    case Range.Medium:
      return 8;
    case Range.Long:
      return 10;
    case Range.Extreme:
      return 12;
    case Range.Over:
      return undefined;
  }
}

const maxCoverForWeapon: Record<Skill, Cover> = {
  Brawl: Cover.None,
  Melee: Cover.None,
  Pistol: Cover.ThreeQuarter,
  Throw: Cover.Half,
  Longarm: Cover.Half,
  Heavy: Cover.Half,
};

function getDefenseDice(params: {
  attacker: Character;
  defender: Character;
  range: Range;
  attackDice: string | number | number[];
}): "Hit" | "Miss" | number[] {
  const { attacker, defender, range, attackDice } = params;
  if (typeof attackDice === "string") {
    return "Miss";
  }
  const inMelee = attacker.weapon.action === "Melee" && range === Range.Close;
  let cover: Cover;
  if (defender.conditions.hiding) {
    cover = defender.maxCover;
  } else if (inMelee) {
    cover = defender.weapon.skill === "Melee" ? Cover.Quarter : Cover.None;
  } else {
    cover = Math.min(
      maxCoverForWeapon[defender.weapon.skill],
      defender.maxCover
    );
  }
  const concealment = inMelee
    ? defender.concealment
    : Math.max(cover, defender.concealment);
  const rangeDie = rangeToDie(params.range);
  const coverDie = coverToDie(cover);
  const concealmentDie = concealmentToDie(concealment);
  if (!rangeDie || !coverDie) {
    return "Miss";
  }
  const dice = [rangeDie, ...coverDie, ...concealmentDie];
  if (typeof attackDice === "number" && !dice.some((x) => x >= attackDice)) {
    return "Hit";
  }
  return dice;
}

function getResult(params: {
  attacker: Character;
  attackRoll: number | number[];
  defenseDice: AttackResult | number[];
  defenseRoll: number[];
}): AttackResult {
  const { attacker, attackRoll, defenseDice, defenseRoll } = params;
  if (typeof defenseDice === "string") {
    return defenseDice;
  }
  const atk =
    typeof attackRoll === "number" ? attackRoll : Math.max(...attackRoll);
  const def = Math.max(...defenseRoll);
  if (atk < def) {
    return "Miss";
  }
  if (atk === def) {
    if (
      attacker.gifts.semiAutoExpert &&
      ["Semi", "Full"].includes(attacker.weapon.action)
    ) {
      return "Hit";
    }
    return "Tie";
  }
  if (
    typeof attackRoll !== "number" &&
    attackRoll.filter((x) => x > def).length >= 2
  ) {
    return "Crit";
  }
  return "Hit";
}

function getDamageDiceCount(params: {
  attacker: Character;
  defender: Character;
  result: AttackResult;
  range: Range;
}): number {
  const { attacker, defender, result, range } = params;
  if (result === "Miss" || result === "Tie") {
    return 0;
  }
  let total: number;
  if (attacker.weapon.shotgun) {
    total = 4 - range;
  } else {
    total = 1 + Math.min(3, defender.woundState);
  }
  if (result === "Crit") {
    total += 1;
  }
  if (defender.conditions.helpless) {
    total += 1;
  }
  if (attacker.weapon.action !== "Melee") {
    if (attacker.activeGifts.sniperMaster) {
      total += 3;
    } else if (attacker.activeGifts.sniperExpert) {
      total += 1;
    }
  }
  return total;
}

function getTotalDamage(params: {
  attacker: Character;
  defender: Character;
  damageRoll: number[];
}): number {
  const { attacker, defender, damageRoll } = params;
  const { weapon } = attacker;
  if (damageRoll.length == 0) {
    return 0;
  }
  let penDamage: number;
  switch (weapon.skill) {
    case "Melee":
    case "Brawl":
      penDamage = Math.max(0, attacker.body - (attacker.injury || 0));
      break;
    default:
      penDamage = weapon.penDamage || 0;
  }
  const passThreshold = damageRoll.filter((x) => x > defender.armor.deflection);
  return (
    weapon.baseDamage +
    Math.max(...damageRoll) +
    passThreshold.length * penDamage
  );
}

function getThresholds(defender: Character): [number, number, number, number] {
  const t1 =
    defender.armor.threshold +
    Math.max(0, defender.body - (defender.injury || 0)) * 2 +
    (defender.gifts.veryTough ? 10 : defender.gifts.tough ? 5 : 0);
  return [t1, t1 + 10, t1 + 20, t1 + 40];
}

function getNewStatus(params: {
  defender: Character;
  totalDamage: number;
}): WoundState {
  const { defender, totalDamage } = params;
  const thresholds = getThresholds(defender);
  for (let i = 0; i < thresholds.length; i++) {
    if (totalDamage < thresholds[i]) {
      return i;
    }
  }
  return thresholds.length;
}

function getAwe(params: {
  defender: Character;
  range: Range;
  result: AttackResult;
  newStatus: WoundState;
}): number {
  const { defender, range, result, newStatus } = params;
  let total = 0;
  if (defender.conditions.surprised || defender.conditions.helpless) {
    total += 1;
  }
  if (range === Range.Close) {
    total += 1;
  }
  if (result === "Hit" || result === "Crit") {
    total += 1;
  }
  total += Math.min(3, newStatus);
  return total;
}

function getInjury(params: { defender: Character; newStatus: WoundState }) {
  switch (params.newStatus) {
    case WoundState.Uninjured:
      return 0;
    case WoundState.Wounded:
      return 1;
    case WoundState.Crippled:
      return 3;
    case WoundState.Incapacitated:
      return 5;
    case WoundState.Devastated:
      return params.defender.body;
  }
}

export function attackSetup(params: {
  attacker: Character;
  defender: Character;
  distance: number;
}) {
  const a = {
    ...params,
    attackDice: getAttackDice(params),
    range: getRange(params),
  };
  return {
    ...a,
    defenseDice: getDefenseDice(a),
  };
}

export function attackResolve(params: {
  attacker: Character;
  defender: Character;
  range: Range;
  attackRoll: number | number[];
  defenseDice: AttackResult | number[];
  defenseRoll: number[];
}) {
  const a = {
    ...params,
    result: getResult(params),
  };
  return {
    ...a,
    damageDiceCount: getDamageDiceCount(a),
  };
}

export function damageResolve(params: {
  attacker: Character;
  defender: Character;
  damageRoll: number[];
  range: Range;
  result: AttackResult;
}) {
  const a = {
    ...params,
    totalDamage: getTotalDamage(params),
  };
  const b = {
    ...a,
    newStatus: getNewStatus(a),
  };
  return {
    ...b,
    awe: getAwe(b),
    injury: getInjury(b),
  };
}

export function applyResult(params: {
  defender: Character;
  newStatus: WoundState;
  injury: number;
  awe: number;
}) {
  const { defender, newStatus, awe, injury } = params;

  return {
    woundState: Math.max(defender.woundState, newStatus),
    injury: Math.min(defender.body, (defender.injury || 0) + injury),
    awe: Math.min(defender.morale, (defender.awe || 0) + awe),
  };
}

export const DefaultWeapons: Weapon[] = [
  // Melee weapons
  {
    name: "Fist",
    skill: "Brawl",
    action: "Melee",
    ranges: { C: 1 },
    baseDamage: 0,
  },
  {
    name: "Martial Arts",
    skill: "Melee",
    action: "Melee",
    ranges: { C: 1 },
    baseDamage: 2,
  },
  {
    name: "Improvised, 1-hand",
    skill: "Melee",
    action: "Melee",
    ranges: { C: 1 },
    baseDamage: 2,
  },
  {
    name: "Improvised, 2-hand",
    skill: "Melee",
    action: "Melee",
    ranges: { C: 1 },
    baseDamage: 5,
  },
  {
    name: "Knife",
    skill: "Melee",
    action: "Melee",
    ranges: { C: 1 },
    baseDamage: 5,
  },
  {
    name: "Combat Staff",
    skill: "Melee",
    action: "Melee",
    ranges: { C: 2 },
    baseDamage: 8,
  },
  // Standard EDF firearms
  {
    name: "CKW Precision",
    skill: "Longarm",
    action: "Semi",
    ranges: {
      S: 15,
      M: 70,
      L: 560,
      X: 4600,
    },
    baseDamage: 10,
    penDamage: 10,
  },
  {
    name: "GLKW 32",
    skill: "Longarm",
    action: "Single",
    ranges: {
      S: 5,
      M: 20,
      L: 80,
      X: 400,
    },
    baseDamage: 10,
    penDamage: 5,
    explosion: 2,
  },
  {
    name: "LRCKW",
    skill: "Longarm",
    action: "Semi",
    ranges: {
      S: 15,
      M: 50,
      L: 330,
      X: 2300,
    },
    baseDamage: 24,
    penDamage: 12,
  },
  {
    name: "GAKW",
    skill: "Heavy",
    action: "Semi",
    ranges: {
      S: 5,
      M: 20,
      L: 80,
      X: 400,
    },
    baseDamage: 0,
    penDamage: 10,
    explosion: 2,
  },
  {
    name: "PRLW",
    skill: "Heavy",
    action: "Single",
    ranges: {
      S: 15,
      M: 60,
      L: 470,
      X: 3700,
    },
    baseDamage: 0,
    penDamage: 10,
  },
  {
    name: "LAKW 1-56",
    skill: "Longarm",
    action: "Full",
    ranges: {
      S: 15,
      M: 60,
      L: 470,
      X: 3700,
    },
    baseDamage: 10,
    penDamage: 10,
  },
  {
    name: "MAKW 3-60",
    skill: "Heavy",
    action: "Full",
    ranges: {
      S: 15,
      M: 50,
      L: 360,
      X: 2600,
    },
    baseDamage: 11,
    penDamage: 10,
  },
  {
    name: "LAKW 1-30",
    skill: "Longarm",
    action: "Full",
    ranges: {
      C: 5,
      S: 15,
      M: 50,
      L: 330,
      X: 1100,
    },
    baseDamage: 10,
    penDamage: 9,
  },
  {
    name: "MAKW 2-18",
    skill: "Pistol",
    action: "Full",
    ranges: {
      C: 5,
      S: 10,
      M: 30,
      L: 190,
      X: 1100,
    },
    baseDamage: 8,
    penDamage: 7,
  },
  {
    name: "PAKW 4-12",
    skill: "Pistol",
    action: "Semi",
    ranges: {
      C: 5,
      S: 10,
      M: 40,
      L: 230,
      X: 1400,
    },
    baseDamage: 8,
    penDamage: 7,
  },
  {
    name: "SBKW 10",
    skill: "Longarm",
    shotgun: true,
    action: "Single",
    ranges: {
      C: 5,
      S: 10,
      M: 20,
      L: 40,
      X: 60,
    },
    baseDamage: 5,
    penDamage: 5,
  },
  // Standard ILR firearms
  {
    name: "AW 191 carbine",
    skill: "Longarm",
    action: "Full",
    ranges: {
      S: 15,
      M: 50,
      L: 410,
      X: 3000,
    },
    baseDamage: 8,
    penDamage: 9,
  },
  {
    name: "ML 199 SMG",
    skill: "Longarm",
    action: "Full",
    ranges: {
      C: 5,
      S: 10,
      M: 40,
      L: 230,
      X: 1400,
    },
    baseDamage: 7,
    penDamage: 7,
  },
];

export const DefaultArmor: Armor[] = [
  {
    name: "None",
    deflection: 3,
    threshold: 0,
  },
  {
    name: "Battle Armor, Full Dress",
    deflection: 11,
    threshold: 5,
  },
  {
    name: "Battle Armor, Vest Only",
    deflection: 7,
    threshold: 5,
  },
  {
    name: "Concealed Armor",
    deflection: 11,
    threshold: 0,
  },
  {
    name: "Spacesuit, Armored",
    deflection: 13,
    threshold: 5,
  },
  {
    name: "Spacesuit, Typical",
    deflection: 11,
    threshold: 0,
  },
];
