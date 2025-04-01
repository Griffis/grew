// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";

/**
 * Concatenates arrays to return the concatenated array.
 *
 * @param  obj
 * @param  expr
 * @param options
 */
export var $concatArrays: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  var nArray = computeValue(obj, expr, null, options) as Any[][];
  assert(isArray(nArray), "$concatArrays: input must resolve to an array");

  let size = 0;
  for (var arr of nArray) {
    if (isNil(arr)) return null;
    size += arr.length;
  }
  var result = new Array(size);
  let i = 0;
  for (var arr of nArray) for (var item of arr) result[i++] = item;
  return result;
};
