import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  CharacterRecord,
  ExplosionResolveSchema,
  ExplosionSetupSchema,
  WoundStateNames,
  type SelectForm,
} from "./schema";
import { AnyField, AnyForm } from "./generic-form";
import { applyResult, explosionResolve, explosionSetup } from "./rules";
import { DefaultValues } from "./data";
import { getCharacter, tryOrFail } from "./calc-provider";
import { DiceGroup } from "./combat-form";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "./components/ui/table";
import { Button } from "./components/ui/button";
import type { LogItem } from "./useCombatLog";

enum ExplosionStep {
  Setup,
  Resolve,
  Complete,
}

function stepSetup(values: SelectForm) {
  const setup = ExplosionSetupSchema.validateSync(values.explosionSetup);
  const characters = values.character.list.map((_, i) =>
    getCharacter(i, values)
  );
  return {
    ...setup,
    hits: explosionSetup({
      ...setup,
      center: setup.center as [number, number],
      characters,
    }),
    characters,
  };
}

function stepResolve(input: ReturnType<typeof stepSetup>, values: SelectForm) {
  if (input.hits.length === 0) {
    throw Error("No hits!");
  }
  const resolve = ExplosionResolveSchema.validateSync({
    rolls: values.explosionResolve?.rolls
      ?.slice(0, input.hits.length)
      .map(({ damageRoll }, i) => ({
        damageRoll: damageRoll?.slice(0, input.hits[i].damageDiceCount),
      })),
  });
  if (resolve.rolls.length < input.hits.length) {
    throw Error("Roll for additional characters");
  }
  const resolved = explosionResolve({
    ...input,
    rolls: input.hits.map((x, i) => ({
      character: x.character,
      damageRoll: resolve.rolls[i].damageRoll,
    })),
  });
  return {
    ...input,
    ...resolved,
  };
}

function useExplosion(form: UseFormReturn<SelectForm>) {
  const values = useWatch({
    control: form.control,
    defaultValue: DefaultValues,
  }) as SelectForm;
  const s1 = tryOrFail(stepSetup, values);
  if (!s1.success) {
    return { step: ExplosionStep.Setup as const, error: s1.error };
  }
  const s2 = tryOrFail(stepResolve, s1.data, values);
  if (!s2.success) {
    return {
      step: ExplosionStep.Resolve as const,
      error: s2.error,
      ...s1.data,
    };
  }
  return { step: ExplosionStep.Complete as const, ...s2.data };
}

type ExpCalcs = ReturnType<typeof useExplosion>;

function ExplosionResolve(props: {
  form: UseFormReturn<SelectForm>;
  calcs: ExpCalcs;
}) {
  const { form, calcs } = props;
  if (calcs.step === ExplosionStep.Setup) {
    return <></>;
  }
  return (
    <>
      {calcs.hits.map(({ character, damageDiceCount }, i) => {
        const c = calcs.characters[character];
        return (
          <DiceGroup
            form={form}
            label={`${c.name}`}
            dice={Array(damageDiceCount).fill(20)}
            prefix={`explosionResolve.rolls.${i}.damageRoll`}
          />
        );
      })}
    </>
  );
}

function ExplosionComplete(props: {
  calcs: ExpCalcs;
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, ...items: LogItem[]) => void;
}) {
  const { calcs, form, addItem } = props;
  if (calcs.step !== ExplosionStep.Complete) {
    return <></>;
  }

  function apply() {
    if (calcs.step !== ExplosionStep.Complete) {
      return;
    }
    const toSet = calcs.results.map(applyResult);
    for (let i = 0; i < toSet.length; i++) {
      const r = calcs.results[i];
      for (const [key, value] of Object.entries(toSet[i])) {
        form.setValue(
          `character.list.${r.defenderIdx}.${key as keyof CharacterRecord}`,
          value
        );
      }
    }
    addItem(
      ...calcs.results.map<LogItem>((r) => ({
        type: "explosion",
        defender: r.defender.name,
        awe: r.awe,
        damageRoll: r.damageRoll,
        injury: r.injury,
        newStatus: r.newStatus,
        totalDamage: r.totalDamage,
      }))
    );
    form.reset(undefined, { keepValues: true });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Character</TableHead>
            <TableHead>Damage total</TableHead>
            <TableHead>Awe</TableHead>
            <TableHead>Injury</TableHead>
            <TableHead>Wound state</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calcs.results.map((x, i) => (
            <TableRow key={i}>
              <TableCell>{x.defender.name}</TableCell>
              <TableCell>{x.totalDamage}</TableCell>
              <TableCell>{x.awe}</TableCell>
              <TableCell>{x.injury}</TableCell>
              <TableCell>{WoundStateNames[x.newStatus]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={apply}>Apply result</Button>
    </>
  );
}

export function ExplosionForm(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, addItem } = props;
  const exp = useExplosion(form);
  const { error } = exp;
  return (
    <div className="flex gap-4 flex-col">
      <p className="text-xs">
        Use the Combat tab to mark candidate positions based on an attack roll.
        <br />
        You can preview and adjust the resulting explosion on the Map.
      </p>
      <AnyForm
        form={form}
        type={ExplosionSetupSchema.describe()}
        prefix="explosionSetup"
      >
        {(field, props) => <AnyField key={field} {...props} />}
      </AnyForm>
      <ExplosionResolve form={form} calcs={exp} />
      <ExplosionComplete form={form} calcs={exp} addItem={addItem} />
      <p className="text-destructive">
        {error
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined}
      </p>
    </div>
  );
}
