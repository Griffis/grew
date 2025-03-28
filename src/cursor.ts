import {
  CollationSpec,
  Options,
  PipelineOperator,
  ProcessingMode
} from "./core";
import { concat, Iterator, Lazy, Source } from "./lazy";
import { $limit } from "./operators/pipeline/limit";
import { $project } from "./operators/pipeline/project";
import { $skip } from "./operators/pipeline/skip";
import { $sort } from "./operators/pipeline/sort";
import { Any, AnyObject, Callback, Predicate } from "./types";
import { cloneDeep, has } from "./util";

const OPERATORS: Record<string, PipelineOperator> = { $sort, $skip, $limit };

/**
 * Cursor to iterate and perform filtering on matched objects.
 * This object must not be used directly. A cursor may be obtaine from calling `find()` on an instance of `Query`.
 *
 * @param collection The input source of the collection
 * @param predicate A predicate function to test documents
 * @param projection A projection criteria
 * @param options Options
 * @constructor
 */
export class Cursor<T> {
  #source: Source;
  #predicate: Predicate<Any>;
  #projection: AnyObject;
  #options: Options;
  #operators: AnyObject = {};
  #result: Iterator | null = null;
  #buffer: T[] = [];

  constructor(
    source: Source,
    predicate: Predicate<Any>,
    projection: AnyObject,
    options?: Options
  ) {
    this.#source = source;
    this.#predicate = predicate;
    this.#projection = projection;
    this.#options = options;
  }

  /** Returns the iterator from running the query */
  private fetch(): Iterator {
    if (this.#result) return this.#result;

    // apply filter
    this.#result = Lazy(this.#source).filter(this.#predicate);
    const mode = this.#options.processingMode;

    // handle processing flag.
    if (mode & ProcessingMode.CLONE_INPUT) this.#result.map(cloneDeep);

    // apply cursor operators
    for (const op of ["$sort", "$skip", "$limit"]) {
      if (has(this.#operators, op)) {
        this.#result = OPERATORS[op](
          this.#result,
          this.#operators[op],
          this.#options
        );
      }
    }
    // apply projection
    if (Object.keys(this.#projection).length) {
      this.#result = $project(this.#result, this.#projection, this.#options);
    }

    if (mode & ProcessingMode.CLONE_OUTPUT) this.#result.map(cloneDeep);

    return this.#result;
  }

  /** Returns an iterator with the buffered data included */
  private fetchAll(): Iterator {
    const buffered = Lazy([...this.#buffer]);
    this.#buffer = [];
    return concat(buffered, this.fetch());
  }

  /**
   * Return remaining objects in the cursor as an array. This method exhausts the cursor
   * @returns {Array}
   */
  all(): T[] {
    return this.fetchAll().value();
  }

  /**
   * Returns the number of objects return in the cursor. This method exhausts the cursor
   * @returns {Number}
   */
  count(): number {
    return this.all().length;
  }

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip(n: number): Cursor<T> {
    this.#operators["$skip"] = n;
    return this;
  }

  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  limit(n: number): Cursor<T> {
    this.#operators["$limit"] = n;
    return this;
  }

  /**
   * Returns results ordered according to a sort specification.
   * @param {AnyObject} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  sort(modifier: AnyObject): Cursor<T> {
    this.#operators["$sort"] = modifier;
    return this;
  }

  /**
   * Specifies the collation for the cursor returned by the `mingo.Query.find`
   * @param {*} spec
   */
  collation(spec: CollationSpec): Cursor<T> {
    this.#options = { ...this.#options, collation: spec };
    return this;
  }

  /**
   * Returns the next document in a cursor.
   * @returns {AnyObject | Boolean}
   */
  next(): T {
    // yield value obtains in hasNext()
    if (this.#buffer.length > 0) {
      return this.#buffer.pop();
    }
    const o = this.fetch().next();
    if (o.done) return;
    return o.value as T;
  }

  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext(): boolean {
    // there is a value in the buffer
    if (this.#buffer.length > 0) return true;

    const o = this.fetch().next();
    if (o.done) return false;

    this.#buffer.push(o.value as T);
    return true;
  }

  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param fn
   * @returns {Array}
   */
  map<R>(fn: Callback<R, T>): R[] {
    return this.all().map(fn as unknown as (t: T, i: number, a: T[]) => R);
  }

  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param fn
   */
  forEach(fn: Callback<void, T>): void {
    this.all().forEach(fn as unknown as (t: T, i: number, a: T[]) => void);
  }

  [Symbol.iterator](): Iterator {
    return this.fetchAll();
  }
}
