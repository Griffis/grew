import { Aggregator } from "../../aggregator";
import { computeValue, Options, PipelineOperator } from "../../core";
import { Iterator } from "../../lazy";
import { Any, AnyObject } from "../../types";
import {
  ensureArray,
  flatten,
  isArray,
  isString,
  resolve,
  ValueMap
} from "../../util";

interface InputExpr {
  /** Specifies the collection in the same database to perform the join with. */
  from: string | AnyObject[];
  /** Specifies the field from the documents input to the $lookup stage. */
  localField?: string;
  /** Specifies the field from the documents in the from collection. */
  foreignField?: string;
  /** Specifies the pipeline to run on the joined collection. The pipeline determines the resulting documents from the joined collection. */
  pipeline?: Record<string, AnyObject>[];
  /** Specifies the name of the new array field to add to the input documents. */
  as: string;
  /** Optional. Specifies variables to use in the pipeline stages. */
  let?: AnyObject;
}

/**
 * Performs a left outer join to another collection to filter in documents from the "joined" collection for processing.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/ usage}
 *
 * @param collection
 * @param expr
 * @param options
 */
export const $lookup: PipelineOperator = (
  collection: Iterator,
  expr: InputExpr,
  options: Options
): Iterator => {
  const joinColl = isString(expr.from)
    ? options?.collectionResolver(expr.from)
    : expr.from;

  const { let: letExpr, pipeline, foreignField, localField } = expr;

  // rewrite pipeline to use a custom $match predicates.
  const subQueryPipeline = pipeline || [];

  // we default to a valid equality match.
  // returns [match_found:boolean, matched_items:array]
  let lookupEq = (_: AnyObject): [boolean, Any[]] => [true, []];

  // handle direct key fields
  if (foreignField && localField) {
    // compute hashtable for joined collection
    const map = ValueMap.init<Any, Any[]>(options.hashFunction);
    for (const doc of joinColl) {
      // add object for each value in the array.
      ensureArray(resolve(doc, foreignField) ?? null).forEach(v => {
        // minor optimization to minimize key hashing in value-map
        const xs = map.get(v);
        const arr = xs ?? [];
        arr.push(doc);
        if (arr !== xs) map.set(v, arr);
      });
    }

    // create lookup function to get matching items. optimized for when more predicates are specified by 'pipeline'.
    lookupEq = (o: AnyObject) => {
      const local = resolve(o, localField) ?? null;
      if (isArray(local)) {
        // only return the predicate result with no values since there is more to check.
        if (subQueryPipeline.length) {
          // check that matches exist for this object.
          return [local.some(v => map.has(v)), null];
        }
        // return entire result set.
        const result = Array.from(
          new Set(flatten(local.map(v => map.get(v), options.hashFunction)))
        );
        return [result.length > 0, result];
      }
      const result = map.get(local) ?? null;
      return [result !== null, result ?? []];
    };

    if (subQueryPipeline.length === 0) {
      return collection.map((obj: AnyObject) => {
        return {
          ...obj,
          [expr.as]: lookupEq(obj).pop()
        };
      });
    }
  }

  // options to use for processing each stage.
  const agg = new Aggregator(subQueryPipeline, options);
  const opts = { ...options };
  return collection.map((obj: AnyObject) => {
    const vars = computeValue(obj, letExpr, null, options) as AnyObject;
    opts.variables = { ...options.variables, ...vars };
    const [ok, res] = lookupEq(obj);
    return {
      ...obj,
      [expr.as]: ok ? agg.run(joinColl, opts) : res
    };
  });
};
