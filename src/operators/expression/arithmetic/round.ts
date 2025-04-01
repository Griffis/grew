// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isNil, isNumber } from "../../../util";
import { truncate } from "./_internal";

/**
 * Rounds a number to to a whole integer or to a specified decimal place.
 * @param {*} obj
 * @param {*} expr
 */
export let $round: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number | null => {
  let args = computeValue(obj, expr, null, options) as Any[];
  let num = args[0] as number;
  let place = args[1] as number;
  if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num;
  assert(isNumber(num), "$round expression must resolve to a number.");

  return truncate(num, place, true);
};
