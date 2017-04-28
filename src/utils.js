/* @flow */
import { traverse } from "./traverse";
import { Match, Empty, Skip, Fault } from "./results";
import Schema from "./schema";

import type {
  ContextType,
  RawSchemaParamsType,
  SchemaType,
  SchemaParamsType,
  ResultTransformerType
} from "./types";

export function getSchemaType(schema: SchemaType): string {
  return ["string", "number", "boolean", "symbol"].includes(typeof schema)
    ? "native"
    : typeof schema === "function"
        ? "function"
        : schema instanceof Schema
            ? "schema"
            : Array.isArray(schema)
                ? "array"
                : typeof schema === "object" ? "object" : typeof schema;
}

export function getDefaultParams(
  rawParams?: string | RawSchemaParamsType
): SchemaParamsType {
  const params: SchemaParamsType = typeof rawParams === "string"
    ? { key: rawParams }
    : (rawParams || {});
  params.builders = params.builders || [{ get: context => context.state }];
  params.modifiers = params.modifiers || {};
  return params;
}

export type WaitForSchemaOptionsType = {};

export function waitForSchema(
  schema: SchemaType,
  then: ResultTransformerType,
  options: WaitForSchemaOptionsType = {}
) {
  then = then || (result => result);
  return function(
    obj: any,
    key: string,
    parents: Array<any>,
    parentKeys: Array<string>
  ) {
    function next(schema) {
      function loop(task) {
        return typeof task === "function" ? (context) => loop(task(context)) : then(task);
      }

      const schemaFn = typeof schema === "function"
        ? schema
        : schema instanceof Schema ? schema.fn : traverse(schema).fn;
      console.log(schemaFn);
      return loop(context => schemaFn(obj, key, parents, parentKeys)(context));
    }
    return next(schema);
  };
}
