// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { Options } from "../../../core";
import { Any, AnyObject, Predicate } from "../../../types";
import { MingoError } from "../../../util";

/**
 * Validate documents against the given JSON Schema.
 *
 * @param selector
 * @param schema
 * @returns {Function}
 */
export function $jsonSchema(
  _: string,
  schema: Any,
  options: Options
): Predicate<Any> {
  if (!options?.jsonSchemaValidator) {
    throw new MingoError(
      "Missing option 'jsonSchemaValidator'. Configure to use '$jsonSchema' operator."
    );
  }
  const validate = options?.jsonSchemaValidator(schema as AnyObject);
  return (obj: AnyObject) => validate(obj);
}
