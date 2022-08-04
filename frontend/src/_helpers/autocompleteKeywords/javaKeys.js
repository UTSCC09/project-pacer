const javaKeywords =
  "abstract continue for new switch assert " +
  "default package synchronized boolean do if private " +
  "this break double implements protected throw byte else import " +
  "public throws case enum instanceof return transient catch extends int " +
  "short try char final interface static void class finally long strictfp volatile float native super while";

const javaBuiltins =
  "compareTo equals concat charAt toUpperCase toLowerCase trim substring endsWith length " +
  "compareTo equals abs round min max random isLetter isDigit isUpperCase isLowerCase " +
  "length toString contains";

const javaKeysProcessed = javaKeywords.split(" ");
const javaBuiltinsProcessed = javaBuiltins.split(" ").join("() ").split(" ");

export { javaKeysProcessed, javaBuiltinsProcessed };
