/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import {
  Form,
  FormControl,
  FormField,
  FormFieldContext,
  FormItem,
  FormLabel,
  FormLegend,
  FormMessage,
} from "./components/ui/form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Input } from "./components/ui/input";
import {
  applyResult,
  attackResolve,
  attackSetup,
  CoverNames,
  damageResolve,
  DefaultArmor,
  DefaultWeapons,
  Range,
  RangeNames,
  WoundState,
  WoundStateNames,
  type AttackResult,
} from "./rules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import type { JSX } from "react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import {
  CharacterRecord,
  Weapon,
  Armor,
  SelectForm,
  DefaultChar,
  type Character,
  ToHitSchema,
  ResolveSchema,
  SetupSchema,
} from "./schema";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { Table, TableBody, TableCell, TableRow } from "./components/ui/table";
import {
  type InferType,
  type Schema,
  type SchemaFieldDescription,
  type SchemaObjectDescription,
} from "yup";

function StringField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
}) {
  const { form, name, label, placeholder } = props;
  return (
    <FormFieldContext.Provider value={{ name }}>
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input placeholder={placeholder} {...form.register(name)} />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormFieldContext.Provider>
  );
}

function NumberField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  className?: string;
}) {
  const { form, name, label, className } = props;
  return (
    <FormFieldContext.Provider value={{ name }}>
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input {...form.register(name, { valueAsNumber: true })} />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormFieldContext.Provider>
  );
}

const Checkbox2 = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <div className="grid">
      <input
        type="checkbox"
        className={cn(
          "grid-overlap cursor-pointer appearance-none",
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "checked:bg-primary checked:text-primary-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
      <Check className="grid-overlap h-4 w-4 text-background pointer-events-none" />
    </div>
  );
});
Checkbox2.displayName = "Checkbox";

function ToggleGroup<TOption = string>(props: {
  options: TOption[];
  render: (this: void, value: TOption, idx: number) => JSX.Element;
}) {
  const { options, render } = props;
  return (
    <div className="flex items-center justify-center gap-1">
      {options.map((x, i) => render(x, i))}
    </div>
  );
}

const radioVariants = cva(
  cn(
    "rounded-md text-sm font-medium transition-colors",
    "hover:bg-muted hover:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "checked:bg-accent checked:text-accent-foreground"
  ),
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RadioButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof radioVariants> {
  label: string;
  type: "single" | "multiple";
}

const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, variant, size, label, type, ...props }, ref) => {
    return (
      <FormItem className="flex-1 flex flex-row items-center gap-0">
        <FormControl>
          <input
            type={type === "single" ? "radio" : "checkbox"}
            className={cn(
              radioVariants({ variant, size, className }),
              "appearance-none w-full cursor-pointer"
            )}
            ref={ref}
            {...props}
          />
        </FormControl>
        <FormLabel className="pointer-events-none w-full text-center ml-[-100%]">
          {label}
        </FormLabel>
      </FormItem>
    );
  }
);
RadioButton.displayName = "RadioButton";

function enumValues(length: number): string[] {
  const ret: string[] = [];
  for (let i = 0; i < length; i++) {
    ret.push(String(i));
  }
  return ret;
}

function EnumField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  optionValues?: string[];
  optionNames?: string[];
}) {
  const { form, name, label, optionValues, optionNames } = props;

  return (
    <FormFieldContext.Provider value={{ name }}>
      <fieldset>
        <div className="flex flex-col gap-2">
          <FormLegend>{label}</FormLegend>
          <ToggleGroup
            options={optionValues ?? enumValues(optionNames?.length || 0)}
            render={(value, idx) => (
              <RadioButton
                key={value}
                type="single"
                {...form.register(name)}
                value={value}
                label={optionNames?.[idx] || value}
              />
            )}
          />
          <FormMessage />
        </div>
      </fieldset>
    </FormFieldContext.Provider>
  );
}

