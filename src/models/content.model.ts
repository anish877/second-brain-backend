import mongoose, { Schema, Types } from "mongoose";

const contentTypes = ['youtube','twitter','document']; // Extend as needed

const contentSchema = new Schema({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: Types.ObjectId, ref: 'Tag' }],
  userId: { type: Types.ObjectId, ref: 'Users', required: true },
  description: {type: String}
});

const Content = mongoose.model("Content",contentSchema)

export default Content
