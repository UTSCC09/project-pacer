const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
  
// your webhooks utils

const sendWebhookMessage = async (event, data) => {
  var url = new URL(
    `https://www.hostedhooks.com/api/v1/apps/${process.env.APP_UUID}/messages`
  );

  // webhook message
  var messagePayload = JSON.stringify({
    data: data,
    version: '1.0',
    event_type: event,
  });

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HOSTEDHOOKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: messagePayload,
    redirect: 'follow',
  };

  try {
    const result = await fetch(subscriberURL, requestOptions)
    return result.text()
  } catch (error) {
    throw error
  }

};

const createSubscriber = async (name) => {
  var subscriberURL = new URL(
    `https://www.hostedhooks.com/api/v1/apps/${process.env.APP_UUID}/subscriptions`
  );

  var messagePayload = JSON.stringify({
    name: name,
  });

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HOSTEDHOOKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: messagePayload,
  };

  try {
    const result = await fetch(subscriberURL, requestOptions)
    return result.text()
  } catch (error) {
    throw error
  }
}

const createEndpoint = async (subId, subUrl, events) => {
  var endpointURL = new URL(
    `https://www.hostedhooks.com/api/v1/subscriptions/${subId}/endpoints`
  );

  var messagePayload = JSON.stringify({
    url: subURL,
    enable_events: events,
    version: "1.0",
    status: "active"
  });

  console.log(messagePayload)

  var requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HOSTEDHOOKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: messagePayload,
  };

  try {
    const result = await fetch(subscriberURL, requestOptions)
    return result.text()
  } catch (error) {
    throw error
  }
}




module.exports = {
  sendWebhookMessage,
  createSubscriber,
  createEndpoint
};