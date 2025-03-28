import { Any, AnyObject } from "../src/types";
import {
  cloneDeep,
  compare,
  groupBy,
  has,
  hashCode,
  intersection,
  isEmpty,
  isEqual,
  isObject,
  isObjectLike,
  normalize,
  resolve,
  resolveGraph,
  stringify,
  truthy,
  typeOf,
  unique,
  ValueMap,
  walk
} from "../src/util";
import { ObjectId } from "./support";

describe("util", () => {
  describe("compare", () => {
    it("can compare less than, greater than, and equal to", () => {
      expect(compare(1, 5)).toBe(-1);
      expect(compare(5, 1)).toBe(1);
      expect(compare(1, 1)).toBe(0);
    });
  });

  describe("normalize", () => {
    it.each([
      [1, { $eq: 1 }],
      ["a", { $eq: "a" }],
      [true, { $eq: true }],
      [{ a: 1 }, { $eq: { a: 1 } }],
      [/mo/, { $regex: /mo/ }],
      [{ $regex: "ab" }, { $regex: /ab/ }],
      [{ $regex: "ab", $options: "i" }, { $regex: /ab/i }],
      [
        { $regex: "ab", $ne: "ab" },
        { $regex: /ab/, $ne: "ab" }
      ],
      [
        { $eq: 10, $gt: 5, $le: 2 },
        { $eq: 10, $gt: 5, $le: 2 }
      ]
    ])("should normalize: %p => %p", (input, output) => {
      expect(normalize(input)).toEqual(output);
    });
  });

  class Custom {
    constructor(readonly _id: string) {}
    toString() {
      return this._id;
    }
  }

  describe("typeOf", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["number", NaN],
      ["number", 1],
      ["string", ""],
      ["regexp", /a/],
      ["boolean", true],
      ["boolean", false],
      ["symbol", Symbol("a")],
      ["error", new Error()],
      ["array", []],
      ["object", {}],
      ["arraybuffer", new ArrayBuffer(0)],
      ["Custom", new Custom("abc")]
    ])("should expect %p for %p", (res, input) => {
      expect(typeOf(input)).toEqual(res);
    });
  });

  describe("isEqual", () => {
    it.each([
      [NaN, 0 / 0, true],
      [NaN, NaN, true],
      [0, -0, true],
      [-0, 0, true],
      [1, NaN, false],
      [NaN, 1, false],
      [[1, 2], [1, 2], true],
      [[2, 1], [1, 2], false],
      [[1, "a", { a: /b/ }], [1, "a", { a: new RegExp("b") }], true],
      [null, undefined, false],
      [new Date(2003, 10, 1), new Date(2003, 10, 1), true],
      [
        { date: { year: 2013, month: 9, day: 25 } },
        { date: { year: 2013, month: 9, day: 25 } },
        true
      ],
      [() => void {}, () => void {}, false],
      [RegExp, RegExp, true],
      [ObjectId("100"), ObjectId("100"), true]
    ])("should check: %p == %p", (a, b, c) => {
      expect(isEqual(a, b)).toEqual(c);
    });

    it("should check for cycles in object", () => {
      const a: Any[] = [1, 2, 3];
      const b: Any[] = [1, 2, 3];
      const obj = { a, b };
      a.push(obj);
      b.push(obj);
      expect(isEqual(a, b)).toEqual(true);
      // expect(() => isEqual(a, b)).toThrow(/cycle detected/);
    });
  });

  describe("stringify", () => {
    const a: Any[] = [1, 2, 3];
    const b: Any[] = [4, 5, 6];

    it.each([
      [null, "null"],
      [undefined, "undefined"],
      [1, "1"],
      ["a", '"a"'],
      [true, "true"],
      [{ a: 1 }, "{a:1}"],
      [/mo/, "/mo/"],
      [[1, "a"], '[1,"a"]'],
      [new Date("2001-01-01T00:00:00.000Z"), "2001-01-01T00:00:00.000Z"],
      [(id: Any) => id, "(id) => id"],
      [new Uint8Array([5, 2]), "uint8array[5,2]"],
      [new Float32Array([1.5, 2.5]), "float32array[1.5,2.5]"],
      [{ a: a, b: a }, "{a:[1,2,3],b:[1,2,3]}"],
      [[a, a], "[[1,2,3],[1,2,3]]"],
      [[a, b], "[[1,2,3],[4,5,6]]"],
      [[a, b, a, b], "[[1,2,3],[4,5,6],[1,2,3],[4,5,6]]"],
      [ObjectId("1234567890"), 'objectId("1234567890")']
    ])("should pass: %p => %p", (input, output) => {
      expect(stringify(input)).toEqual(output);
    });

    it("should check for cycles in object", () => {
      const a: Any[] = [1, 2, 3];
      const b: Any[] = [4, 5, 6];
      const obj = { a, b };
      b.push(obj);

      expect(() => stringify(obj)).toThrow(/cycle detected/);
    });

    it("should check for cycles in array", () => {
      const a: Any[] = [1, 2, 3];
      const b: Any[] = [4, 5, 6, a];
      const c = [a, b];
      a.push(c);

      expect(() => stringify(c)).toThrow(/cycle detected/);
    });
  });

  describe("groupBy", () => {
    it("should group by user-defined object", () => {
      const a = ObjectId("100");
      const b = ObjectId("200");
      const collection = [
        { userId: a, ix: 1 },
        { userId: a, ix: 2 },
        { userId: b, ix: 3 },
        { userId: b, ix: 4 },
        { userId: b, ix: 5 }
      ];

      const partitions = groupBy(collection, o => (o as AnyObject).userId);

      expect(partitions.size).toEqual(2);
      expect(partitions.get(a)?.length).toEqual(2);
      expect(partitions.get(a)).toContainEqual({ userId: a, ix: 1 });
      expect(partitions.get(a)).not.toContainEqual({ userId: b, ix: 3 });
      expect(partitions.get(b)?.length).toEqual(3);
      expect(partitions.get(b)).toContainEqual({ userId: b, ix: 3 });
      expect(partitions.get(b)).not.toContainEqual({ userId: a, ix: 1 });
    });
  });

  describe("isObject", () => {
    class Foo {
      constructor(readonly a: string = "foo") {}
    }

    const OBJECT_PROTO = Object.getPrototypeOf({}) as AnyObject;

    const arrayWithNullProto = ["a", "b"];
    Object.setPrototypeOf(arrayWithNullProto, null);

    const arrayWithObjectProto = ["a", "b"];
    Object.setPrototypeOf(arrayWithObjectProto, OBJECT_PROTO);

    const fooWithNullProto = new Foo();
    Object.setPrototypeOf(fooWithNullProto, null);

    const fooWithObjectProto = new Foo();
    Object.setPrototypeOf(fooWithObjectProto, OBJECT_PROTO);

    const fixtures = [
      [{}, true, "empty object literal"],
      [{ a: 1 }, true, "object literal with value"],
      [Object.create(null), true, "object from null proto"],
      [Object.create(OBJECT_PROTO), true, "object from object proto"],
      [fooWithNullProto, true, "custom type with null proto"],
      [fooWithObjectProto, true, "custom type with object proto"],
      [arrayWithObjectProto, false, "array with object proto"],
      [arrayWithNullProto, false, "array with null proto"],
      [Object.create({}), false, "object with object literal as proto"],
      [[3, 2, 1], false, "array instance"],
      [new Foo(), false, "custom object instance"]
    ];

    fixtures.forEach(arr => {
      it(arr[2] as string, () => {
        expect(isObject(arr[0])).toEqual(arr[1]);
      });
    });
  });

  describe("isEmpty", () => {
    const sample = ["0", 0, null, {}, "", []];
    expect(sample.map(isEmpty)).toEqual([false, false, true, true, true, true]);
  });

  describe("cloneDeep", () => {
    const a: Any[] = [1, 2, 3];
    const b: Any[] = [4, 5, 6];

    it.each([
      [null],
      [undefined],
      [1],
      ["a"],
      [true],
      [{ a: 1 }],
      [/mo/],
      [[1, "a"]],
      [new Date("2001-01-01T00:00:00.000Z")],
      [new Uint8Array([5, 2])],
      [new Float32Array([1.5, 2.5])],
      [{ a: a, b: a }],
      [[a, b, a, b]]
    ])("should pass: %p => %p", input => {
      const other = cloneDeep(input);
      expect(isEqual(input, other)).toEqual(true);
      if (isObjectLike(input)) expect(input !== other).toEqual(true);
    });
  });

  describe("resolveGraph", () => {
    const doc = { a: 1, b: { c: 2, d: ["hello"], e: [1, 2, 3] } };
    const sameDoc = cloneDeep(doc);

    it("resolves the path to the selected field only", () => {
      const result = resolveGraph(doc, "b.e.1");
      expect(result).toEqual({ b: { e: [2] } });
      expect(doc).toEqual(sameDoc);
    });

    it("resolves item in nested array by index", () => {
      const result = resolveGraph({ a: [5, { b: [10] }] }, "a.1.b.0");
      expect(result).toEqual({ a: [{ b: [10] }] });
    });

    it("resolves object in a nested array", () => {
      const result = resolveGraph({ a: [{ b: [{ c: 1 }] }] }, "a.b.c");
      expect(result).toEqual({ a: [{ b: [{ c: 1 }] }] });
    });

    it("preserves untouched keys of the resolved object", () => {
      const result = resolveGraph(doc, "b.e.1", {
        preserveKeys: true
      }) as AnyObject;
      expect(result).toEqual({ a: 1, b: { c: 2, d: ["hello"], e: [2] } });
      expect(doc).toEqual(sameDoc);

      const leaf = resolve(result, "b.d");
      expect(leaf).toEqual(["hello"]);
      expect(leaf === doc.b.d).toBeTruthy();
    });

    it("preserves untouched array indexes of resolved object graph", () => {
      const result = resolveGraph(doc, "b.e.1", {
        preserveIndex: true
      }) as AnyObject;
      expect(result).toEqual({ b: { e: [1, 2, 3] } });

      const res2 = resolveGraph({ a: 1, b: [{ c: 2 }, { d: 3 }] }, "b.1.d", {
        preserveIndex: true
      }) as AnyObject;
      expect(res2).toEqual({ b: [{ c: 2 }, { d: 3 }] });
    });

    it("preserves position of touched array indexes for nested object in resolved object", () => {
      const result = resolveGraph({ a: 1, b: [{ c: 2 }, { d: 3 }] }, "b.d", {
        preserveIndex: true
      }) as AnyObject;
      expect(result).toEqual({ b: [undefined, { d: 3 }] });
    });
  });

  describe("unique", () => {
    it("returns unique items even with hash collision", () => {
      const first = "KNE_OC42-midas";
      const second = "KNE_OCS3-midas";
      expect(hashCode(first)).toEqual(hashCode(second));

      const res = unique([first, second]);
      expect(res).toEqual([first, second]);
    });

    it("returns stable unique items from duplicates", () => {
      expect(unique([1, 2, 2, 1])).toEqual([1, 2]);
      expect(unique([5, [2], 3, [2], 1])).toEqual([5, [2], 3, 1]);
    });
  });

  describe("intersection", () => {
    it("should find no intersection", () => {
      const res = intersection([
        [1, 2, 3],
        [4, 5, 6],
        [5, 6, 7]
      ]);
      expect(res).toEqual([]);
    });

    it("should find one intersection", () => {
      const res = intersection([
        [1, 2, 3],
        [4, 5, 3]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of more than two arrays", () => {
      const res = intersection([
        [1, 2, 3],
        [3, 6, 2],
        [4, 5, 3]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of multiple arrays with duplicates", () => {
      const res = intersection([
        [1, 2, 3, 6],
        [4, 5, 3],
        [3, 5, 3, 1]
      ]);
      expect(res).toEqual([3]);
    });

    it("should find intersection of multiple arrays with complex objects", () => {
      const res = intersection([
        [1, [2], 3, 3],
        [4, 5, 3, [2]],
        [[2], 4, 5, 3, 1]
      ]);
      expect(res).toEqual([[2], 3]);
    });

    it("should find intersection of multiple arrays and maintain stability of sequence", () => {
      const res = intersection([
        [1, [2], 3, 3, 9, 10, 11],
        [4, 5, 3, [2]],
        [[2], 4, 5, 3, 1]
      ]);
      expect(res).toEqual([[2], 3]);
    });
  });

  describe("truthy", () => {
    // [value, strict, result]
    for (const [v, b, r] of Array.from<[unknown, boolean, boolean]>([
      ["", true, true],
      ["", false, false],
      ["s", true, true],
      ["s", false, true],
      [0, true, false],
      [0, false, false],
      [1, true, true],
      [1, false, true],
      [[], true, true],
      [[], false, true],
      [false, true, false],
      [false, false, false],
      [true, true, true],
      [true, false, true],
      [null, true, false],
      [null, false, false],
      [undefined, true, false],
      [undefined, false, false]
    ])) {
      it(`should return ${String(r)} for '${JSON.stringify(
        v
      )}' with strict=${String(b)}.`, () => {
        expect(truthy(v, b)).toEqual(r);
      });
    }
  });

  describe("walk", () => {
    let o: AnyObject = {};
    beforeEach(() => {
      o = {
        a: { b: { c: [{ x: 1 }, { x: 4 }] } }
      };
    });
    it("should return undefined for missing path", () => {
      let counter = 0;
      walk(o, "a.c.e", () => counter++);
      expect(counter).toEqual(0);
    });

    it("should navigate selector and invoke callback", () => {
      let counter = 0;
      walk(o, "a.b.c.x", () => counter++);
      expect(counter).toEqual(0);

      walk(o, "a.b.c.x", () => counter++, { descendArray: true });
      // invoke for each item in array
      expect(counter).toEqual(2);

      walk(o, "a.b.c", () => counter++);
      expect(counter).toEqual(3);
    });

    it("should build path if options provided", () => {
      let counter = 0;
      walk(o, "a.b.d.e", () => counter++);
      expect(has(resolve(o, "a.b") as AnyObject, "d")).toEqual(false);

      walk(o, "a.b.d.e", () => counter++, { buildGraph: true });
      expect(has(resolve(o, "a.b") as AnyObject, "d")).toEqual(true);
    });
  });

  describe("ValueMap", () => {
    it("should process map methods correctly", () => {
      const m = ValueMap.init();

      // set
      m.set(100, 100)
        .set("string", "100")
        .set([1, 2], { a: 3 })
        .set([1, 2], { a: 1 }) // replace
        .set({ a: 1 }, [1, 2])
        .set({ a: 1 }, [2, 1]); // replace

      // has
      expect(m.has(100)).toEqual(true);
      expect(m.has("string")).toEqual(true);
      expect(m.has([1, 2])).toEqual(true);
      expect(m.has({ a: 1 })).toEqual(true);
      expect(m.has("hello")).toEqual(false);

      // size
      expect(m.size).toEqual(4);

      // get
      expect(m.get([1, 2])).toEqual({ a: 1 });
      expect(m.get({ a: 1 })).toEqual([2, 1]);

      // keys
      expect(Array.from(m.keys()).length).toEqual(4);

      // delete
      expect(m.delete({ a: 1 })).toEqual(true);
      expect(m.delete({ a: 1 })).toEqual(false);
      expect(m.size).toEqual(3);

      // clear
      m.clear();
      expect(m.size).toEqual(0);
      expect(m.get([1, 2])).toBeUndefined();
      expect(m.get({ a: 1 })).toBeUndefined();
    });

    it("should handle poor hash function", () => {
      const badHashFn = (v: Any) => {
        if (isEqual(v, { a: 1 })) return 1234;
        if (isEqual(v, { a: 2 })) return 1234;
        if (isEqual(v, { a: 3 })) return 1234;
        const r = hashCode(v);
        return r == null ? 0 : Number(r);
      };
      const m = ValueMap.init(badHashFn);
      m.set({ a: 1 }, "A");
      m.set({ a: 2 }, "B");
      m.set({ a: 3 }, "C");
      m.set({ a: 1 }, "D"); // replace

      expect(m.size).toEqual(3);

      expect(m.delete({ a: 2 })).toEqual(true);

      expect(m.size).toEqual(2);
      expect(m.get({ a: 1 })).toEqual("D");
      expect(m.get({ a: 3 })).toEqual("C");
    });
  });
});
