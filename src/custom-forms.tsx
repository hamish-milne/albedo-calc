import { useWatch, type UseFormReturn } from "react-hook-form";
import type { SchemaObjectDescription } from "yup";
import { RefField, FlagsField, SpinField, TextField } from "./custom-fields";
import { AnyForm, AnyField, type AnyFieldProps } from "./generic-form";
import {
  CharacterRecord,
  Weapon,
  Armor,
  SelectForm,
  MapSchema,
} from "./schema";

function ListSelect(
  props: { listName: "weapon" | "armor" } & AnyFieldProps<SelectForm>
) {
  const {
    listName,
    form: { control },
  } = props;
  const list: { name: string }[] = useWatch({
    control,
    name: `${listName}.list`,
  });
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
            return <ListSelect key={key} {...props} listName={fName} />;
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
