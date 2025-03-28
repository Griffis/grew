// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the minute for a date as a number between 0 and 59.
 * @param obj
 * @param expr
 */
export const $minute: ExpressionOperator<number> = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number => {
  return computeDate(obj, expr, options).getUTCMinutes();
};
