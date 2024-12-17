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
  FormMessage,
} from "./components/ui/form";
import {
  z,
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
import { attackSetup, DefaultArmor, DefaultWeapons } from "./rules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { type JSX } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
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
  resolveCharacter,
} from "./schema";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "./components/ui/label";

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
}) {
  const { form, name, label } = props;
  return (
    <FormFieldContext.Provider value={{ name }}>
      <FormItem>
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
      <div className="grid flex-1 items-center">
        <input
          type="radio"
          className={cn(
            radioVariants({ variant, size, className }),
            "appearance-none grid-overlap"
          )}
          ref={ref}
          {...props}
        />
        <Label className="grid-overlap pointer-events-none text-center">
          {label}
        </Label>
      </div>
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
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
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
        </FormControl>
      </FormItem>
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
          <FormControl>
            <Select {...field} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {optionLabels.map((x, i) => (
                  <SelectItem key={i} value={i.toString()}>
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
  title: string;
  render: (this: void, prefix: string) => JSX.Element;
}) {
  const { form, prefix, title, render } = props;
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4 flex-col">
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
      </CardContent>
    </Card>
  );
}

function CombatForm(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  const values = form.getValues();
  const characters = values.character.list.map((x) => x.name);

  const attacker = resolveCharacter(values, values.inProgress.attacker);
  const defender = resolveCharacter(values, values.inProgress.defender);
  const distance = Number(values.inProgress.distance);

  if (attacker && defender) {
    console.log(attackSetup({ attacker, defender, distance }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Combat</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4 flex-col">
        <RefField
          form={form}
          name="inProgress.attacker"
          label="Attacker"
          optionLabels={characters}
        />
        <RefField
          form={form}
          name="inProgress.defender"
          label="Defender"
          optionLabels={characters}
        />
        <NumberField form={form} label="Distance" name="inProgress.distance" />
      </CardContent>
    </Card>
  );
}

function Main() {
  console.log("render");
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
      inProgress: {},
    },
  });

  try {
    SelectForm.parse(form.getValues());
  } catch (e) {
    console.log(e);
    console.log(form.formState.errors);
  }

  return (
    <Form {...form}>
      <ObjectEditor
        form={form}
        prefix="character"
        title={CharacterRecord.description!}
        render={(prefix) => (
          <CharacterForm key={prefix} prefix={prefix} form={form} />
        )}
      />
      <ObjectEditor
        form={form}
        prefix="weapon"
        title={Weapon.description!}
        render={(prefix) => (
          <WeaponForm key={prefix} prefix={prefix} form={form} />
        )}
      />
      <ObjectEditor
        form={form}
        prefix="armor"
        title={Armor.description!}
        render={(prefix) => (
          <ArmorForm key={prefix} prefix={prefix} form={form} />
        )}
      />
      <CombatForm form={form} />
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
