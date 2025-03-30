import {
  AccumulatorOperator,
  ComputeOptions,
  computeValue,
  Options
} from "../../core";
import { Any, AnyObject } from "../../types";

/**
 * Returns the last value in the collection.
 *
 * @param collection The input array
 * @param expr The right-hand side expression value of the operator
 * @param options The options to use for this operation
 * @returns
 */
export let $last: AccumulatorOperator = (
  collection: AnyObject[],
  expr: Any,
  options: Options
): Any => {
  if (collection.length === 0) return undefined;
  let obj = collection[collection.length - 1];
  let copts = ComputeOptions.init(options).update(obj);
  return computeValue(obj, expr, null, copts);
};
