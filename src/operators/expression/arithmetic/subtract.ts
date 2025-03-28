// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isDate, isNumber } from "../../../util";

/**
 * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
 *
 * @param obj
 * @param expr
 * @param options
 * @returns {number}
 */
export const $subtract: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  const [a, b] = computeValue(obj, expr, null, options) as (number | Date)[];
  if ((isNumber(a) && isNumber(b)) || (isDate(a) && isDate(b))) return +a - +b;
  if (isDate(a) && isNumber(b)) return new Date(+a - b);
  assert(false, "$subtract: must resolve to number/date.");
};
