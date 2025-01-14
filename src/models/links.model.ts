import mongoose, { Schema, Types } from "mongoose";

const LinkSchema = new Schema({
    hash : {type:String, required: true, unique: true},
    userId : {type: Types.ObjectId, ref: "Users", required: true}
})

const Link = mongoose.model("Link",LinkSchema)

export default Link