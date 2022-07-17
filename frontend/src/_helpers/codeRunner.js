var stringToHTML = function (str) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(str, 'text/html');
	return doc.body;
};

function runCode(code, language) {
    if (language === "javascript") {
        const parsedCode = `\n ${code};`
        const res = eval(parsedCode)
        console.log(res)
      } else if (language === "python") {
        const pythonDecoder = document.getElementById('python-decoder')
        pythonDecoder.value = `${code}`
        pythonDecoder.dispatchEvent(new Event("input"))
        const pythonOut = document.getElementById('python-out')
        console.log("out: " + pythonOut.innerHTML)
        const pythonErr = document.getElementById('python-err')
        console.log("err: " + pythonErr.innerHTML)
      } else {
        
      }
}

export default runCode