import {
  Armor,
  CharacterRecord,
  ResolveSchema,
  ToHitSchema,
  Weapon,
  type Character,
  type SelectForm,
} from "./schema";
import {
  attackResolve,
  attackSetup,
  damageResolve,
  getExplosionResult,
  isExplosion,
} from "./rules";

export type CombatValues = Pick<
  SelectForm,
  "character" | "weapon" | "armor" | "resolve" | "setup" | "toHit"
>;

type Optional<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

function tryOrFail<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
  ...args: Args
): Optional<T> {
  try {
    return { success: true, data: fn(...args) };
  } catch (error) {
    return { success: false, error };
  }
}

function getOrThrow<T extends "character" | "weapon" | "armor">(
  idx: number,
  values: CombatValues,
  l: T
): CombatValues[T]["list"][number] {
  const c = values[l].list[idx];
  if (!c) {
    throw Error(`Index ${idx} out of range for ${l} list`);
  }
  return c;
}

function getCharacter(
  idx: number | undefined,
  values: CombatValues
): Character {
  const c = CharacterRecord.validateSync(
    getOrThrow(idx ?? -1, values, "character")
  );
  return {
    ...c,
    weapon: Weapon.validateSync(getOrThrow(c.weapon, values, "weapon")),
    armor: Armor.validateSync(getOrThrow(c.armor, values, "armor")),
  };
}

function stepSetup(values: CombatValues) {
  const { attacker, defender } = values.setup || {};
  return attackSetup({
    attacker: getCharacter(attacker, values),
    defender: getCharacter(defender, values),
  });
}

function toHitParams(
  values: CombatValues,
  input: ReturnType<typeof stepSetup>
) {
  const toHit = ToHitSchema.validateSync(values.toHit);
  return {
    ...input,
    attackRoll:
      typeof input.attackDice === "number"
        ? input.attackDice
        : toHit.attackRoll.slice(0, input.attackDice.length),
    defenseRoll:
      typeof input.defenseDice === "string"
        ? []
        : toHit.defenseRoll.slice(0, input.defenseDice.length),
  };
}

function stepExplosion(
  values: CombatValues,
  input: ReturnType<typeof stepSetup>
) {
  const params = toHitParams(values, input);
  return {
    ...input,
    explosion: getExplosionResult(params),
  };
}

function stepAttackResolve(
  values: CombatValues,
  input: ReturnType<typeof stepSetup>
) {
  const params = toHitParams(values, input);
  return {
    ...input,
    ...attackResolve(params),
  };
}

function stepDamageResolve(
  values: CombatValues,
  input: ReturnType<typeof stepAttackResolve>
) {
  const resolved = ResolveSchema.validateSync({
    damageRoll: values.resolve.damageRoll?.slice(0, input.damageDiceCount),
  });
  return {
    ...input,
    ...damageResolve({
      ...input,
      ...resolved,
    }),
  };
}

export enum Step {
  Setup,
  ToHit,
  AttackResolve,
  DamageResolve,
  Explosion,
}

export function useCalcs(values: CombatValues) {
  const s1 = tryOrFail(stepSetup, values);
  if (!s1.success) {
    return { step: Step.Setup as const, error: s1.error };
  }
  if (isExplosion(s1.data)) {
    const s4 = tryOrFail(stepExplosion, values, s1.data);
    if (!s4.success) {
      return { step: Step.ToHit as const, error: s4.error, ...s1.data };
    }
    return { step: Step.Explosion as const, ...s4.data };
  }
  const s2 = tryOrFail(stepAttackResolve, values, s1.data);
  if (!s2.success) {
    return { step: Step.ToHit as const, error: s2.error, ...s1.data };
  }
  const s3 = tryOrFail(stepDamageResolve, values, s2.data);
  if (!s3.success) {
    return { step: Step.AttackResolve as const, error: s3.error, ...s2.data };
  }
  return { step: Step.DamageResolve as const, ...s3.data };
}

export type Calcs = ReturnType<typeof useCalcs>;
