import mongoose, { ObjectId, Schema } from "mongoose"

export interface User {
    _id : ObjectId
    username: string
    password: string
}

const userSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

const Users = mongoose.model("Users", userSchema)

export default Users

