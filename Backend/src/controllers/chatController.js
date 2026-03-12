import { spawnPython } from "../utils/spawnPython.js";

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Spawn python agent
        const result = await spawnPython("agents/chatbot.py", { message });

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        return res.status(200).json({ response: result.response });
    } catch (error) {
        console.error("Chatbot error:", error.message);
        res.status(500).json({ error: "Failed to process chat message" });
    }
};
