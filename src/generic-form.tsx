import {
  type FieldValues,
  type UseFormReturn,
  type Path,
  useWatch,
} from "react-hook-form";
import type { SchemaFieldDescription, SchemaObjectDescription } from "yup";
import { Button } from "./components/ui/button";
import { EnumField, TextField, BoolField } from "./custom-fields";
import { ListSelect } from "./schema";
import { ListSelectField } from "./custom-forms";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./components/ui/dialog";
import { useState } from "react";

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
      return (
        <TextField form={form} name={name} label={label} inputMode="numeric" />
      );
    case "string":
      return <TextField form={form} name={name} label={label} />;
    case "boolean":
      return <BoolField form={form} name={name} label={label} />;
    case "object":
      return (
        <RecordField
          form={form}
          name={name}
          type={type as SchemaObjectDescription}
        />
      );
    default:
      throw Error(`Unknown type: ${type.type}`);
  }
}

export function RecordField<TFieldValues extends FieldValues>(props: {
  form: UseFormReturn<TFieldValues>;
  type: SchemaObjectDescription;
  name: Path<TFieldValues>;
  children?: (
    this: void,
    field: string,
    props: AnyFieldProps<TFieldValues>
  ) => JSX.Element;
}) {
  const { form, type, name } = props;
  const children =
    props.children || ((key, props) => <AnyField key={key} {...props} />);

  return (
    <div className="flex flex-wrap gap-2 *:flex-1 *:min-w-12">
      {Object.keys(type.fields).map((x) =>
        children(x, {
          form,
          name: `${name}.${x}` as Path<TFieldValues>,
          label: type.fields[x].label || x,
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
  children?: (
    this: void,
    field: string,
    props: AnyFieldProps<TFieldValues>
  ) => JSX.Element;
}) {
  const { form, type, prefix } = props;
  const children =
    props.children || ((key, props) => <AnyField key={key} {...props} />);
  const fullPrefix = prefix ? `${prefix}.` : "";
  return (
    <>
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
    </>
  );
}

export type ListSelect<T> = { list: T[]; idx: number };

export function ObjectEditor(props: {
  form: UseFormReturn<any>;
  prefix: string;
  children: (this: void, prefix: string) => JSX.Element;
  newItem: (this: void, newIdx: number) => { name: string };
}) {
  const { form, prefix, children, newItem } = props;
  const idx = useWatch({
    control: form.control,
    name: `${prefix}.idx`,
  }) as number;

  const [open, setOpen] = useState(false);

  function setIdx(newIdx: number) {
    form.setValue(`${prefix}.idx`, newIdx);
    form.reset(undefined, {
      keepValues: true,
    });
  }

  function create() {
    const list = form.getValues(`${prefix}.list`) as unknown[];
    const newIdx = list.length;
    form.setValue(`${prefix}.list.${newIdx}`, newItem(newIdx));
    setIdx(newIdx);
  }

  function remove() {
    const list = form.getValues(`${prefix}.list`) as unknown[];
    if (idx > 0 && idx < list.length) {
      const newList = [...list];
      newList.splice(idx, 1);
      form.setValue(`${prefix}.list`, newList);
      if (idx >= newList.length) {
        setIdx(newList.length - 1);
      }
    }
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <ListSelectField
          name={`${prefix}.idx`}
          listName={prefix}
          form={form}
          label=""
          className="flex-1"
        />
        <Button onClick={create}>New</Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
            </DialogHeader>
            <DialogFooter className="sm:justify-start">
              <Button variant="destructive" onClick={remove}>
                Delete selected {prefix}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {children(`${prefix}.list.${idx}`)}
    </>
  );
}
