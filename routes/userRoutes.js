const express = require('express');
const router=   express.Router();
const {signUp,login,getUserinfo,setToken,getToken,removeToken,addPatient,addCaretaker,getPatients,getCaretakers,removePatient,removeCaretaker} =require('../controllers/userControllers');

router.route('/signup').post(signUp)
router.route('/login').post(login)
router.route('/userinfo').get(getUserinfo)
router.route('/settoken').put(setToken)
router.route('/gettoken').get(getToken)
router.route('/removetoken').delete(removeToken)
router.route('/addpatient').post(addPatient)
router.route('/addcaretaker').post(addCaretaker)
router.route('/getpatients').get(getPatients)
router.route('/getcaretakers').get(getCaretakers)
router.route('/removepatient').delete(removePatient)
router.route('/removecaretaker').delete(removeCaretaker)


module.exports = router;