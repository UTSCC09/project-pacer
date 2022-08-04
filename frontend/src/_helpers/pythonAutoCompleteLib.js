import {
  pythonKeywordsL,
  pythonKeywordsU,
  pythonBuiltinsL,
  pythonBuiltinsU,
} from "./autocompleteKeywords/pythonKeys";
import {
  javaBuiltinsProcessed,
  javaKeysProcessed,
} from "./autocompleteKeywords/javaKeys";

function buildAutoCompleteLib(keywords, builtins) {
  console.log("building");
  const keys = keywords.concat(builtins);
  const lib = [];
  keys.forEach((key) => {
    const entry = { label: key, type: "keyword" };
    lib.push(entry);
  });
  return lib;
}
const upperPythonKeys = buildAutoCompleteLib(pythonKeywordsU, pythonBuiltinsU);
const lowerPythonKeys = buildAutoCompleteLib(pythonKeywordsL, pythonBuiltinsL);

const javaKeys = buildAutoCompleteLib(javaBuiltinsProcessed, javaKeysProcessed);

export { upperPythonKeys, lowerPythonKeys, javaKeys };
