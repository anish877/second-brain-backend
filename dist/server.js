"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const users_model_1 = __importDefault(require("./models/users.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const enviormentvariables_1 = require("./config/enviormentvariables");
const protectRoute_1 = require("./middleware/protectRoute");
const content_model_1 = __importDefault(require("./models/content.model"));
const crypto_1 = __importDefault(require("crypto"));
const links_model_1 = __importDefault(require("./models/links.model"));
const cors_1 = __importDefault(require("cors"));
const tag_model_1 = __importDefault(require("./models/tag.model"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const axios_1 = __importDefault(require("axios"));
const groq = new groq_sdk_1.default({
    apiKey: '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'
});
function generateMockId() {
    return Math.random().toString(36).substring(2, 12);
}
exports.app = (0, express_1.default)();
const port = 3000;
const MONGO_PASSWORD = "yVQU6ky9u31RVUk0";
const run = async () => {
    await mongoose_1.default.connect(`mongodb+srv://anishsuman2305:${MONGO_PASSWORD}@cluster0.0e8r4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
    console.log("Connected to myDB");
};
function isAllCharPresent(str) {
    let pattern = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[-+_!@#$%^&*.,?]).+$");
    if (pattern.test(str))
        return true;
    else
        return false;
}
run()
    .catch((err) => console.error(err));
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, cors_1.default)({
    origin: "https://second-brain-rosy.vercel.app",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
// Function to extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
};
// Function to extract Twitter tweet ID from URL
const getTweetId = (url) => {
    const matches = url.match(/x\.com\/\w+\/status\/(\d+)/);
    return matches ? matches[1] : null;
};
exports.app.post("/api/v1/content/metadata", protectRoute_1.protectRoute, async (req, res) => {
    const { link, type } = req.body;
    if (!link) {
        return res.status(400).json({ message: "Link is required" });
    }
    try {
        switch (type) {
            case 'youtube': {
                const videoId = getYoutubeVideoId(link);
                if (!videoId) {
                    return res.status(400).json({ message: "Invalid YouTube URL" });
                }
                // Using YouTube oEmbed endpoint to get video metadata
                const response = await axios_1.default.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
                return res.json({
                    title: response.data.title,
                    description: `Video by ${response.data.author_name}`,
                    tags: ['youtube', response.data.author_name.toLowerCase().replace(/\s+/g, '-')]
                });
            }
            case 'twitter': {
                console.log(link);
                const tweetId = getTweetId(link);
                if (!tweetId) {
                    return res.status(400).json({ message: "Invalid Twitter URL" });
                }
                console.log(tweetId);
                // Using Twitter oEmbed endpoint
                const response = await axios_1.default.get(`https://publish.twitter.com/oembed?url=${link}`);
                console.log(response);
                return res.json({
                    title: `Tweet by ${response.data.author_name}`,
                    description: response.data.html.replace(/<[^>]+>/g, ''), // Strip HTML tags
                    tags: ['twitter', response.data.author_name.toLowerCase().replace(/\s+/g, '-')]
                });
            }
            // case 'document': {
            //   // For Google Docs, we'll try to fetch the document title from meta tags
            //   const response = await axios.get(link);
            //   const $ = load(response.data);
            //   const title = $('title').text();
            //   return res.json({
            //     title: title || 'Google Document',
            //     description: 'Google Document',
            //     tags: ['document']
            //   });
            // }
            default:
                return res.status(400).json({ message: "Unsupported content type" });
        }
    }
    catch (error) {
        console.error('Metadata extraction error:', error);
        return res.status(500).json({
            message: "Failed to fetch content metadata",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.app.post("/api/v1/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!(username.length <= 10 && username.length >= 3))
            return res.status(411).json({ message: "Username should be between 3 to 10 characters" });
        const isPasswordValid = isAllCharPresent(password);
        if (!(password.length <= 20 && password.length >= 8 && isPasswordValid))
            return res.status(411).json({ message: "Password should have one uppercase one lowercase and one special character" });
        const user = await users_model_1.default.findOne({ username: username });
        if (user)
            return res.status(403).json({ message: "User already exists with this username" });
        const newUser = new users_model_1.default({
            username: username,
            password: password
        });
        await newUser.save();
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, enviormentvariables_1.JWT_SECRET);
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true, // Required for HTTPS
            sameSite: 'none', // Required for cross-origin requests
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        res.status(200).json({ message: "Signed up", user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.app.post("/api/v1/signin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = (await users_model_1.default.findOne({ username: username }));
        console.log(user);
        if (!user)
            return res.status(403).json({ message: "Wrong username" });
        if (user.password !== password)
            return res.status(403).json({ message: "Wrong password" });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, enviormentvariables_1.JWT_SECRET);
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ message: "Signed in", user });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.app.post("/api/v1/content", protectRoute_1.protectRoute, async (req, res) => {
    try {
        const { link, title, description, type, tags } = req.body;
        let tagsId = [];
        tagsId = await Promise.all(tags.map(async (item) => {
            let tag = await tag_model_1.default.findOne({ name: item });
            if (!tag) {
                tag = await tag_model_1.default.create({ name: item });
            }
            return tag._id;
        }));
        const response = await content_model_1.default.create({
            link,
            type,
            title,
            description,
            tags: tagsId,
            userId: req.user._id
        });
        if (!response)
            return res.status(400).json({ message: "Failed to add content" });
        res.status(200).json({ message: "Content added" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.app.get("/api/v1/content", protectRoute_1.protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const content = await content_model_1.default.find({
            userId
        })
            .populate("userId", "username")
            .populate("tags");
        res.status(200).json({ content });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.app.delete("/api/v1/content", protectRoute_1.protectRoute, async (req, res) => {
    const contentId = req.body.contentId;
    const userId = req.user._id;
    try {
        const response = await content_model_1.default.deleteOne({
            _id: contentId,
            userId
        });
        if (!response)
            return res.status(400).json({ message: "Failed to delete the content" });
        res.status(200).json({ message: "Content deleted" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.app.post("/api/v1/brain/share", protectRoute_1.protectRoute, async (req, res) => {
    const share = req.body.share;
    const userId = req.user._id;
    try {
        if (share === undefined)
            return res.status(400).json({ message: "Share or Delete not specified" });
        if (share === false) {
            const response = await links_model_1.default.deleteOne({
                userId
            });
            if (response.deletedCount === 0)
                return res.status(400).json({ message: "No active link found to delete" });
            return res.status(200).json({ message: "Link deleted successfully" });
        }
        let link;
        const existingLink = await links_model_1.default.findOne({
            userId
        });
        if (existingLink)
            link = `${existingLink.hash}`;
        else {
            const hash = crypto_1.default.createHash('sha1').update(userId.toString()).digest('hex');
            const response = await links_model_1.default.create({
                hash,
                userId
            });
            if (!response)
                return res.status(400).json({ message: "Failed to create link" });
            link = `${hash}`;
        }
        res.status(200).json({ link: link });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const { shareLink } = req.params;
    try {
        const response = await links_model_1.default.findOne({
            hash: shareLink
        });
        if (!response)
            return res.status(400).json({ message: "Invalid link" });
        const user = await users_model_1.default.findOne({
            _id: response.userId
        });
        const content = await content_model_1.default.find({
            userId: user?._id
        })
            .populate("userId", "username")
            .populate("tags");
        res.status(200).json({
            username: user?.username,
            content
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.app.post("/api/v1/ai/generate-content", async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    try {
        const { topic, contentType } = req.body;
        // // Analyze existing content patterns
        // const contentTypes = contentHistory?.reduce((acc, content) => {
        //   acc[content.type] = (acc[content.type] || 0) + 1;
        //   return acc;
        // }, {}) || {};
        // // Determine most common content type
        // const preferredPlatform = Object.entries(contentTypes)
        //   .sort((a, b) => b[1] - a[1])[0]?.[0] || 'article';
        const prompt = `You are a content creation assistant. Create a content suggestion based on the following information:
    
    Topic: ${topic}
    
    Provide only one creative and engaging content suggestion by choosing a valid ${contentType === "youtube" ? "video" : contentType === "twitter" ? "tweet" : "google docs"} link based on topic.
    Response must be in the following JSON format:
    {
      "type": "${contentType}",
      "title": "string",
      "link": "string ${contentType === "youtube" ? "valid link of a video from Youtube matching topic" : contentType === "twitter" ? "valid link of tweet from Twitter matching topic" : "valid link of Google Docs same as platform chosen"}",
      "description": "string (max 150 words)",
      "tags": ["array of strings"]
    }
    just give me this only this not anything else`;
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 500
        });
        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from AI');
        }
        // Extract JSON from response
        let suggestion;
        try {
            console.log(response);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                suggestion = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error('No valid JSON found in response');
            }
        }
        catch (parseError) {
            console.error('Parse error:', parseError);
            throw new Error('Failed to parse AI response as JSON');
        }
        // Validate required fields
        const requiredFields = ['type', 'title', 'description', 'tags', 'link'];
        for (const field of requiredFields) {
            if (!suggestion[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        console.log(suggestion);
        return res.status(200).json(suggestion);
    }
    catch (error) {
        console.error('AI Content Generation Error:', error);
        return res.status(500).json({
            message: 'Failed to generate content suggestion',
            //@ts-ignore
            error: error.message,
            //@ts-ignore
            details: error.stack
        });
    }
});
exports.app.listen(port, () => {
    console.log("Server started at port " + port);
});
function load(data) {
    throw new Error("Function not implemented.");
}
