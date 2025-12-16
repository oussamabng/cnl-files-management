"use client";

import * as React from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, Search } from "lucide-react";
import { FormField, SelectOption } from "./ui/form-field";

type MultiSelectConfig<TValues extends FieldValues> = {
  name: Path<TValues>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
};

type SearchConfig<TValues extends FieldValues> = {
  name: Path<TValues>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
};

export function TableFiltresBar<TValues extends FieldValues>(props: {
  form: UseFormReturn<TValues>;
  search?: SearchConfig<TValues>;
  multiSelect?: MultiSelectConfig<TValues>;
  onApply: (values: TValues) => void;
  onReset: () => void;
  showReset: boolean;
  className?: string;
}) {
  const { form, search, multiSelect, onApply, onReset, showReset, className } =
    props;

  const searchValue = search ? form.watch(search.name) : (undefined as any);

  const multiSelectValue = multiSelect
    ? form.watch(multiSelect.name)
    : (undefined as any);

  const hasSearchValue =
    typeof searchValue === "string" && searchValue.trim().length > 0;

  const hasMultiSelectValue =
    Array.isArray(multiSelectValue) && multiSelectValue.length > 0;

  const showSearchButton = hasSearchValue || hasMultiSelectValue;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onApply)}
        className={cn(
          "flex flex-col gap-3 rounded-xl border bg-card p-4",
          className
        )}
      >
        <div className="grid gap-3 md:grid-cols-12">
          {search && (
            <div className="md:col-span-4">
              <FormField
                control={form.control}
                name={search.name}
                type="text"
                label={search.label}
                placeholder={search.placeholder}
                disabled={search.disabled}
                className="space-y-1"
              />
            </div>
          )}

          {multiSelect && (
            <div className="md:col-span-4">
              <FormField
                control={form.control}
                name={multiSelect.name}
                type="multiselect"
                label={multiSelect.label}
                selectPlaceholder={multiSelect.placeholder}
                options={multiSelect.options}
                disabled={multiSelect.disabled}
                searchable
                searchPlaceholder="search..."
                emptyText="Aucun résultat."
                className="space-y-1"
              />
            </div>
          )}

          <div
            className={cn(
              "flex items-end gap-2",
              search
                ? multiSelect
                  ? "md:col-span-2"
                  : "md:col-span-3"
                : "md:col-span-3"
            )}
          >
            {showSearchButton && (
              <Button
                type="submit"
                className="gap-2 pr-20"
                disabled={search?.disabled}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {showReset && (
              <Button
                type="button"
                variant="destructive"
                className="gap-2 justify-content-end"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
