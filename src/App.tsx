import "./App.css";
import {
  systemTheme,
  ThemeProvider,
  useTheme,
} from "./components/theme-provider";
import { Form } from "./components/ui/form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import {
  DefaultArmor,
  DefaultWeapons,
  DefaultChar,
  DefaultValues,
} from "./data";
import { useEffect, useMemo, type ComponentProps, type ReactNode } from "react";
import { SelectForm } from "./schema";
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
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { Sun, Moon } from "lucide-react";

export function TypographyH3(props: ComponentProps<"h3">) {
  const { className, ...cProps } = props;
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...cProps}
    />
  );
}

export function TypographyH2(props: ComponentProps<"h2">) {
  const { className, ...cProps } = props;
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...cProps}
    />
  );
}

function TopLevelItem(props: {
  value: string;
  label: string;
  children: ReactNode;
}) {
  const { value, label, children } = props;
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-lg">{label}</AccordionTrigger>
      <AccordionContent className="flex gap-4 flex-col px-px pt-px">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function Main() {
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
        <TopLevelItem value="character" label="Character">
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
        </TopLevelItem>
        <TopLevelItem value="weapon" label="Weapon">
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
        </TopLevelItem>
        <TopLevelItem value="armor" label="Armor">
          <ObjectEditor
            form={form}
            prefix="armor"
            newItem={(newIdx) => ({
              ...DefaultArmor[0],
              name: `New armor ${newIdx}`,
            })}
          >
            {(prefix) => <ArmorForm key={prefix} prefix={prefix} form={form} />}
          </ObjectEditor>
        </TopLevelItem>
        <TopLevelItem value="map" label="Map">
          <BattleMap form={form} />
        </TopLevelItem>
        <TopLevelItem value="combat" label="Combat">
          <CombatForm form={form} addItem={addItem} />
        </TopLevelItem>
        <TopLevelItem value="log" label="Log">
          <CombatLog items={items} deleteItem={deleteItem} />
        </TopLevelItem>
      </Accordion>
      <ExportDialog form={form} />
    </Form>
  );
}

function Title() {
  const { theme, setTheme } = useTheme();
  return (
    <TypographyH2 className="flex justify-between">
      Hamish's Albedo Combat Calculator
      <Button
        variant="secondary"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => {
          const current = theme === "system" ? systemTheme() : theme;
          setTheme(current === "dark" ? "light" : "dark");
        }}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </TypographyH2>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="max-w-xl flex flex-col gap-3 m-auto">
        <Title />
        <Main />
      </div>
    </ThemeProvider>
  );
}

export default App;
