import { UpdateOptions } from "../../core";
import { Any, AnyObject } from "../../types";
import { UPDATE_OPTIONS } from "./_internal";
import { $pull } from "./pull";

/** Removes all instances of the specified values from an existing array. */
export const $pullAll = (
  obj: AnyObject,
  expr: Record<string, Any[]>,
  arrayFilters: AnyObject[] = [],
  options: UpdateOptions = UPDATE_OPTIONS
) => {
  const pullExpr: Record<string, AnyObject> = {};
  Object.entries(expr).forEach(([k, v]) => {
    pullExpr[k] = { $in: v };
  });
  return $pull(obj, pullExpr, arrayFilters, options);
};
