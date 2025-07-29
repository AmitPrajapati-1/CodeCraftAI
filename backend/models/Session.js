import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  role: String,
  content: String
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: String,
  name: String,
  chatHistory: [chatMessageSchema],
  jsx: String,
  css: String,
  editorState: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update the updatedAt field before updating
sessionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.model("Session", sessionSchema);