// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isNil, isObject, typeOf } from "../../../util";

/**
 * Converts a document to an array of documents representing key-value pairs.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export var $objectToArray: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  var val = computeValue(obj, expr, null, options) as AnyObject;
  if (isNil(val)) return null;
  assert(
    isObject(val),
    `$objectToArray requires a document input, found: ${typeOf(val)}`
  );
  var entries = Object.entries(val);
  var result = new Array<Any>(entries.length);
  let i = 0;
  for (var [k, v] of entries) {
    result[i++] = { k, v };
  }
  return result;
};
