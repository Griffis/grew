// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the weekday number in ISO 8601 format, ranging from 1 (Monday) to 7 (Sunday).
 * @param obj
 * @param expr
 */
export const $isoDayOfWeek: ExpressionOperator<number> = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number => {
  return computeDate(obj, expr, options).getUTCDay() || 7;
};
