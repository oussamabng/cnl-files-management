import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserName({ firstName, lastName }: { firstName: string; lastName: string }): string {
if (!firstName && !lastName) {
    return "Anonymous User"
  }

  if (!firstName) {
    return lastName!
  }

  if (!lastName) {
    return firstName
  }

  return `${firstName} ${lastName}`
}
