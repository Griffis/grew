// https://www.mongodb.com/docs/manual/reference/operator/aggregation/bottomN/#mongodb-group-grp.-bottomN
import {
  AccumulatorOperator,
  ComputeOptions,
  computeValue,
  Options
} from "../../core";
import { Lazy } from "../../lazy";
import { Any, AnyObject } from "../../types";
import { $sort } from "../pipeline/sort";
import { $push } from "./push";

interface InputExpr {
  n: Any;
  sortBy: Record<string, number>;
  output: Any;
}

/**
 * Returns an aggregation of the bottom n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $bottomN returns all elements in the group.
 *
 * @param {Any[]} collection The input array
 * @param {AnyObject} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export const $bottomN: AccumulatorOperator<Any[]> = (
  collection: AnyObject[],
  expr: InputExpr,
  options: Options
): Any[] => {
  const copts = ComputeOptions.init(options);
  const { n, sortBy } = computeValue(
    copts.local.groupId,
    expr,
    null,
    copts
  ) as Pick<InputExpr, "n" | "sortBy">;

  const result = $sort(Lazy(collection), sortBy, options).value();

  const m = result.length;
  const p = n as number;
  return $push(m <= p ? result : result.slice(m - p), expr.output, copts);
};
