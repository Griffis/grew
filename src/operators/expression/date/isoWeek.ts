// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { computeDate, isoWeek } from "./_internal";

/**
 * Returns the week number in ISO 8601 format, ranging from 1 to 53.
 * Week numbers start at 1 with the week (Monday through Sunday) that contains the year's first Thursday.
 * @param obj
 * @param expr
 */
export let $isoWeek: ExpressionOperator<number> = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number => {
  return isoWeek(computeDate(obj, expr, options));
};
