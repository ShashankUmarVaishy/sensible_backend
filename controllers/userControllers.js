//bring inprisma anc cookie
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/index");
const bcrypt = require("bcryptjs"); //to hash passwords
const cookieToken = require("../utils/cookieToken");

exports.signUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    //check
    if (!name || !email || !password) {
      throw new Error("Please provide all the fields");
    }
    const salt = bcrypt.genSaltSync(10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: bcrypt.hashSync(password, salt),
      },
    });
    //send user a token
    cookieToken(user, res);
  } catch (err) {
    throw new Error(err);
  }
};
exports.login = async (req, res, next) => {
  try {
    console.log("Login request received");
    console.log("Request body:", req.body);
    const { email, password } = req.body;
    //check
    if (!email || !password) {
      throw new Error("Please provide all the fields");
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }
    //check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(403)
        .json({ message: "Invalid credentials (password) " });
    }

    //send user a token
    cookieToken(user, res);
  } catch (err) {
    throw new Error(err);
  }
};
exports.getUserinfoByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    //check
    if (!userId) {
      throw new Error("Invalid user Id");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    //send user details
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: user.token,
      },
    });
  } catch (err) {
    throw new Error(err);
  }
};
exports.getUserinfo = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Authorization header:", authHeader);
    const userToken = authHeader.split(" ")[1];
    console.log("User token:", userToken);
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);

    const userId = decoded?.userId;
    if (!userId) {
      throw new Error("Invalid user token");
    }
    console.log("Decoded user ID:", userId);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    //send user details
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: user.token,
        age: user.age,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    throw new Error(err);
  }
};

