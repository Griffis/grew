import { ComputeOptions, Options, PipelineOperator, redact } from "../../core";
import { Iterator } from "../../lazy";
import { AnyObject } from "../../types";

/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * See {@link https://docs.mongodb.com/manual/reference/operator/aggregation/redact/ usage}
 */
export const $redact: PipelineOperator = (
  collection: Iterator,
  expr: AnyObject,
  options: Options
): Iterator => {
  const copts = ComputeOptions.init(options);
  return collection.map((obj: AnyObject) =>
    redact(obj, expr, copts.update(obj))
  );
};
