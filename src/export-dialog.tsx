import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Textarea } from "./components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import { SelectForm } from "./schema";

function ExportContent(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;

  const textArea = useRef<HTMLTextAreaElement>(null);

  function load() {
    if (textArea.current) {
      textArea.current.value = JSON.stringify(form.getValues(), undefined, 2);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function save() {
    if (textArea.current) {
      const { value } = textArea.current;
      const blob = new Blob([value], {
        type: "text/plain",
      });
      const elem = window.document.createElement("a");
      elem.href = window.URL.createObjectURL(blob);
      elem.download = "albedo.json";
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  const [error, setError] = useState("");

  function doImport() {
    if (!textArea.current) {
      return;
    }
    try {
      const data = JSON.parse(textArea.current.value);
      const valid = SelectForm.validateSync(data);
      form.reset(valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Textarea
        ref={textArea}
        className="h-[80vh] font-mono bg-accent text-xs"
        spellCheck="false"
        name="jsonContent"
        autoComplete="false"
        autoCapitalize="false"
        autoCorrect="false"
      />

      <DialogFooter>
        <Button onClick={save}>Save to file</Button>
        <Button onClick={doImport}>Import</Button>
      </DialogFooter>
      <p className="text-destructive">{error}</p>
    </>
  );
}

export function ExportDialog(props: { form: UseFormReturn<SelectForm> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Export</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Import/Export</DialogTitle>
        </DialogHeader>
        <ExportContent {...props} />
      </DialogContent>
    </Dialog>
  );
}
