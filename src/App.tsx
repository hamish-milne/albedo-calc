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
import {
  ZodBoolean,
  ZodEffects,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPipeline,
  ZodRecord,
  ZodString,
  type ZodRawShape,
  type ZodTypeAny,
} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Path,
  type RegisterOptions,
  type UseFormRegisterReturn,
  type UseFormReturn,
} from "react-hook-form";
import { Input } from "./components/ui/input";
import {
  applyResult,
  attackResolve,
  attackSetup,
  damageResolve,
  DefaultArmor,
  DefaultWeapons,
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
import React from "react";
import { Check } from "lucide-react";
import {
  BoolInput,
  Bool,
  CharacterRecord,
  Weapon,
  Armor,
  SelectForm,
  DefaultChar,
  type Character,
  Range,
} from "./schema";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";

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
          <Input {...form.register(name)} />
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

function RadioGroup<TFieldValues extends FieldValues, TOption = string>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  registerOpts?: RegisterOptions<TFieldValues>;
  options: TOption[];
  render: (
    this: void,
    field: UseFormRegisterReturn,
    value: TOption,
    idx: number
  ) => JSX.Element;
}) {
  const { form, name, registerOpts, options, render } = props;
  return (
    <div className="flex items-center justify-center gap-1">
      {options.map((x, i) => render(form.register(name, registerOpts), x, i))}
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
}

const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, variant, size, label, ...props }, ref) => {
    return (
      <FormItem className="flex-1 flex flex-row items-center gap-0">
        <FormControl>
          <input
            type="radio"
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

function EnumField2<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  label: string;
  type: ZodEnum<[string, ...string[]]>;
  name: Path<TFieldValues>;
}) {
  const { form, label, type, name } = props;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select {...field} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type.options.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function EnumField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: ZodEnum<[string, ...string[]]>;
  name: Path<TFieldValues>;
  label: string;
  optionNames?: string[];
}) {
  const { form, type, name, label, optionNames } = props;

  return (
    <FormFieldContext.Provider value={{ name }}>
      <fieldset>
        <div className="flex flex-col gap-2">
          <FormLegend>{label}</FormLegend>
          <RadioGroup
            form={form}
            name={name}
            options={type.options}
            render={(field, value, idx) => (
              <RadioButton
                key={value}
                {...field}
                value={value}
                label={optionNames?.[idx] || value}
              />
            )}
          />
        </div>
      </fieldset>
    </FormFieldContext.Provider>
  );

  // return (
  //   <FormField
  //     control={form.control}
  //     name={name}
  //     render={({ field }) => (
  //       <FormItem>
  //         <FormLabel>{label}</FormLabel>
  //         <FormControl>
  //           <ToggleGroup
  //             type="single"
  //             {...field}
  //             onValueChange={field.onChange}
  //           >
  //             {type.options.map((x, i) => (
  //               <ToggleGroupItem key={x} className="flex-1" value={x}>
  //                 {optionNames?.[i] ?? x}
  //               </ToggleGroupItem>
  //             ))}
  //           </ToggleGroup>
  //         </FormControl>
  //       </FormItem>
  //     )}
  //   />
  // );
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
          <Select {...field} onValueChange={field.onChange}>
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
  // return (
  //   <FormField
  //     control={form.control}
  //     name={name}
  //     render={({ field }) => (
  //       <FormItem className="gap-2">
  //         <div className="flex flex-row justify-between">
  //           <FormLabel>{label}</FormLabel>
  //           <FormControl>
  //             <Checkbox
  //               ref={field.ref}
  //               disabled={field.disabled}
  //               onBlur={field.onBlur}
  //               checked={field.value}
  //               onCheckedChange={(x) => field.onChange(x === true)}
  //             />
  //           </FormControl>
  //         </div>
  //         <Separator />
  //       </FormItem>
  //     )}
  //   />
  // );
  return (
    <FormItem className="gap-2">
      <div className="flex flex-row justify-between">
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Checkbox2 {...form.register(name)} />
        </FormControl>
      </div>
    </FormItem>
  );
}

