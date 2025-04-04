/**
 * Predicates used for Query and Expression operators.
 */

import {
  computeValue,
  ExpressionOperator,
  Options,
  QueryOperator
} from "../core";
import { Query } from "../query";
import {
  Any,
  AnyObject,
  BsonType,
  Callback,
  JsType,
  Predicate
} from "../types";
import {
  compare as mingoCmp,
  ensureArray,
  flatten,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isEqual,
  isNil,
  isNumber,
  isObject,
  isOperator,
  isRegExp,
  isString,
  MingoError,
  resolve,
  truthy,
  typeOf
} from "../util";

type PredicateOptions = Options & { depth: number };

type ConversionType = number | JsType | BsonType;

/**
 * Returns a query operator created from the predicate
 *
 * @param predicate Predicate function
 */
export function createQueryOperator(predicate: Predicate<Any>): QueryOperator {
  const f = (selector: string, value: Any, options: Options) => {
    const opts = { unwrapArray: true };
    const depth = Math.max(1, selector.split(".").length - 1);
    return (obj: AnyObject): boolean => {
      // value of field must be fully resolved.
      const lhs = resolve(obj, selector, opts);
      return predicate(lhs, value, { ...options, depth });
    };
  };
  return f; // as QueryOperator;
}

/**
 * Returns an expression operator created from the predicate
 *
 * @param predicate Predicate function
 */
export function createExpressionOperator(
  predicate: Predicate<Any>
): ExpressionOperator {
  return (obj: AnyObject, expr: Any, options: Options) => {
    const args = computeValue(obj, expr, null, options) as Any[];
    return predicate(...args);
  };
}

/**
 * Checks that two values are equal.
 *
 * @param a         The lhs operand as resolved from the object by the given selector
 * @param b         The rhs operand provided by the user
 * @returns {*}
 */
export function $eq(a: Any, b: Any, options?: PredicateOptions): boolean {
  // start with simple equality check
  if (isEqual(a, b)) return true;

  // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
  if (isNil(a) && isNil(b)) return true;

  // check
  if (isArray(a)) {
    return (
      a.some(v => isEqual(v, b)) ||
      flatten(a, options?.depth).some(v => isEqual(v, b))
    );
  }

  return false;
}

/**
 * Matches all values that are not equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $ne(a: Any, b: Any, options?: PredicateOptions): boolean {
  return !$eq(a, b, options);
}

/**
 * Matches any of the values that exist in an array specified in the query.
 *
 * @param a
 * @param b
 * @returns {*}
 */
export function $in(a: Any[], b: Any[], options?: PredicateOptions): boolean {
  // queries for null should be able to find undefined fields
  if (isNil(a)) return b.some(v => v === null);

  return intersection([ensureArray(a), b], options?.hashFunction).length > 0;
}

/**
 * Matches values that do not exist in an array specified to the query.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
export function $nin(a: Any[], b: Any[], options?: PredicateOptions): boolean {
  return !$in(a, b, options);
}

/**
 * Matches values that are less than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lt(a: Any, b: Any, _options?: PredicateOptions): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) < 0);
}

/**
 * Matches values that are less than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lte(a: Any, b: Any, _options?: PredicateOptions): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) <= 0);
}

/**
 * Matches values that are greater than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gt(a: Any, b: Any, _options?: PredicateOptions): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) > 0);
}

/**
 * Matches values that are greater than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gte(a: Any, b: Any, _options?: PredicateOptions): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) >= 0);
}

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $mod(
  a: Any,
  b: number[],
  _options?: PredicateOptions
): boolean {
  return ensureArray(a).some(
    ((x: number) => b.length === 2 && x % b[0] === b[1]) as Callback
  );
}

/**
 * Selects documents where values match a specified regular expression.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $regex(a: Any, b: RegExp, options?: PredicateOptions): boolean {
  const lhs = ensureArray(a) as string[];
  const match = (x: string) =>
    isString(x) && truthy(b.exec(x), options?.useStrictMode);
  return lhs.some(match) || flatten(lhs, 1).some(match as Callback);
}

/**
 * Matches arrays that contain all elements specified in the query.
 *
 * @param values
 * @param queries
 * @returns boolean
 */
