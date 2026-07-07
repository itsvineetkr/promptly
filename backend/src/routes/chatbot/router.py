from fastapi import APIRouter, Response, Depends
import typesense
import pandas as pd

from src.database.mongo import allowed_origins_collection
from src.routes.chatbot.utils import extract_page_info, format_url
from src.routes.chatbot.models import chatbot_collection
from src.routes.chatbot.chatbot_collection import VectorCollection
from src.routes.chatbot.utils import get_chatbot_response
from src.routes.chatbot.models import QueryRequest
from src.routes.chatbot.constants import CHATBOT_SCRIPT, CHATBOT_SCRIPT_BLACK, INITIALIZATION_CODE
from src.auth.models import User
from src.auth.utils import get_current_active_user
from src.config import get_settings


settings = get_settings()
backend_url = settings.BACKEND_URL

router = APIRouter(responses={418: {"description": "Chatbot endpoints"}})
vector_collection = VectorCollection()

@router.post("/chatbot/scrape")
async def scrape(
    website_url: str,
    origin_url: str,
    max_depth: int = 3,
    max_urls: int = 30,
    current_user: User = Depends(get_current_active_user),
):
    """
    Initiates the scraping process for the given website URL.

    Args:
        website_url (str): The URL of the website to scrape.
        max_depth (int): The maximum depth of links to follow.
        max_urls (int): The maximum number of URLs to scrape.

    Returns:
        dict: A message indicating that scraping has been initiated.
    """

    user_id = current_user.id

    existing_origin = await allowed_origins_collection.find_one({"origin": origin_url})

    if not existing_origin:
        await allowed_origins_collection.insert_one(
            {"origin": origin_url, "user_id": user_id, "created_at": pd.Timestamp.now()}
        )

    try:
        content = await extract_page_info(
            start_url=website_url, max_depth=max_depth, max_urls=max_urls
        )
        if not content:
            return {"message": "No content extracted from the website."}

        print(content)

        response = await vector_collection.create_vector_db(
            urls_content=content, website_url=website_url, user_id=user_id
        )

        return response

    except Exception as e:
        return {"message": f"An error occurred while scraping the website. {e}"}


@router.get("/chatbot/websites")
async def list_scraped_websites(current_user: User = Depends(get_current_active_user)):
    """
    List the websites the current user has already scraped, along with the
    script tag for each, so previously generated chatbots can be reused.
    """
    user_id = current_user.id
    website_urls = await chatbot_collection.distinct("website_url", {"user_id": user_id})

    websites = []
    for website_url in website_urls:
        collection_name = f"{user_id}_chatbot_{format_url(website_url)}"
        websites.append(
            {
                "website_url": website_url,
                "collection_name": collection_name,
                "script_tag": f"<script src='https://promptlyback.vineetkr.me/api/v1/chatbot/BL/{collection_name}.js'></script>",
            }
        )

    return {"status": "success", "websites": websites}


@router.post("/chatbot/ask")
async def ask(
    request: QueryRequest,
):
    """
    Searches the vector database for the given query.

    Args:
        query (str): The query to search for.
        collection_name (str): The name of the collection to search in.

    Returns:
        dict: The search results.
    """
    conversation_history = request.conversation_history or []

    try:
        conversation_history.pop()
    except IndexError:
        pass

    try:
        similar_docs = await vector_collection.search_vector_db(
            request.query, request.collection_name, 2
        )
        chatbot_response = await get_chatbot_response(request.query, similar_docs, request.conversation_history)
        return {"query": request.query, "response": chatbot_response}

    except Exception as e:
        return {
            "message": f"An error occurred while searching the vector database. {e}"
        }


@router.get("/chatbot/{color}/{collection_name}.js")
async def get_chatbot_js_with_collection(collection_name: str, color: str):
    """
    Serve chatbot JavaScript with a specific collection name pre-configured.
    Args:
        collection_name (str): The name of the collection to be used in the chatbot script.
        color (str): The color theme for the chatbot (not used in this implementation).
    Returns:
        Response: A JavaScript file with the chatbot script customized for the given collection.

    Color could be:- (code : color)
        - "VI" : "violet"
        - "GR" : "green"
        - "RE" : "red"
        - "YE" : "yellow"
        - "BL" : "black"

    """
    customized_js = CHATBOT_SCRIPT.get(
        color, CHATBOT_SCRIPT_BLACK
    ) + INITIALIZATION_CODE.format(collection_name=collection_name, backend_url=backend_url)

    return Response(
        content=customized_js,
        media_type="application/javascript",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": f"inline; filename=chatbot-{collection_name}.js",
        },
    )
