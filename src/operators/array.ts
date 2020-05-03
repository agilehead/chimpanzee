import { Match, Empty, Skip, Fault, Result } from "../results";
import { Schema, FunctionSchema } from "../schemas";
import parse from "../parse";
import { toNeedledSchema, ArrayOperator, ArrayResult } from "../parsers/array";
import { Value, IContext, IParams } from "../types";

/*
  Unordered does not change the needle.
  Searching for "1" in
  [1, 4, 4, 4, 4, 5, 6, 67]
            ^needle
  returns [4, 4], with needle moved to 5.
*/

export type RepeatingOptions = {
  min?: number;
  max?: number;
};

export function repeating(schema: Schema<any>, opts: RepeatingOptions = {}) {
  const meta = { type: "repeating", schema: schema };

  const min = opts.min || 0;
  const max = opts.max;

  const needledSchema = toNeedledSchema(schema);

  return new ArrayOperator(
    (needle: number) =>
      new FunctionSchema(
        (
          obj: Array<Value>,
          key: string,
          parents: Value[],
          parentKeys: string[]
        ) => (context: IContext) => {
          function completed(results: Result[], needle: number) {
            return results.length >= min && (!max || results.length <= max)
              ? new ArrayResult(
                  new Match(results, { obj, key, parents, parentKeys }, meta),
                  needle
                )
              : new ArrayResult(
                  new Skip(
                    "Incorrect number of matches.",
                    { obj, key, parents, parentKeys },
                    meta
                  ),
                  needle
                );
          }

          return (function loop(
            results: Result[],
            needle: number
          ): ArrayResult {
            const { result, needle: updatedNeedle } = parse(
              needledSchema(needle)
            )(
              obj,
              key,
              parents,
              parentKeys
            )(context);

            return result instanceof Match || result instanceof Empty
              ? obj.length > needle
                ? loop(
                    result instanceof Match
                      ? results.concat([result.value])
                      : results,
                    updatedNeedle
                  )
                : completed(
                    result instanceof Match
                      ? results.concat([result.value])
                      : results,
                    needle
                  )
              : result instanceof Skip
              ? completed(results, needle)
              : new ArrayResult(result, needle); // Skip or Fault
          })([], needle);
        },
        {},
        meta
      )
  );
}

/*
  Unordered does not change the needle.
  Searching for "1" in
  [1, 2, 4, 5, 6, 67]
         ^needle
  returns 1, with needle still pointing at 4.
  We don't care about the needle.
*/
export type UnorderedOptions = {
  searchPrevious?: boolean;
};

export function unordered(schema: Schema<any>, opts: UnorderedOptions = {}) {
  const useNeedle = opts.searchPrevious === false ? true : false;

  const meta = { type: "unordered", schema: schema };

  const needledSchema = toNeedledSchema(schema);

  return new ArrayOperator(
    (needle: number) =>
      new FunctionSchema(
        (obj: Array<Value>, key: string, parents: Value[], parentKeys: string[]) => (
          context: IContext
        ) =>
          (function loop(i: number): ArrayResult {
            const { result } = parse(needledSchema(i))(
              obj,
              key,
              parents,
              parentKeys
            )(context);

            return result instanceof Match ||
              result instanceof Empty ||
              result instanceof Fault
              ? new ArrayResult(result, needle)
              : obj.length > i
              ? loop(i + 1)
              : new ArrayResult(
                  new Skip(
                    `Unordered item was not found.`,
                    { obj, key, parents, parentKeys },
                    meta
                  ),
                  needle
                );
          })(useNeedle ? needle : 0),
        {},
        meta
      )
  );
}

/*  
  A recursive is schema that calls child schemas with all the remaining items as an array, instead of with each array element.   For instance, [1, 2, 3, 4] will be passed to child schemas as [1, 2, 3, 4], [2, 3, 4], [3, 4], [4] - if each child schema invocation consumes a single item.
  
  If a child schema invocation consumes multiple items, the next iteration will have as many items less.
*/
export function recursive(schema: Schema<any>, params: IParams) {
  const meta = { type: "recursive", schema, params };

  return new FunctionSchema(
    (
      obj: Array<Value>,
      key: string,
      parents: Value[],
      parentKeys: string[]
    ) => (context: IContext) =>
      (function loop(items: Array<Value>, results: Result[]): Result {
        return items.length
          ? (() => {
              const result = parse(schema)(items, key, parents, parentKeys)(
                context
              );
              return result.env && typeof result.env.needle !== "undefined"
                ? result instanceof Match
                  ? loop(
                      items.slice(result.env.needle),
                      results.concat([result.value])
                    )
                  : result instanceof Empty
                  ? loop(items.slice(result.env.needle), results)
                  : result
                : new Fault(
                    `The child expression in recursive() needs to be an array.`
                  );
            })()
          : results.length
          ? new Match(
              results,
              {
                obj,
                key,
                parents,
                parentKeys,
              },
              meta
            )
          : new Empty(
              {
                obj,
                key,
                parents,
                parentKeys,
              },
              meta
            );
      })(obj, []),
    {},
    meta
  );
}

/*
  Optional items may or may not exist.
  A Skip() is not issued when an item is not found.
  The needle is incremented by 1 if found, otherwise it remains the same.
*/
export function optionalItem(schema: Schema<any>) {
  const meta = { type: "optionalItem", schema: schema };
  const needledSchema = toNeedledSchema(schema);

  return new ArrayOperator((needle: number) => {
    return new FunctionSchema(
      (obj: Value, key: string, parents: Value[], parentKeys: string[]) => (
        context: IContext
      ) => {
        const { result } = parse(needledSchema(needle))(obj, key, parents, parentKeys)(
          context
        );

        return result instanceof Match || result instanceof Empty
          ? new ArrayResult(result, needle + 1)
          : result instanceof Skip
          ? new ArrayResult(
              new Empty({ obj, key, parents, parentKeys }, meta),
              needle
            )
          : new ArrayResult(result, needle);
      },
      {},
      meta
    );
  });
}
