import { Options, QueryOperator } from "../../../core";
import { isArray } from "../../../util";
import { createQueryOperator } from "../../_predicates";

type Bitmask = number | number[];

export const createBitwiseOperator = (
  predicate: (_1: number, _2: number) => boolean
): QueryOperator => {
  return createQueryOperator(
    (value: number, mask: Bitmask, _options: Options): boolean => {
      let b = 0;
      if (isArray(mask)) {
        for (const n of mask) b = b | (1 << n);
      } else {
        b = mask;
      }
      return predicate(value & b, b);
    }
  );
};
