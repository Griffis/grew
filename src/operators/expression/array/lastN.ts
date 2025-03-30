// https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN-array-element/#mongodb-expression-exp.-lastN

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";
import { $lastN as __lastN } from "../../accumulator/lastN";

interface InputExpr {
  n: Any;
  input: Any;
}

/**
 * Returns a specified number of elements from the end of an array.
 *
 * @param  {AnyObject} obj
 * @param  {*} expr
 * @return {*}
 */
export let $lastN: ExpressionOperator = (
  obj: AnyObject,
  expr: InputExpr,
  options: Options
): Any => {
  // first try the accumulator if input is an array.
  if (isArray(obj)) return __lastN(obj, expr, options);
  let { input, n } = computeValue(obj, expr, null, options) as InputExpr;
  if (isNil(input)) return null;
  assert(isArray(input), "Must resolve to an array/null or missing");
  return __lastN(input as AnyObject[], { n, input: "$$this" }, options);
};
