// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isArray, isEqual } from "../../../util";

/**
 * Returns a boolean indicating whether a specified value is in an array.
 *
 * @param {AnyObject} obj
 * @param {Any[]} expr
 */
export let $in: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): boolean => {
  let [item, arr] = computeValue(obj, expr, null, options) as [Any, Any[]];
  assert(isArray(arr), "$in second argument must be an array");
  return arr.some(v => isEqual(v, item));
};
