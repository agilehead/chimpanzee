/* @flow */
import external from "./external";
import { Match, Empty, Skip, Fault } from "../results";
import { FunctionalSchema } from "../schema";
import { parse } from "../utils";

export function getTasks(valueSchema, params) {
  const schema = valueSchema.value;
  return function(originalObj, key, parents, parentKeys) {
    return function(obj, meta) {
      return [
        {
          task: context => parse(schema)(originalObj, key, parents, parentKeys)(obj, meta)
        }
      ];
    };
  };
}