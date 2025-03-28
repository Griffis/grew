import { aggregate, Aggregator, find } from "../src";
import {
  ComputeOptions,
  computeValue,
  initOptions,
  Options,
  PipelineOperator,
  ProcessingMode,
  redact,
  useOperators
} from "../src/core";
import { Iterator } from "../src/lazy";
import { Any, AnyObject } from "../src/types";
import { isNumber, resolve } from "../src/util";
import { complexGradesData, DEFAULT_OPTS } from "./support";

const copts = ComputeOptions.init(DEFAULT_OPTS);

describe("core", () => {
  afterEach(() => {
    copts.update();
  });

  describe("ComputeOptions", () => {
    it("should preserve 'root' on init if defined", () => {
      expect(copts.root).toBeUndefined();
      copts.update(false);
      expect(copts.root).toEqual(false);
      expect(ComputeOptions.init(copts, true).root).toEqual(false);
    });

    it("should preserve 'local' on init if defined", () => {
      expect(copts.local).toEqual({});
      copts.update(null, { groupId: 5 });
      expect(copts.local?.groupId).toEqual(5);
      expect(ComputeOptions.init(copts).local?.groupId).toEqual(5);
    });

    it("should access all members of init options", () => {
      copts.update(true, { variables: { x: 10 } });
      expect(copts.idKey).toEqual("_id");
      expect(copts.scriptEnabled).toEqual(true);
      expect(copts.useStrictMode).toEqual(true);
      expect(copts.processingMode).toEqual(ProcessingMode.CLONE_OFF);
      expect(copts.collation).toBeUndefined();
      expect(copts.collectionResolver).toBeUndefined();
      expect(copts.hashFunction).toBeUndefined();
      expect(copts.jsonSchemaValidator).toBeUndefined();
      expect(copts.variables).toBeUndefined();
      expect(copts.local?.variables).toEqual({ x: 10 });
      expect(copts.root).toEqual(true);
    });

    it("should merge new variables on update when non-empty", () => {
      copts.update(true, { variables: { x: 10 } });
      copts.update(true, { variables: { y: 20 } });
      expect(copts.local?.variables).toEqual({ x: 10, y: 20 });
    });
  });
  describe("useOperators", () => {
    it("should add new pipeline operator", () => {
      const $pluck: PipelineOperator = (
        collection: Any,
        expr: Any,
        options: Options
      ): Iterator => {
        const array = collection as Array<{ __temp__: Any }>;
        const agg = new Aggregator([{ $project: { __temp__: expr } }], options);
        return agg.stream(array).map(item => (item as AnyObject)["__temp__"]);
      };

      const opts = initOptions(DEFAULT_OPTS);
      if (opts.context) opts.context.addPipelineOps({ $pluck });

      const result = aggregate(
        complexGradesData,
        [{ $unwind: "$scores" }, { $pluck: "$scores.score" }],
        opts
      );

      expect(isNumber(result[0])).toBe(true);
    });

    it("should add new query operator", () => {
      function $between(selector: string, rhs: Any, _options?: Options) {
        const args = rhs as number[];
        // const value = lhs as number;
        return (obj: AnyObject): boolean => {
          const value = resolve(obj, selector, { unwrapArray: true }) as number;
          return value >= args[0] && value <= args[1];
        };
      }

      useOperators("query", { $between });

      const coll = [
        { a: 1, b: 1 },
        { a: 7, b: 1 },
        { a: 10, b: 6 },
        { a: 20, b: 10 }
      ];
      const result = find(
        coll,
        { a: { $between: [5, 10] } },
        {},
        DEFAULT_OPTS
      ).all();
      expect(result.length).toBe(2);
    });

    it("should add accumulator operator", () => {
      DEFAULT_OPTS.context?.addAccumulatorOps({
        $stddev: (collection: Any[], expr: Any, options?: Options) => {
          const result = aggregate(
            collection,
            [{ $group: { _id: null, avg: { $avg: expr } } }],
            options
          );
          const avg = result[0].avg as number;
          const nums = computeValue(
            collection,
            expr,
            "$push",
            options
          ) as number[];
          const diffs = nums.map(n => Math.pow(n - avg, 2));

          const variance =
            diffs.reduce((memo, val) => {
              return memo + val;
            }, 0) / diffs.length;
          return Math.sqrt(variance);
        }
      });

      const result = aggregate(
        complexGradesData,
        [
          { $unwind: "$scores" },
          { $group: { _id: null, stddev: { $stddev: "$scores.score" } } }
        ],
        DEFAULT_OPTS
      );
      expect(result.length).toBe(1);
      expect(result[0].stddev).toEqual(28.57362029450366);
    });
  });

  describe("computeValue", () => {
    it("throws for invalid operator", () => {
      expect(() => computeValue({}, {}, "$fakeOperator", DEFAULT_OPTS)).toThrow(
        Error
      );
    });

    it("computes current timestamp using $$NOW", () => {
      const result = computeValue(
        {},
        { date: "$$NOW" },
        null,
        DEFAULT_OPTS
      ) as {
        date: Date;
      };
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("issues#526: passes root object down call stack", () => {
      const obj = {
        value10: 10,
        value20: 20,
        value30: 30,
        value50: 50
      };
      const res = computeValue(
        obj,
        {
          data: {
            steps: [
              { range: [{ $min: [9, "$value10"] }, "$value20"] },
              { range: ["$value30", "$value50"] }
            ]
          }
        },
        null,
        DEFAULT_OPTS
      );
      expect(res).toEqual({
        data: {
          steps: [{ range: [9, 20] }, { range: [30, 50] }]
        }
      });
    });
  });

  describe("redact", () => {
    it("returns object with $$KEEP", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$KEEP", copts.update(obj));
      expect(result).toStrictEqual(obj);
    });

    it("discards object with $$PRUNE", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "$$PRUNE", copts.update(obj));
      expect(result).toStrictEqual(undefined);
    });

    it("return input object for $$DESCEND if operator is not $cond", () => {
      const obj = { name: "Francis", level: "$$DESCEND" };
      const result = redact(obj, "$level", copts.update(obj));
      expect(result).toStrictEqual(obj);
    });

    it("ignore and return resolved value if not valid redact variable", () => {
      const obj = { name: "Francis" };
      const result = redact(obj, "unknown", copts.update(obj));
      expect(result).toStrictEqual("unknown");
    });
  });
});
