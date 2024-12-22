import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import type { FieldValues, UseFormReturn, Path } from "react-hook-form";
import type { SchemaFieldDescription, SchemaObjectDescription } from "yup";
import { Button } from "./components/ui/button";
import { FormField, FormItem, FormControl } from "./components/ui/form";
import { EnumField, TextField, BoolField } from "./custom-fields";
import { DefaultChar } from "./schema";

export function AnyField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaFieldDescription;
  name: Path<TFieldValues>;
  label: string;
}) {
  const { form, type, name, label } = props;
  if (type.oneOf && type.oneOf.length > 0) {
    return (
      <EnumField
        form={form}
        options={type.oneOf as string[]}
        name={name}
        label={label}
      />
    );
  }
  switch (type.type) {
    case "number":
    case "string":
      return <TextField form={form} name={name} label={label} />;
    case "boolean":
      return <BoolField form={form} name={name} label={label} />;
    default:
      throw Error(`Unknown type: ${type.type}`);
  }
}

export function RecordField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaObjectDescription;
  name: Path<TFieldValues>;
  children: (
    this: void,
    field: string,
    props: AnyFieldProps<TFieldValues>
  ) => JSX.Element;
}) {
  const { form, type, name, children } = props;
  return (
    <div className="flex flex-wrap gap-2 *:flex-1 *:min-w-12">
      {Object.keys(type.fields).map((x) =>
        children(x, {
          form,
          name: `${name}.${x}` as Path<TFieldValues>,
          label: x,
          type: type.fields[x],
        })
      )}
    </div>
  );
}

export type AnyFieldProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  type: SchemaFieldDescription;
};

export function AnyForm<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaObjectDescription;
  prefix?: string;
  children: (
    this: void,
    field: string,
    props: AnyFieldProps<TFieldValues>
  ) => JSX.Element;
}) {
  const { form, type, prefix, children } = props;
  const fullPrefix = prefix ? `${prefix}.` : "";
  return (
    <div className="flex gap-4 flex-col">
      {(
        Object.entries(type.fields) as [
          Path<TFieldValues>,
          SchemaFieldDescription,
        ][]
      ).map(([name, type]) =>
        children(name, {
          form,
          type,
          name: (fullPrefix + name) as Path<TFieldValues>,
          label: type.label || name,
        })
      )}
    </div>
  );
}

export type ListSelect<T> = { list: T[]; idx: number };

export function ObjectEditor(props: {
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
