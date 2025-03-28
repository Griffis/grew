import { Options, WindowOperator } from "../../core";
import { Any, AnyObject, WindowOperatorInput } from "../../types";
import { rank } from "./_internal";

/** Returns the document position relative to other documents in the $setWindowFields stage partition. */
export const $denseRank: WindowOperator = (
  obj: AnyObject,
  collection: AnyObject[],
  expr: WindowOperatorInput,
  options: Options
): Any => rank(obj, collection, expr, options, true /*dense*/);
