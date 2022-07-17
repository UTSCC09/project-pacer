function send(method, url, data, callback) {
    const config = {
      method: method,
    };
    if (!["GET", "DELETE"].includes(method)) {
      config.headers = {
        "Content-Type": "application/json",
      };
      config.body = JSON.stringify(data);
    }
    fetch(url, config)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text);
          });
        } else {
          return res.json();
        }
      })
      .then((val) => callback(null, val))
      .catch((err) => callback(err, null));
  }

export const webhookService = {
    subscribe,
    addEndpoint,
    requestHelp
};

function subscribe(name, callback) {
    send("POST", "http://localhost:8080/api/subs", { name }, function (err, res) {
        if (err) return callback(err, null);
        return callback(null, JSON.parse(res));
      });
}

function addEndpoint(subId, subUrl, events, callback) {
    send("POST", "http://localhost:8080/api/newEndpoint", { subId, subUrl, events }, function (err, res) {
        if (err) return callback(err, null);
        return callback(null, JSON.parse(res));
      });
}

function requestHelp(student_id, student_name, callback) {
    // remove user from local storage to log user out
    send("POST", "http://localhost:8080/api/assist", { student_id, student_name }, function (err, res) {
        if (err) return callback(err, null);
        return callback(null, JSON.parse(res));
      });
}
