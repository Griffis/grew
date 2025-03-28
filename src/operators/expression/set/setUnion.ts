/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, flatten, isArray, isNil, unique } from "../../../util";

/**
 * Returns a set that holds all elements of the input sets.
 * @param obj
 * @param expr
 */
export const $setUnion: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  const args = computeValue(obj, expr, null, options) as Any[];
  if (isNil(args)) return null;
  assert(isArray(args), "$setUnion operands must be arrays.");
  if (args.some(isNil)) return null;
  return unique(flatten(args), options?.hashFunction);
};
