import aiohttp
import asyncio
from langchain_community.document_loaders import PyPDFLoader
from pathlib import Path
from io import BytesIO
from playwright.async_api import async_playwright
import re
import requests
import google.generativeai as genai
from src.config import get_settings


settings = get_settings()

GEMINI_API_KEY = settings.GEMINI_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

# from src.routes.chatbot.image import ImageCaptioning
# image_captioning = ImageCaptioning()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://google.com",
}


def format_url(website_url):
    website_url_formatted = (
        website_url.replace("https://", "")
        .replace("http://", "")
        .replace("/", "_")
        .replace(".", "_")
    )
    for i in website_url_formatted:
        if not i.isalnum() and i != "_":
            website_url_formatted = website_url_formatted.replace(i, "_")

    return website_url_formatted


def fetch(url):
    """
    Fetches the content of a web page.

    Args:
        url (str): The URL of the web page to fetch.

    Returns:
        str: The HTML content of the web page.
    """
    response = requests.get(url)
    content_type = response.headers.get("Content-Type", "")
    if response.status_code != 200:
        raise Exception(f"Failed to fetch page: {response.status_code}")
    return response.text, content_type


def remove_style_tags(text):
    """
    Removes style tags from the given text.

    Args:
        text (str): The input text containing style tags.

    Returns:
        str: The text with style tags removed.
    """
    return re.sub(r"<style.*?>.*?</style>", "", text, flags=re.DOTALL)


def extract_links(text):
    """
    Extracts all links from the given text.

    Args:
        text (str): The input text containing links.

    Returns:
        list: A list of extracted links.
    """
    return re.findall(r'href=["\'](https?://[^"\']+)["\']', text)


def remove_script_tags(text):
    """
    Removes script tags from the given text.

    Args:
        text (str): The input text containing script tags.

    Returns:
        str: The text with script tags removed.
    """
    return re.sub(r"<script.*?>.*?</script>", "", text, flags=re.DOTALL)


def remove_html_tags(text):
    """
    Removes HTML tags from the given text.

    Args:
        text (str): The input text containing HTML tags.

    Returns:
        str: The text with HTML tags removed.
    """
    return re.sub(r"<[^>]+>", "", text)  # Remove all HTML tags


def remove_path_and_svg_tags(text):
    """
    Removes path and svg tags from the given text.

    Args:
        text (str): The input text containing path and svg tags.

    Returns:
        str: The text with path and svg tags removed.
    """
    return re.sub(r"<(path|svg)[^>]*>.*?</\1>", "", text, flags=re.DOTALL)


def remove_line_breaks(text):
    """
    Removes line breaks from the given text.

    Args:
        text (str): The input text containing line breaks.

    Returns:
        str: The text with line breaks removed.
    """
    return re.sub(r"\n+", " ", text)  # Replace multiple newlines with a single space


def clean_web_content(text):
    """
    Cleans the web content text by removing unnecessary tags and formatting.

    Args:
        text (str): The input text to clean.

    Returns:
        str: The cleaned text.
    """
    text = remove_style_tags(text)
    text = remove_script_tags(text)
    text = remove_path_and_svg_tags(text)
    text = remove_html_tags(text)
    text = remove_line_breaks(text)
    return text


def get_information(text):
    prompt = f"""
    You are a helpful assistant. Given the following text extracted from a website, now you extract the relevant information in a structured and summarize it in a concise manner.
    Don't use any markdown or HTML formatting, just plain text with line breaks.
    Don't use ** for specifying headings or any other formatting.
    Here is the text:
    {text}
    """
    response = genai.GenerativeModel("gemini-2.5-flash").generate_content(prompt)
    return response.text if response else "No information extracted."


async def fetch_content(url, session, use_browser=True):
    try:
        if use_browser:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle")
                html = await page.content()
                await browser.close()
                return html, "text/html"
        else:
            async with session.get(url, headers=HEADERS, timeout=15) as response:
                content_type = response.headers.get("Content-Type", "")
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                if content_type.startswith("text/"):
                    content = await response.text()
                else:
                    content = await response.read()
                return content, content_type
    except Exception as e:
        raise Exception(f"[Fetch Error] {url}: {e}")


async def extract_page_info(start_url, max_depth=2, max_urls=30):
    visited = set()
    urls_content = {}
    sem = asyncio.Semaphore(5)

    async with aiohttp.ClientSession() as session:

        async def process_url(url, depth):
            nonlocal visited, urls_content

            if url in visited or depth >= max_depth:
                return
            visited.add(url)

            if len(urls_content) >= max_urls:
                return

            try:
                async with sem:
                    # Use JS-rendering for initial HTML pages only
                    # use_browser = url == start_url or url.endswith("/")
                    content, content_type = await fetch_content(
                        url, session, use_browser=True
                    )
            except Exception as e:
                print(e)
                return

            print(f"[Depth {depth}] Processing: {url} ({content_type})")

            if content_type.startswith("text/html"):
                cleaned_text = clean_web_content(content)
                processed_text = get_information(cleaned_text)
                urls_content[url] = processed_text

                links = extract_links(content)
                for link in links:
                    # https://example.com/page = ["https:", "", "example.com", "page"]
                    if link.split("/")[2] == start_url.split("/")[2]:  # same domain
                        await process_url(link, depth + 1)

            # elif content_type.startswith("image"):
            #     try:
            #         caption = await image_captioning.generate_caption(url, session)
            #         urls_content[url] = f"Image Caption: {caption}"
            #     except Exception as e:
            #         print(f"Image caption failed: {e}")

            elif content_type.startswith("application/pdf"):
                try:
                    loader = PyPDFLoader(BytesIO(content))
                    docs = loader.load()
                    urls_content[url] = "\n".join(doc.page_content for doc in docs)
                except Exception as e:
                    print(f"PDF processing failed: {e}")

            elif content_type.startswith("text/plain"):
                urls_content[url] = content

        await process_url(start_url, 0)

    return urls_content


async def get_chatbot_response(query, similar_docs, conversation_history=[]):
    """
    Generates a response for the chatbot based on the query and similar documents.

    Args:
        query (str): The user's query.
        similar_docs (list): List of similar documents to use for context.

    Returns:
        str: The generated response.
    """
    prompt = f"""
    You are a helpful chatbot. Given the user's query, some relevant documents and conversation history, generate a concise and informative response.
    You should not give response like a markdown or HTML format, just plain text. Make sure to not use ** for specifying headings or any other formatting.
    If there is something that is to be written in points, use numbering like 1, 2, 3.
    As you are representing a chatbot in a web application make sure what you respond to query, make sure not to reveal any internal information or system details.
    
    Important: If you find some url which may be helpful for the user, you can include it in your response, and to incude url and links use html tag <a href="url">link text</a> as your response will be rendered in a web application.

    {("Conversation History:", conversation_history) if conversation_history else ""}

    User Query: {query}
    
    Relevant Documents:
    {similar_docs}
    
    Generate a response based on the above information.
    """

    response = await genai.GenerativeModel("gemini-2.5-flash").generate_content_async(
        prompt
    )
    return response.text if response else "No response generated."


def format_dict_to_url_content_string(data_dict):
    """
    Converts dictionary with 'hits' containing documents to URL: Content format
    """
    result_strings = []

    hits = data_dict.get("hits", [])

    for hit in hits:
        document = hit.get("document", {})
        url = document.get("url", "No URL")
        content = document.get("content", "No Content")
        formatted_string = f"{url}: {content}"
        result_strings.append(formatted_string)

    return "\n\n".join(result_strings)
