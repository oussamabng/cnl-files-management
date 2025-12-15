"use client";

import * as React from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
} from "react-hook-form";

import { cn } from "@/lib/utils";

import {
  FormField as RHFFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Check, ChevronsUpDown } from "lucide-react";

export type SelectOption<TMeta = unknown> = {
  label: string;
  value: string;
  disabled?: boolean;
  meta?: TMeta;
};

type BaseProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> = {
  control: Control<TFieldValues>;
  name: TName;

  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;

  disabled?: boolean;
  className?: string;

  /** Use this for fully custom controls while keeping label/description/error UI */
  render?: (args: {
    field: ControllerRenderProps<TFieldValues, TName>;
  }) => React.ReactNode;
};

type AutoProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TMeta = unknown
> = BaseProps<TFieldValues, TName> & {
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "checkbox"
    | "select"
    | "multiselect";

  placeholder?: string;
  options?: SelectOption<TMeta>[];
  selectPlaceholder?: string;

  searchable?: boolean;
  emptyText?: string;
  searchPlaceholder?: string;
  renderOption?: (
    opt: SelectOption<TMeta>,
    ctx: { selected: boolean }
  ) => React.ReactNode;

  maxDropdownHeightClassName?: string;
};

export type AppFormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TMeta = unknown
> = BaseProps<TFieldValues, TName> | AutoProps<TFieldValues, TName, TMeta>;

