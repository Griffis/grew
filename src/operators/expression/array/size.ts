// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { isArray } from "../../../util";

/**
 * Counts and returns the total the number of items in an array.
 *
 * @param obj
 * @param expr
 */
export const $size: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  const value = computeValue(obj, expr, null, options) as Any[];
  return isArray(value) ? value.length : undefined;
};
