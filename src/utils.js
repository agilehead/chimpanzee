import { traverse } from "./traverse";
import { Match, Empty, Skip, Fault } from "./results";
import Schema from "./schema";

export function getDefaultParams(params = {}) {
  params = typeof params === "string" ? { key: params } : params;
  params.builders = params.builders || [{ get: (obj, { state }) => state }];
  params.modifiers = params.modifiers || {};
  return params;
}

export function runToXXX(schema, then, options = {}) {
  then = then || (result => result);
;
  return function(obj, context, key, parents, parentKeys) {
    function next(schema) {
      function loop(task) {
        return typeof task === "function"
          ? () => loop(task())
          : then(task);
      }

      const effectiveContext = options.newContext ? { ...context } : context;
      const schemaFn = typeof schema === "function"
        ? schema
        : schema instanceof Schema ? schema.fn : traverse(schema).fn;
      return loop(schemaFn(obj, effectiveContext, key, parents, parentKeys));
    }
    return next(schema);
  };
}

export function waitFor(gen, then = x => x) {
  return (function run(gen) {
    const result = typeof gen === "function" ? gen() : gen;
    return typeof result === "function" ? () => run(result) : then(result);
  })(gen);
}

export function waitForSchema(
  schema,
  obj,
  context,
  key,
  parents,
  parentKeys,
  then
) {
  return waitFor(
    traverse(schema).fn(obj, context, key, parents, parentKeys),
    then
  );
}
