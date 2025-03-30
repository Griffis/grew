// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import {
  ComputeOptions,
  computeValue,
  ExpressionOperator,
  Options
} from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";

/**
 * Applies an expression to each element in an array and combines them into a single value.
 *
 * @param obj
 * @param expr
 */
export let $reduce: ExpressionOperator = (
  obj: AnyObject,
  expr: AnyObject,
  options: Options
): Any => {
  let copts = ComputeOptions.init(options);
  let input = computeValue(obj, expr.input, null, copts) as Any[];
  let initialValue = computeValue(obj, expr.initialValue, null, copts);
  let inExpr = expr["in"];

  if (isNil(input)) return null;
  assert(isArray(input), "$reduce 'input' expression must resolve to an array");

  return input.reduce((acc, n) => {
    return computeValue(
      n,
      inExpr,
      null,
      copts.update(copts.root, {
        variables: { value: acc }
      })
    );
  }, initialValue);
};
