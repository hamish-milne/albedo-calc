import {
  type Character,
  Weapon,
  type Armor,
  Status,
  Cover,
  Range,
  Skill,
} from "./schema";

function getRange(params: { attacker: Character; distance: number }) {
  const { attacker, distance } = params;
  const { ranges } = attacker.weapon;
  for (const r of Weapon.shape.ranges.keySchema.options) {
    if (ranges[r] && distance <= ranges[r]) {
      return r;
    }
  }
  return undefined;
}

type AttackResult = "Miss" | "Tie" | "Hit" | "Crit";

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

function getAttackDice(params: { attacker: Character }): number[] | number {
  const { attacker } = params;
  const marks = Math.min(attacker.marks[attacker.weapon.skill] || 0, 8);
  switch (attacker.mode) {
    case "Rote":
      return marks + 1;
    case "Roll":
      return one(marks);
    case "Push":
      return two(marks);
    case "Risk":
      return one(marks + 1);
    case "Breeze":
      return two(marks / 2);
  }
}

const coverToDie: Record<Cover, number> = {
  None: 4,
  Quarter: 6,
  Half: 8,
  ThreeQuarter: 10,
};

const rangeToDie: Record<Range, number> = {
  C: 4,
  S: 6,
  M: 8,
  L: 10,
  X: 12,
};

const maxCoverForWeapon: Record<Skill, Cover> = {
  Brawl: "None",
  Melee: "None",
  Pistol: "ThreeQuarter",
  Throw: "Half",
  Longarm: "Half",
  Heavy: "Half",
};

function getDefenseDice(params: {
  defender: Character;
  range: Range | undefined;
}): number[] {
  const { defender, range } = params;
  if (!range) {
    return [];
  }
  const rangeDie = rangeToDie[range];
  const maxCover = coverToDie[defender.maxCover];
  const maxWeaponCover = coverToDie[maxCoverForWeapon[defender.weapon.skill]];
  const finalCover = defender.hiding
    ? maxCover
    : Math.min(maxCover, maxWeaponCover);
  const concealment = coverToDie[defender.concealment];
  const finalConcealment = Math.max(finalCover, concealment);
  return [rangeDie, finalCover, finalConcealment];
}

function getResult(params: {
  attackRoll: number[];
  defenseRoll: number[];
}): AttackResult {
  const { attackRoll, defenseRoll } = params;
  const atk = Math.max(...attackRoll);
  const def = Math.max(...defenseRoll);
  if (atk < def) {
    return "Miss";
  }
  if (atk === def) {
    return "Tie";
  }
  if (attackRoll.filter((x) => x > def).length >= 2) {
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
  let total = 1;
  switch (defender.status) {
    case "None":
      total += 0;
      break;
    case "Wounded":
      total += 1;
      break;
    case "Crippled":
      total += 2;
      break;
    case "Devastated":
    case "Incapacitated":
      total += 3;
      break;
  }
  if (attacker.weapon.shotgun) {
    switch (range) {
      case "C":
        total += 3;
        break;
      case "S":
        total += 2;
        break;
      case "M":
        total += 1;
        break;
      case "L":
        total += 0;
        break;
    }
  }
  if (result === "Crit") {
    total += 1;
  }
  if (defender.helpless) {
    total += 1;
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
      penDamage = attacker.body;
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

function getNewStatus(params: {
  defender: Character;
  totalDamage: number;
}): Status {
  const { defender, totalDamage } = params;
  const woundedThreshold = defender.armor.threshold + defender.body * 2;
  if (totalDamage < woundedThreshold) {
    return "None";
  }
  if (totalDamage < woundedThreshold + 10) {
    return "Wounded";
  }
  if (totalDamage < woundedThreshold + 20) {
    return "Crippled";
  }
  if (totalDamage < woundedThreshold + 40) {
    return "Incapacitated";
  }
  return "Devastated";
}

function getAwe(params: {
  defender: Character;
  range: Range;
  result: AttackResult;
  newStatus: Status;
}): number {
  const { defender, range, result, newStatus } = params;
  let total = 0;
  if (defender.surprised || defender.helpless) {
    total += 1;
  }
  if (range === "C") {
    total += 1;
  }
  if (result === "Hit" || result === "Crit") {
    total += 1;
  }
  switch (newStatus) {
    case "Wounded":
      total += 1;
      break;
    case "Crippled":
      total += 2;
      break;
    case "Incapacitated":
    case "Devastated":
      total += 3;
      break;
  }
  return total;
}

function getInjury(params: { defender: Character; newStatus: Status }) {
  switch (params.newStatus) {
    case "None":
      return 0;
    case "Wounded":
      return 1;
    case "Crippled":
      return 3;
    case "Incapacitated":
      return 5;
    case "Devastated":
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
  attackRoll: number[];
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
  newStatus: Status;
  injury: number;
  awe: number;
}): Character {
  const { defender, newStatus, awe, injury } = params;

  const statusOrder = Status.options;
  return {
    ...defender,
    morale: Math.max(defender.morale - awe, 0),
    status:
      statusOrder[
        Math.max(
          statusOrder.indexOf(defender.status),
          statusOrder.indexOf(newStatus)
        )
      ],
    body: Math.max(defender.body - injury, 0),
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
