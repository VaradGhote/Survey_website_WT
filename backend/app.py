from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from nrclex import NRCLex
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import io
from bson import ObjectId
from llama_cpp import Llama
import logging
import os
import pathlib
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# MongoDB connection
try:
    MONGO_URI = os.getenv('MONGO_URI')
    client = MongoClient(MONGO_URI)
    db = client["survey_db"]
    responses_collection = db["responses"]
    questions_collection = db["questions"]
    answers_collection = db["answers"]
    surveys_collection = db["surveys"]
    logger.info("Successfully connected to MongoDB")
except ConnectionFailure as e:
    logger.error(f"MongoDB connection failed: {str(e)}")
    raise Exception(f"MongoDB connection failed: {str(e)}")
except Exception as e:
    logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
    raise Exception(f"Unexpected error connecting to MongoDB: {str(e)}")

vader_analyzer = SentimentIntensityAnalyzer()


llm = Llama.from_pretrained(
    repo_id="TheBloke/Llama-2-7B-GGUF",
    filename="llama-2-7b.Q2_K.gguf",
)

# [Rest of the routes remain unchanged]
@app.route("/api/create-survey", methods=["POST"])
def create_survey():
    try:
        data = request.get_json()
        survey_data = {
            "title": data.get("title"),
            "created_at": datetime.utcnow()
        }
        result = surveys_collection.insert_one(survey_data)
        logger.info(f"Survey created with ID: {result.inserted_id}")
        return jsonify({"survey_id": str(result.inserted_id), "message": "Survey created successfully"})
    except Exception as e:
        logger.error(f"Error creating survey: {str(e)}")
        return jsonify({"error": f"Error creating survey: {str(e)}"}), 500

@app.route("/api/surveys", methods=["GET"])
def get_surveys():
    try:
        surveys = list(surveys_collection.find())
        for survey in surveys:
            survey["_id"] = str(survey["_id"])
            survey["created_at"] = survey["created_at"].isoformat()
        logger.info(f"Retrieved {len(surveys)} surveys")
        return jsonify(surveys)
    except Exception as e:
        logger.error(f"Error fetching surveys: {str(e)}")
        return jsonify({"error": f"Error fetching surveys: {str(e)}"}), 500

@app.route("/submit-response", methods=["POST"])
def submit_response():
    try:
        data = request.get_json()
        logger.info(f"Submitting response: {data}")
        textblob_sentiment = TextBlob(data["feedback"]).sentiment.polarity
        vader_scores = vader_analyzer.polarity_scores(data["feedback"])
        emotion = NRCLex(data["feedback"]).affect_frequencies

        response_data = {
            "name": data["name"],
            "age": data["age"],
            "feedback": data["feedback"],
            "rating": data["rating"],
            "userType": data["userType"],
            "survey_id": data.get("survey_id"),
            "sentiment": vader_scores["compound"],
            "emotion": emotion,
        }
        result = responses_collection.insert_one(response_data)
        logger.info(f"Response inserted with ID: {result.inserted_id}")
        return jsonify({
            "message": "Response submitted successfully",
            "sentiment": vader_scores["compound"],
            "response_id": str(result.inserted_id)
        })
    except Exception as e:
        logger.error(f"Error submitting response: {str(e)}")
        return jsonify({"error": f"Error submitting response:  {str(e)}"}), 500

@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    try:
        data = request.get_json()
        domain = data.get("domain", "")
        feedback = data.get("feedback", "")
        survey_id = data.get("survey_id", "")
        response_id = data.get("response_id", "")

        prompt = f"""
        A user gave feedback in the domain: '{domain}'.
        Feedback: "{feedback}"
        Generate 5-6 follow-up questions to better understand the user's experience and improve the service.
        Format as a numbered list (e.g., 1. Question text).
        """

        logger.info(f"Generating questions for domain: {domain}, feedback: {feedback}")
        response = llm.create_completion(
            prompt=prompt,
            max_tokens=300,
            stop=["\n\n"],
            temperature=0.7
        )
        generated_text = response["choices"][0]["text"].strip()
        questions = [{"id": str(ObjectId()), "question": q.strip("123456. ").strip()} for q in generated_text.split("\n") if q.strip()]

        # Store questions in MongoDB
        question_docs = [
            {
                "survey_id": survey_id,
                "response_id": response_id,
                "domain": domain,
                "question": q["question"],
                "created_at": datetime.utcnow()
            }
            for q in questions
        ]
        if question_docs:
            result = questions_collection.insert_many(question_docs)
            for q, inserted_id in zip(questions, result.inserted_ids):
                q["id"] = str(inserted_id)
        logger.info(f"Stored {len(question_docs)} questions in MongoDB")
        return jsonify({"questions": questions})
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        return jsonify({"error": f"Error generating questions: {str(e)}"}), 500

