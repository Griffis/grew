// https://www.mongodb.com/docs/manual/reference/operator/aggregation/minN-array-element/

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";
import { $minN as __minN } from "../../accumulator/minN";

interface InputExpr {
  n: Any;
  input: Any;
}

/**
 * Returns the n smallest values in an array.
 *
 * @param  {AnyObject} obj
 * @param  {*} expr
 * @return {*}
 */
export let $minN: ExpressionOperator = (
  obj: AnyObject,
  expr: InputExpr,
  options: Options
): Any => {
  // first try the accumulator if input is an array.
  if (isArray(obj)) return __minN(obj, expr, options);
  let { input, n } = computeValue(obj, expr, null, options) as InputExpr;
  if (isNil(input)) return null;
  assert(isArray(input), "Must resolve to an array/null or missing");
  return __minN(input as AnyObject[], { n, input: "$$this" }, options);
};
