import type { Armor, CharacterRecord, SelectForm, Weapon } from "./schema";

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
  marker: "Circle",
  morale: 5,
  awe: 0,
  conditions: {},
  gifts: {},
  activeGifts: {},
  position: { x: 1, y: 1 },
};

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

export const DefaultValues: SelectForm = {
  character: {
    list: [DefaultChar],
    idx: 0,
  },
  weapon: {
    list: DefaultWeapons,
    idx: 0,
  },
  armor: {
    list: DefaultArmor,
    idx: 0,
  },
  setup: {},
  toHit: {
    attackRoll: [],
    defenseRoll: [],
  },
  resolve: {
    damageRoll: [],
  },
  map: {
    width: 25,
    height: 25,
    gridCellSize: 1,
    snap: 1,
    pixelsPerUnit: 20,
  },
  explosionSetup: {
    center: [0, 0],
    radius: 0,
    penDamage: 10,
  },
  explosionResolve: { rolls: [] },
};
