import { X } from "lucide-react";
import { Button } from "./components/ui/button";
import { Table, TableBody, TableRow, TableCell } from "./components/ui/table";
import type { AttackResult } from "./rules";
import { WoundState, Range } from "./schema";
import { useState } from "react";

export interface LogItem {
  attacker: string;
  defender: string;
  weapon: string;
  range: Range;
  attackRoll: number | number[];
  defenseRoll: number[];
  result: AttackResult;
  damageRoll: number[];
  totalDamage: number;
  newStatus: WoundState | undefined;
  injury: number;
  awe: number;
}

export function useCombatLog() {
  const [items, setItems] = useState<LogItem[]>(() => {
    const data = localStorage.getItem("log");
    return data ? JSON.parse(data) : [];
  });

  function addItem(item: LogItem) {
    const newItems = [...items, item];
    setItems(newItems);
    localStorage.setItem("log", JSON.stringify(newItems));
  }

  function deleteItem(idx: number) {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
    localStorage.setItem("log", JSON.stringify(newItems));
  }

  return { items, addItem, deleteItem };
}

function LogItem({
  attacker,
  defender,
  weapon,
  range,
  attackRoll,
  defenseRoll,
  result,
  damageRoll,
  totalDamage,
  newStatus,
  injury,
  awe,
}: LogItem) {
  return (
    <p>
      <b>{attacker}</b> attacked <b>{defender}</b> with <b>{weapon}</b>, at{" "}
      <b>{Range[range]}</b> range,{" "}
      {typeof attackRoll === "number" ? (
        <>
          roting for <b>{attackRoll}</b>
        </>
      ) : (
        <>
          rolling{" "}
          <b>
            [{attackRoll.join(", ")}]={Math.max(...attackRoll)}
          </b>
        </>
      )}{" "}
      against{" "}
      <b>
        [{defenseRoll.join(", ")}]={Math.max(...defenseRoll)}
      </b>
      . The result was a <b>{result}</b>.{" "}
      {damageRoll.length > 0 ? (
        <>
          The damage was{" "}
          <b>
            [{damageRoll.join(", ")}]={totalDamage}
          </b>
          , and <i>{defender}</i>{" "}
          {newStatus ? (
            <>
              is <b>{WoundState[newStatus]}</b>, taking
            </>
          ) : (
            <>took</>
          )}{" "}
          <b>{injury}</b> injuries and <b>{awe}</b> awe.
        </>
      ) : awe > 0 ? (
        <>
          <i>{defender}</i> took <b>{awe}</b> awe from being attacked.
        </>
      ) : (
        <></>
      )}
    </p>
  );
}

export function CombatLog(props: {
  items: LogItem[];
  deleteItem: (this: void, idx: number) => void;
}) {
  const { items, deleteItem } = props;

  return (
    <Table>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>
              <LogItem {...item} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteItem(idx)}
              >
                <X className="text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
