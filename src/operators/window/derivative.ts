import { Options, WindowOperator } from "../../core";
import { Any, AnyObject, Callback, WindowOperatorInput } from "../../types";
import { isNumber } from "../../util";
import { $push } from "../accumulator";
import { MILLIS_PER_UNIT, WindowTimeUnit } from "./_internal";

/**
 * Returns the average rate of change within the specified window
 */
export const $derivative: WindowOperator = (
  _: AnyObject,
  collection: AnyObject[],
  expr: WindowOperatorInput,
  options: Options
): Any => {
  // need 2 points to compute derivative
  if (collection.length < 2) return null;

  const { input, unit } = expr.inputExpr as {
    input: Any;
    unit?: WindowTimeUnit;
  };
  const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
  const values = [collection[0], collection[collection.length - 1]];
  const points = $push(values, [sortKey, input], options).filter(
    (([x, y]: number[]) => isNumber(+x) && isNumber(+y)) as Callback
  ) as number[][];

  // invalid values encountered
  if (points.length !== 2) return null;

  const [[x1, y1], [x2, y2]] = points;
  // convert from millis to the unit.
  const deltaX = (x2 - x1) / (MILLIS_PER_UNIT[unit] || 1);

  return (y2 - y1) / deltaX;
};
