import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DefaultValues } from "./data";
import { SelectForm } from "./schema";

export function MainForm() {
  const form = useForm<SelectForm>({
    mode: "onBlur",
    resolver: yupResolver(SelectForm),
    defaultValues: DefaultValues,
  });

  useEffect(() => {
    const data = localStorage.getItem("data");
    const values: SelectForm = data
      ? JSON.parse(data)
      : structuredClone(DefaultValues);
    form.reset(values);
  }, [form]);

  const { watch } = form;

  useEffect(() => {
    const subscription = watch((value) =>
      localStorage.setItem("data", JSON.stringify(value))
    );
    return () => subscription.unsubscribe();
  }, [watch]);
}
