CHATBOT_SCRIPT_BLACK = open("src/routes/chatbot/scripts/black.js", "r").read()
CHATBOT_SCRIPT_YELLOW = open("src/routes/chatbot/scripts/yellow.js", "r").read()
CHATBOT_SCRIPT_RED = open("src/routes/chatbot/scripts/red.js", "r").read()
CHATBOT_SCRIPT_GREEN = open("src/routes/chatbot/scripts/green.js", "r").read()
CHATBOT_SCRIPT_VIOLET = open("src/routes/chatbot/scripts/violet.js", "r").read()

CHATBOT_SCRIPT = {
    "BL": CHATBOT_SCRIPT_BLACK,
    "YE": CHATBOT_SCRIPT_YELLOW,
    "RE": CHATBOT_SCRIPT_RED,
    "GR": CHATBOT_SCRIPT_GREEN,
    "VI": CHATBOT_SCRIPT_VIOLET,
}

INITIALIZATION_CODE = """
    // Auto-initialize with default settings
    initializeChatbot(
        {{
            collectionName: '{collection_name}',
            apiUrl: '{backend_url}/api/v1/chatbot/ask',
            apiKey: null
        }}
    );

    // Export for manual initialization if needed
    if (typeof module !== 'undefined' && module.exports) {{
        module.exports = {{ ChatbotDOMGenerator, ChatbotAPI, initializeChatbot }};
    }}
    """