export function $all(
  values: Any[],
  queries: AnyObject[],
  options?: PredicateOptions
): boolean {
  if (
    !isArray(values) ||
    !isArray(queries) ||
    !values.length ||
    !queries.length
  ) {
    return false;
  }

  let matched = true;
  for (const query of queries) {
    // no need to check all the queries.
    if (!matched) break;
    if (isObject(query) && Object.keys(query).includes("$elemMatch")) {
      matched = $elemMatch(values, query["$elemMatch"] as AnyObject, options);
    } else if (isRegExp(query)) {
      matched = values.some(s => typeof s === "string" && query.test(s));
    } else {
      matched = values.some(v => isEqual(query, v));
    }
  }
  return matched;
}

/**
 * Selects documents if the array field is a specified size.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
export function $size(
  a: Any[],
  b: number,
  _options?: PredicateOptions
): boolean {
  return Array.isArray(a) && a.length === b;
}

function isNonBooleanOperator(name: string): boolean {
  return isOperator(name) && ["$and", "$or", "$nor"].indexOf(name) === -1;
}

/**
 * Selects documents if element in the array field matches all the specified $elemMatch condition.
 *
 * @param a {Any[]} element to match against
 * @param b {AnyObject} subquery
 */
export function $elemMatch(
  a: Any[],
  b: AnyObject,
  options?: PredicateOptions
): boolean {
  // should return false for non-matching input
  if (isArray(a) && !isEmpty(a)) {
    let format = (x: Any) => x;
    let criteria = b;

    // If we find a boolean operator in the subquery, we fake a field to point to it. This is an
    // attempt to ensure that it is a valid criteria. We cannot make this substitution for operators
    // like $and/$or/$nor; as otherwise, this faking will break our query.
    if (Object.keys(b).every(isNonBooleanOperator)) {
      criteria = { temp: b };
      format = x => ({ temp: x });
    }

    const query = new Query(criteria, options);
    for (let i = 0, len = a.length; i < len; i++) {
      if (query.test(format(a[i]) as AnyObject)) {
        return true;
      }
    }
  }
  return false;
}

// helper functions
const isNull = (a: Any) => a === null;

/** Mapping of type to predicate */
const compareFuncs: Record<ConversionType, Predicate<Any>> = {
  array: isArray as Predicate<Any>,
  boolean: isBoolean,
  bool: isBoolean,
  date: isDate,
  number: isNumber,
  int: isNumber,
  long: isNumber,
  double: isNumber,
  decimal: isNumber,
  null: isNull,
  object: isObject,
  regexp: isRegExp,
  regex: isRegExp,
  string: isString,
  // added for completeness
  undefined: isNil, // deprecated
  function: (_: Any) => {
    throw new MingoError("unsupported type key `function`.");
  },
  // Mongo identifiers
  1: isNumber, //double
  2: isString,
  3: isObject,
  4: isArray as Predicate<Any>,
  6: isNil, // deprecated
  8: isBoolean,
  9: isDate,
  10: isNull,
  11: isRegExp,
  16: isNumber, //int
  18: isNumber, //long
  19: isNumber //decimal
};

/**
 * Selects documents if a field is of the specified type.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function compareType(a: Any, b: ConversionType, _?: PredicateOptions): boolean {
  const f = compareFuncs[b];
  return f ? f(a) : false;
}

/**
 * Selects documents if a field is of the specified type.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $type(
  a: Any,
  b: ConversionType | ConversionType[],
  options?: PredicateOptions
): boolean {
  return isArray(b)
    ? b.findIndex(t => compareType(a, t, options)) >= 0
    : compareType(a, b, options);
}

function compare(a: Any, b: Any, f: Predicate<Any>): boolean {
  return ensureArray(a).some(x => typeOf(x) === typeOf(b) && f(x, b));
}
