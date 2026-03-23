from langchain.text_splitter import RecursiveCharacterTextSplitter
from src.routes.chatbot.utils import format_url, format_dict_to_url_content_string
from src.routes.chatbot.models import chatbot_collection
import uuid
import typesense
import pandas as pd
import requests

from src.config import get_settings


settings = get_settings()

TYPESENSE_API_KEY = settings.TYPESENSE_API_KEY
TYPESENSE_HOST = settings.TYPESENSE_HOST
TYPESENSE_PORT = settings.TYPESENSE_PORT
TYPESENSE_PROTOCOL = settings.TYPESENSE_PROTOCOL
TYPESENSE_HOST_MULTISEARCH = f"https://{TYPESENSE_HOST}/search/multi_search"

headers = {"X-TYPESENSE-API-KEY": TYPESENSE_API_KEY}
client = typesense.Client(
    {
        "nodes": [
            {"host": TYPESENSE_HOST, "port": TYPESENSE_PORT, "protocol": TYPESENSE_PROTOCOL}
        ],
        "api_key": TYPESENSE_API_KEY,
        "connection_timeout_seconds": 1000,
    }
)


class VectorCollection:
    def __init__(self):
        pass

    async def create_vector_db(
        self, urls_content: dict, website_url: str, user_id: str
    ):
        json_data = []
        for url, content in urls_content.items():
            json_data.append(
                {
                    "id": str(uuid.uuid4()),
                    "url": url,
                    "content": content,
                    "website_url": website_url,
                    "user_id": user_id,
                }
            )

        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

        chunks = []
        for item in json_data:
            if "content" in item:
                split_chunks = splitter.split_text(item["content"])
                for i, chunk in enumerate(split_chunks):
                    chunks.append(
                        {
                            "id": (
                                f"{item['id']}_{i}"
                                if len(split_chunks) > 1
                                else item["id"]
                            ),
                            "url": item["url"],
                            "content": chunk,
                            "website_url": item["website_url"],
                            "user_id": item["user_id"],
                        }
                    )

        if not chunks:
            return {"message": "No content to index."}

        website_url_formatted = format_url(website_url)
        collection_name = f"{user_id}_chatbot_{website_url_formatted}"

        try:
            collections = client.collections.retrieve()
            collection_names = [collection["name"] for collection in collections]
            if collection_name in collection_names:
                client.collections[collection_name].delete()

            client.collections.create(
                {
                    "name": collection_name,
                    "fields": [
                        {"name": "id", "type": "string", "facet": False},
                        {"name": "url", "type": "string", "facet": False},
                        {"name": "content", "type": "string", "facet": False},
                        {"name": "website_url", "type": "string", "facet": False},
                        {"name": "user_id", "type": "string", "facet": False},
                        {
                            "name": "embedding",
                            "type": "float[]",
                            "embed": {
                                "from": ["url", "content"],
                                "model_config": {"model_name": "ts/all-MiniLM-L12-v2"},
                            },
                        },
                    ],
                }
            )

            df = pd.DataFrame(chunks)
            jsonl_data = df.to_json(orient="records", lines=True)
            jsonl_data = jsonl_data.encode("utf-8")

            try:
                typesense_response = client.collections[
                    collection_name
                ].documents.import_(jsonl_data, {"action": "upsert"})
            except Exception as e:
                return {"status": "error", "response": str(e)}

        except Exception as e:
            return {"status": "error", "response": str(e)}

        try:
            existing_docs = await chatbot_collection.find(
                {"website_url": website_url, "user_id": user_id}
            ).to_list()

            if existing_docs:
                for doc in existing_docs:
                    await chatbot_collection.delete_one({"_id": doc["_id"]})

            await chatbot_collection.insert_many(chunks)

        except Exception as e:
            return {"status": "error", "response": str(e)}

        content = ""
        for url, text in urls_content.items():
            content += f"{url}: {text}\n"

        return {
            "status": "success",
            "scrapped_content": content,
            "script_tag": f"<script src='http://127.0.0.1:8000/api/v1/chatbot/BL/{collection_name}.js'></script>",
        }

    async def search_vector_db(self, query: str, collction_name: str, k: int = 5):
        search = {
            "searches": [
                {
                    "q": query,
                    "query_by": "embedding",
                    "collection": collction_name,
                    "prefix": "false",
                    "exclude_fields": "embedding",
                    "per_page": k,
                }
            ]
        }

        response = requests.post(TYPESENSE_HOST_MULTISEARCH, json=search, headers=headers)
        response_data = response.json()
        inner_response = response_data.get("results", {})

        if isinstance(inner_response, list) and len(inner_response) > 0:
            inner_response = inner_response[0]

        try:
            return format_dict_to_url_content_string(inner_response)
        except Exception as e:
            return "No content related to the query found."
