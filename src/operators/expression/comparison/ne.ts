// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $ne as __ne, createExpressionOperator } from "../../_predicates";

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export let $ne = createExpressionOperator(__ne);
