/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { Form } from "./components/ui/form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { DefaultArmor, DefaultWeapons } from "./rules";
import { useEffect, useMemo } from "react";
import { SelectForm, DefaultChar } from "./schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { ObjectEditor } from "./generic-form";
import { CombatLog, useCombatLog } from "./combat-log";
import { CombatForm } from "./combat-form";
import { CharacterForm, WeaponForm, ArmorForm } from "./custom-forms";
import { ExportDialog } from "./export-dialog";
import { BattleMap } from "./battlemap";

function Main() {
  const form = useForm<SelectForm>({
    mode: "onBlur",
    resolver: yupResolver(SelectForm),
    defaultValues: {
      character: {
        list: [],
        idx: 0,
      },
      weapon: { list: [], idx: 0 },
      armor: { list: [], idx: 0 },
      toHit: {
        attackRoll: [],
        defenseRoll: [],
      },
      resolve: {
        damageRoll: [],
      },
    },
  });

  useEffect(() => {
    const data = localStorage.getItem("data");
    const values: SelectForm = data
      ? JSON.parse(data)
      : {
          character: {
            list: [DefaultChar],
            idx: "0",
          },
          weapon: { list: [...DefaultWeapons], idx: "0" },
          armor: { list: [...DefaultArmor], idx: "0" },
          toHit: { attackRoll: [], defenseRoll: [] },
          resolve: { damageRoll: [] },
        };
    form.reset(values);
  }, [form]);

  const { watch } = form;

  useEffect(() => {
    const subscription = watch((value) =>
      localStorage.setItem("data", JSON.stringify(value))
    );
    return () => subscription.unsubscribe();
  }, [watch]);

  const defaultOpen = useMemo(() => {
    const data = localStorage.getItem("open");
    return data ? JSON.parse(data) : ["character", "combat", "log"];
  }, []);

  const { items, addItem, deleteItem } = useCombatLog();

  return (
    <Form {...form}>
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        onValueChange={(value) =>
          localStorage.setItem("open", JSON.stringify(value))
        }
      >
        <AccordionItem value="character">
          <AccordionTrigger className="text-lg">Character</AccordionTrigger>
          <AccordionContent className="px-px pt-px">
            <ObjectEditor
              form={form}
              prefix="character"
              newItem={(newIdx) => ({
                ...DefaultChar,
                name: `New Character ${newIdx}`,
              })}
            >
              {(prefix) => (
                <CharacterForm key={prefix} prefix={prefix} form={form} />
              )}
            </ObjectEditor>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="weapon">
          <AccordionTrigger className="text-lg">Weapon</AccordionTrigger>
          <AccordionContent className="px-px pt-px">
            <ObjectEditor
              form={form}
              prefix="weapon"
              newItem={(newIdx) => ({
                ...DefaultWeapons[0],
                name: `New weapon ${newIdx}`,
              })}
            >
              {(prefix) => (
                <WeaponForm key={prefix} prefix={prefix} form={form} />
              )}
            </ObjectEditor>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="armor">
          <AccordionTrigger className="text-lg">Armor</AccordionTrigger>
          <AccordionContent className="px-px pt-px">
            <ObjectEditor
              form={form}
              prefix="armor"
              newItem={(newIdx) => ({
                ...DefaultArmor[0],
                name: `New armor ${newIdx}`,
              })}
            >
              {(prefix) => (
                <ArmorForm key={prefix} prefix={prefix} form={form} />
              )}
            </ObjectEditor>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="map">
          <AccordionTrigger className="text-lg">Map</AccordionTrigger>
          <AccordionContent className="px-px pt-px">
            <BattleMap form={form} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="combat">
          <AccordionTrigger className="text-lg">Combat</AccordionTrigger>
          <AccordionContent className="px-px pt-px">
            <CombatForm form={form} addItem={addItem} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="log">
          <AccordionTrigger className="text-lg">Log</AccordionTrigger>
          <AccordionContent>
            <CombatLog items={items} deleteItem={deleteItem} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <ExportDialog form={form} />
    </Form>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="max-w-xl flex flex-col gap-3 m-auto">
        <h1 className="text-2xl">Hamish's Albedo Combat Calculator</h1>
        <Main />
      </div>
    </ThemeProvider>
  );
}

export default App;
