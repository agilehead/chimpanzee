/* @flow */
import { Result, Match, Empty, Skip, Fault } from "../results";
import Schema from "../schema";

import type {
  ContextType,
  SchemaType,
  RawSchemaParamsType,
  SchemaParamsType,
  ResultGeneratorType,
  EnvType,
  MetaType
} from "../types";

export default function(schema: SchemaType, params: SchemaParamsType) {
  return function(
    originalObj: any,
    key: string,
    parents: Array<any>,
    parentKeys: Array<string>
  ) {
    return function(obj: any, meta: MetaType) {
      /*
      Function will not have multiple child tasks.
      So, we can consider the first item in finished as the only item.
      There can be multiple tasks though.
    */
      function mergeChildResult(
        finished: { result: Result, params: SchemaParamsType },
        state: any
      ) {
        const { result, params } = finished;

        return result instanceof Match
          ? !(result instanceof Empty) ? { state: result.value } : { state }
          : { nonMatch: result };
      }

      return { mergeChildResult };
    };
  };
}
