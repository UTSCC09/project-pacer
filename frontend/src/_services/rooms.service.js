async function send(method, url, data) {
  const config = {
    method: method,
    credentials: "include",
  };
  if (!["GET", "DELETE"].includes(method)) {
    config.headers = {
      "Content-Type": "application/json",
    };
    config.body = JSON.stringify(data);
  }
  try {
    const response = await fetch(url, config);
    const resData = await response.json();
    if (response.status !== 200) throw new Error(resData);
    return { res: resData };
  } catch (error) {
    return { err: error.message };
  }
}

export async function getAllRooms() {
  return send("GET", "https://api.pacer.codes/api/rooms/");
}

export const createNewRoom = async (roomName, socketId) => {
  return send("POST", "https://api.pacer.codes/api/rooms/", {
    roomName,
    socketId,
  });
};

export const joinRoom = async (host, socketId) => {
  return await send("PATCH", "https://api.pacer.codes/api/rooms/" + host + "/", {
    socketId,
  });
};
