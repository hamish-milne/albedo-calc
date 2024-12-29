import type { UseFormReturn } from "react-hook-form";
import type { InferType, SchemaObjectDescription } from "yup";
import { RefField, FlagsField, SpinField, TextField } from "./custom-fields";
import { AnyForm, RecordField, AnyField } from "./generic-form";
import { DefaultWeapons, DefaultArmor } from "./rules";
import {
  CharacterRecord,
  Weapon,
  Armor,
  SelectForm,
  MapSchema,
} from "./schema";

export function CharacterForm(props: {
  form: UseFormReturn<SelectForm>;
  prefix: string;
}) {
  const { form, prefix } = props;

  return (
    <AnyForm form={form} type={CharacterRecord.describe()} prefix={prefix}>
      {(key, props) => {
        switch (key as keyof CharacterRecord) {
          case "injury":
          case "awe":
            return <SpinField key={key} {...props} />;
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
          case "position":
            return (
              <RecordField key={key} {...props} type={props.type as any}>
                {(key, props) => <AnyField key={key} {...props} />}
              </RecordField>
            );
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

  return (
    <AnyForm form={form} type={Weapon.describe()} prefix={prefix}>
      {(key, props) => {
        switch (key as keyof Weapon) {
          case "ranges":
            return (
              <RecordField key={key} {...props} type={props.type as any}>
                {(key, props) => <AnyField key={key} {...props} />}
              </RecordField>
            );
          default:
            return <AnyField key={key} {...props} />;
        }
      }}
    </AnyForm>
  );
}

export function ArmorForm(props: { form: UseFormReturn<any>; prefix: string }) {
  const { form, prefix } = props;

  return (
    <AnyForm form={form} type={Armor.describe()} prefix={prefix}>
      {(key, props) => {
        switch (key as keyof Weapon) {
          default:
            return <AnyField key={key} {...props} />;
        }
      }}
    </AnyForm>
  );
}

export function MapForm(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  return (
    <AnyForm form={form} type={MapSchema.describe()} prefix={"map"}>
      {(key, props) => {
        switch (key as keyof InferType<typeof MapSchema>) {
          default:
            return <AnyField key={key} {...props} />;
        }
      }}
    </AnyForm>
  );
}
