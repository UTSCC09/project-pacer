

async function runCode(code, language) {
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
    // let pyodide = await loadPyodide();
    // try {
    //   out = pyodide.runPython(code)
    // } catch (error) {
    //   err = error
    // }
    const pythonDecoder = document.getElementById("python-decoder");
    pythonDecoder.value = `${code}`;
    pythonDecoder.dispatchEvent(new Event("input"));
    const pythonOut = document.getElementById("python-out");
    console.log("out: " + pythonOut.innerHTML);
    out = pythonOut.innerHTML;
    const pythonErr = document.getElementById("python-err");
    console.log("err: " + pythonErr.innerHTML);
    console.log(pythonErr.innerHTML)
    err = pythonErr.innerHTML
  } else {
  }
  return {out, err}
}

export default runCode;
