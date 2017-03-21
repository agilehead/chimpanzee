import { Match, Empty, Skip, Fault } from "./results";
import Schema from "./schema";
import { waitForSchema } from "./utils";

export function capture(params) {
  return captureIf(obj => typeof obj !== "undefined", params);
}

export function captureIf(predicate, params) {
  return take(predicate, undefined, params);
}

export function modify(comparand, modifier, params) {
  return take(
    typeof comparand === "function" ? comparand : x => x === comparand,
    undefined,
    params,
    { modifier: typeof modifier === "function" ? modifier : x => modifier }
  );
}

export function captureAndTraverse(schema, params) {
  return take(obj => typeof obj !== "undefined", schema, params);
}

export function literal(what, params) {
  return take(x => x === what, undefined, params, {
    skipMessage: x => `Expected value to be ${what} but got ${x}.`
  });
}

export function take(predicate, schema, params, options = {}) {
  const meta = { type: "take", schema, params, predicate, options };

  params = typeof params === "string" ? { key: params } : params;

  function fn(obj, context, key) {
    return predicate(obj)
      ? typeof schema !== "undefined"
          ? waitForSchema(
              schema,
              obj,
              context,
              result => result instanceof Match
                ? new Match(
                    {
                      ...obj,
                      ...(options.modifier
                        ? options.modifier(result.value)
                        : result.value)
                    },
                    meta
                  )
                : new Skip("Capture failed in inner schema.", meta)
            )
          : new Match(options.modifier ? options.modifier(obj) : obj, meta)
      : new Skip(
          options.skipMessage
            ? options.skipMessage(obj)
            : "Predicate returned false.",
          meta
        );
  }

  return new Schema(fn, params, meta);
}