function AnyField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: ZodTypeAny;
  name: Path<TFieldValues>;
  label: string;
}) {
  const { form, type, name, label } = props;
  if (type instanceof ZodNumber) {
    return <NumberField form={form} name={name} label={label} />;
  }
  if (type instanceof ZodEnum) {
    return <EnumField form={form} type={type} name={name} label={label} />;
  }
  if (type instanceof ZodString) {
    return <StringField form={form} name={name} label={label} />;
  }
  if (type === BoolInput || type === Bool || type instanceof ZodBoolean) {
    return <BoolField form={form} name={name} label={label} />;
  }
  if (type instanceof ZodEffects) {
    return AnyField({ ...props, type: type.innerType() });
  }
  if (type instanceof ZodOptional) {
    return AnyField({ ...props, type: type.unwrap() });
  }
  if (type instanceof ZodPipeline) {
    return AnyField({ ...props, type: type._def.out });
  }
  throw Error(`Unknown type: ${Object.getPrototypeOf(type).constructor.name}`);
}

function RecordField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: ZodRecord<ZodEnum<[string, ...string[]]>>;
  name: Path<TFieldValues>;
  render: (this: void, field: string, props: AnyFieldProps) => JSX.Element;
}) {
  const { form, type, name, render } = props;
  return (
    <div className="flex gap-2">
      {type.keySchema.options.map((x) =>
        render(x, {
          form,
          name: `${name}.${x}`,
          label: x,
          type: type.valueSchema,
        })
      )}
    </div>
  );
}

type AnyFieldProps = {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type: ZodTypeAny;
};

