const router = require('express').Router();
const { createSubscriber, sendWebhookMessage, createEndpoint } = require('../utils/webhooks.js');

router.post('/assist', (req, res, next) => {
    const {
        student_id,
        student_name
    } = req.body;

    // you may want to store it in a database, and generate the ID automatically
    const data = {
        request_id: 'a1b2c3d4e5f6g7h8i9', // demo ID
        student_id,
        student_name
    };

    // you can pass in whatever data you want to send with the event
    sendWebhookMessage('help.requested', data)
        .then((result) => {
            res.status(201).json({
                message: 'Student request passed on successfully',
                result
            });
        })
        .catch((error) => {
            res.status(error.status).json({
                message: error.message
            });
        });
    });

router.post('/subs', (req, res, next) => {

    createSubscriber(req.body.name)
    .then((result) => {
        console.log("here:")
        console.log(result)
        res.status(201).json(result);
    })
    .catch((error) => {
        res.status(error.status).json({
            message: error.message
        });
    });
});

router.post('/newEndpoint', (req, res, next) => {
    console.log("there")
    const {
        subId,
        subUrl,
        events
    } = req.body;
    console.log(subId, subUrl, events)
    createEndpoint(subId, subUrl, [])
    .then((result) => {
        res.status(201).json({
            message: 'New endpoint hooked',
            result
        });
    })
    .catch((error) => {
        res.status(error.status).json({
            message: error.message
        });
    });
});

module.exports = router;