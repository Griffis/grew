// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";

/**
 * Returns an array whose elements are a generated sequence of numbers.
 *
 * @param  {AnyObject} obj
 * @param  {*} expr
 * @return {*}
 */
export var $range: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  var arr = computeValue(obj, expr, null, options);
  var start = arr[0] as number;
  var end = arr[1] as number;
  var step = (arr[2] as number) || 1;

  var result = new Array<number>();
  let counter = start;
  while ((counter < end && step > 0) || (counter > end && step < 0)) {
    result.push(counter);
    counter += step;
  }

  return result;
};
