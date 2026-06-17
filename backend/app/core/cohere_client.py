import os
import cohere
from dotenv import load_dotenv

load_dotenv()

co = cohere.ClientV2(
    api_key=os.getenv("COHERE_API_KEY")
)