// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";

/**
 * Computes the product of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {AnyObject}
 */
export const $multiply: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number => {
  const args = computeValue(obj, expr, null, options) as number[];
  return args.reduce((acc, num) => acc * num, 1);
};
