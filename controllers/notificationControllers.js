// notificationControllers.js
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const admin = require("firebase-admin");
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

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

    res.status(200).json({
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
    console.log("Token removed successfully");
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
    const fcmToken = user.token?.replace(' ', '');
    if (!fcmToken) throw new Error("User has no FCM token");
    console.log("Sending notification to user |", fcmToken,"|end");
    // const response=  await sendNotificationToUserHandler(fcmToken, title, body);
     if (!Expo.isExpoPushToken(fcmToken)) {
    console.error(`Push token ${fcmToken} is not a valid Expo token`);
    return;
  }

  const messages = [{
    to: fcmToken,
    sound: 'default',
    title,
    body,
    data: { customData: 'value' },
  }];

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('Ticket:', ticketChunk);
    //also trying the handker
    // const anotherResponse= await sendNotificationToUserHandler(fcmToken, title, body);
    // console.log('another response:', anotherResponse);
    return res.send(ticketChunk);
  } 
  catch (err) {
    //catch of notification block
    console.error('Notification error:', err);
  }
    
  } 
  catch (err) {
    //catchof overall block
    return res.status(500).json({ error: err.message });
  }
};
const sendNotificationToUserHandler = async (fcmToken, title, body) => {
  console.log('in handler function ')
  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
    };
    console.log('message body made now sending it ')
    const response = await admin.messaging().send(message);
    console.log("res arrived from admin.messaging")
    console.log(response);
    return { success: true, response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.sendNotificationToGroupFromPatient = async (req, res, next) => {

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
    // Collect all valid tokens
    const allTokens = user.caretakers
      .map((relation) => relation.caretaker.token)
      .filter((token) => Expo.isExpoPushToken(token));

    if (allTokens.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No valid Expo tokens found for caretakers.",
      });
    } 
    const messages = allTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { from: userId },
    }));

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    

    for (let chunk of chunks) {
      try {
         await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending notification chunk:", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notifications sent to caretakers',
      
    });
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
