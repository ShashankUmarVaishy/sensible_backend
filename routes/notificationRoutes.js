const express = require('express');
const router=   express.Router();
const {setToken,getToken,removeToken,sendNotificationToUser,sendNotificationToGroupFromPatient,sendNotificationToAllUsers} = require('../controllers/notificationControllers');

router.route('/token').put(setToken)
router.route('/token').get(getToken)
router.route('/token').delete(removeToken)
router.route('/sendtouser').post(sendNotificationToUser)
router.route('/sendtogroupfrompatients').post(sendNotificationToGroupFromPatient)
router.route('/sendtoallusers').post(sendNotificationToAllUsers)
module.exports = router;