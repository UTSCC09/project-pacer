import { BehaviorSubject } from 'rxjs';

import { handleResponse } from './../_helpers';

const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

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

export const authenticationService = {
    signin,
    signup,
    logout,
    currentUser: currentUserSubject.asObservable(),
    get currentUserValue () { return currentUserSubject.value }
};

function signin(username, password, role, callback) {
    send("POST", "http://localhost:8080/api/signin", { username, password, role }, function (err, res) {
        if (err) return callback(err, null);
        localStorage.setItem('currentUser', JSON.stringify(res));
        currentUserSubject.next(res);
        return callback(null, res);
      });
}

function signup(username, password, role, callback) {
    send("POST", "http://localhost:8080/api/signup", { username, password, role }, function (err, res) {
        if (err) return callback(err, null);
        localStorage.setItem('currentUser', JSON.stringify(res));
        currentUserSubject.next(res);
        return callback(null, res);
      });
}

function logout() {
    // remove user from local storage to log user out
    send("POST", "http://localhost:8080/api/signout", { }, function (err) {
        if (err) return console.log(err);
        console.log("logging out")
        localStorage.removeItem('currentUser');
        currentUserSubject.next(null);
      });
}
