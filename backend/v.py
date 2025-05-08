from flask import Flask, request, jsonify
from flask_cors import CORS
from llama_cpp import Llama

app = Flask(__name__)
CORS(app)

# Load your LLaMA model
llm = Llama.from_pretrained(
    repo_id="TheBloke/Llama-2-7B-GGUF",
    filename="llama-2-7b.Q2_K.gguf",
)


@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json()
    domain = data.get("domain", "")
    feedback = data.get("feedback", "")

    prompt = f"""
    A user gave feedback in the domain: '{domain}'.
    Feedback: "{feedback}"
    Generate 5-6 follow-up questions to better understand the user's experience and improve the service.
    """

    response = llm(prompt, max_tokens=300, stop=["\n\n"])
    return jsonify({"questions": response["choices"][0]["text"].strip().split('\n')})
