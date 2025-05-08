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
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const SurveysList = () => {
  const { t } = useTranslation();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/surveys');
        setSurveys(response.data);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load surveys',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, [toast]);

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
        Surveys
      </Heading>

      <Box p={6} bg="white" borderRadius="md" boxShadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th fontWeight="medium">Title</Th>
              <Th fontWeight="medium">Created At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {surveys.map((survey) => (
              <Tr key={survey._id}>
                <Td>{survey.title}</Td>
                <Td>{new Date(survey.created_at).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {surveys.length === 0 && (
          <Text mt={4} textAlign="center" color="gray.500">
            No surveys found.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default SurveysList;