function FieldDescription({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}
export function MultiSelect<TMeta = unknown>({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled,
  searchable = true,
  searchPlaceholder = "Search...",
  emptyText = "No results.",
  renderOption,
  maxDropdownHeightClassName,
  boundaryRef,
  maxDropdownHeightPx = 224,
  minDropdownHeightPx = 96,
}: {
  value: string[];
  onValueChange: (next: string[]) => void;
  options: SelectOption<TMeta>[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  renderOption?: (
    opt: SelectOption<TMeta>,
    ctx: { selected: boolean }
  ) => React.ReactNode;
  maxDropdownHeightClassName?: string;
  boundaryRef?: React.RefObject<HTMLElement>;
  maxDropdownHeightPx?: number;
  minDropdownHeightPx?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const topRef = React.useRef<HTMLDivElement | null>(null);
  const [computedListHeight, setComputedListHeight] = React.useState<
    number | null
  >(null);

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const selectedLabels = React.useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o.label]));
    return value.map((v) => byValue.get(v)).filter(Boolean) as string[];
  }, [options, value]);

  const toggle = React.useCallback(
    (val: string) => {
      if (selectedSet.has(val)) {
        onValueChange(value.filter((x) => x !== val));
        return;
      }
      onValueChange([...value, val]);
    },
    [onValueChange, selectedSet, value]
  );

  const clearAll = React.useCallback(() => onValueChange([]), [onValueChange]);

  const effectiveHeightClass =
    maxDropdownHeightClassName ??
    "h-[min(var(--radix-popover-content-available-height),14rem)]";

  const computeHeights = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();

    const boundaryEl = boundaryRef?.current ?? null;
    const boundaryBottom = boundaryEl
      ? boundaryEl.getBoundingClientRect().bottom
      : window.innerHeight;

    const padding = 8;
    const availableBelow = Math.max(
      0,
      boundaryBottom - triggerRect.bottom - padding
    );

    const topH = topRef.current?.getBoundingClientRect().height ?? 0;
    const availableForList = Math.max(0, availableBelow - topH - padding);

    const capped = Math.min(maxDropdownHeightPx, availableForList);
    const finalH =
      availableForList >= minDropdownHeightPx
        ? Math.max(minDropdownHeightPx, capped)
        : capped;

    setComputedListHeight(Number.isFinite(finalH) ? Math.floor(finalH) : null);
  }, [boundaryRef, maxDropdownHeightPx, minDropdownHeightPx]);

  React.useEffect(() => {
    if (!open) return;

    computeHeights();

    const boundaryEl = boundaryRef?.current ?? null;
    const ro = new ResizeObserver(() => computeHeights());

    if (boundaryEl) ro.observe(boundaryEl);
    if (triggerRef.current) ro.observe(triggerRef.current);
    if (topRef.current) ro.observe(topRef.current);

    const onResize = () => computeHeights();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onResize, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, boundaryRef, computeHeights]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            selectedLabels.length === 0 && "text-muted-foreground"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectedLabels.length === 0 ? (
              <span className="truncate">{placeholder}</span>
            ) : (
              <div className="flex min-w-0 flex-wrap gap-1">
                {selectedLabels.slice(0, 3).map((lbl) => (
                  <Badge key={lbl} variant="secondary" className="max-w-full">
                    <span className="max-w-[180px] truncate">{lbl}</span>
                  </Badge>
                ))}
                {selectedLabels.length > 3 && (
                  <Badge variant="outline" className="shrink-0">
                    +{selectedLabels.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
        collisionPadding={8}
        className={cn(
          "p-0",
          "w-[var(--radix-popover-trigger-width)]",
          "max-w-[calc(100vw-2rem)]"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="flex w-full flex-col">
          <div ref={topRef}>
            {searchable ? (
              <CommandInput placeholder={searchPlaceholder} />
            ) : null}

            <div className="flex items-center justify-between gap-2 border-b bg-background px-2 py-2">
              <span className="text-xs text-muted-foreground">
                {value.length} sélectionné{value.length > 1 ? "s" : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={clearAll}
                disabled={disabled || value.length === 0}
              >
                Effacer
              </Button>
            </div>
          </div>

          <ScrollArea
            className={cn(
              "w-full min-h-0",
              computedListHeight == null ? effectiveHeightClass : ""
            )}
            style={
              computedListHeight == null
                ? undefined
                : { height: computedListHeight }
            }
            onWheelCapture={(e) => e.stopPropagation()}
          >
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>{emptyText}</CommandEmpty>

              <CommandGroup>
                {options.map((opt) => {
                  const selected = selectedSet.has(opt.value);

                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      disabled={opt.disabled || disabled}
                      onSelect={() => toggle(opt.value)}
                      className="flex items-start gap-2 py-2"
                    >
                      <div className="mt-0.5 flex h-4 w-4 items-center justify-center">
                        {selected ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        {renderOption ? (
                          renderOption(opt, { selected })
                        ) : (
                          <span className="block truncate">{opt.label}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TMeta = unknown
>(props: AppFormFieldProps<TFieldValues, TName, TMeta>) {
  return (
    <RHFFormField
      control={props.control}
      name={props.name}
      render={({ field }) => {
        const disabled = props.disabled;

        const label = props.label ? (
          <FormLabel className="flex items-center gap-1">
            {props.label}
            {props.required && <span className="text-destructive">*</span>}
          </FormLabel>
        ) : null;

        const description = props.description ? (
          <FieldDescription>{props.description}</FieldDescription>
        ) : null;

        if (props.render) {
          return (
            <FormItem className={props.className}>
              {label}
              <FormControl>{props.render({ field })}</FormControl>
              {description}
              <FormMessage />
            </FormItem>
          );
        }

        const p = props as AutoProps<TFieldValues, TName, TMeta>;
        const commonInputProps = {
          disabled,
          placeholder: p.placeholder,
        };

        const controlNode = (() => {
          switch (p.type) {
            case "textarea":
              return <Textarea {...field} {...commonInputProps} />;

            case "checkbox":
              return (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={disabled}
                  />
                </div>
              );

            case "select":
              return (
                <Select
                  value={(field.value ?? "") as string}
                  onValueChange={(v) => field.onChange(v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={p.selectPlaceholder ?? "Select..."}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(p.options ?? []).map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case "multiselect":
              return (
                <MultiSelect<TMeta>
                  value={
                    Array.isArray(field.value) ? (field.value as string[]) : []
                  }
                  onValueChange={(next) => field.onChange(next)}
                  options={p.options ?? []}
                  disabled={disabled}
                  placeholder={p.selectPlaceholder ?? "Select..."}
                  searchable={p.searchable ?? true}
                  emptyText={p.emptyText ?? "No results."}
                  searchPlaceholder={p.searchPlaceholder ?? "Search..."}
                  renderOption={p.renderOption}
                  // IMPORTANT: ensure it's a real height (h-*) if you pass a class
                  maxDropdownHeightClassName={
                    p.maxDropdownHeightClassName ??
                    "h-[min(var(--radix-popover-content-available-height),14rem)]"
                  }
                />
              );

            default:
              return (
                <Input
                  {...field}
                  {...commonInputProps}
                  type={p.type}
                  value={(field.value ?? "") as string}
                />
              );
          }
        })();

        return (
          <FormItem className={props.className}>
            {label}
            <FormControl>{controlNode}</FormControl>
            {description}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
