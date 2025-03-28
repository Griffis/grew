import { update } from "../src";
import { clone } from "../src/operators/update/_internal";
import { isArray } from "../src/util";

describe("updateObject", () => {
  const obj = {};
  beforeEach(() => {
    Object.assign(obj, { name: "John", age: 30 });
  });

  it("should contain single operator in expression", () => {
    const expr = { $set: { name: "Fred" } };
    expr["$inc"] = { age: 2 };
    expect(() => update(obj, expr)).toThrow(/must contain only one operator/);
  });

  it("should contain valid operator in expression", () => {
    const expr = { $set: { name: "Fred" } };
    expr["$cos"] = { age: 2 };
    delete expr["$set" as string];
    expect(() => update(obj, expr)).toThrow(
      /operator '\$cos' is not supported/
    );
  });

  it("should check condition before update", () => {
    expect(
      update(obj, { $set: { name: "Fred" } }, [], { age: { $lt: 10 } })
    ).toEqual([]);
    expect(obj).toEqual({ name: "John", age: 30 });
  });

  it("should apply update on valid condition expression", () => {
    expect(
      update(obj, { $set: { name: "Fred" } }, [], { age: { $gt: 10 } })
    ).toEqual(["name"]);
    expect(obj).toEqual({ name: "Fred", age: 30 });
  });

  it("should not apply update on invalid condition expression", () => {
    expect(obj).toEqual({ name: "John", age: 30 });
    expect(update(obj, { $set: { name: "Fred" } }, [], { age: 10 })).toEqual(
      []
    );
    expect(obj).toEqual({ name: "John", age: 30 });
  });

  it("should apply update on valid condition query", () => {
    expect(
      update(obj, { $set: { name: "Fred" } }, [], { age: { $gt: 10 } })
    ).toEqual(["name"]);
    expect(obj).toEqual({ name: "Fred", age: 30 });
  });

  it.each([{ a: 1 }, [{ a: 1 }], new Date("2022-02-01")])(
    "should apply clone mode: %p",
    val => {
      const a = clone("deep", val);
      const b = clone("copy", val);
      const c = clone("none", val);

      expect(val).toEqual(a);
      expect(val).toEqual(b);
      expect(val).toEqual(c);

      expect(val).not.toBe(a);
      expect(val).not.toBe(b);
      expect(val).toBe(c);

      if (isArray(val)) {
        expect(val[0]).not.toBe((a as unknown[])[0]);
        expect(val[0]).toBe((b as unknown[])[0]);
        expect(val[0]).toBe((c as unknown[])[0]);
      }
    }
  );
});
