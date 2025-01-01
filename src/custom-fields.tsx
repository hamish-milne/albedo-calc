import type { FieldValues, UseFormReturn, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormFieldContext,
  FormItem,
  FormLabel,
  FormLegend,
  FormMessage,
} from "./components/ui/form";
import { Checkbox, RadioButton, ToggleGroup } from "./form-components";
import { Input } from "./components/ui/input";
import type { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { cn } from "./lib/utils";
import { Separator } from "./components/ui/separator";
import { Button } from "./components/ui/button";
import { Minus, Plus } from "lucide-react";

export function TextField<TFieldValues extends FieldValues>(
  props: {
    form: UseFormReturn<TFieldValues>;
    name: Path<TFieldValues>;
    label: string;
    className?: string;
  } & Omit<ComponentProps<"input">, "form">
) {
  const { form, name, label, className, ...inputProps } = props;
  return (
    <FormFieldContext.Provider value={{ name }}>
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input {...form.register(name)} {...inputProps} />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormFieldContext.Provider>
  );
}

function SpinFieldSlot<TFieldValues extends FieldValues>(
  props: {
    form: UseFormReturn<TFieldValues>;
    name: Path<TFieldValues>;
  } & Omit<ComponentProps<"input">, "form">
) {
  const { form, name, ...inputProps } = props;

  function inc() {
    form.setValue(name, (Number(form.getValues(name)) + 1) as any);
  }
  function dec() {
    form.setValue(name, (Number(form.getValues(name)) - 1) as any);
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="secondary"
        size="icon"
        onClick={dec}
        aria-label="Decrement"
      >
        <Minus />
      </Button>
      <Input {...inputProps} {...form.register(name)} />
      <Button
        variant="secondary"
        size="icon"
        onClick={inc}
        aria-label="Increment"
      >
        <Plus />
      </Button>
    </div>
  );
}

export function SpinField<TFieldValues extends FieldValues>(props: {
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
          <SpinFieldSlot form={form} name={name} />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormFieldContext.Provider>
  );
}

export function BoolField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  className?: string;
}) {
  const { form, name, label, className } = props;
  return (
    <FormItem className={cn("gap-2", className)}>
      <div className="flex flex-row justify-between">
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Checkbox {...form.register(name)} />
        </FormControl>
        <FormMessage />
      </div>
      <Separator />
    </FormItem>
  );
}

export function EnumField<
  TFieldValues extends FieldValues,
  TOption extends string,
>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: TOption[];
  optionLabels?: (option: TOption, idx: number) => string | undefined;
  className?: string;
}) {
  const { form, name, label, options, optionLabels, className } = props;

  return (
    <FormFieldContext.Provider value={{ name }}>
      <div className={cn("flex flex-col gap-2", className)}>
        <FormLegend>{label}</FormLegend>
        <ToggleGroup options={options}>
          {(value, idx) => (
            <RadioButton
              key={value}
              type="single"
              {...form.register(name)}
              value={value}
              label={optionLabels?.(value, idx) || value}
            />
          )}
        </ToggleGroup>
        <FormMessage />
      </div>
    </FormFieldContext.Provider>
  );
}

export function FlagsField<
  TFieldValues extends FieldValues,
  TField extends string,
>(props: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  fields: TField[];
  fieldLabels?: (field: TField, idx: number) => string | undefined;
  className?: string;
}) {
  const { form, name, label, fields, fieldLabels, className } = props;

  return (
    <FormFieldContext.Provider value={{ name }}>
      <div className={cn("flex flex-col gap-2", className)}>
        <FormLegend>{label}</FormLegend>
        <ToggleGroup options={fields}>
          {(value, idx) => (
            <RadioButton
              key={value}
              type="multiple"
              {...form.register(`${name}.${value}` as Path<TFieldValues>)}
              label={fieldLabels?.(value, idx) || value}
            />
          )}
        </ToggleGroup>
        <FormMessage />
      </div>
    </FormFieldContext.Provider>
  );
}

export function RefField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  label: string;
  name: Path<TFieldValues>;
  optionLabels: string[];
  className?: string;
}) {
  const { form, label, name, optionLabels, className } = props;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label ? <FormLabel>{label}</FormLabel> : undefined}
          <Select
            disabled={field.disabled}
            name={field.name}
            value={String(field.value)}
            onValueChange={(x) => field.onChange(Number(x))}
          >
            <FormControl>
              <SelectTrigger aria-label={label || "Drop-down button"}>
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
