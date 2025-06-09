//bring inprisma anc cookie

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
  console.log("Login request received");
  console.log(req.body);
  try {
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
    console.log("User found:", user);
    if (!user) {
      throw new Error("User not found");
    }
    //check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    console.log("Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      return res.status(403).json({ message: "Invalid credentials (password) " });
    }
    
    //send user a token
    cookieToken(user, res);
  } catch (err) {
    throw new Error(err);
  }
};
exports.getUserinfo = async (req, res, next) => {
  try {
    const { userToken } = req.body;
    //check
    if (!userToken) {
      throw new Error("Please provide necessary details");
    }
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const userId = decoded?.id;
    if (!userId) {
      throw new Error("Invalid user token");
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
exports.setToken = async (req, res, next) => {
  try {
    const { userToken, token } = req.body;
    if (!userToken || !token) {
      throw new Error("Please provide user details");
    }
    const userId = jwt.verify(userToken, process.env.JWT_SECRET);
    if (!userId) {
      throw new Error("Invalid user ");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    //update user token
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        token: token,
      },
    });
    res.send(200).json({
      success: true,
      message: "Token updated successfully",
    });
  } catch (err) {
    throw new Error(err);
  }
};
exports.removeToken = async (req, res, next) => {
  try {
    const { userToken } = req.body;
    if (!userToken) {
      throw new Error("Please provide user details");
    }
    const userId = jwt.verify(userToken, process.env.JWT_SECRET);
    if (!userId) {
      throw new Error("Invalid user ");
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    //update user token
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        token: null,
      },
    });
    res.send(200).json({
      success: true,
      message: "Token removed successfully",
    });
  } catch (err) {
    throw new Error(err);
  }
};
exports.addPatient = async (req, res, next) => {
  try {
    const { userToken, patientId } = req.body;
    if (!userToken || !patientId) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const caretakerId = decoded?.id;
    if (!caretakerId) {
      throw new Error("Invalid user token");
    }

    // Check if users exist
    const [caretaker, patient] = await Promise.all([
      prisma.user.findUnique({ where: { id: caretakerId } }),
      prisma.user.findUnique({ where: { id: patientId } }),
    ]);

    if (!caretaker || !patient) {
      throw new Error("User or Patient not found");
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
exports.addCaretaker = async (req, res, next) => {
  try {
    const { userToken, caretakerId } = req.body;
    if (!userToken || !caretakerId) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.id;
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
    const { userToken } = req.body;
    if (!userToken) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const caretakerId = decoded?.id;
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
exports.getCaretakers = async (req, res, next) => {
  try {
    const { userToken } = req.body;
    if (!userToken) {
      throw new Error("Please provide user details");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.id;
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
    const caretakerId = decoded?.id;
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
    res
      .status(200)
      .json({
        success: true,
        message: `Patient ${patient.name} removed successfully`,
      });
  } catch (error) {
    res.send(500).json({ success: false, message: error.message });
  }
};
exports.removeCaretaker = async (req, res, next) => {
  try {
    const { userToken, caretakerId } = req.body;
    if (!userToken || !caretakerId) {
      throw new Error("Please provide user details");
    }
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const patientId = decoded?.id;
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
    res
      .status(200)
      .json({
        success: true,
        message: `Caretaker ${caretaker.name} removed successfully`,
      });
  } catch (error) {
    res.send(500).json({ success: false, message: error.message });
  }
};
