import { Match, Empty, Skip, Fault } from "./results";
import Schema from "./schema";
import getReconciler from "./reconciler/get-reconciler";
import reconcile from "./reconciler/reconcile";
import { getDefaultParams } from "./utils";
import { getSchemaType } from "./utils";

export function traverse(schema, params, inner = false) {
  const meta = { type: "traverse", schema, params, inner };
  params = getDefaultParams(params);

  function fn(originalObj, context = {}, key, parents, parentKeys) {
    const obj = params.modifiers.object
      ? params.modifiers.object(originalObj)
      : originalObj;

    const schemaType = getSchemaType(schema);

    const childReconciler = getReconciler(schemaType)(schema, params, inner)(
      originalObj,
      context,
      key,
      parents,
      parentKeys
    )(obj, meta);

    const childTasks = childReconciler.getChildTasks();

    const immediateChildTasks = childTasks.filter(
      t => !t.params || !t.params.defer
    );
    const deferredChildTasks = childTasks.filter(
      t => t.params && t.params.defer
    );

    const mergeChildTasks = results => childReconciler.mergeChildTasks(results);

    const isTraversingDependent = schemaType === "object" && inner;

    return reconcile(
      params,
      isTraversingDependent,
      [immediateChildTasks, deferredChildTasks],
      mergeChildTasks,
      meta
    )(obj, context, key, parents, parentKeys);
  }

  return new Schema(fn, params);
}
