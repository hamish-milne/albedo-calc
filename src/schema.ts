import { z, type ZodTypeAny } from "zod";

const Integer = z
  .string()
  .or(z.number())
  .pipe(z.coerce.number().min(0).step(1));
export const BoolInput = z.string().optional();
export const Bool = z.boolean().optional(); // BoolInput.transform((x) => x === true);

export const Skill = z.enum([
  "Brawl",
  "Melee",
  "Throw",
  "Longarm",
  "Pistol",
  "Heavy",
]);
export type Skill = z.infer<typeof Skill>;

export const Weapon = z
  .strictObject({
    name: z.string().min(1).describe("Weapon name"),
    skill: Skill.describe("Weapon skill"),
    action: z.enum(["Melee", "Single", "Semi", "Full"]).describe("Action"),
    ranges: z
      .record(z.enum(["C", "S", "M", "L", "X"]), Integer)
      .describe("Ranges"),
    baseDamage: Integer.describe("Base damage"),
    penDamage: Integer.optional().describe("Penetration damage"),
    shotgun: Bool.describe("Use shotgun damage dice"),
    explosion: Integer.optional().describe("Explosion radius"),
  })
  .describe("Weapon");
export type Weapon = z.infer<typeof Weapon>;

export const Armor = z
  .strictObject({
    name: z.string().min(1).describe("Armor name"),
    deflection: Integer.describe("Deflection"),
    threshold: Integer.describe("Threshold modifier"),
  })
  .describe("Armor");
export type Armor = z.infer<typeof Armor>;

const Cover = z
  .string()
  .or(z.number())
  .pipe(z.coerce.number().int().nonnegative().max(4));

export const CharacterRecord = z
  .strictObject({
    name: z.string().min(1).describe("Character name"),
    body: Integer.describe("Body score"),
    injury: Integer.describe("Injury"),
    weapon: Integer.describe("Equipped weapon"),
    marks: z.record(Weapon.shape.skill, Integer),
    mode: z
      .enum(["Rote", "Roll", "Push", "Risk", "Breeze"])
      .describe("Attack mode"),
    armor: Integer.describe("Equipped armor"),
    woundState: Integer.describe("Wound state"),
    maxCover: Cover.describe("Max cover in environment"),
    concealment: Cover.describe("Concealment in environment"),
    morale: Integer.describe("Morale"),
    awe: Integer.describe("Awe"),
    conditions: z
      .object({
        surprised: Bool.describe("Surprised"),
        helpless: Bool.describe("Helpless"),
        hiding: Bool.describe("Hiding"),
        aiming: Bool.describe("Aiming"),
      })
      .describe("Conditions"),
    gifts: z
      .object({
        tough: Bool.describe("Tough"),
        veryTough: Bool.describe("Very Tough"),
        strong: Bool.describe("Strong"),
        veryStrong: Bool.describe("Very Strong"),
        semiAutoExpert: Bool.describe("Semi-Auto Expert"),
      })
      .describe("Passive Gifts"),
    activeGifts: z
      .object({
        sniperExpert: Bool.describe("Sniper Expert"),
        sniperMaster: Bool.describe("Sniper Master"),
        martialArts: Bool.describe("Martial Arts"),
        meleeExpert: Bool.describe("Melee Expert"),
      })
      .pick({
        sniperExpert: true,
        sniperMaster: true,
        martialArts: true,
        meleeExpert: true,
      })
      .describe("Active Gifts"),
  })
  .describe("Character");
export type CharacterRecord = z.infer<typeof CharacterRecord>;

export type Character = Omit<CharacterRecord, "weapon" | "armor"> & {
  weapon: Weapon;
  armor: Armor;
};

export function ListSelect<T extends ZodTypeAny>(t: T) {
  return z.strictObject({
    list: z.array(t),
    idx: Integer,
  });
}

const DiceRoll = z.array(Integer);

export const SelectForm = z.strictObject({
  character: ListSelect(CharacterRecord),
  weapon: ListSelect(Weapon),
  armor: ListSelect(Armor),
  setup: z.strictObject({
    attacker: Integer.describe("Attacker"),
    defender: Integer.describe("Defender"),
    distance: Integer.describe("Distance"),
  }),
  toHit: z.strictObject({
    attackRoll: DiceRoll.describe("Attack roll"),
    defenseRoll: DiceRoll.describe("Defense roll"),
  }),
  resolve: z.strictObject({
    damageRoll: DiceRoll.describe("Damage roll"),
  }),
});
export type SelectForm = z.input<typeof SelectForm>;

export const DefaultChar: z.input<typeof CharacterRecord> = {
  name: "Donut Steele",
  body: 7,
  injury: 0,
  weapon: "0",
  marks: {
    Brawl: 0,
    Heavy: 0,
    Longarm: 0,
    Melee: 0,
    Pistol: 0,
    Throw: 0,
  },
  mode: "Roll",
  armor: "0",
  woundState: "0",
  maxCover: "2",
  concealment: "0",
  morale: 5,
  awe: 0,
  conditions: {},
  gifts: {},
  activeGifts: {},
};
