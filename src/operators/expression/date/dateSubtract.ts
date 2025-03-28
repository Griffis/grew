// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyObject } from "../../../types";
import { $dateAdd } from "./dateAdd";

/**
 * Decrements a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
export const $dateSubtract: ExpressionOperator<Date> = (
  obj: AnyObject,
  expr: AnyObject,
  options: Options
): Date => {
  const amount = computeValue(obj, expr?.amount, null, options) as number;
  return $dateAdd(obj, { ...expr, amount: -1 * amount }, options);
};
