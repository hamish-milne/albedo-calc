import { useEffect } from "react";
import type { UseFormReturn, Path } from "react-hook-form";
import type { Schema, InferType } from "yup";
import type { LogItem } from "./combat-log";
import { Button } from "./components/ui/button";
import { TextField, RefField } from "./custom-fields";
import {
  attackSetup,
  type AttackResult,
  attackResolve,
  damageResolve,
  applyResult,
  getThresholds,
} from "./rules";
import {
  Range,
  SelectForm,
  type Character,
  CharacterRecord,
  Weapon,
  Armor,
  SetupSchema,
  ToHitSchema,
  RangeNames,
  ResolveSchema,
  WoundStateNames,
} from "./schema";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./components/ui/table";

function getCharacter(form: UseFormReturn<SelectForm>, idx: number): Character {
  const record = CharacterRecord.validateSync(
    form.watch(`character.list.${idx}`)
  );
  const weapon = Weapon.validateSync(
    form.watch(`weapon.list.${Number(record.weapon)}`)
  );
  const armor = Armor.validateSync(
    form.watch(`armor.list.${Number(record.armor)}`)
  );
  return { ...record, weapon, armor };
}

function trySetupCombat(form: UseFormReturn<SelectForm>) {
  const s = form.watch("setup");
  try {
    const inProgress = SetupSchema.validateSync(s);
    return {
      attacker: getCharacter(form, inProgress.attacker),
      defender: getCharacter(form, inProgress.defender),
      distance: inProgress.distance,
    };
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

function ThresholdsTable(props: { defender: Character }) {
  const { defender } = props;

  const thresholds = getThresholds(defender);

  const data: [string, number][] = [
    ["Deflection", 11],
    ...WoundStateNames.slice(1).map<[string, number]>((x, i) => [
      x,
      thresholds[i],
    ]),
  ];

  return (
    <Table>
      <TableBody>
        {data.map(([key, value]) => (
          <TableRow key={key}>
            <TableHead>{key}</TableHead>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DiceGroup(props: {
  form: UseFormReturn<SelectForm>;
  dice: number[];
  prefix: Path<SelectForm>;
  label: string;
}) {
  const { form, dice, prefix, label } = props;

  if (dice.length === 0) {
    return <></>;
  }

  function rollForMe() {
    for (let i = 0; i < dice.length; i++) {
      form.setValue(
        `${prefix}.${i}` as Path<SelectForm>,
        1 + Math.floor(Math.random() * dice[i])
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium leading-none">{label}</div>
      <div className="flex gap-2">
        {dice.map((d, i) => (
          <TextField
            className="w-12"
            key={i}
            form={form}
            label={`d${d}`}
            name={`${prefix}.${i}` as Path<SelectForm>}
          />
        ))}
        <Button className="self-end" onClick={rollForMe}>
          Roll
        </Button>
      </div>
    </div>
  );
}

function validateSafe<T extends Schema>(
  schema: T,
  value: any
): { success: true; data: InferType<T> } | { success: false; error: unknown } {
  try {
    return {
      success: true,
      data: schema.validateSync(value),
    };
  } catch (error) {
    return { success: false, error };
  }
}

function CombatSetup(props: {
  attacker: Character;
  defender: Character;
  distance: number;
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, addItem } = props;
  const result = attackSetup(props);

  if (result.range >= Range.Over) {
    return <p>Out of range!</p>;
  }

  const toHit = validateSafe(ToHitSchema, form.watch("toHit"));
  const toHitFixed = toHit.success
    ? {
        attackRoll:
          typeof result.attackDice === "number"
            ? result.attackDice
            : toHit.data.attackRoll.slice(0, result.attackDice.length),
        defenseRoll:
          typeof result.defenseDice === "string"
            ? []
            : toHit.data.defenseRoll.slice(0, result.defenseDice.length),
      }
    : undefined;

  return (
    <>
      <ThresholdsTable defender={result.defender} />
      <p>
        <b>{result.attacker.name}</b> will attack <b>{result.defender.name}</b>{" "}
        with <b>{result.attacker.weapon.name}</b> at{" "}
        <b>{RangeNames[result.range]}</b> range.
      </p>
      {typeof result.attackDice === "number" ? (
        <p>
          Attacker will rote for <b>{result.attackDice}.</b>
        </p>
      ) : typeof result.attackDice === "string" ? (
        <p className="text-destructive">{result.attackDice}</p>
      ) : (
        <DiceGroup
          form={form}
          prefix="toHit.attackRoll"
          label="Attack dice"
          dice={result.attackDice}
        />
      )}
      {result.defenseDice === "Hit" ? (
        <p>
          <i>{result.defender.name}</i> can't defend against that!
        </p>
      ) : result.defenseDice === "Miss" ? (
        <p>
          <i>{result.defender.name}</i> can't be hit.
        </p>
      ) : (
        <DiceGroup
          form={form}
          prefix="toHit.defenseRoll"
          label="Defense dice"
          dice={result.defenseDice}
        />
      )}
      {toHitFixed ? (
        <CombatResolve
          form={form}
          addItem={addItem}
          {...result}
          range={result.range}
          {...toHitFixed}
        />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">
          Invalid dice roll values
        </p>
      )}
    </>
  );
}

function CombatResolve(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
  attacker: Character;
  defender: Character;
  attackRoll: number | number[];
  defenseRoll: number[];
  defenseDice: AttackResult | number[];
  range: Range;
}) {
  const { form, addItem } = props;
  const result = attackResolve(props);
  const { attacker, defender, damageDiceCount } = result;

  const resolved = validateSafe(ResolveSchema, form.watch("resolve"));
  const resolvedFixed = resolved.success
    ? {
        damageRoll: resolved.data.damageRoll.slice(0, damageDiceCount),
      }
    : undefined;

  return (
    <>
      <p>
        {attacker.name} will <b>{result.result}</b> {defender.name}!
      </p>
      <DiceGroup
        dice={Array(damageDiceCount).fill(20)}
        form={form}
        label="Damage dice"
        prefix="resolve.damageRoll"
      />
      {resolvedFixed ? (
        <DamageResolve
          form={form}
          addItem={addItem}
          {...result}
          {...resolvedFixed}
        />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">
          Invalid dice roll values
        </p>
      )}
    </>
  );
}

const woundStateChange = [
  "no injury",
  "a wounding hit",
  "a crippling hit",
  "an incapacitating hit",
  "a devastating hit",
];

function resetDiceValues(form: UseFormReturn<SelectForm>) {
  const names = [
    "toHit.attackRoll",
    "toHit.defenseRoll",
    "resolve.damageRoll",
  ] as const;
  for (const name of names) {
    for (let i = 0; i < 10; i++) {
      form.setValue(`${name}.${i}`, 0);
    }
  }
}

function DamageResolve(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
  attacker: Character;
  defender: Character;
  damageRoll: number[];
  attackRoll: number | number[];
  defenseRoll: number[];
  range: Range;
  result: AttackResult;
}) {
  const { form, addItem } = props;
  const result = damageResolve(props);
  const { defender, totalDamage, newStatus, awe, injury } = result;

  const defenderIdx = form.watch(`setup.defender`);

  function apply() {
    const toSet = applyResult(result);
    for (const [key, value] of Object.entries(toSet)) {
      form.setValue(
        `character.list.${defenderIdx as number}.${key as keyof CharacterRecord}`,
        String(value)
      );
    }
    resetDiceValues(form);
    form.reset(undefined, {
      keepValues: true,
    });
    addItem({
      range: result.range,
      totalDamage: result.totalDamage,
      awe: result.awe,
      damageRoll: result.damageRoll,
      injury: result.injury,
      result: result.result,
      attacker: props.attacker.name,
      defender: props.defender.name,
      weapon: props.attacker.weapon.name,
      attackRoll: props.attackRoll,
      defenseRoll: props.defenseRoll,
      newStatus:
        Number(props.defender.woundState) <= result.newStatus
          ? undefined
          : result.newStatus,
    });
  }

  return (
    <>
      <p>
        After an attack of <b>{totalDamage}</b>, {defender.name} suffers{" "}
        <b>{woundStateChange[newStatus]}</b>, taking <b>{injury}</b> injuries
        and <b>{awe}</b> awe.
      </p>
      <Button onClick={apply}>Apply result</Button>
    </>
  );
}

export function CombatForm(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, addItem } = props;
  const values = form.getValues();
  const characters = values.character.list.map((x) => x.name);

  const setup = trySetupCombat(form);
  const hasErrors = typeof setup !== "object";

  useEffect(() => {
    if (hasErrors) {
      resetDiceValues(form);
    }
  }, [hasErrors]);

  return (
    <div className="flex gap-4 flex-col">
      <RefField
        form={form}
        name="setup.attacker"
        label="Attacker"
        optionLabels={characters}
      />
      <RefField
        form={form}
        name="setup.defender"
        label="Defender"
        optionLabels={characters}
      />
      <TextField form={form} label="Distance" name="setup.distance" />

      {typeof setup === "object" ? (
        <CombatSetup {...setup} form={form} addItem={addItem} />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">{setup}</p>
      )}
    </div>
  );
}
