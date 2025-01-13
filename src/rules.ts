import {
  type Character,
  type Skill,
  WeaponRangeNames,
  Range,
  Cover,
  WoundState,
  getPos,
  CharacterRecord,
} from "./schema";

import { vec2, glMatrix } from "gl-matrix";

glMatrix.setMatrixArrayType(Array);

function getRange(params: { attacker: Character; defender: Character }): {
  range: Range;
  distance: number;
} {
  const { attacker, defender } = params;
  const { x: x1, y: y1 } = getPos(attacker);
  const { x: x2, y: y2 } = getPos(defender);
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.ceil(Math.sqrt(dx * dx + dy * dy));
  const { ranges } = attacker.weapon;
  for (let i = 0; i < WeaponRangeNames.length; i++) {
    const range = ranges[WeaponRangeNames[i]];
    if (range && distance <= range) {
      return { range: i, distance };
    }
  }
  return { range: Range.Over, distance };
}

export type AttackResult = "Miss" | "Tie" | "Hit" | "Crit";

export type Circle = { c: vec2; r: number };

export type ThrowResult = { maximum?: Circle; target: Circle };
export type EXResult = vec2;

export type AttackOrThrowResult = AttackResult | ThrowResult | EXResult;

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
  maxCover: Cover;
  concealment: Cover;
  range: Range;
  attackDice: string | number | number[];
}): "Hit" | "Miss" | number[] {
  const { attacker, defender, attackDice, maxCover, concealment } = params;
  let range = params.range;
  if (typeof attackDice === "string") {
    return "Miss";
  }
  const inMelee = attacker.weapon.action === "Melee" && range === Range.Close;
  let cover: Cover;
  if (defender.conditions.hiding) {
    cover = maxCover;
  } else if (inMelee) {
    cover = defender.weapon.skill === "Melee" ? Cover.Quarter : Cover.None;
  } else {
    cover = Math.min(maxCoverForWeapon[defender.weapon.skill], maxCover);
  }
  let finalConcealment = inMelee ? concealment : Math.max(cover, concealment);

  if (
    attacker.conditions.aiming &&
    attacker.weapon.action !== "Melee" &&
    concealment < Cover.Total
  ) {
    finalConcealment = Math.max(0, concealment - 1);
    cover = Math.max(0, cover - 1);
    range = Math.max(0, range - 1);
  }

  const rangeDie = rangeToDie(range);
  const coverDie = coverToDie(cover);
  const concealmentDie = concealmentToDie(finalConcealment);
  if (!rangeDie || !coverDie) {
    return "Miss";
  }
  const dice = [rangeDie, ...coverDie, ...concealmentDie];
  if (typeof attackDice === "number" && !dice.some((x) => x >= attackDice)) {
    return "Hit";
  }
  return dice;
}

