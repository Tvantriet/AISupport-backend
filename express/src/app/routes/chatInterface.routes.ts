import { Router } from "express";
import ChatInterfaceController from "../controllers/ChatInterfaceController.js";
import { IRoute } from "../../interfaces/IRouter.js";

export default class ChatInterfaceRoutes implements IRoute {
    public getRoutes(): Router {
        const router = Router();
        const controller = new ChatInterfaceController();

        // Process a user request with document search and chatbot response
        router.post("/process", controller.processUserRequest.bind(controller));
        
        // Add this to your existing routes
        router.get("/test", (req, res) => {
            res.send(`
                <html>
                <head>
                    <title>Chat API Test</title>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            document.getElementById('sendButton').addEventListener('click', sendRequest);
                            
                            async function sendRequest() {
                                const query = document.getElementById('query').value;
                                const productName = document.getElementById('productName').value;
                                
                                try {
                                    const response = await fetch('/api/chat/process', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            query,
                                            productName,
                                            conversationHistory: []
                                        })
                                    });
                                    
                                    const result = await response.json();
                                    document.getElementById('result').textContent = JSON.stringify(result, null, 2);
                                } catch (error) {
                                    document.getElementById('result').textContent = 'Error: ' + error.message;
                                }
                            }
                        });
                    </script>
                </head>
                <body>
                    <h1>Test Chat API</h1>
                    <div>
                        <label for="query">Query:</label>
                        <input type="text" id="query" value="How do I use this product?">
                    </div>
                    <div>
                        <label for="productName">Product Name:</label>
                        <input type="text" id="productName" value="your-collection-name">
                    </div>
                    <button id="sendButton">Send Request</button>
                    <pre id="result"></pre>
                </body>
                </html>
            `);
        });
        
        return router;
    }
}
