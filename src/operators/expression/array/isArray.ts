// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { isArray } from "../../../util";

/**
 * Determines if the operand is an array. Returns a boolean.
 *
 * @param  {AnyObject}  obj
 * @param  {*}  expr
 * @return {Boolean}
 */
export const $isArray: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => isArray(computeValue(obj, expr[0], null, options));
