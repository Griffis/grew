import { Any } from "../../../src/types";
import * as samples from "../../support";

samples.runTestPipeline("operators/pipeline/limit", [
  {
    message: "can apply $limit",
    input: samples.studentsData,
    pipeline: [{ $limit: 20 }],
    expected: (actual: Any[]) => {
      expect(actual.length).toEqual(20);
    }
  }
]);
