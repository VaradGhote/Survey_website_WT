import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
  Select,
  Tooltip,
  HStack,
  IconButton,
  FormErrorMessage,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon, StarIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const SurveyForm = () => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [userType, setUserType] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [realTimeSentiment, setRealTimeSentiment] = useState(null);
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [domain, setDomain] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [responseId, setResponseId] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const toast = useToast();

  const domains = ['healthcare', 'education', 'technology', 'finance', 'customer satisfaction'];

  const getSentimentUI = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return { icon: <CheckCircleIcon color="green.500" />, color: 'green.500' };
      case 'negative':
        return { icon: <WarningIcon color="red.500" />, color: 'red.500' };
      case 'neutral':
      default:
        return { icon: <InfoIcon color="gray.500" />, color: 'gray.500' };
    }
  };

  useEffect(() => {
    const analyzeSentiment = async () => {
      if (feedback) {
        try {
          const response = await axios.post('http://localhost:8000/analyze', { feedback });
          setRealTimeSentiment(response.data);
        } catch (error) {
          console.error('Error analyzing sentiment:', error);
        }
      } else {
        setRealTimeSentiment(null);
      }
    };
    analyzeSentiment();
  }, [feedback]);

  const validateName = (value) => {
    if (value.length < 2) {
      setNameError('Name must be at least 2 characters long.');
    } else {
      setNameError('');
    }
  };

  const validateAge = (value) => {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < 1 || parsed > 120) {
      setAgeError('Age must be a number between 1 and 120.');
    } else {
      setAgeError('');
    }
  };

  const createSurvey = async () => {
    if (!surveyTitle) {
      toast({
        title: 'Error',
        description: 'Survey title is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/create-survey', { title: surveyTitle });
      setSurveyId(response.data.survey_id);
      toast({
        title: 'Survey Created',
        description: 'Survey created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: 'Error',
        description: 'Failed to create survey.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const generateQuestions = async () => {
    if (!surveyId || !domain || !responseId) {
      toast({
        title: 'Error',
        description: 'Please create a survey, select a domain, and submit initial feedback.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setLoadingQuestions(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-questions', {
        domain,
        feedback,
        survey_id: surveyId,
        response_id: responseId,
      });
      setQuestions(response.data.questions);
      toast({
        title: 'Questions Generated',
        description: 'Follow-up questions generated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate questions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async () => {
    setIsModalOpen(false);
    const parsedAge = parseInt(age);
    try {
      const response = await axios.post('http://localhost:8000/submit-response', {
        name,
        age: parsedAge,
        feedback,
        rating,
        userType,
        survey_id: surveyId,
      });
      
      const data = response.data;
      setResponseId(data.response_id);
      const { icon, color } = getSentimentUI(data.sentiment);
      toast({
        title: 'Feedback Submitted',
        description: (
          <Box display="flex" alignItems="center" gap={2}>
            {icon}
            <Text>
              {data.message} (Sentiment: <b style={{ color }}>{data.sentiment}</b>, Polarity: {data.sentiment.toFixed(2)})
            </Text>
          </Box>
        ),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setSentimentResult({ sentiment: data.sentiment, polarity: data.sentiment });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'There was an error submitting your feedback.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAnswerSubmit = async (question, index) => {
    const answer = answers[index];
    if (!answer) {
      toast({
        title: 'Error',
        description: 'Please provide an answer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/submit-answer', {
        answer,
        question_id: question.id,
        response_id: responseId,
      });
      toast({
        title: 'Answer Submitted',
        description: `Answer submitted with sentiment: ${response.data.sentiment.toFixed(2)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setAnswers((prev) => ({ ...prev, [index]: '' }));
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    validateName(name);
    validateAge(age);
    
    if (nameError || ageError || !name || !age || !feedback || !userType || rating === 0) {
      toast({
        title: 'Error',
        description: 'Please correct the errors in the form.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <MotionBox
      maxW="container.md"
      mx="auto"
      mt={10}
      p={8}
      borderWidth={1}
      borderRadius="lg"
      bg="white"
      boxShadow="lg"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Heading as="h2" size="lg" mb={6} textAlign="center" color="brand.500">
        Create and Share Survey
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        <Box>
          <FormControl isRequired>
            <FormLabel fontWeight="medium">Survey Title</FormLabel>
            <Input
              type="text"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              borderColor="gray.300"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
            />
          </FormControl>
          <MotionButton
            colorScheme="brand"
            mt={4}
            width="full"
            onClick={createSurvey}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Create Survey
          </MotionButton>
        </Box>
        {surveyId && (
          <Box>
            <FormControl isRequired>
              <FormLabel fontWeight="medium">Domain</FormLabel>
              <Select
                placeholder="Select domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                borderColor="gray.300"
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>
            {responseId && (
              <MotionButton
                colorScheme="brand"
                mt={4}
                width="full"
                onClick={generateQuestions}
                isLoading={loadingQuestions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Generate Follow-up Questions
              </MotionButton>
            )}
          </Box>
        )}
      </SimpleGrid>

      <Heading as="h2" size="lg" mt={10} mb={6} textAlign="center" color="brand.500">
        Share Your Feedback
      </Heading>

      <Select
        mb={6}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        defaultValue="en"
        borderColor="gray.300"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </Select>

      <form onSubmit={handleFormSubmit}>
        <VStack spacing={5} align="stretch">
          <FormControl isRequired isInvalid={!!nameError}>
            <FormLabel fontWeight="medium">{t('name')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              borderColor="gray.300"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
            />
            <FormErrorMessage>{nameError}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!ageError}>
            <FormLabel fontWeight="medium">{t('age')}</FormLabel>
            <Input
              type="number"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                validateAge(e.target.value);
              }}
              borderColor="gray.300"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
            />
            <FormErrorMessage>{ageError}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="medium">User Type</FormLabel>
            <Select
              placeholder="Select user type"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              borderColor="gray.300"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
            >
              <option value="Student">Student</option>
              <option value="Professional">Professional</option>
              <option value="Other">Other</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="medium">Rating</FormLabel>
            <HStack>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconButton
                  key={star}
                  icon={<StarIcon />}
                  colorScheme={star <= rating ? 'yellow' : 'gray'}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  variant="ghost"
                  size="lg"
                />
              ))}
            </HStack>
          </FormControl>

          <FormControl isRequired>
            <FormLabel fontWeight="medium">{t('feedback')}</FormLabel>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              borderColor="gray.300"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
              minH="120px"
            />
            {realTimeSentiment && (
              <Tooltip label={`Polarity: ${realTimeSentiment.polarity.toFixed(2)}`}>
                <Text mt={2} fontSize="sm" color="gray.600">
                  Real-time Sentiment:{' '}
                  <b style={{ color: getSentimentUI(realTimeSentiment.sentiment).color }}>
                    {realTimeSentiment.sentiment}
                  </b>
                </Text>
              </Tooltip>
            )}
          </FormControl>

          <MotionButton
            type="submit"
            colorScheme="brand"
            width="full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            fontWeight="medium"
            size="lg"
          >
            {t('submit')}
          </MotionButton>
        </VStack>
      </form>

      {sentimentResult && (
        <Box mt={6} p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" color="gray.600">
            Sentiment:{' '}
            <b style={{ color: getSentimentUI(sentimentResult.sentiment).color }}>
              {sentimentResult.sentiment}
            </b>{' '}
            (Polarity: {sentimentResult.polarity.toFixed(2)})
          </Text>
        </Box>
      )}

      {questions.length > 0 && (
        <Box mt={8} p={6} bg="gray.50" borderRadius="md">
          <Heading as="h3" size="md" mb={4} color="brand.600">
            Follow-up Questions
          </Heading>
          <VStack spacing={4} align="stretch">
            {questions.map((q, index) => (
              <Box key={q.id} p={4} bg="white" borderRadius="md" boxShadow="sm">
                <Text mb={2} fontWeight="medium">{q.question}</Text>
                <Textarea
                  value={answers[index] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [index]: e.target.value }))}
                  placeholder="Your answer..."
                  borderColor="gray.300"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
                />
                <Button
                  mt={2}
                  colorScheme="brand"
                  size="sm"
                  onClick={() => handleAnswerSubmit(q, index)}
                >
                  Submit Answer
                </Button>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Your Submission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}><strong>Name:</strong> {name}</Text>
            <Text mb={2}><strong>Age:</strong> {age}</Text>
            <Text mb={2}><strong>User Type:</strong> {userType}</Text>
            <Text mb={2}><strong>Rating:</strong> {rating}</Text>
            <Text mb={2}><strong>Feedback:</strong> {feedback}</Text>
            {realTimeSentiment && (
              <Text mb={2}>
                <strong>Sentiment:</strong>{' '}
                <span style={{ color: getSentimentUI(realTimeSentiment.sentiment).color }}>
                  {realTimeSentiment.sentiment} (Polarity: {realTimeSentiment.polarity.toFixed(2)})
                </span>
              </Text>
            )}
            <Text>Are you sure you want to submit this feedback?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default SurveyForm;