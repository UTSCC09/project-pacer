var stringToHTML = function (str) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(str, "text/html");
  return doc.body;
};

function runCode(code, language) {
  let out = null
  let err = null
  if (language === "javascript") {
    const parsedCode = `\n ${code};`;
    try {
      const func = new Function(parsedCode);
      out = String(func());
      console.log("out: " + out);
    } catch (error) {
      console.log("err: " + error);
      err = String(error)
    }
  } else if (language === "python") {
    const pythonDecoder = document.getElementById("python-decoder");
    pythonDecoder.value = `${code}`;
    pythonDecoder.dispatchEvent(new Event("input"));
    const pythonOut = document.getElementById("python-out");
    console.log("out: " + pythonOut.innerHTML);
    out = pythonOut.innerHTML;
    const pythonErr = document.getElementById("python-err");
    console.log("err: " + pythonErr.innerHTML);
    err = pythonErr.innerHTML
  } else {
  }
  return {out, err}
}

export default runCode;
