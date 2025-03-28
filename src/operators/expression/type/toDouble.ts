/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { isDate, isNil, isNumber } from "../../../util";
import { TypeConvertError } from "./_internal";

/**
 * Converts a value to a double. If the value cannot be converted to an double, $toDouble errors. If the value is null or missing, $toDouble returns null.
 *
 * @param obj
 * @param expr
 */
export const $toDouble: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): number | null => {
  const val = computeValue(obj, expr, null, options) as
    | string
    | boolean
    | number
    | Date;

  if (isNil(val)) return null;
  if (isDate(val)) return val.getTime();
  if (val === true) return 1;
  if (val === false) return 0;

  const n = Number(val);

  if (isNumber(n)) return n;

  throw new TypeConvertError(`cannot convert '${val}' to double/decimal`);
};
