//helper file to jus get jwt token from cookies
const jwt = require('jsonwebtoken');

const getJwtToken=(userId) =>{
    return jwt.sign({ userId:userId }, process.env.JWT_SECRET)
}

module.exports = getJwtToken;