function getAttackResult(params: {
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

function clampDistance(a: vec2, b: vec2, r: number): [vec2, number] {
  const dist = vec2.distance(a, b);
  if (dist <= r) {
    return [b, dist];
  }
  return [vec2.lerp([0, 0], a, b, r / dist), r];
}

function posAsVec(c: Character): vec2 {
  return [c.position?.x || 0, c.position?.y || 0];
}

function round(v: vec2, p: number = 100): vec2 {
  return [Math.round(v[0] * p) / p, Math.round(v[1] * p) / p];
}

function getThrowResult(params: {
  attacker: Character;
  defender: Character;
  attackRoll: number | number[];
}): ThrowResult {
  const { attacker, defender, attackRoll } = params;

  const maxDistance = attacker.body * 4;
  const aPos = posAsVec(attacker);
  const dPos = posAsVec(defender);
  const [clamped, actualDistance] = clampDistance(aPos, dPos, maxDistance);

  const roll = typeof attackRoll === "number" ? [attackRoll] : attackRoll;
  const maxRoll = Math.min(7, Math.max(...roll));
  const deviationRatio = 0.7 - 0.1 * maxRoll;
  const deviationDistance = actualDistance * deviationRatio;

  return {
    maximum: { c: aPos, r: maxDistance },
    target: { c: round(clamped), r: deviationDistance },
  };
}

function getEXResult(params: {
  attacker: Character;
  defender: Character;
  attackRoll: number | number[];
  defenseDice: "Hit" | "Miss" | number[];
  defenseRoll: number[];
}): "Miss" | ThrowResult {
  const { attacker, defender, attackRoll, defenseDice, defenseRoll } = params;

  if (defenseDice === "Hit") {
    return { target: { c: posAsVec(defender), r: 0 } };
  }
  if (typeof defenseDice === "string") {
    return defenseDice;
  }
  const roll = typeof attackRoll === "number" ? [attackRoll] : attackRoll;
  const atkValue = Math.max(...roll);
  const deviation = Math.max(0, Math.max(...defenseRoll) - atkValue) * 6;
  const angle =
    atkValue % 2 !== 0
      ? atkValue % 3 === 0
        ? 0.5
        : 1
      : atkValue !== 12 && atkValue % 4 === 0
        ? -0.5
        : 0;
  const aPos = posAsVec(attacker);
  const dPos = posAsVec(defender);
  const targetPoint = vec2.lerp(
    [0, 0],
    aPos,
    dPos,
    1 + deviation / vec2.distance(aPos, dPos)
  );
  const newPoint = vec2.rotate([0, 0], targetPoint, dPos, angle * Math.PI);
  return { target: { c: round(newPoint), r: 0 } };
}

export function isExplosion(params: { attacker: Character }) {
  return Boolean(params.attacker.weapon.explosion);
}

export function getExplosionResult(params: {
  attacker: Character;
  defender: Character;
  attackRoll: number | number[];
  defenseDice: "Hit" | "Miss" | number[];
  defenseRoll: number[];
}) {
  const { attacker } = params;
  return attacker.weapon.skill === "Throw"
    ? getThrowResult(params)
    : getEXResult(params);
}

function getDamageDiceCount(params: {
  attacker: Character;
  defender: Character;
  result: AttackOrThrowResult;
  range: Range;
  woundState: WoundState;
}): number {
  const { attacker, defender, result, range, woundState } = params;
  if (typeof result !== "string" || result === "Miss" || result === "Tie") {
    return 0;
  }
  let total: number;
  if (attacker.weapon.shotgun) {
    total = 4 - range;
  } else {
    total = 1 + Math.min(3, woundState);
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

function getWeaponDamage(params: { attacker: Character }) {
  const { attacker } = params;
  const { weapon } = attacker;
  let penDamage: number;
  switch (weapon.skill) {
    case "Melee":
    case "Brawl":
      penDamage = Math.max(0, attacker.body - (attacker.injury || 0));
      break;
    default:
      penDamage = weapon.penDamage || 0;
  }
  return {
    baseDamage: weapon.baseDamage,
    penDamage,
  };
}

function getTotalDamage(params: {
  defender: Character;
  damageRoll: number[];
  baseDamage: number;
  penDamage: number;
}): number {
  const { baseDamage, penDamage, defender, damageRoll } = params;
  if (damageRoll.length == 0) {
    return 0;
  }
  const passThreshold = damageRoll.filter((x) => x > defender.armor.deflection);
  return (
    baseDamage + Math.max(...damageRoll) + passThreshold.length * penDamage
  );
}

export function getThresholds(
  defender: Character
): [number, number, number, number] {
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

function asNumber<T extends { [key: string]: unknown }>(
  enumObj: T,
  value: keyof T
) {
  const x = isNaN(value as number) ? enumObj[value] : Number(value);
  if (isNaN(x as number)) {
    throw Error(`Unable to convert ${String(value)}`);
  }
  return x as T[keyof T];
}

export function attackSetup(params: {
  attacker: Character;
  defender: Character;
}) {
  const a = {
    ...params,
    attackDice: getAttackDice(params),
    ...getRange(params),
    maxCover: asNumber(Cover, params.defender.maxCover),
    concealment: asNumber(Cover, params.defender.concealment),
    woundState: asNumber(WoundState, params.defender.woundState),
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
  defenseDice: "Hit" | "Miss" | number[];
  defenseRoll: number[];
}) {
  const a = {
    ...params,
    result: getAttackResult(params),
    woundState: asNumber(WoundState, params.defender.woundState),
  };
  return {
    ...a,
    damageDiceCount: getDamageDiceCount(a),
  };
}

export function explosionSetup(params: {
  center: [number, number];
  radius: number;
  characters: Character[];
}) {
  const { center, radius, characters } = params;
  const result: { character: number; damageDiceCount: number }[] = [];
  for (let i = 0; i < characters.length; i++) {
    const { x, y } = characters[i].position || { x: 0, y: 0 };
    const distance = vec2.distance(center, [x, y]);
    const ratio = Math.floor(distance / radius); // TODO: Cover?
    const damageDiceCount = 5 - ratio + (ratio === 0 && distance < 0.5 ? 1 : 0);
    if (damageDiceCount <= 0) {
      continue;
    }
    result.push({ character: i, damageDiceCount });
  }
  return result;
}

export function explosionResolve(params: {
  characters: Character[];
  rolls: { character: number; damageRoll: number[] }[];
  baseDamage?: number;
  penDamage: number;
}) {
  const { characters, rolls } = params;

  return {
    results: rolls.map(({ character, damageRoll }) =>
      damageResolve({
        defender: characters[character],
        damageRoll,
        baseDamage: params.baseDamage || 0,
        penDamage: params.penDamage,
        range: Range.Short,
        result: "Hit",
      })
    ),
  };
}

export function weaponDamageResolve(params: {
  defender: Character;
  attacker: Character;
  damageRoll: number[];
  range: Range;
  result: AttackResult;
}) {
  return damageResolve({
    ...params,
    ...getWeaponDamage(params),
  });
}

function damageResolve(params: {
  defender: Character;
  baseDamage: number;
  penDamage: number;
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
  defender: Character | CharacterRecord;
  newStatus: WoundState;
  injury: number;
  awe: number;
}) {
  const { defender, newStatus, awe, injury } = params;
  const woundState = WoundState[defender.woundState];

  return {
    woundState: WoundState[Math.max(woundState, newStatus)],
    injury: Math.min(defender.body, (defender.injury || 0) + injury),
    awe: Math.min(defender.morale, (defender.awe || 0) + awe),
  };
}
