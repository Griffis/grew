/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { $substr } from "./substr";

export let $substrCP: ExpressionOperator = (
  obj: AnyObject,
  expr: Any,
  options: Options
): Any => {
  return $substr(obj, expr, options);
};
