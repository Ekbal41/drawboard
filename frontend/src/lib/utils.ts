import type { UseMutationResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mErrors<TData, TVariables>(
  mutation: UseMutationResult<TData, unknown, TVariables, unknown>
): any | null {
  if (mutation.isError && mutation.error) {
    const axiosError = mutation.error as AxiosError<any>;
    return axiosError.response?.data?.errors ?? null;
  }
  return null;
}

export const getDateBadgeVariant = (createdAt: string) => {
  const date = dayjs(createdAt);

  if (date.isSame(dayjs(), "day")) return "today";
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return "yesterday";
  if (date.isAfter(dayjs().subtract(8, "day"))) return "last7days";

  return "recent";
};