@app.route("/submit-answer", methods=["POST"])
def submit_answer():
    try:
        data = request.get_json()
        answer = data.get("answer", "")
        question_id = data.get("question_id", "")
        response_id = data.get("response_id", "")

        vader_scores = vader_analyzer.polarity_scores(answer)
        answer_data = {
            "question_id": question_id,
            "response_id": response_id,
            "answer": answer,
            "sentiment": vader_scores["compound"],
            "timestamp": datetime.utcnow()
        }
        result = answers_collection.insert_one(answer_data)
        logger.info(f"Answer inserted with ID: {result.inserted_id}")
        return jsonify({
            "message": "Answer submitted successfully",
            "sentiment": vader_scores["compound"]
        })
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        return jsonify({"error": f"Error submitting answer: {str(e)}"}), 500

@app.route("/analyze", methods=["POST"])
def analyze_feedback():
    try:
        data = request.get_json()
        text = data.get("feedback", "")
        vader_scores = vader_analyzer.polarity_scores(text)
        sentiment_score = vader_scores["compound"]
        sentiment = "positive" if sentiment_score >= 0.05 else "negative" if sentiment_score <= -0.05 else "neutral"
        logger.info(f"Feedback sentiment: {sentiment}")
        return jsonify({"sentiment": sentiment, "polarity": sentiment_score})
    except Exception as e:
        logger.error(f"Error analyzing feedback: {str(e)}")
        return jsonify({"error": f"Error analyzing feedback: {str(e)}"}), 500

@app.route("/analytics", methods=["GET"])
def analytics():
    try:
        responses = list(responses_collection.find())
        answers = list(answers_collection.find())
        if not responses:
            logger.warning("No responses found for analytics")
            return jsonify({"error": "No data available"}), 404

        df = pd.DataFrame(responses)
        total_responses = len(responses)
        avg_age = df["age"].mean()
        avg_rating = df["rating"].mean()
        avg_sentiment = df["sentiment"].mean()
        recent_feedbacks = df["feedback"].tail(10).tolist()

        age_bins = [0, 20, 30, 40, 50, 100]
        age_labels = ['0-20', '21-30', '31-40', '41-50', '51+']
        age_distribution = pd.cut(df["age"], bins=age_bins, labels=age_labels, include_lowest=True)
        age_counts = age_distribution.value_counts().reindex(age_labels, fill_value=0).tolist()

        user_type_counts = df["userType"].value_counts().reindex(["Student", "Professional", "Other"], fill_value=0).tolist()

        df["sentiment_label"] = df["sentiment"].apply(lambda x: "positive" if x >= 0.05 else ("negative" if x <= -0.05 else "neutral"))
        sentiment_counts = df["sentiment_label"].value_counts().reindex(["positive", "neutral", "negative"], fill_value=0).tolist()

        answer_df = pd.DataFrame(answers)
        question_stats = answer_df.groupby("question_id").agg({
            "answer": "count",
            "sentiment": "mean"
        }).reset_index()
        question_stats = [
            {
                "question_id": str(row["question_id"]),
                "response_count": row["answer"],
                "avg_sentiment": round(row["sentiment"], 2) if not pd.isna(row["sentiment"]) else 0
            }
            for _, row in question_stats.iterrows()
        ]

        analytics_data = {
            "total_responses": total_responses,
            "average_age": round(avg_age, 2) if not pd.isna(avg_age) else 0,
            "average_rating": round(avg_rating, 2) if not pd.isna(avg_rating) else 0,
            "average_sentiment": round(avg_sentiment, 2) if not pd.isna(avg_sentiment) else 0,
            "all_feedbacks": recent_feedbacks,
            "age_distribution": age_counts,
            "user_type_distribution": user_type_counts,
            "sentiment_distribution": sentiment_counts,
            "question_stats": question_stats
        }
        logger.info("Analytics data prepared")
        return jsonify(analytics_data)
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        return jsonify({"error": f"Error fetching analytics: {str(e)}"}), 500

