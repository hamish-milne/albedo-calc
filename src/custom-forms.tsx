import { type Path, type UseFormReturn } from "react-hook-form";
import type { SchemaObjectDescription } from "yup";
import { RefField, FlagsField, SpinField, TextField } from "./custom-fields";
import { AnyForm, AnyField } from "./generic-form";
import {
  CharacterRecord,
  Weapon,
  Armor,
  SelectForm,
  MapSchema,
} from "./schema";

export function ListSelectField(props: {
  listName: Path<any>;
  form: UseFormReturn<any>;
  name: Path<any>;
  label: string;
  className?: string;
}) {
  const { listName, form } = props;
  const list: { name: string }[] = form.getValues(`${listName}.list`);
  return <RefField {...props} optionLabels={list.map((x) => x.name)} />;
}

export function CharacterForm(props: {
  form: UseFormReturn<SelectForm>;
  prefix: string;
}) {
  const { form, prefix } = props;

  return (
    <AnyForm form={form} type={CharacterRecord.describe()} prefix={prefix}>
      {(key, props) => {
        const fName = key as keyof CharacterRecord;
        switch (fName) {
          case "injury":
          case "awe":
            return <SpinField key={key} {...props} />;
          case "weapon":
          case "armor":
            return <ListSelectField key={key} {...props} listName={fName} />;
          case "conditions":
          case "gifts":
          case "activeGifts": {
            const { fields } = props.type as SchemaObjectDescription;
            return (
              <FlagsField
                key={key}
                {...props}
                fields={Object.keys(fields)}
                fieldLabels={(f) => fields[f].label}
              />
            );
          }
          case "color":
            return <TextField key={key} {...props} type="color" />;
          default:
            return <AnyField key={key} {...props} />;
        }
      }}
    </AnyForm>
  );
}

export function WeaponForm(props: {
  form: UseFormReturn<any>;
  prefix: string;
}) {
  const { form, prefix } = props;

  return <AnyForm form={form} type={Weapon.describe()} prefix={prefix} />;
}

export function ArmorForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  return <AnyForm form={form} type={Armor.describe()} prefix={prefix} />;
}

export function MapForm(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;

  return <AnyForm form={form} type={MapSchema.describe()} prefix={"map"} />;
}
