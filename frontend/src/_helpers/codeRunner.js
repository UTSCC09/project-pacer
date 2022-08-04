async function runCode(code, language) {
  let out = null;
  let err = null;
  if (language === "javascript") {
    const parsedCode = `\n ${code};`;
    try {
      const func = new Function(parsedCode);
      out = String(func());
    } catch (error) {
      err = String(error);
    }
  } else if (language === "python") {
    const pythonDecoder = document.getElementById("python-decoder");
    pythonDecoder.value = `${code}`;
    pythonDecoder.dispatchEvent(new Event("input"));
    const pythonOut = document.getElementById("python-out");
    out = pythonOut.innerHTML;
    const pythonErr = document.getElementById("python-err");
    err = pythonErr.innerHTML;
  } else {
  }
  return { out, err };
}

export default runCode;
