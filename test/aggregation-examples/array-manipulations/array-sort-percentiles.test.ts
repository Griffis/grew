import { aggregate } from "../../../src";
import { DEFAULT_OPTS, ISODate } from "../../support";

/**
 * You've conducted performance testing of an application with the results of each "test run" captured in a database.
 * Each record contains a set of response times for the test run. You want to analyse the data from multiple runs to
 * identify the slowest ones. You calculate the median (50th percentile) and 90th percentile response times for each
 * test run and only keep results where the 90th percentile response time is greater than 100 milliseconds.
 *
 * See {@link https://www.practical-mongodb-aggregations.com/examples/array-manipulations/array-sort-percentiles.html}
 */
describe("Sample Data Population", () => {
  // Insert 7 records into the performance_test_results collection
  const performance_test_results = [
    {
      testRun: 1,
      datetime: ISODate("2021-08-01T22:51:27.638Z"),
      responseTimesMillis: [62, 97, 59, 104, 97, 71, 62, 115, 82, 87]
    },
    {
      testRun: 2,
      datetime: ISODate("2021-08-01T22:56:32.272Z"),
      responseTimesMillis: [
        34, 63, 51, 104, 87, 63, 64, 86, 105, 51, 73, 78, 59, 108, 65, 58, 69,
        106, 87, 93, 65
      ]
    },
    {
      testRun: 3,
      datetime: ISODate("2021-08-01T23:01:08.908Z"),
      responseTimesMillis: [56, 72, 83, 95, 107, 83, 85]
    },
    {
      testRun: 4,
      datetime: ISODate("2021-08-01T23:17:33.526Z"),
      responseTimesMillis: [78, 67, 107, 110]
    },
    {
      testRun: 5,
      datetime: ISODate("2021-08-01T23:24:39.998Z"),
      responseTimesMillis: [75, 91, 75, 87, 99, 88, 55, 72, 99, 102]
    },
    {
      testRun: 6,
      datetime: ISODate("2021-08-01T23:27:52.272Z"),
      responseTimesMillis: [88, 89]
    },
    {
      testRun: 7,
      datetime: ISODate("2021-08-01T23:31:59.917Z"),
      responseTimesMillis: [101]
    }
  ];

  // Macro function to generate a complex aggregation expression for sorting an array
  // This function isn't required for MongoDB version 5.2+ due to the new $sortArray operator
  function sortArray(sourceArrayField: string) {
    return {
      // GENERATE BRAND NEW ARRAY TO CONTAIN THE ELEMENTS FROM SOURCE ARRAY BUT NOW SORTED
      $reduce: {
        input: sourceArrayField,
        initialValue: [], // THE FIRST VERSION OF TEMP SORTED ARRAY WILL BE EMPTY
        in: {
          $let: {
            vars: {
              // CAPTURE $$this & $$value FROM OUTER $reduce BEFORE OVERRIDDEN
              resultArray: "$$value",
              currentSourceArrayElement: "$$this"
            },
            in: {
              $let: {
                vars: {
                  // FIND EACH SOURCE ARRAY'S CURRENT ELEMENT POSITION IN NEW SORTED ARRAY
                  targetArrayPosition: {
                    $reduce: {
                      input: { $range: [0, { $size: "$$resultArray" }] }, // "0,1,2.."
                      initialValue: {
                        // INITIALISE SORTED POSITION TO BE LAST ARRAY ELEMENT
                        $size: "$$resultArray"
                      },
                      in: {
                        // LOOP THRU "0,1,2..."
                        $cond: [
                          {
                            $lt: [
                              "$$currentSourceArrayElement",
                              { $arrayElemAt: ["$$resultArray", "$$this"] }
                            ]
                          },
                          { $min: ["$$value", "$$this"] }, // ONLY USE IF LOW VAL NOT YET FOUND
                          "$$value" // RETAIN INITIAL VAL AGAIN AS NOT YET FOUND CORRECT POSTN
                        ]
                      }
                    }
                  }
                },
                in: {
                  // BUILD NEW SORTED ARRAY BY SLICING OLDER ONE & INSERTING NEW ELEMENT BETWEEN
                  $concatArrays: [
                    {
                      $cond: [
                        // RETAIN THE EXISTING FIRST PART OF THE NEW ARRAY
                        { $eq: [0, "$$targetArrayPosition"] },
                        [],
                        {
                          $slice: ["$$resultArray", 0, "$$targetArrayPosition"]
                        }
                      ]
                    },
                    ["$$currentSourceArrayElement"], // PULL IN THE NEW POSITIONED ELEMENT
                    {
                      $cond: [
                        // RETAIN THE EXISTING LAST PART OF THE NEW ARRAY
                        { $gt: [{ $size: "$$resultArray" }, 0] },
                        {
                          $slice: [
                            "$$resultArray",
                            "$$targetArrayPosition",
                            { $size: "$$resultArray" }
                          ]
                        },
                        []
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }
    };
  }

  // Macro function to find nth percentile element of a sorted version of an array
  function arrayElemAtPercentile(sourceArrayField: string, percentile: number) {
    return {
      $let: {
        vars: {
          sortedArray: sortArray(sourceArrayField)
          // Comment out the line above and uncomment the line below if running MDB 5.2 or greater
          // "sortedArray": {"$sortArray": {"input": sourceArrayField, "sortBy": 1}},
        },
        in: {
          $arrayElemAt: [
            // FIND ELEMENT OF ARRAY AT NTH PERCENTILE POSITION
            "$$sortedArray",
            {
              $subtract: [
                // ARRAY IS 0-INDEX BASED SO SUBTRACT 1 TO GET POSITION
                {
                  // FIND NTH ELEMENT IN THE ARRAY, ROUNDED UP TO NEAREST integer
                  $ceil: {
                    $multiply: [
                      { $divide: [percentile, 100] },
                      { $size: "$$sortedArray" }
                    ]
                  }
                },
                1
              ]
            }
          ]
        }
      }
    };
  }

  const pipeline = [
    // Capture new fields for the ordered array + various percentiles
    {
      $set: {
        sortedResponseTimesMillis: sortArray("$responseTimesMillis"),
        // Comment out the line above and uncomment the line below if running MDB 5.2 or greater
        // "sortedResponseTimesMillis": {"$sortArray": {"input": "$responseTimesMillis", "sortBy": 1}},
        medianTimeMillis: arrayElemAtPercentile("$responseTimesMillis", 50),
        ninetiethPercentileTimeMillis: arrayElemAtPercentile(
          "$responseTimesMillis",
          90
        )
      }
    },

    // Only show results for tests with slow latencies (i.e. 90th%-ile responses >100ms)
    {
      $match: {
        ninetiethPercentileTimeMillis: { $gt: 100 }
      }
    },

    // Exclude unrequired fields from each record
    { $unset: ["_id", "datetime", "responseTimesMillis"] }
  ];

  it("returns documents representing the subset of documents with a 90th percentile response time greater than 100 milliseconds", () => {
    expect(aggregate(performance_test_results, pipeline, DEFAULT_OPTS)).toEqual(
      [
        {
          testRun: 1,
          sortedResponseTimesMillis: [59, 62, 62, 71, 82, 87, 97, 97, 104, 115],
          medianTimeMillis: 82,
          ninetiethPercentileTimeMillis: 104
        },
        {
          testRun: 2,
          sortedResponseTimesMillis: [
            34, 51, 51, 58, 59, 63, 63, 64, 65, 65, 69, 73, 78, 86, 87, 87, 93,
            104, 105, 106, 108
          ],
          medianTimeMillis: 69,
          ninetiethPercentileTimeMillis: 105
        },
        {
          testRun: 3,
          sortedResponseTimesMillis: [56, 72, 83, 83, 85, 95, 107],
          medianTimeMillis: 83,
          ninetiethPercentileTimeMillis: 107
        },
        {
          testRun: 4,
          sortedResponseTimesMillis: [67, 78, 107, 110],
          medianTimeMillis: 78,
          ninetiethPercentileTimeMillis: 110
        },
        {
          testRun: 7,
          sortedResponseTimesMillis: [101],
          medianTimeMillis: 101,
          ninetiethPercentileTimeMillis: 101
        }
      ]
    );
  });
});
