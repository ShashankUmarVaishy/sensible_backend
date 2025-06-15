// notificationControllers.js
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const admin = require("firebase-admin");

// const serviceAccount = require('../config/service_account_file.json'); // Update path if needed

// // Initialize Firebase Admin
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }
let adminConfig, serviceAccount;

if (process.env.FIREBASE_CREDENTIAL_JSON) {
  try {
    // In production: credentials provided via environment variable (as JSON string)
    //  serviceAccount= require(process.env.FIREBASE_CREDENTIAL_JSON);
    // console.log("Firebase admin initialized successfully : ", serviceAccount);
    // adminConfig = JSON.stringify(serviceAccount);
    // console.log("Firebase adminoconfig initialized successfully : ", adminConfig);
    
    const decoded = Buffer.from(process.env.FIREBASE_CREDENTIAL_BASE64, 'base64').toString();
    
    serviceAccount = JSON.parse(decoded);
    console.log("Private key preview:", serviceAccount.private_key?.slice(0, 40));
console.log("Private key newline count:", (serviceAccount.private_key?.match(/\n/g) || []).length);

    
  } catch (err) {
    console.error("Failed to parse FIREBASE_CREDENTIAL_JSON:", err);
  }
}

if (serviceAccount && !admin.apps.length) {
  console.log("making admin initialize app ");
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // credential: admin.credential.cert(adminConfig),
  });
  console.log("credential part done")
}
exports.setToken = async (req, res) => {
  try {
    const { userToken, token } = req.body;
    if (!userToken || !token) throw new Error("Please provide user details");

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({ where: { id: userId }, data: { token } });
    res
      .status(200)
      .json({ success: true, message: "Token updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    res
      .status(200)
      .json({
        success: true,
        token: user.token,
        message: "Token retrieved successfully",
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeToken = async (req, res) => {
  try {
    const { userToken } = req.body;
    if (!userToken) throw new Error("Please provide user details");

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({ where: { id: userId }, data: { token: null } });
    res
      .status(200)
      .json({ success: true, message: "Token removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendNotificationToUser = async (req, res, next) => {
  try {
    const { userToken, recieverId, title, body } = req.body;
    if (!userToken || !recieverId || !title || !body)
      throw new Error("Please provide user details and notification details");
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");
    const user = await prisma.user.findUnique({ where: { id: recieverId } });
    if (!user) throw new Error("User not found");
    const fcmToken = user.token;
    if (!fcmToken) throw new Error("User has no FCM token");
    
    const result = await sendNotificationToUserHandler(fcmToken, title, body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
const sendNotificationToUserHandler = async (fcmToken, title, body) => {
  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
    };
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.sendNotificationToGroupFromPatient = async (req, res, next) => {
  //   try {
  //   const { userToken, title, body } = req.body;
  //   if (!userToken ||!title ||!body) throw new Error("Please provide user details and notification details");
  //   const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
  //   const userId = decoded?.userId;
  //   if (!userId) throw new Error("Invalid user");
  //   const user = await prisma.user.findUnique({ where: { id: userId } });
  //   if (!user) throw new Error("User not found");
  //   const tokenArray= user.caretakers;
  //   return sendNotificationToGroupHandler(tokenArray, title, body);
  // } catch (err) {
  //   return res.status(500).json({ error: err.message });
  // }
  try {
    const { userToken, title, body } = req.body;
    if (!userToken || !title || !body)
      throw new Error("Please provide user details and notification details");

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");

    // Include caretaker relation and fetch tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        caretakers: {
          include: {
            caretaker: true, // fetch the actual caretaker User object
          },
        },
      },
    });

    if (!user) throw new Error("User not found");

    // Extract tokens from caretakers
    const tokenArray = user.caretakers
      .map((relation) => relation.caretaker.token)
      .filter((token) => token); // remove null or undefined tokens

    if (tokenArray.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "No valid caretaker tokens found." });
    }

    const response = await sendNotificationToGroupHandler(
      tokenArray,
      title,
      body
    );
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const sendNotificationToGroupHandler = async (tokenArray, title, body) => {
  const message = {
    tokens: tokenArray,
    notification: { title, body },
  };
  try {
    const response = await admin.messaging().sendMulticast(message);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.sendNotificationToAllUsers = async (req, res, next) => {
  try {
    const { userToken, title, body } = req.body;
    if (!userToken || !title || !body)
      throw new Error("Please provide user details and notification details");
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.userId;
    if (!userId) throw new Error("Invalid user");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const result = await sendNotificationToAllUsersHandler(title, body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const sendNotificationToAllUsersHandler = async (title, body) => {
  const users = await prisma.user.findMany({
    where: { token: { not: null } },
    select: { token: true },
  });

  const tokens = users.map((u) => u.token);
  const chunkSize = 500;

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    await sendNotificationToGroupHandler(chunk, title, body);
  }

  return { success: true, message: "Notifications sent to all users." };
};
