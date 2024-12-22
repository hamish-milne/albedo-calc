import type { UseFormReturn } from "react-hook-form";
import type { SchemaObjectDescription } from "yup";
import { RefField, FlagsField, SpinField } from "./custom-fields";
import { AnyForm, RecordField, AnyField } from "./generic-form";
import { DefaultWeapons, DefaultArmor } from "./rules";
import { CharacterRecord, Weapon, Armor, SelectForm } from "./schema";

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
