async function send(method, url, data) {
  const config = {
    method: method,
    credentials: "include",
  };
  if (!["GET", "DELETE"].includes(method)) {
    config.headers = {
      "Content-Type": "application/json"
    };
    config.body = JSON.stringify(data);
  }
  try {
    const response = await fetch(url, config);
    const resData = await response.json();
    console.log(resData)
    return resData;
  } catch (error) {
    console.log(error);
  }
}

export async function getAllRooms() {
    console.log("waiting")
  return await send(
    "GET",
    "http://localhost:8080/api/rooms/"
  );
}

export const getRoomByHost = async (host) => {
  return await send(
    "GET",
    "http://localhost:8080/api/rooms/" + host,
  );
}

export const createNewRoom = async (roomName, socketId) => {
    return await send(
        "POST",
        "http://localhost:8080/api/rooms/",
        {roomName, socketId}
    );
}

export const joinRoom = async (host, socketId) => {
    return await send(
        "PATCH",
        "http://localhost:8080/api/rooms/" + host + "/",
        {socketId}
    )
}