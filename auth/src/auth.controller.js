const { loginSchema, registerSchema, validateDto } = require("./auth.dto");
const AuthService = require("./auth.service");

class AuthController {s
  async register(req, res, next) {
    try {
      const value = await validateDto(registerSchema, req.body);
      const { refreshToken, ...result } = await AuthService.register(value);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.cookie(refreshToken).status(201).json(result);
    } catch (error) {
      if (error.message === "Email zaten kullanımda") {
        return res.status(409).json({ message: error.message });
      }

      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = await validateDto(loginSchema, req.body);
      const { refreshToken, ...result } = await AuthService.login(email, password);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        next(new Error("Refresh tokena erişilemedi"));
      }

      const accessToken = await AuthService.refresh(refreshToken);

      return res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  }

  async getProfile(req, res, next) {
    res.json(req.user);
  }
}

module.exports = new AuthController();
