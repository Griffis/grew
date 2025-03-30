import { Aggregator } from "../../aggregator";
import { Options, PipelineOperator, ProcessingMode } from "../../core";
import { Iterator } from "../../lazy";
import { AnyObject, Callback } from "../../types";
/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 *
 * See {@link https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet usage}.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns
 */
export let $facet: PipelineOperator = (
  collection: Iterator,
  expr: Record<string, AnyObject[]>,
  options: Options
): Iterator => {
  return collection.transform(((array: AnyObject[]) => {
    let o: AnyObject = {};
    for (let [k, pipeline] of Object.entries(expr)) {
      o[k] = new Aggregator(pipeline, {
        ...options,
        processingMode: ProcessingMode.CLONE_INPUT
      }).run(array);
    }
    return [o];
  }) as Callback<AnyObject[]>);
};
