"use client";

import * as React from "react";
import { Checkbox as RadixCheckbox } from "@/components/ui/checkbox";

type IndeterminateCheckboxProps = React.ComponentProps<typeof RadixCheckbox> & {
  indeterminate?: boolean;
  onChange: () => void;
};

const IndeterminateCheckbox: React.FC<IndeterminateCheckboxProps> = ({
  indeterminate = false,
  onChange,
  ...props
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      // Radix checkbox renders <button> but internally has input at first child
      const input = ref.current.querySelector(
        "input[type='checkbox']"
      ) as HTMLInputElement | null;
      if (input) {
        input.indeterminate = indeterminate;
      }
    }
  }, [indeterminate]);

  return <RadixCheckbox ref={ref} onCheckedChange={onChange} {...props} />;
};

export default IndeterminateCheckbox;
