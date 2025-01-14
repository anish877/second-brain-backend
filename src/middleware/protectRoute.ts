import { NextFunction, Request, Response } from "express-serve-static-core"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config/enviormentvariables"
import Users from "../models/users.model"
import { JwtPayload } from "jsonwebtoken"

interface RequestWithUser extends Request {
    user?: any
}

export const protectRoute = async (req : RequestWithUser,res : Response, next: NextFunction)=>{
    try {
        const token = req.cookies.jwt
        if(!token)
            return res.status(401).json({message: "User not authenticated"})
        const decoded = (jwt.verify(token,JWT_SECRET)) as JwtPayload
        const user = await Users.findById(decoded.userId).select("-password")
        req.user = user
        next()
    } catch (error) {
        res.status(500)
    }
}