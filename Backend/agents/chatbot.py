import sys
import json
from llm_client import ask_model

def main():


    if not sys.stdin.isatty():
        try:
            input_data = sys.stdin.read()
            if not input_data:
                print(json.dumps({"error": "No input provided"}))
                sys.exit(1)
                
            parsed = json.loads(input_data)
            user_input = parsed.get("message", "")
            
            if not user_input:
                print(json.dumps({"error": "Message is empty"}))
                sys.exit(1)

            response = ask_model(user_input)
            print(json.dumps({"response": response}))
            return
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
            
    # Interactive CLI Mode
    print("Welcome Ask me ! Type 'exit' to quit.")
    chat_history = []
    
    while True:
        try:
            user_input = input("You: ")
        except EOFError:
            break
            
        chat_history.append(user_input)
        
        if user_input.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break

        response = ask_model(user_input)
        chat_history.append(response)
        print("Bot:", response)

if __name__ == "__main__":
    main()
