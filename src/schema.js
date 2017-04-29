/* @flow */
import type {
  ContextType,
  InvokeType,
  SchemaParamsType,
  TaskType,
  EnvType,
  MetaType
} from "./types";

export default class Schema<T> {
  fn: InvokeType<T>;
  params: SchemaParamsType<T>;

  constructor(fn: InvokeType<T>, params: SchemaParamsType<T>) {
    this.fn = fn;
    this.params = params;
  }
}