exports.addPatient = async (req, res, next) => {
  console.log(req.body);
  try {
    const { userToken, patientId } = req.body;
    if (!userToken || !patientId) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    console.log("Decoded user ID:", decoded?.userId);
    const caretakerId = decoded?.userId;
    if (!caretakerId) {
      throw new Error("Invalid user token");
    }

    // Check if users exist
    console.log("checking data ");
    const [caretaker, patient] = await Promise.all([
      prisma.user.findUnique({ where: { id: caretakerId } }),
      prisma.user.findUnique({ where: { id: patientId } }),
    ]);
    console.log("data checked ");
    if (!caretaker || !patient) {
      throw new Error("User or Patient not found");
    }
    console.log("awaiting to update")
    await prisma.user.update({
      where: { id: patientId },
      data: { isPatient: true },
    });
    console.log("updated")

    // Create UserRelation
    const relation = await prisma.userRelation.create({
      data: {
        caretakerId,
        patientId,
      },
    });

    res.status(200).json({ success: true, relation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.addPatientByEmail = async (req, res, next) => {
  console.log(req.body);
  try {
    const { userToken, patientEmail } = req.body;
    if (!userToken ||!patientEmail) {
      throw new Error("Please provide user details");
    }
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const caretakerId = decoded?.userId;
    if (!caretakerId) {
      throw new Error("Invalid user token");
    }const [patient, caretaker] = await Promise.all([
      prisma.user.findUnique({ where: { email : patientEmail } }),
      prisma.user.findUnique({ where: { id: caretakerId } }),
    ]);

    if (!patient || !caretaker) {
      throw new Error("User or Caretaker not found");
    }
    await prisma.user.update({
      where: { email: patientEmail },
      data: { isPatient: true },
    });

    // Create UserRelation
    const relation = await prisma.userRelation.create({
      data: {
        caretakerId:caretaker.id,
        patientId:patient.id,
      },
    });

    res.status(200).json({ success: true, message :"patient added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

};
exports.addCaretakerByEmail = async (req, res, next) => {
  try {
    const { userToken, caretakerEmail } = req.body;
    if (!userToken || !caretakerEmail) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.userId;
    if (!patientId) {
      throw new Error("Invalid user token");
    }

    // Check if users exist
    const [patient, caretaker] = await Promise.all([
      prisma.user.findUnique({ where: { id: patientId } }),
      prisma.user.findUnique({ where: { email: caretakerEmail } }),
    ]);

    if (!patient || !caretaker) {
      throw new Error("User or Caretaker not found");
    }
    await prisma.user.update({
      where: { id: patientId },
      data: { isPatient: true },
    });

    // Create UserRelation
    const relation = await prisma.userRelation.create({
      data: {
        caretakerId:caretaker.id,
        patientId,
      },
    });

    res.status(200).json({ success: true, relation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.addCaretaker = async (req, res, next) => {
  try {
    const { userToken, caretakerId } = req.body;
    if (!userToken || !caretakerId) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.userId;
    if (!patientId) {
      throw new Error("Invalid user token");
    }

    // Check if users exist
    const [patient, caretaker] = await Promise.all([
      prisma.user.findUnique({ where: { id: patientId } }),
      prisma.user.findUnique({ where: { id: caretakerId } }),
    ]);

    if (!patient || !caretaker) {
      throw new Error("User or Caretaker not found");
    }
    await prisma.user.update({
      where: { id: patientId },
      data: { isPatient: true },
    });

    // Create UserRelation
    const relation = await prisma.userRelation.create({
      data: {
        caretakerId,
        patientId,
      },
    });

    res.status(200).json({ success: true, relation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getPatients = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Authorization header:", authHeader);
    const userToken = authHeader.split(" ")[1];
    console.log("User token:", userToken);
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const caretakerId = decoded?.userId;
    if (!caretakerId) {
      throw new Error("Invalid user token");
    }

    // Fetch patients for the caretaker
    const relations = await prisma.userRelation.findMany({
      where: { caretakerId },
      include: { patient: true },
    });

    res.status(200).json({ success: true, relations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.updateProfile=async (req, res, next) => {
  console.log('ima called')
   console.log(req.body);
  try {
    const { userToken, age, phoneNumber } = req.body;
    if (!userToken || !age || !phoneNumber) {
      throw new Error("Please provide all details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    console.log("Decoded user ID:", decoded?.userId);
    const userId = decoded?.userId;
    if (!userId) {
      throw new Error("Invalid user token");
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isPatient: true,
        age,
        phoneNumber
       },
    });
    console.log("updated")

   

    res.status(200).json({ success: true, message : "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
exports.getCaretakers = async (req, res, next) => {
  try {
     const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Authorization header:", authHeader);
    const userToken = authHeader.split(" ")[1];
    console.log("User token:", userToken);
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.userId;
    if (!patientId) {
      throw new Error("Invalid user token");
    }

    // Fetch caretakers for the patient
    const relations = await prisma.userRelation.findMany({
      where: { patientId },
      include: { caretaker: true },
    });

    res.status(200).json({ success: true, relations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.removePatient = async (req, res, next) => {
  try {
    const { userToken, patientId } = req.body;
    if (!userToken || !patientId) {
      throw new Error("Please provide user details");
    }
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const caretakerId = decoded?.userId;
    if (!caretakerId) {
      throw new Error("Invalid user token");
    }
    // Check if the caretaker and patient exist
    const caretaker = await prisma.user.findUnique({
      where: { id: caretakerId },
    });
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!caretaker || !patient) {
      throw new Error("Caretaker or Patient not found");
    }
    // Remove the relation
    const relation = await prisma.userRelation.deleteMany({
      where: {
        caretakerId,
        patientId,
      },
    });
    if (relation.count === 0) {
      throw new Error("No relation found to remove");
    }
    res.status(200).json({
      success: true,
      message: `Patient ${patient.name} removed successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.removeCaretaker = async (req, res, next) => {
  try {
    const { userToken, caretakerId } = req.body;
    if (!userToken || !caretakerId) {
      throw new Error("Please provide user details");
    }
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.userId;
    if (!patientId) {
      throw new Error("Invalid user token");
    }
    // Check if the caretaker and patient exist
    const caretaker = await prisma.user.findUnique({
      where: { id: caretakerId },
    });
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!caretaker || !patient) {
      throw new Error("Caretaker or Patient not found");
    }
    // Remove the relation
    const relation = await prisma.userRelation.deleteMany({
      where: {
        caretakerId,
        patientId,
      },
    });
    if (relation.count === 0) {
      throw new Error("No relation found to remove");
    }
    res.status(200).json({
      success: true,
      message: `Caretaker ${caretaker.name} removed successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