function AnyForm(props: {
  form: UseFormReturn<FieldValues>;
  type: ZodObject<ZodRawShape>;
  prefix?: string;
  render: (this: void, field: string, props: AnyFieldProps) => JSX.Element;
}) {
  const { form, type, prefix, render } = props;
  const fullPrefix = prefix ? `${prefix}.` : "";
  return (
    <div className="flex gap-4 flex-col">
      {(Object.entries(type.shape) as [Path<FieldValues>, ZodTypeAny][]).map(
        ([name, type]) =>
          render(name, {
            form,
            type,
            name: fullPrefix + name,
            label: type.description || name,
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
      default:
        return <AnyField key={key} {...props} />;
    }
  }

  return (
    <AnyForm
      form={form}
      type={CharacterRecord}
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

  return <AnyForm form={form} type={Weapon} prefix={prefix} render={render} />;
}

function ArmorForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  function render(key: string, props: AnyFieldProps) {
    switch (key as keyof Weapon) {
      default:
        return <AnyField key={key} {...props} />;
    }
  }

  return <AnyForm form={form} type={Armor} prefix={prefix} render={render} />;
}

type ListSelect<T> = { list: T[]; idx: number };

let i = 0;

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
      name: `Random ${(i += 1)}`,
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
                  {...field}
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
  const record = CharacterRecord.parse(form.watch(`character.list.${idx}`));
  const weapon = Weapon.parse(form.watch(`weapon.list.${record.weapon}`));
  const armor = Armor.parse(form.watch(`armor.list.${record.armor}`));
  return { ...record, weapon, armor };
}

function trySetupCombat(form: UseFormReturn<SelectForm>) {
  try {
    const inProgress = SelectForm.shape.setup.parse(form.watch("setup"));
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
  // const result = form.watch(prefix) as number[] | undefined;
  // useEffect(() => {
  //   if (!result || result.length != dice.length) {
  //     form.setValue(
  //       prefix,
  //       (result || []).concat(Array(dice.length).fill(0)).slice(dice.length)
  //     );
  //     form.reset(undefined, { keepValues: true });
  //   }
  // }, [dice.length, form, prefix]);
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

const rangeName = {
  C: "Close",
  S: "Short",
  M: "Medium",
  L: "Long",
  X: "Extreme",
};

function CombatSetup(props: {
  attacker: Character;
  defender: Character;
  distance: number;
  form: UseFormReturn<SelectForm>;
}) {
  const { form } = props;
  const result = attackSetup(props);

  if (!result.range) {
    return <p>Out of range!</p>;
  }

  const toHit = SelectForm.shape.toHit.safeParse(form.watch("toHit"));
  const toHitFixed = toHit.success
    ? {
        attackRoll:
          typeof result.attackDice === "number"
            ? [result.attackDice]
            : toHit.data.attackRoll.slice(0, result.attackDice.length),
        defenseRoll: toHit.data.defenseRoll.slice(0, result.defenseDice.length),
      }
    : undefined;

  return (
    <>
      <p>
        <b>{result.attacker.name}</b> will attack <b>{result.defender.name}</b>{" "}
        with <b>{result.attacker.weapon.name}</b> at{" "}
        <b>{rangeName[result.range]}</b> range.
      </p>
      {typeof result.attackDice === "number" ? (
        <p>
          Attacker will rote for <b>{result.attackDice}</b>
        </p>
      ) : (
        <DiceGroup
          form={form}
          prefix="toHit.attackRoll"
          label="Attack dice"
          dice={result.attackDice}
        />
      )}
      <DiceGroup
        form={form}
        prefix="toHit.defenseRoll"
        label="Defense dice"
        dice={result.defenseDice}
      />

      {toHitFixed ? (
        <CombatResolve
          form={form}
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
  attacker: Character;
  defender: Character;
  attackRoll: number[];
  defenseRoll: number[];
  range: Range;
}) {
  const { form } = props;
  const result = attackResolve(props);
  const { attacker, defender, damageDiceCount } = result;

  const resolved = SelectForm.shape.resolve.safeParse(form.watch("resolve"));
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
        <DamageResolve form={form} {...result} {...resolvedFixed} />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">
          Invalid dice roll values
        </p>
      )}
    </>
  );
}

function DamageResolve(props: {
  form: UseFormReturn<SelectForm>;
  attacker: Character;
  defender: Character;
  damageRoll: number[];
  range: Range;
  result: AttackResult;
}) {
  const { form } = props;
  const result = damageResolve(props);
  const { defender, totalDamage, newStatus, awe, injury } = result;

  const defenderIdx = form.watch(`setup.defender`);

  console.log(form.getValues());

  function apply() {
    const toSet = applyResult(result);
    for (const [key, value] of Object.entries(toSet)) {
      form.setValue(
        `character.list.${defenderIdx as number}.${key as keyof CharacterRecord}`,
        value
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
  }

  return (
    <>
      <p>
        After an attack of <b>{totalDamage}</b>, {defender.name} goes from{" "}
        {defender.status} to <b>{newStatus}</b>, taking <b>{injury}</b> injuries
        and <b>{awe}</b> awe.
      </p>
      <Button onClick={apply}>Apply result</Button>
    </>
  );
}

function CombatForm(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
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
        <CombatSetup {...setup} form={form} />
      ) : (
        <p className="text-[0.8rem] font-medium text-destructive">
          Unable to start combat due to form errors
        </p>
      )}
    </div>
  );
}

function Main() {
  // console.log("render");
  const form = useForm<SelectForm>({
    mode: "onChange",
    shouldUseNativeValidation: true,
    resolver: zodResolver(SelectForm),
    defaultValues: {
      character: {
        list: [DefaultChar],
        idx: "0",
      },
      weapon: { list: [...DefaultWeapons], idx: "0" },
      armor: { list: [...DefaultArmor], idx: "0" },
      toHit: {
        attackRoll: [],
        defenseRoll: [],
      },
      resolve: {
        damageRoll: [],
      },
    },
  });

  // try {
  //   SelectForm.parse(form.getValues());
  // } catch (e) {
  //   console.log(e);
  //   console.log(form.formState.errors);
  // }

  return (
    <Form {...form}>
      <Accordion type="multiple">
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
            <CombatForm form={form} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Form>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="max-w-xl flex flex-col gap-3">
        <Main />
      </div>
    </ThemeProvider>
  );
}

export default App;
