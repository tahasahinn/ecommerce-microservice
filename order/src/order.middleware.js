const jwt = require("jsonwebtoken");

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Bu route'a erişme yetkiniz yok" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.log(err);
    return res.status(401).json({ message: "Bu route'a erişme yetkiniz yok" });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Erişim reddedildi. Sadece admin." });
  }
};
