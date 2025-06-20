const express = require('express');
const router=   express.Router();
const {signUp,updateProfile,addPatientByEmail,addCaretakerByEmail,login,getUserinfo,getUserinfoByUserId,addPatient,addCaretaker,getPatients,getCaretakers,removePatient,removeCaretaker} =require('../controllers/userControllers');

router.route('/signup').post(signUp)
router.route('/login').post(login)
router.route('/userinfo').get(getUserinfo)
router.route('/userinfoById').get(getUserinfoByUserId)
router.route('/updateprofile').put(updateProfile)
router.route('/addpatientbyemail').post(addPatientByEmail)
router.route('/addcaretakerbyemail').post(addCaretakerByEmail)
router.route('/addpatient').post(addPatient)
router.route('/addcaretaker').post(addCaretaker)
router.route('/getpatients').get(getPatients)
router.route('/getcaretakers').get(getCaretakers)
router.route('/removepatient').delete(removePatient)
router.route('/removecaretaker').delete(removeCaretaker)


module.exports = router;