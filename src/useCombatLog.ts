import { useState } from "react";
import type { AttackResult } from "./rules";
import { Range, WoundState } from "./schema";

export interface BaseLogItem {
  defender: string;
  damageRoll: number[];
  totalDamage: number;
  newStatus: WoundState | undefined;
  injury: number;
  awe: number;
}

export interface AttackLogItem extends BaseLogItem {
  type?: undefined;
  attacker: string;
  defenseRoll: number[];
  attackRoll: number | number[];
  weapon: string;
  range: Range;
  result: AttackResult;
}

export interface ExplosionLogItem extends BaseLogItem {
  type: "explosion";
}

export type LogItem = AttackLogItem | ExplosionLogItem;

export function useCombatLog() {
  const [items, setItems] = useState<LogItem[]>(() => {
    const data = localStorage.getItem("log");
    return data ? JSON.parse(data) : [];
  });

  function addItem(...toAdd: LogItem[]) {
    const newItems = [...items, ...toAdd];
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
