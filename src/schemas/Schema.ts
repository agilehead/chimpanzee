/*
  This is the base class for all schemas.
*/
import { IParams, IMeta, Value, IContext, SchemaParser } from "../types";
import parse from "../parse";
import { Match, Empty, Result } from "../results";

export type FnGetSchemaFromResult = (result: Result) => Schema<any>;

export default abstract class Schema<T> {
  value: T;
  params: IParams | undefined;
  meta: IMeta | undefined;

  constructor(value: T, params?: IParams, meta?: IMeta) {
    this.value = value;
    this.params = params;
    this.meta = meta;
  }

  abstract getParseFunc(): SchemaParser<T>;

  then(
    fnSuccessSchema: FnGetSchemaFromResult,
    fnFailSchema: FnGetSchemaFromResult
  ) {
    return (
      obj: Value,
      key: string,
      parents: Value[],
      parentKeys: string[]
    ) => (context: IContext) => {
      const result = parse(this)(obj, key, parents, parentKeys)(context);
      return result instanceof Match || result instanceof Empty
        ? parse(fnSuccessSchema(result))(obj, key, parents, parentKeys)(context)
        : fnFailSchema
        ? fnFailSchema(result)
        : result;
    };
  }
}