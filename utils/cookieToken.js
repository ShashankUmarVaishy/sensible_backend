const getJwtToken= require('../helpers/getJwtToken')

const cookieToken= (user , res )=>{
    const userToken=getJwtToken(user.id)
    const options={
        httpOnly: true //now we can manipulate this cookie only through this server/ so server only cookie
    }
    user.password=undefined; //restricts passwords from user

    //now just set the cookie
    res.status(200).json({
        success:true,
        userToken,
        user
    })
}

module.exports = cookieToken;