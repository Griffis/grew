// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { truthy } from "../../../util";

/**
 * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export let $and: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  let value = computeValue(obj, expr, null, options) as Any[];
  return (
    truthy(value, options.useStrictMode) &&
    value.every(v => truthy(v, options.useStrictMode))
  );
};
