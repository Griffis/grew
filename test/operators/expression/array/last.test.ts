import * as support from "../../../support";

support.runTest(support.testPath(__filename), {
  $last: [
    [[1, 2, 3], 3],
    [[[]], undefined],
    [[null], null],
    [[], null, { err: true }],
    [null, null],
    [undefined, null],
    [5, null, { err: true }]
  ]
});
