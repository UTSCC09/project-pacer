import { BehaviorSubject } from "rxjs";

export const getCurrentUser = async () => {
  try {
    const response = await fetch("http://pacer.codes/api/whoami", {
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
        "Host": "api.pacer.codes"
      },
    });
    const data = await response.json();
    console.log(data);
    currentUserSubject.next(data);
  } catch (error) {
    console.log(error);
  }
};

const currentUserSubject = new BehaviorSubject();

function send(method, url, data, callback) {
  const config = {
    method: method,
    credentials: "include",
  };
  if (!["GET", "DELETE"].includes(method)) {
    config.headers = {
      "Content-Type": "application/json",
      "Host": "api.pacer.codes"
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

export const authenticationService = {
  signin,
  signup,
  logout,
  currentUser: currentUserSubject.asObservable(),
};

function signin(username, password, role, callback) {
  send(
    "POST",
    "http://pacer.codes/api/signin",
    { username, password, role },
    function (err, res) {
      if (err) return callback(err, null);
      console.log(res);
      currentUserSubject.next(res);
      return callback(null, res);
    }
  );
}

function signup(username, password, role, callback) {
  send(
    "POST",
    "http://pacer.codes/api/signup",
    { username, password, role },
    function (err, res) {
      if (err) return callback(err, null);
      currentUserSubject.next(res);
      return callback(null, res);
    }
  );
}

function logout() {
  // remove user from local storage to log user out
  send("POST", "http://pacer.codes/api/signout", {}, function (err) {
    if (err) return console.log(err);
    console.log("logging out");
    currentUserSubject.next(null);
  });
}
