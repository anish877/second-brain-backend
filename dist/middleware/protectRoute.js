"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectRoute = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const enviormentvariables_1 = require("../config/enviormentvariables");
const users_model_1 = __importDefault(require("../models/users.model"));
const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token)
            return res.status(401).json({ message: "User not authenticated" });
        const decoded = (jsonwebtoken_1.default.verify(token, enviormentvariables_1.JWT_SECRET));
        const user = await users_model_1.default.findById(decoded.userId).select("-password");
        req.user = user;
        next();
    }
    catch (error) {
        res.status(500);
    }
};
exports.protectRoute = protectRoute;
