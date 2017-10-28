import { Result, Match, Empty, Skip, Fault } from "../results";
import { FunctionSchema } from "../schemas";

export default function(schema) {
  return (obj, key, parents, parentKeys) => context => {
    return schema.fn(obj, key, parents, parentKeys)(context);
  };
}
