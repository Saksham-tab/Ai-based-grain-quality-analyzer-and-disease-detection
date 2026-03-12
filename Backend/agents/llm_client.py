import os
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain.schema import HumanMessage, SystemMessage
from dotenv import load_dotenv

# Load .env from the agents directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def get_model():
    api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not api_token:
        raise ValueError("HUGGINGFACEHUB_API_TOKEN is not set in environment variables")

    endpoint = HuggingFaceEndpoint(
        repo_id="meta-llama/Llama-3.2-3B-Instruct",
        task="text-generation",
        huggingfacehub_api_token=api_token,
        temperature=0.7,
        max_new_tokens=512,
    )

    llm = ChatHuggingFace(llm=endpoint)
    return llm


def ask_model(prompt: str):
    model = get_model()

    messages = [
        SystemMessage(content=(
            """
Tum ek experienced wheat grain quality advisor ho.

User question:
{user_input}

Seedha simple jawab do.
Short aur natural Hinglish me reply karo.
Bullet points mat use karo.
Sirf wheat grain quality, storage, grading ya machine se related jawab do.
Agar sawaal unrelated ho to politely mana karo.
"""
        )),
        HumanMessage(content=prompt)
    ]

    response = model.invoke(messages)
    return response.content


if __name__ == "__main__":
    print("Grain Quality Analyzer AI\nType 'exit' to quit.")
    
    while True:
        user_input = input("You: ")
        
        if user_input.lower() == "exit":
            break
        
        response = ask_model(user_input)
        print(f"\nAnalysis Report:\n{response}\n")
