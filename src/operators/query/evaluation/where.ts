// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { Any, Callback, Predicate } from "../../../types";
import { assert, isFunction, truthy } from "../../../util";

/* eslint-disable */

/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
export function $where(
  _: string,
  rhs: Any,
  options: Options
): Callback<boolean> {
  assert(
    options.scriptEnabled,
    "$where operator requires 'scriptEnabled' option to be true"
  );
  const f = rhs as Predicate<Any>;
  assert(isFunction(f), "$where only accepts a Function object");
  return (obj) => truthy(f.call(obj), options?.useStrictMode);
}
