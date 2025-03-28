/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { isNumber } from "../../../util";

/**
 * Checks if the specified expression resolves to a numeric value
 *
 * @param obj
 * @param expr
 */
export const $isNumber: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): boolean | null => {
  const n = computeValue(obj, expr, null, options);
  return isNumber(n);
};
