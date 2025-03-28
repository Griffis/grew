import { computeValue, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { isDate, isNil, isNumber, isString } from "../../../util";

export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;
export const MAX_LONG = Number.MAX_SAFE_INTEGER;
export const MIN_LONG = Number.MIN_SAFE_INTEGER;

export class TypeConvertError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function toInteger(
  obj: AnyObject,
  expr: Any,
  options: Options,
  min: number,
  max: number
): number | null {
  const val = computeValue(obj, expr, null, options) as
    | string
    | number
    | boolean
    | Date;

  if (val === true) return 1;
  if (val === false) return 0;
  if (isNil(val)) return null;
  if (isDate(val)) return val.getTime();

  const n = Number(val);

  if (isNumber(n) && n >= min && n <= max) {
    // weirdly a decimal in string format cannot be converted to int.
    // so we must check input if not string or if it is, not in decimal format
    if (!isString(val) || n.toString().indexOf(".") === -1) {
      return Math.trunc(n);
    }
  }

  throw new TypeConvertError(
    `cannot convert '${val}' to ${max == MAX_INT ? "int" : "long"}`
  );
}
