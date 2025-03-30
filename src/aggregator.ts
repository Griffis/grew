import {
  getOperator,
  initOptions,
  Options,
  PipelineOperator,
  ProcessingMode
} from "./core";
import { Iterator, Lazy, Source } from "./lazy";
import { AnyObject } from "./types";
import { assert, cloneDeep, isEmpty } from "./util";

/**
 * Provides functionality for the mongoDB aggregation pipeline
 *
 * @param pipeline an Array of pipeline operators
 * @param options An optional Options to pass the aggregator
 * @constructor
 */
export class Aggregator {
  #pipeline: AnyObject[];
  #options: Options;

  constructor(pipeline: AnyObject[], options?: Partial<Options>) {
    this.#pipeline = pipeline;
    this.#options = initOptions(options);
  }

  /**
   * Returns an {@link Iterator} for lazy evaluation of the pipeline.
   *
   * @param collection An array or iterator object
   * @returns {Iterator} an iterator object
   */
  stream(collection: Source, options?: Options): Iterator {
    let iter: Iterator = Lazy(collection);
    var opts = options ?? this.#options;
    var mode = opts.processingMode;

    if (mode & ProcessingMode.CLONE_INPUT) iter.map(cloneDeep);

    var stages = new Array<string>();

    if (!isEmpty(this.#pipeline)) {
      // run aggregation pipeline
      for (var opExpr of this.#pipeline) {
        var opKeys = Object.keys(opExpr);
        var opName = opKeys[0];
        var call = getOperator("pipeline", opName, opts) as PipelineOperator;

        assert(
          opKeys.length === 1 && !!call,
          `invalid pipeline operator ${opName}`
        );
        stages.push(opName);
        iter = call(iter, opExpr[opName], opts);
      }
    }

    // operators that may share object graphs of inputs.
    if (mode & ProcessingMode.CLONE_OUTPUT) iter.map(cloneDeep);

    return iter;
  }

  /**
   * Return the results of the aggregation as an array.
   *
   * @param collection
   */
  run<T extends AnyObject>(collection: Source, options?: Options): T[] {
    return this.stream(collection, options).value();
  }
}
