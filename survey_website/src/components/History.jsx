import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Heading,
  Spinner,
  useToast,
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const History = () => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      toast({
        title: 'Error',
        description: 'Please log in to view history',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      window.location.href = '/login';
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/history?username=${username}`);
        setResponses(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to load history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [toast, username]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <Box display="flex" justifyContent="center">
          <Spinner size="xl" color="brand.500" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Box bg="white" borderRadius="lg" boxShadow="xl" p={8}>
        <Heading as="h2" size="xl" mb={8} textAlign="center" color="brand.500">
          {t('history')}
        </Heading>
        {responses.length === 0 ? (
          <Box textAlign="center" p={4} color="gray.500">
            {t('no_responses')}
          </Box>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{t('name')}</Th>
                <Th>{t('age')}</Th>
                <Th>{t('feedback')}</Th>
                <Th>{t('rating')}</Th>
                <Th>{t('user_type')}</Th>
                <Th>{t('domain')}</Th>
                <Th>{t('timestamp')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {responses.map((response) => (
                <Tr key={response._id}>
                  <Td>{response.name}</Td>
                  <Td>{response.age}</Td>
                  <Td>{response.feedback}</Td>
                  <Td>{response.rating}</Td>
                  <Td>{response.userType}</Td>
                  <Td>{response.domain}</Td>
                  <Td>{new Date(response.timestamp).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Container>
  );
};

export default History;