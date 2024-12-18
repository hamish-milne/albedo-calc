import { z, type ZodTypeAny } from "zod";

const Integer = z
  .string()
  .or(z.number())
  .pipe(z.coerce.number().min(0).step(1));
export const BoolInput = z.string().optional();
export const Bool = z.boolean().optional(); // BoolInput.transform((x) => x === true);

export const Range = z.enum(["C", "S", "M", "L", "X"]);
export type Range = z.infer<typeof Range>;

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
    ranges: z.record(Range, Integer).describe("Ranges"),
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

export const Cover = z.enum(["None", "Quarter", "Half", "ThreeQuarter"]);
export type Cover = z.infer<typeof Cover>;

export const Status = z.enum([
  "None",
  "Wounded",
  "Crippled",
  "Incapacitated",
  "Devastated",
]);
export type Status = z.infer<typeof Status>;

export const CharacterRecord = z
  .strictObject({
    name: z.string().min(1).describe("Character name"),
    body: Integer.describe("Current Body score"),
    weapon: Integer.describe("Equipped weapon"),
    marks: z.record(Weapon.shape.skill, Integer),
    mode: z
      .enum(["Rote", "Roll", "Push", "Risk", "Breeze"])
      .describe("Attack mode"),
    armor: Integer.describe("Equipped armor"),
    status: Status.describe("Wound state"),
    surprised: Bool.describe("Surprised"),
    helpless: Bool.describe("Helpless"),
    maxCover: Cover.describe("Max cover in environment"),
    concealment: Cover.describe("Concealment in environment"),
    hiding: Bool.describe("Hiding (taking cover and not attacking)"),
    morale: Integer.describe("Current Morale"),
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
  name: "Person personson",
  body: "7",
  weapon: "0",
  marks: {
    Brawl: "0",
    Heavy: "0",
    Longarm: "0",
    Melee: "0",
    Pistol: "0",
    Throw: "0",
  },
  mode: "Roll",
  armor: "0",
  status: "None",
  surprised: false,
  helpless: false,
  maxCover: "Half",
  concealment: "None",
  hiding: false,
  morale: "5",
};
