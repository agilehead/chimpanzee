import { FunctionSchema, Schema } from "../schemas";
import parse from "../parse";
import { getParams } from "./utils";
import { Value, IContext, IParams } from "../types";

export function wrap(schema: Schema, params: IParams) {
  const meta = { schema, params };

  function fn(obj: Value, key: string, parents: Value[], parentKeys: string[]) {
    return (context: IContext) =>
      parse(schema)(obj, key, parents, parentKeys)(context);
  }

  return new FunctionSchema(fn, getParams(params), meta);
}
