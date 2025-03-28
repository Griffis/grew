// loads basic operators
import "./init/basic";

import { Aggregator } from "./aggregator";
import { Options } from "./core";
import { Cursor } from "./cursor";
import { Source } from "./lazy";
import { Query } from "./query";
import { AnyObject } from "./types";
import { createUpdater, update } from "./updater";

export { Aggregator } from "./aggregator";
export { Query } from "./query";
export { createUpdater, update } from "./updater";

/**
 * Performs a query on a collection and returns a cursor object.
 * Shorthand for `Query(criteria).find(collection, projection)`
 *
 * @param collection Array of objects
 * @param criteria Query criteria
 * @param projection Projection criteria
 * @param options
 * @returns {Cursor} A cursor of results
 */
export function find<T>(
  collection: Source,
  criteria: AnyObject,
  projection?: AnyObject,
  options?: Partial<Options>
): Cursor<T> {
  return new Query(criteria, options).find<T>(collection, projection);
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection Array of objects
 * @param criteria Query criteria of objects to remove
 * @param options
 * @returns {Array} New filtered array
 */
export function remove(
  collection: AnyObject[],
  criteria: AnyObject,
  options?: Options
): AnyObject[] {
  return new Query(criteria, options).remove(collection);
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection.
 * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
 *
 * @param collection array or stream of objects
 * @param pipeline The pipeline operators to use
 * @param options
 * @returns {Array} New array of results
 */
export function aggregate(
  collection: Source,
  pipeline: AnyObject[],
  options?: Partial<Options>
): AnyObject[] {
  return new Aggregator(pipeline, options).run(collection);
}

// default interface
export default {
  Aggregator,
  Query,
  aggregate,
  createUpdater,
  find,
  remove,
  update
};
