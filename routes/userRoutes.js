const express = require('express');
const router=   express.Router();
const {signUp,login,getUserinfo,setToken,removeToken,addPatient,addCaretaker,getPatients,getCareTakers,removePatient,removeCaretaker} =require('../controllers/userControllers');

router.route('/signup').post(signUp)
router.route('/login').post(login)
router.route('/userinfo').get(getUserinfo)
router.route('/settoken').post(setToken)
router.route('/removetoken').post(removeToken)
router.route('/addpatient').post(addPatient)
router.route('/addcaretaker').post(addCaretaker)
router.route('/getpatients').get(getPatients)
router.route('/getcaretakers').get(getCareTakers)
router.route('/removepatient').post(removePatient)
router.route('/removecaretaker').post(removeCaretaker)


module.exports = router;