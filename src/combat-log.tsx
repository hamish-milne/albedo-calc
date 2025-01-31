import { X } from "lucide-react";
import { Button } from "./components/ui/button";
import { Table, TableBody, TableRow, TableCell } from "./components/ui/table";
import { WoundState, Range } from "./schema";
import type {
  BaseLogItem,
  AttackLogItem,
  ExplosionLogItem,
  LogItem,
} from "./useCombatLog";

function BaseLogItem({
  defender,
  damageRoll,
  totalDamage,
  newStatus,
  awe,
  injury,
}: BaseLogItem) {
  return (
    <>
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
    </>
  );
}

function AttackLogItem(props: AttackLogItem) {
  const { attacker, defender, weapon, range, attackRoll, defenseRoll, result } =
    props;
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
      . The result was a <b>{result}</b>. <BaseLogItem {...props} />
    </p>
  );
}

function ExplosionLogItem(props: ExplosionLogItem) {
  const { defender } = props;
  return (
    <p>
      <b>{defender}</b> was caught in an explosion! <BaseLogItem {...props} />
    </p>
  );
}

function LogItem(props: LogItem) {
  return props.type === "explosion" ? (
    <ExplosionLogItem {...props} />
  ) : (
    <AttackLogItem {...props} />
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
                aria-label="Delete log item"
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
