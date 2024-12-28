document.addEventListener("DOMContentLoaded", () => {
    // Append chatbot UI container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    // eslint-disable-next-line max-len
    chatbotContainer.classList.add("fixed", "bottom-4", "right-4", "flex", "flex-col", "items-end", "z-50");
    document.body.appendChild(chatbotContainer);

    // Add closed chat button
    const chatButton = document.createElement("button");
    chatButton.id = "chatbot-button";
    chatButton.textContent = "Chat";
    chatButton.classList.add(
        "bg-blue-600",
        "text-white",
        "px-4",
        "py-2",
        "rounded-full",
        "shadow-lg",
        "hover:bg-blue-500",
        "transition-all"
    );
    chatbotContainer.appendChild(chatButton);

    // Add chat room container (hidden by default)
    const chatRoom = document.createElement("div");
    chatRoom.id = "chatbot-room";
    chatRoom.classList.add(
        "hidden",
        "bg-white",
        "w-80",
        "h-96",
        "shadow-lg",
        "rounded-lg",
        "flex",
        "flex-col"
    );
    chatbotContainer.appendChild(chatRoom);

    // Add chat header
    const chatHeader = document.createElement("div");
    // eslint-disable-next-line max-len
    chatHeader.classList.add("bg-blue-600", "text-white", "p-3", "rounded-t-lg", "text-center");
    chatHeader.textContent = "Chatbot";
    chatRoom.appendChild(chatHeader);

    // Add chat messages area
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "chatbot-messages";
    messagesContainer.classList.add("flex-grow", "p-3", "overflow-y-auto");
    chatRoom.appendChild(messagesContainer);

    // Add chat input area
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("p-3", "border-t");

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.id = "chatbot-input";
    inputField.placeholder = "Type a message...";
    inputField.classList.add(
        "w-full",
        "border",
        "rounded-lg",
        "p-2",
        "outline-none",
        "focus:ring",
        "focus:ring-blue-400"
    );

    inputContainer.appendChild(inputField);
    chatRoom.appendChild(inputContainer);

    // Toggle chat UI on button click
    chatButton.addEventListener("click", () => {
        const isChatOpen = !chatRoom.classList.contains("hidden");
        if (isChatOpen) {
            chatRoom.classList.add("hidden");
            chatButton.classList.remove("mb-2")
            chatButton.textContent = "Chat";
        } else {
            chatRoom.classList.remove("hidden");
            chatButton.classList.add("mb-2")
            chatButton.textContent = "Close";
        }
    });

    const messages = []
    let threadId = ""
    async function fetchResponse(userMessage) {
        const placeholder = document.createElement("div");
        placeholder.classList.add("text-left", "my-2");
        placeholder.innerHTML = `
            <div class="inline-block bg-gray-100 text-gray-800 rounded-lg px-3 py-2">Formulating response...</div>
        `;
        messagesContainer.appendChild(placeholder);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        try {
            // eslint-disable-next-line max-len, no-undef
            const response = await fetch("https://dxke40ek7f.execute-api.us-east-1.amazonaws.com/prod/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    thread_id: threadId,
                    content: userMessage
                })
            });

            const data = await response.json();
            threadId = data.threadId
            const botMessage = {
                agent: "BOT",
                message: data.content,
                time: new Date().toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                })
            };
            messages.push(botMessage);

            // Add bot message to chat window
            const messageElement = document.createElement("div");
            messageElement.classList.add("text-left", "my-2");
            messageElement.innerHTML = `
                <div class="inline-block bg-gray-100 text-gray-800 rounded-lg px-3 py-2">${botMessage.message}</div>
                <div class="text-xs text-gray-500 mt-1">${botMessage.time}</div>
            `;
            messagesContainer.removeChild(placeholder)
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            messagesContainer.removeChild(placeholder)
            const botMessage = {
                agent: "BOT",
                message: "Sorry, I'm having trouble responding at the moment.",
                time: new Date().toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                })
            };
            messages.push(botMessage);
            const errorMessage = document.createElement("div");
            errorMessage.classList.add("text-left", "my-2");
            errorMessage.innerHTML = `
                <div class="text-xs text-gray-500 mt-1">${botMessage.time}</div>
                <div class="inline-block bg-gray-100 text-gray-800 rounded-lg px-3 py-2">${botMessage.message}</div>
            `;
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.error("Error fetching response:", error);
        } finally {
            inputField.disabled = false;
            inputField.placeholder = "Type a message...";
        }
    }

    inputField.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && inputField.value.trim() !== "") {
            const message = inputField.value.trim();
            const timestamp = new Date().toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

            const messageData = {
                agent: "USER",
                message,
                time: timestamp
            };

            messages.push(messageData);

            // Add message to chat window
            const messageElement = document.createElement("div");
            messageElement.classList.add("text-right", "my-2");
            messageElement.innerHTML = `
                <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
                <div class="inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-2">${message}</div>
            `;

            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            inputField.value = "";
            inputField.disabled = true
            fetchResponse(message);
        }
    });
});
