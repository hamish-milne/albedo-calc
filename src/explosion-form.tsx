import type { UseFormReturn } from "react-hook-form";
import { ExplosionSchema, type SelectForm } from "./schema";
import { AnyField, AnyForm } from "./generic-form";

export function ExplosionForm(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  return (
    <div className="flex gap-4 flex-col">
      <p className="text-xs">
        Use the Combat tab to mark candidate positions based on an attack roll.
        <br />
        You can preview and adjust the resulting explosion on the Map.
      </p>
      <AnyForm form={form} type={ExplosionSchema.describe()} prefix="explosion">
        {(field, props) => <AnyField key={field} {...props} />}
      </AnyForm>
      <p></p>
    </div>
  );
}
