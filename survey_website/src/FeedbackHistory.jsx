import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast,
  Select,
  Input,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const FeedbackHistory = () => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState([]);
  const [survey, setsurvey] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterName, setFilterName] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [responsesResponse, questionsResponse, answersResponse,surveyResponse] = await Promise.all([
          axios.get('http://localhost:8000/responses'),
          axios.get('http://localhost:8000/questions'),
          axios.get('http://localhost:8000/answers'),
          axios.get('http://localhost:8000/api/surveys'),
        ]);
        setResponses(responsesResponse.data);
        setFilteredResponses(responsesResponse.data);
        setQuestions(questionsResponse.data);
        setAnswers(answersResponse.data);
        setsurvey(surveyResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load feedback history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  useEffect(() => {
    let updatedResponses = [...responses];

    if (filterName) {
      updatedResponses = updatedResponses.filter((res) =>
        res.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    updatedResponses.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      if (sortField === 'timestamp') {
        return sortOrder === 'asc'
          ? new Date(valueA) - new Date(valueB)
          : new Date(valueB) - new Date(valueA);
      }
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredResponses(updatedResponses);
  }, [filterName, sortField, sortOrder, responses]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={10}>
        <Spinner size="xl" color="brand.500" />
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} bg="gray.50" borderRadius="lg">
      <Heading as="h2" size="lg" mb={8} textAlign="center" color="brand.500">
        Feedback History
      </Heading>

      <Flex mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Input
          placeholder="Filter by name"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          maxW="300px"
          borderColor="gray.300"
          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
        />
        <Select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          maxW="200px"
          borderColor="gray.300"
          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
        >
          <option value="timestamp">Sort by Date</option>
          <option value="age">Sort by Age</option>
          <option value="rating">Sort by Rating</option>
          <option value="sentiment">Sort by Sentiment</option>
        </Select>
        <Select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          maxW="150px"
          borderColor="gray.300"
          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px brand.500' }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </Select>
      </Flex>

      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th fontWeight="medium">Title</Th>
              <Th fontWeight="medium">Name</Th>
              <Th fontWeight="medium">Age</Th>
              <Th fontWeight="medium">User Type</Th>
              <Th fontWeight="medium">Rating</Th>
              <Th fontWeight="medium">Feedback</Th>
              <Th fontWeight="medium">Sentiment</Th>
              <Th fontWeight="medium">Follow-up Questions & Answers</Th> 
            </Tr>
          </Thead>
          <Tbody>
            {filteredResponses.map((response, index) => {
              const relatedQuestions = questions.filter((q) => q.response_id === response._id);
              return (
                <Tr key={index}>
                  <Td>
                  {(() => {
                    const matchedSurvey = survey.find((s) => s._id === response.survey_id);
                    return (
                      <Text fontSize="sm">
                        {matchedSurvey ? matchedSurvey.title : 'Unknown'}
                      </Text>
                    );
                  })()}
                </Td>
                  <Td>{response.name}</Td>
                  <Td>{response.age}</Td>
                  <Td>{response.userType}</Td>
                  <Td>{response.rating}</Td>
                  <Td>{response.feedback}</Td>
                  <Td>{response.sentiment.toFixed(2)}</Td>
                  <Td>
                    {relatedQuestions.map((q, qIndex) => {
                      const answer = answers.find((a) => a.question_id === q._id);
                      return (
                        <Box key={qIndex} mb={2}>
                          <Text fontSize="sm"><strong>Q:</strong> {q.question}</Text>
                          <Text fontSize="sm">
                            <strong>A:</strong> {answer ? answer.answer : 'No answer'}
                            {answer && ` (Sentiment: ${answer.sentiment.toFixed(2)})`}
                          </Text>
                        </Box>
                      );
                    })}
                  </Td>
                  
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        {filteredResponses.length === 0 && (
          <Text mt={4} textAlign="center" color="gray.500">
            No feedback found.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackHistory;