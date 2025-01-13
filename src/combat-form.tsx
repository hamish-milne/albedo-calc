import { useEffect } from "react";
import { type UseFormReturn, type Path, useWatch } from "react-hook-form";
import type { LogItem } from "./combat-log";
import { Button } from "./components/ui/button";
import { TextField, RefField } from "./custom-fields";
import { applyResult, getThresholds } from "./rules";
import {
  Range,
  SelectForm,
  type Character,
  CharacterRecord,
  RangeNames,
  WoundStateNames,
} from "./schema";
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./components/ui/table";
import { Step, useCalcs, type Calcs } from "./calc-provider";
import { DefaultValues } from "./data";

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

export function DiceGroup(props: {
  form: UseFormReturn<SelectForm>;
  dice: number[];
  prefix: Path<SelectForm>;
  label: string;
}) {
  const { form, dice, prefix, label } = props;

  const prev = (form.getValues(prefix) as number[]) || [];
  const shouldReset = dice.length < prev.length;
  useEffect(() => {
    if (shouldReset) {
      const prev = (form.getValues(prefix) as number[]) || [];
      form.setValue(prefix, prev.slice(0, dice.length));
    }
  }, [shouldReset, dice.length, form, prefix]);

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
            inputMode="numeric"
          />
        ))}
        <Button className="self-end" onClick={rollForMe}>
          Roll
        </Button>
      </div>
    </div>
  );
}

function CombatSetup(props: {
  form: UseFormReturn<SelectForm>;
  result: Calcs;
}) {
  const { form, result } = props;

  if (result.step === Step.Setup) {
    return <></>;
  }

  if (result.range >= Range.Over) {
    return <p>Out of range!</p>;
  }

  return (
    <>
      <ThresholdsTable defender={result.defender} />
      <p>
        <b>{result.attacker.name}</b> will attack <b>{result.defender.name}</b>{" "}
        with <b>{result.attacker.weapon.name}</b> at{" "}
        <b>{RangeNames[result.range]}</b> range ({result.distance} meters).
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
    </>
  );
}

function CombatResolve(props: {
  form: UseFormReturn<SelectForm>;
  calcs: Calcs;
}) {
  const { form, calcs } = props;
  if (
    calcs.step === Step.Setup ||
    calcs.step === Step.ToHit ||
    calcs.step === Step.Explosion
  ) {
    return <></>;
  }

  const { attacker, defender, result, damageDiceCount } = calcs;

  return (
    <>
      <p>
        {attacker.name} will <b>{result}</b> {defender.name}!
      </p>
      <DiceGroup
        dice={Array(damageDiceCount).fill(20)}
        form={form}
        label="Damage dice"
        prefix="resolve.damageRoll"
      />
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
      form.resetField(`${name}.${i}`, {
        defaultValue: "" as unknown as number,
      });
    }
  }
}

function DamageResolve(props: {
  form: UseFormReturn<SelectForm>;
  calcs: Calcs;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, calcs, addItem } = props;
  if (calcs.step !== Step.DamageResolve) {
    return <></>;
  }
  const { defender, totalDamage, newStatus, awe, injury } = calcs;

  const defenderIdx = form.getValues().setup.defender || -1;

  function apply() {
    if (calcs.step !== Step.DamageResolve) {
      return <></>;
    }
    const toSet = applyResult(calcs);
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
      range: calcs.range,
      totalDamage: calcs.totalDamage,
      awe: calcs.awe,
      damageRoll: calcs.damageRoll,
      injury: calcs.injury,
      result: calcs.result,
      attacker: calcs.attacker.name,
      defender: calcs.defender.name,
      weapon: calcs.attacker.weapon.name,
      attackRoll: calcs.attackRoll,
      defenseRoll: calcs.defenseRoll,
      newStatus:
        Number(calcs.defender.woundState) <= calcs.newStatus
          ? undefined
          : calcs.newStatus,
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

function ExplosionCandidate(props: {
  form: UseFormReturn<SelectForm>;
  calcs: Calcs;
}) {
  const { form, calcs } = props;
  if (calcs.step !== Step.Explosion) {
    return <></>;
  }
  const { explosion } = calcs;
  if (typeof explosion === "string") {
    return <p className="text-destructive">Unable to hit</p>;
  }
  const radius = calcs.attacker.weapon.explosion || 0;
  return (
    <>
      <p>
        An explosion <b>{radius} meters</b> wide will occur next turn. Click
        below before opening the Explosion tab:
      </p>
      <Button
        onClick={() => {
          form.setValue("explosionSetup", {
            center: explosion.target.c as [number, number],
            radius,
            baseDamage: calcs.attacker.weapon.baseDamage,
            penDamage: calcs.attacker.weapon.penDamage || 0,
          });
        }}
      >
        Copy Explosion
      </Button>
    </>
  );
}

export function CombatForm(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, addItem } = props;
  // TODO: Optimize this?
  const values = useWatch({
    control: form.control,
    defaultValue: DefaultValues,
  }) as SelectForm;
  const characters = values.character.list.map((x) => x.name);
  const calcs = useCalcs(values);
  const { error } = calcs;

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
      <CombatSetup form={form} result={calcs} />
      <CombatResolve form={form} calcs={calcs} />
      <DamageResolve form={form} calcs={calcs} addItem={addItem} />
      <ExplosionCandidate form={form} calcs={calcs} />
      <p className="text-[0.8rem] font-medium text-destructive">
        {error
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined}
      </p>
    </div>
  );
}
