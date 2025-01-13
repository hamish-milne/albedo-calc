import type { UseFormReturn } from "react-hook-form";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import type { SelectForm } from "./schema";
import { DefaultValues } from "./data";
import { useState } from "react";

export function ResetButton(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Reset</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Clear all data?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              form.reset(DefaultValues);
              setOpen(false);
            }}
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