@app.route("/chart", methods=["GET"])
def get_chart():
    try:
        responses = list(responses_collection.find())
        if not responses:
            logger.warning("No responses found for chart")
            return jsonify({"error": "No data available"}), 404

        df = pd.DataFrame(responses)
        age_bins = [0, 20, 30, 40, 50, 100]
        age_labels = ['0-20', '21-30', '31-40', '41-50', '51+']
        age_distribution = pd.cut(df["age"], bins=age_bins, labels=age_labels, include_lowest=True)
        age_counts = age_distribution.value_counts().reindex(age_labels, fill_value=0)

        plt.figure(figsize=(6, 4))
        age_counts.plot(kind='bar', color='teal')
        plt.title("Age Distribution")
        plt.xlabel("Age Group")
        plt.ylabel("Count")

        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        plt.close()

        logger.info("Chart generated successfully")
        return buf.getvalue(), 200, {'Content-Type': 'image/png'}
    except Exception as e:
        logger.error(f"Error generating chart: {str(e)}")
        return jsonify({"error": f"Error generating chart: {str(e)}"}), 500

@app.route("/export-csv", methods=["GET"])
def export_csv():
    try:
        responses = list(responses_collection.find())
        if not responses:
            logger.warning("No responses found for CSV export")
            return jsonify({"error": "No data available"}), 404

        df = pd.DataFrame(responses)
        df = df.drop(columns=["_id"])
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        logger.info("CSV exported successfully")
        return csv_buffer.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=survey_responses.csv'
        }
    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        return jsonify({"error": f"Error exporting CSV: {str(e)}"}), 500

@app.route("/responses", methods=["GET"])
def get_responses():
    try:
        responses = list(responses_collection.find())
        if not responses:
            logger.info("No responses found")
            return jsonify([])

        for response in responses:
            response["_id"] = str(response["_id"])
            if response.get("survey_id"):
                response["survey_id"] = str(response["survey_id"])
        logger.info(f"Retrieved {len(responses)} responses")
        return jsonify(responses)
    except Exception as e:
        logger.error(f"Error fetching responses: {str(e)}")
        return jsonify({"error": f"Error fetching responses: {str(e)}"}), 500

@app.route("/questions", methods=["GET"])
def get_questions():
    try:
        survey_id = request.args.get("survey_id")
        query = {"survey_id": survey_id} if survey_id else {}
        questions = list(questions_collection.find(query))
        if not questions:
            logger.info("No questions found")
            return jsonify([])

        for q in questions:
            q["_id"] = str(q["_id"])
            q["created_at"] = q["created_at"].isoformat()
            if q.get("survey_id"):
                q["survey_id"] = str(q["survey_id"])
            if q.get("response_id"):
                q["response_id"] = str(q["response_id"])
        logger.info(f"Retrieved {len(questions)} questions")
        return jsonify(questions)
    except Exception as e:
        logger.error(f"Error fetching questions: {str(e)}")
        return jsonify({"error": f"Error fetching questions: {str(e)}"}), 500

@app.route("/answers", methods=["GET"])
def get_answers():
    try:
        response_id = request.args.get("response_id")
        query = {"response_id": response_id} if response_id else {}
        answers = list(answers_collection.find(query))
        if not answers:
            logger.info("No answers found")
            return jsonify([])

        for a in answers:
            a["_id"] = str(a["_id"])
            a["timestamp"] = a["timestamp"].isoformat()
            a["question_id"] = str(a["question_id"])
            if a.get("response_id"):
                a["response_id"] = str(a["response_id"])
        logger.info(f"Retrieved {len(answers)} answers")
        return jsonify(answers)
    except Exception as e:
        logger.error(f"Error fetching answers: {str(e)}")
        return jsonify({"error": f"Error fetching answers: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)