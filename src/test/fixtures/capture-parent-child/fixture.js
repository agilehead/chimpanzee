import { capture, captureAndParse } from "../../../chimpanzee";

export const input = { level1: { level2: "hello world" } };

export const schema = {
  level1: captureAndParse({ level2: capture("prop2") }, "prop1")
};
