/* @flow */
import { Match, Empty, Skip, Fault } from "../results";
import Schema from "../schema";

export function empty() {
  const meta = { type: "empty" };

  function fn(obj, key, parents, parentKeys) {
    return obj === undefined
      ? context => new Empty({ obj, key, parents, parentKeys }, meta)
      : context => new Skip(
          "Not empty.",
          { obj, key, parents, parentKeys },
          meta
        );
  }

  return new Schema(fn, undefined);
}
