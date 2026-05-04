import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  parsePastedFlashcards,
  type CardDelimiter,
  type TermDefDelimiter,
  type ParsedFlashcardRow,
} from "@/domains/flashcards/parse-pasted-flashcards";

export type ImportFlashcardsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppend: (rows: ParsedFlashcardRow[]) => void;
};

type TermDefChoice = "tab" | "comma" | "custom";
type CardSepChoice = "newline" | "semicolon" | "custom";

function toTermDefDelimiter(choice: TermDefChoice, custom: string): TermDefDelimiter {
  if (choice === "tab") return "tab";
  if (choice === "comma") return "comma";
  return { kind: "custom", value: custom || "|" };
}

function toCardDelimiter(choice: CardSepChoice, custom: string): CardDelimiter {
  if (choice === "newline") return "newline";
  if (choice === "semicolon") return "semicolon";
  return { kind: "custom", value: custom || "\n" };
}

export function ImportFlashcardsModal({ open, onOpenChange, onAppend }: ImportFlashcardsModalProps) {
  const [paste, setPaste] = React.useState("");
  const [termDefChoice, setTermDefChoice] = React.useState<TermDefChoice>("tab");
  const [termDefCustom, setTermDefCustom] = React.useState("");
  const [cardSepChoice, setCardSepChoice] = React.useState<CardSepChoice>("newline");
  const [cardSepCustom, setCardSepCustom] = React.useState("");

  const preview = React.useMemo(() => {
    const td = toTermDefDelimiter(
      termDefChoice,
      termDefChoice === "custom" ? termDefCustom : "",
    );
    const cs = toCardDelimiter(cardSepChoice, cardSepChoice === "custom" ? cardSepCustom : "");
    return parsePastedFlashcards(paste, td, cs);
  }, [paste, termDefChoice, termDefCustom, cardSepChoice, cardSepCustom]);

  const handleImport = () => {
    if (preview.length === 0) return;
    onAppend(preview);
    setPaste("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle>Import your data</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy and paste your data here (from Word, Excel, Google Docs, etc.)
          </p>
        </DialogHeader>

        <Textarea
          className="min-h-[140px] font-mono text-sm"
          placeholder={"Word 1\tDefinition 1\nWord 2\tDefinition 2"}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Between term and definition</Label>
            <RadioGroup
              value={termDefChoice}
              onValueChange={(v) => setTermDefChoice(v as TermDefChoice)}
              className="gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="tab" id="td-tab" />
                <Label htmlFor="td-tab" className="font-normal">
                  Tab
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="comma" id="td-comma" />
                <Label htmlFor="td-comma" className="font-normal">
                  Comma
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RadioGroupItem value="custom" id="td-custom" />
                <Label htmlFor="td-custom" className="font-normal">
                  Custom
                </Label>
                {termDefChoice === "custom" && (
                  <Input
                    className="h-8 max-w-[120px]"
                    value={termDefCustom}
                    onChange={(e) => setTermDefCustom(e.target.value)}
                    placeholder="|"
                  />
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Between cards</Label>
            <RadioGroup
              value={cardSepChoice}
              onValueChange={(v) => setCardSepChoice(v as CardSepChoice)}
              className="gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="newline" id="cs-nl" />
                <Label htmlFor="cs-nl" className="font-normal">
                  New line
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="semicolon" id="cs-semi" />
                <Label htmlFor="cs-semi" className="font-normal">
                  Semicolon
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RadioGroupItem value="custom" id="cs-custom" />
                <Label htmlFor="cs-custom" className="font-normal">
                  Custom
                </Label>
                {cardSepChoice === "custom" && (
                  <Input
                    className="h-8 max-w-[120px]"
                    value={cardSepCustom}
                    onChange={(e) => setCardSepCustom(e.target.value)}
                    placeholder="###"
                  />
                )}
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-sm font-semibold">Preview {preview.length} cards</div>
          {preview.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing to preview yet.</p>
          ) : (
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm">
              {preview.map((row, i) => (
                <li key={`${row.term}-${i}`} className="truncate text-muted-foreground">
                  <span className="font-medium text-foreground">{row.term}</span>
                  {" · "}
                  {row.definition}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel Import
          </Button>
          <Button
            type="button"
            className="bg-gradient-primary"
            disabled={preview.length === 0}
            onClick={handleImport}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