function FlagsField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  type: SchemaObjectDescription;
}) {
  const { form, name, label, type } = props;

  return (
    <FormFieldContext.Provider value={{ name }}>
      <fieldset>
        <div className="flex flex-col gap-2">
          <FormLegend>{label}</FormLegend>
          <ToggleGroup
            options={Object.keys(type.fields)}
            render={(value) => (
              <RadioButton
                key={value}
                type="multiple"
                {...form.register(`${name}.${value}` as Path<TFieldValues>)}
                label={type.fields[value]?.label || value}
              />
            )}
          />
          <FormMessage />
        </div>
      </fieldset>
    </FormFieldContext.Provider>
  );
}

function RefField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  label: string;
  name: Path<TFieldValues>;
  optionLabels: string[];
}) {
  const { form, label, name, optionLabels } = props;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            disabled={field.disabled}
            name={field.name}
            value={String(field.value)}
            onValueChange={(x) => field.onChange(Number(x))}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {optionLabels.map((x, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

function BoolField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
}) {
  const { form, name, label } = props;
  return (
    <FormItem className="gap-2">
      <div className="flex flex-row justify-between">
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Checkbox2 {...form.register(name)} />
        </FormControl>
        <FormMessage />
      </div>
    </FormItem>
  );
}

function AnyField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaFieldDescription;
  name: Path<TFieldValues>;
  label: string;
}) {
  const { form, type, name, label } = props;
  if (type.type === "number") {
    return <NumberField form={form} name={name} label={label} />;
  }
  if (type.oneOf && type.oneOf.length > 0) {
    return (
      <EnumField
        form={form}
        optionValues={type.oneOf as string[]}
        name={name}
        label={label}
      />
    );
  }
  if (type.type === "string") {
    return <StringField form={form} name={name} label={label} />;
  }
  if (type.type === "boolean") {
    return <BoolField form={form} name={name} label={label} />;
  }
  throw Error(`Unknown type: ${Object.getPrototypeOf(type).constructor.name}`);
}

function RecordField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaObjectDescription;
  name: Path<TFieldValues>;
  render: (this: void, field: string, props: AnyFieldProps) => JSX.Element;
}) {
  const { form, type, name, render } = props;
  return (
    <div className="flex gap-2">
      {Object.keys(type.fields).map((x) =>
        render(x, {
          form,
          name: `${name}.${x}`,
          label: x,
          type: type.fields[x],
        })
      )}
    </div>
  );
}

type AnyFieldProps = {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type: SchemaFieldDescription;
};

function AnyForm(props: {
  form: UseFormReturn<FieldValues>;
  type: SchemaObjectDescription;
  prefix?: string;
  render: (this: void, field: string, props: AnyFieldProps) => JSX.Element;
}) {
  const { form, type, prefix, render } = props;
  const fullPrefix = prefix ? `${prefix}.` : "";
  return (
    <div className="flex gap-4 flex-col">
      {(
        Object.entries(type.fields) as [
          Path<FieldValues>,
          SchemaFieldDescription,
        ][]
      ).map(([name, type]) =>
        render(name, {
          form,
          type,
          name: fullPrefix + name,
          label: type.label || name,
        })
      )}
    </div>
  );
}

function CharacterForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  function render(key: string, props: AnyFieldProps) {
    switch (key as keyof CharacterRecord) {
      case "weapon":
        return (
          <RefField
            key={key}
            {...props}
            optionLabels={DefaultWeapons.map((x) => x.name)}
          />
        );
      case "armor":
        return (
          <RefField
            key={key}
            {...props}
            optionLabels={DefaultArmor.map((x) => x.name)}
          />
        );
      case "marks":
        return (
          <RecordField
            key={key}
            {...props}
            type={props.type as any}
            render={(key, props) => <AnyField key={key} {...props} />}
          />
        );
      case "woundState":
        return <EnumField key={key} {...props} optionNames={WoundStateNames} />;
      case "maxCover":
      case "concealment":
        return <EnumField key={key} {...props} optionNames={CoverNames} />;
      case "conditions":
      case "gifts":
      case "activeGifts":
        return <FlagsField key={key} {...props} type={props.type as any} />;
      default:
        return <AnyField key={key} {...props} />;
    }
  }

  return (
    <AnyForm
      form={form}
      type={CharacterRecord.describe()}
      prefix={prefix}
      render={render}
    />
  );
}

function WeaponForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  function render(key: string, props: AnyFieldProps) {
    switch (key as keyof Weapon) {
      case "ranges":
        return (
          <RecordField
            key={key}
            {...props}
            type={props.type as any}
            render={(key, props) => <AnyField key={key} {...props} />}
          />
        );
      default:
        return <AnyField key={key} {...props} />;
    }
  }

  return (
    <AnyForm
      form={form}
      type={Weapon.describe()}
      prefix={prefix}
      render={render}
    />
  );
}

function ArmorForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  function render(key: string, props: AnyFieldProps) {
    switch (key as keyof Weapon) {
      default:
        return <AnyField key={key} {...props} />;
    }
  }

  return (
    <AnyForm
      form={form}
      type={Armor.describe()}
      prefix={prefix}
      render={render}
    />
  );
}

type ListSelect<T> = { list: T[]; idx: number };

function ObjectEditor(props: {
  form: UseFormReturn<any>;
  prefix: string;
  render: (this: void, prefix: string) => JSX.Element;
}) {
  const { form, prefix, render } = props;
  const { list, idx } = form.getValues()[prefix] as ListSelect<{
    name: string;
  }>;

  function setIdx(newIdx: number) {
    form.setValue(`${prefix}.idx`, newIdx);
    form.reset(undefined, {
      keepValues: true,
    });
  }

  function create() {
    const newIdx = list.length;
    form.setValue(`${prefix}.list.${newIdx}`, {
      ...DefaultChar,
      name: `New Character ${list.length}`,
    });
    setIdx(newIdx);
  }

  return (
    <div className="flex gap-4 flex-col">
      <div className="flex gap-2">
        <FormField
          name={`${prefix}.idx`}
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Select
                  disabled={field.disabled}
                  name={field.name}
                  value={String(field.value)}
                  onValueChange={(x) => setIdx(Number(x))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((x, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <Button onClick={create}>New</Button>
        <Button>Delete</Button>
      </div>
      {render(`${prefix}.list.${idx}`)}
    </div>
  );
}

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
  try {
    const inProgress = SetupSchema.validateSync(form.watch("setup"));
    return {
      attacker: getCharacter(form, inProgress.attacker),
      defender: getCharacter(form, inProgress.defender),
      distance: inProgress.distance,
    };
  } catch (_) {
    return;
  }
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
          <NumberField
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

  if (!result.range) {
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
      <p>
        <b>{result.attacker.name}</b> will attack <b>{result.defender.name}</b>{" "}
        with <b>{result.attacker.weapon.name}</b> at{" "}
        <b>{RangeNames[result.range]}</b> range.
      </p>
      {typeof result.attackDice === "number" ? (
        <p>
          Attacker will rote for <b>{result.attackDice}.</b>
        </p>
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

function CombatForm(props: {
  form: UseFormReturn<SelectForm>;
  addItem: (this: void, item: LogItem) => void;
}) {
  const { form, addItem } = props;
  const values = form.getValues();
  const characters = values.character.list.map((x) => x.name);

  const setup = trySetupCombat(form);

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
      <NumberField form={form} label="Distance" name="setup.distance" />

      {setup ? (
        <CombatSetup {...setup} form={form} addItem={addItem} />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">
          Unable to start combat due to form errors
        </p>
      )}
    </div>
  );
}

interface LogItem {
  attacker: string;
  defender: string;
  weapon: string;
  range: Range;
  attackRoll: number | number[];
  defenseRoll: number[];
  result: AttackResult;
  damageRoll: number[];
  totalDamage: number;
  newStatus: WoundState | undefined;
  injury: number;
  awe: number;
}

function LogItem({
  attacker,
  defender,
  weapon,
  range,
  attackRoll,
  defenseRoll,
  result,
  damageRoll,
  totalDamage,
  newStatus,
  injury,
  awe,
}: LogItem) {
  return (
    <p>
      <b>{attacker}</b> attacked <b>{defender}</b> with <b>{weapon}</b>, at{" "}
      <b>{Range[range]}</b> range,{" "}
      {typeof attackRoll === "number" ? (
        <>
          roting for <b>{attackRoll}</b>
        </>
      ) : (
        <>
          rolling{" "}
          <b>
            [{attackRoll.join(", ")}]={Math.max(...attackRoll)}
          </b>
        </>
      )}{" "}
      against{" "}
      <b>
        [{defenseRoll.join(", ")}]={Math.max(...defenseRoll)}
      </b>
      . The result was a <b>{result}</b>.{" "}
      {damageRoll.length > 0 ? (
        <>
          The damage was{" "}
          <b>
            [{damageRoll.join(", ")}]={totalDamage}
          </b>
          , and <i>{defender}</i>{" "}
          {newStatus ? (
            <>
              is <b>{newStatus}</b>, taking
            </>
          ) : (
            <>took</>
          )}{" "}
          <b>{injury}</b> injuries and <b>{awe}</b> awe.
        </>
      ) : awe > 0 ? (
        <>
          <i>{defender}</i> took <b>{awe}</b> awe from being attacked.
        </>
      ) : (
        <></>
      )}
    </p>
  );
}

function CombatLog(props: {
  items: LogItem[];
  deleteItem: (this: void, idx: number) => void;
}) {
  const { items, deleteItem } = props;

  return (
    <Table>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>
              <LogItem {...item} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteItem(idx)}
              >
                <X className="text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Main() {
  const form = useForm<SelectForm>({
    mode: "onBlur",
    resolver: yupResolver(SelectForm),
    defaultValues: {
      character: {
        list: [],
        idx: 0,
      },
      weapon: { list: [], idx: 0 },
      armor: { list: [], idx: 0 },
      toHit: {
        attackRoll: [],
        defenseRoll: [],
      },
      resolve: {
        damageRoll: [],
      },
    },
  });

  useEffect(() => {
    const data = localStorage.getItem("data");
    const values: SelectForm = data
      ? JSON.parse(data)
      : {
          character: {
            list: [DefaultChar],
            idx: "0",
          },
          weapon: { list: [...DefaultWeapons], idx: "0" },
          armor: { list: [...DefaultArmor], idx: "0" },
          toHit: { attackRoll: [], defenseRoll: [] },
          resolve: { damageRoll: [] },
        };
    form.reset(values);
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) =>
      localStorage.setItem("data", JSON.stringify(value))
    );
    return () => subscription.unsubscribe();
  }, [form]);

  const defaultOpen = useMemo(() => {
    const data = localStorage.getItem("open");
    return data ? JSON.parse(data) : ["character", "combat", "log"];
  }, []);

  const [items, setItems] = useState<LogItem[]>(() => {
    const data = localStorage.getItem("log");
    return data ? JSON.parse(data) : [];
  });

  function addItem(item: LogItem) {
    const newItems = [...items, item];
    setItems(newItems);
    localStorage.setItem("log", JSON.stringify(newItems));
  }

  function deleteItem(idx: number) {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
    localStorage.setItem("log", JSON.stringify(newItems));
  }

  return (
    <Form {...form}>
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        onValueChange={(value) =>
          localStorage.setItem("open", JSON.stringify(value))
        }
      >
        <AccordionItem value="character">
          <AccordionTrigger>Character</AccordionTrigger>
          <AccordionContent>
            <ObjectEditor
              form={form}
              prefix="character"
              render={(prefix) => (
                <CharacterForm key={prefix} prefix={prefix} form={form} />
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="weapon">
          <AccordionTrigger>Weapon</AccordionTrigger>
          <AccordionContent>
            <ObjectEditor
              form={form}
              prefix="weapon"
              render={(prefix) => (
                <WeaponForm key={prefix} prefix={prefix} form={form} />
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="armor">
          <AccordionTrigger>Armor</AccordionTrigger>
          <AccordionContent>
            <ObjectEditor
              form={form}
              prefix="armor"
              render={(prefix) => (
                <ArmorForm key={prefix} prefix={prefix} form={form} />
              )}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="combat">
          <AccordionTrigger>Combat</AccordionTrigger>
          <AccordionContent>
            <CombatForm form={form} addItem={addItem} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="log">
          <AccordionTrigger>Log</AccordionTrigger>
          <AccordionContent>
            <CombatLog items={items} deleteItem={deleteItem} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Form>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="max-w-xl flex flex-col gap-3 m-auto">
        <h1 className="text-2xl">Hamish's Albedo Combat Calculator</h1>
        <Main />
      </div>
    </ThemeProvider>
  );
}

export default App;
