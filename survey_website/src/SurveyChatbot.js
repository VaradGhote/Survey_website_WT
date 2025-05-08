import React, { useState, useEffect } from 'react';
import { BotUI, BotUIMessageList, BotUIAction } from 'botui';
import 'botui/build/botui.min.css';
import 'botui/build/botui-theme-default.css';
import axios from 'axios';
import { Box, Button } from '@chakra-ui/react';

const SurveyChatbot = ({ formState, setFormState, handleSubmit }) => {
  const [botState, setBotState] = useState({
    messages: [],
    actions: [],
  });

  const addMessage = (message) => {
    setBotState((prev) => ({
      ...prev,
      messages: [...prev.messages, { type: 'bot', content: message }],
    }));
  };

  const addAction = (action) => {
    setBotState((prev) => ({
      ...prev,
      actions: [action],
    }));
  };

  const clearActions = () => {
    setBotState((prev) => ({
      ...prev,
      actions: [],
    }));
  };

  const handleUserInput = async (userInput) => {
    const lowerInput = userInput.toLowerCase();
    setBotState((prev) => ({
      ...prev,
      messages: [...prev.messages, { type: 'user', content: userInput }],
    }));

    if (lowerInput.includes('start') || lowerInput.includes('begin')) {
      addMessage('Great! Let’s start. What’s your name?');
      addAction({
        type: 'input',
        placeholder: 'Enter your name',
        onSubmit: (value) => {
          setFormState((prev) => ({ ...prev, name: value }));
          clearActions();
          addMessage(`Thanks, ${value}! Now, what’s your age?`);
          addAction({
            type: 'input',
            placeholder: 'Enter your age',
            onSubmit: (value) => {
              setFormState((prev) => ({ ...prev, age: value }));
              clearActions();
              addMessage('Got it! What type of user are you? (Student, Professional, Other)');
              addAction({
                type: 'select',
                options: ['Student', 'Professional', 'Other'],
                onSubmit: (value) => {
                  setFormState((prev) => ({ ...prev, userType: value }));
                  clearActions();
                  addMessage('Nice! Please provide a rating (1-5 stars).');
                  addAction({
                    type: 'select',
                    options: ['1', '2', '3', '4', '5'],
                    onSubmit: (value) => {
                      setFormState((prev) => ({ ...prev, rating: parseInt(value) }));
                      clearActions();
                      addMessage('Thanks! Now, share your feedback.');
                      addAction({
                        type: 'input',
                        placeholder: 'Enter your feedback',
                        onSubmit: (value) => {
                          setFormState((prev) => ({ ...prev, feedback: value }));
                          clearActions();
                          addMessage('Ready to submit? Click the button below.');
                          addAction({
                            type: 'button',
                            text: 'Submit Feedback',
                            onClick: () => {
                              handleSubmit();
                              clearActions();
                              addMessage('Feedback submitted! Thanks for your input.');
                            },
                          });
                        },
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    } else if (lowerInput.includes('name') || lowerInput.includes('why name')) {
      addMessage('Your name helps us personalize the feedback. It should be at least 2 characters long.');
    } else if (lowerInput.includes('age') || lowerInput.includes('why age')) {
      addMessage('We need your age to understand our audience better. Enter a number between 1 and 120.');
    } else if (lowerInput.includes('rating') || lowerInput.includes('how rate')) {
      addMessage('Rating is from 1 to 5 stars. 1 is poor, 5 is excellent.');
    } else if (lowerInput.includes('feedback') || lowerInput.includes('what feedback')) {
      addMessage('Your feedback helps us improve. Be specific for better sentiment analysis!');
    } else if (lowerInput.includes('sentiment') || lowerInput.includes('what is sentiment')) {
      addMessage('Sentiment analysis uses AI to determine if your feedback is positive, neutral, or negative.');
      // Optional: Fetch real-time sentiment
      if (formState.feedback) {
        axios
          .post('http://localhost:8000/analyze', { feedback: formState.feedback })
          .then((response) => {
            addMessage(
              `Your current feedback sentiment is ${response.data.sentiment} (Polarity: ${response.data.polarity.toFixed(2)})`
            );
          })
          .catch(() => {
            addMessage('Error analyzing sentiment.');
          });
      }
    } else if (lowerInput.includes('submit') || lowerInput.includes('done')) {
      addMessage('Ready to submit? Click the button below.');
      addAction({
        type: 'button',
        text: 'Submit Feedback',
        onClick: () => {
          handleSubmit();
          clearActions();
          addMessage('Feedback submitted! Thanks for your input.');
        },
      });
    } else if (lowerInput.includes('bye') || lowerInput.includes('thanks')) {
      addMessage('Thanks for using the survey! Bye!');
    } else {
      addMessage('I’m not sure what you mean. Try saying "start", "submit", or ask about "name", "age", "rating", "feedback", or "sentiment".');
    }
  };

  useEffect(() => {
    addMessage('Hello! I’m here to help with the survey. Type "start" to begin.');
  }, []);

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      width="300px"
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      zIndex="1000"
      p={4}
    >
      <BotUI>
        <BotUIMessageList
          messages={botState.messages.map((msg) => ({
            text: msg.content,
            isBot: msg.type === 'bot',
          }))}
        />
        {botState.actions.map((action, index) => (
          <BotUIAction key={index}>
            {action.type === 'input' && (
              <Box>
                <input
                  type="text"
                  placeholder={action.placeholder}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      action.onSubmit(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </Box>
            )}
            {action.type === 'select' && (
              <Box>
                <select
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                  }}
                  onChange={(e) => {
                    action.onSubmit(e.target.value);
                  }}
                >
                  <option value="">Select an option</option>
                  {action.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Box>
            )}
            {action.type === 'button' && (
              <Button
                colorScheme="brand"
                onClick={action.onClick}
                size="sm"
                mt={2}
              >
                {action.text}
              </Button>
            )}
          </BotUIAction>
        ))}
        <Box mt={2}>
          <input
            type="text"
            placeholder="Type a message..."
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #CBD5E0',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                handleUserInput(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </Box>
      </BotUI>
    </Box>
  );
};

export default SurveyChatbot;