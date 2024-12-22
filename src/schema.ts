import * as yup from "yup";

function getEnumNames<T extends { [k: string]: unknown }>(obj: T) {
  return Object.keys(obj).filter((x) => isNaN(Number(x))) as Array<keyof T>;
}

export enum WoundState {
  Uninjured = 0,
  Wounded = 1,
  Crippled = 2,
  Incapacitated = 3,
  Devastated = 4,
}
export const WoundStateNames = getEnumNames(WoundState);

export enum Range {
  Close = 0,
  Short = 1,
  Medium = 2,
  Long = 3,
  Extreme = 4,
  Over = 5,
}
export const RangeNames = getEnumNames(Range);

export enum Cover {
  None = 0,
  Quarter = 1,
  Half = 2,
  ThreeQuarter = 3,
  Total = 4,
}
export const CoverNames = getEnumNames(Cover);

const nameType = yup.string().required().min(1);
const integer = yup
  .number()
  .transform((x) => (isNaN(x) ? undefined : x))
  .min(0)
  .integer();

const selectValue = integer.required();

const Marks = yup
  .object({
    Brawl: integer,
    Melee: integer,
    Throw: integer,
    Longarm: integer,
    Pistol: integer,
    Heavy: integer,
  })
  .label("Skills");

const Skill = Object.keys(Marks.fields) as Array<keyof typeof Marks.fields>;
export type Skill = keyof typeof Marks.fields;

const Ranges = yup.object({
  C: integer,
  S: integer,
  M: integer,
  L: integer,
  X: integer,
});

export const WeaponRangeNames = Object.keys(Ranges.fields) as Array<
  keyof typeof Ranges.fields
>;

export const Weapon = yup.object({
  name: nameType.label("Weapon name"),
  skill: yup.string().required().oneOf(Skill).label("Weapon skill"),
  action: yup
    .string()
    .required()
    .oneOf(["Melee", "Single", "Semi", "Full"])
    .label("Action"),
  ranges: Ranges,
  baseDamage: integer.required().label("Base damage"),
  penDamage: integer.label("Penetration damage"),
  shotgun: yup.boolean().label("Use shotgun damage dice"),
  explosion: integer.label("Explosion radius"),
});
export type Weapon = yup.InferType<typeof Weapon>;

export const Armor = yup.object({
  name: nameType.label("Armor name"),
  deflection: integer.required().label("Deflection"),
  threshold: integer.required().label("Threshold modifier"),
});
export type Armor = yup.InferType<typeof Armor>;

const bool = yup.bool();

function enumOf<T extends string>(options: T[]) {
  return yup.string().oneOf(options).required();
}

export const CharacterRecord = yup.object({
  name: nameType.label("Character name"),
  body: integer.required().label("Body score"),
  injury: integer.label("Injury"),
  weapon: selectValue.label("Equipped weapon"),
  armor: selectValue.label("Equipped armor"),
  marks: Marks,
  mode: yup
    .string()
    .required()
    .oneOf(["Rote", "Roll", "Push", "Risk", "Breeze"])
    .label("Attack mode"),
  woundState: enumOf(WoundStateNames).label("Wound state"),
  maxCover: enumOf(CoverNames).label("Max cover in environment"),
  concealment: enumOf(CoverNames).label("Concealment in environment"),
  morale: integer.required().label("Morale"),
  awe: integer.label("Awe"),
  conditions: yup
    .object({
      surprised: bool.label("Surprised"),
      helpless: bool.label("Helpless"),
      hiding: bool.label("Hiding"),
      aiming: bool.label("Aiming"),
    })
    .label("Conditions"),
  gifts: yup
    .object({
      tough: bool.label("Tough"),
      veryTough: bool.label("Very Tough"),
      strong: bool.label("Strong"),
      veryStrong: bool.label("Very Strong"),
      semiAutoExpert: bool.label("Semi-Auto Expert"),
    })
    .label("Passive Gifts"),
  activeGifts: yup
    .object({
      sniperExpert: bool.label("Sniper Expert"),
      sniperMaster: bool.label("Sniper Master"),
      martialArts: bool.label("Martial Arts"),
      meleeExpert: bool.label("Melee Expert"),
    })
    .label("Active Gifts"),
});
export type CharacterRecord = yup.InferType<typeof CharacterRecord>;

export type Character = Omit<CharacterRecord, "weapon" | "armor"> & {
  weapon: Weapon;
  armor: Armor;
};

export function ListSelect<C extends yup.Maybe<yup.AnyObject>, T = any>(
  t: yup.ISchema<T, C>
) {
  return yup.object({
    list: yup.array(t).required(),
    idx: integer.required(),
  });
}

const DiceRoll = yup.array(integer.required()).required();

export const SetupSchema = yup.object({
  attacker: integer.required().label("Attacker"),
  defender: integer.required().label("Defender"),
  distance: integer.required().label("Distance"),
});

export const ToHitSchema = yup.object({
  attackRoll: DiceRoll.label("Attack roll"),
  defenseRoll: DiceRoll.label("Defense roll"),
});

export const ResolveSchema = yup.object({
  damageRoll: DiceRoll.label("Damage roll"),
});

export const SelectForm = yup.object({
  character: ListSelect(CharacterRecord),
  weapon: ListSelect(Weapon),
  armor: ListSelect(Armor),
  setup: SetupSchema,
  toHit: ToHitSchema,
  resolve: ResolveSchema,
});
export type SelectForm = yup.InferType<typeof SelectForm>;

export const DefaultChar: CharacterRecord = {
  name: "Donut Steele",
  body: 7,
  injury: 0,
  weapon: 0,
  marks: {
    Brawl: 0,
    Heavy: 0,
    Longarm: 0,
    Melee: 0,
    Pistol: 0,
    Throw: 0,
  },
  mode: "Roll",
  armor: 0,
  woundState: "Uninjured",
  maxCover: "Half",
  concealment: "None",
  morale: 5,
  awe: 0,
  conditions: {},
  gifts: {},
  activeGifts: {},
};
