/* @flow */
import external from "./external";
import { Match, Empty, Skip, Fault } from "../results";
import Schema from "../schema";

import type {
  ContextType,
  RawSchemaParamsType,
  SchemaParamsType,
  TaskType,
  EnvType,
  MetaType
} from "../types";

export function getTasks(schema: Schema, params: SchemaParamsType) {
  return function(
    originalObj: any,
    key: string,
    parents: Array<any>,
    parentKeys: Array<string>
  ) {
    return function(obj: any, meta: MetaType) {
      const common = external(schema, params)(originalObj, key, parents, parentKeys)(obj, meta);
      const tasksList = schema.fn(obj, key, parents, parentKeys);
      return tasksList.map(t => ({
        task: context => t.task(context),
        merge: t.merge || common.mergeChildResult,
        params: schema.params
      }));
    };
  };
}
